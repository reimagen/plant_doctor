
import { useState, useRef, useCallback } from 'react';
import { Type, FunctionDeclaration } from "@google/genai";
import { HomeProfile, Plant } from '../types';
import { GeminiLiveSession } from '../lib/gemini-live';
import { AudioService } from '../lib/audio-service';
import { useMediaStream } from './useMediaStream';

export const usePlantDoctor = (homeProfile: HomeProfile, onPlantDetected: (p: Plant) => void) => {
  const [isCalling, setIsCalling] = useState(false);
  const [lastDetectedName, setLastDetectedName] = useState<string | null>(null);
  const [discoveryLog, setDiscoveryLog] = useState<string[]>([]);
  
  const hardware = useMediaStream();
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const audioServiceRef = useRef(new AudioService(24000));
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Refs for video elements to allow frame capture during tool calls
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const onPlantDetectedRef = useRef(onPlantDetected);
  onPlantDetectedRef.current = onPlantDetected;

  const proposePlantFunction: FunctionDeclaration = {
    name: 'propose_plant_to_inventory',
    parameters: {
      type: Type.OBJECT,
      description: 'Proposes a plant to the inventory. Can be called multiple times in one session.',
      properties: {
        commonName: { type: Type.STRING },
        scientificName: { type: Type.STRING },
        healthStatus: { type: Type.STRING, enum: ['healthy', 'warning', 'critical'] },
        habitGrade: { type: Type.STRING, description: 'A grade from A to F based on care habits visible (dust, soil moisture, pruning).' },
        habitFeedback: { type: Type.STRING, description: 'Brief reasoning for the grade.' },
        cadenceDays: { type: Type.NUMBER },
        idealConditions: { type: Type.STRING }
      },
      required: ['commonName', 'scientificName', 'healthStatus', 'habitGrade', 'habitFeedback']
    }
  };

  const stopCall = useCallback(async () => {
    if (!isCalling) return;
    setIsCalling(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (workletRef.current) {
      workletRef.current.port.onmessage = null;
      workletRef.current.disconnect();
      workletRef.current = null;
    }
    if (muteGainRef.current) {
      muteGainRef.current.disconnect();
      muteGainRef.current = null;
    }
    sessionRef.current?.close();
    sessionRef.current = null;
    hardware.stop();
    await audioServiceRef.current.close();
    if (audioContextRef.current?.state !== 'closed') {
      await audioContextRef.current?.close();
    }
    activeVideoRef.current = null;
    activeCanvasRef.current = null;
  }, [hardware, isCalling]);

  const startCall = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (isCalling) return;
    setIsCalling(true);
    setDiscoveryLog([]);
    activeVideoRef.current = video;
    activeCanvasRef.current = canvas;

    try {
      const stream = await hardware.start();
      video.srcObject = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioCtx.resume();
      audioContextRef.current = audioCtx;
      await audioServiceRef.current.ensureContext();

      const session = new GeminiLiveSession({
        apiKey: process.env.API_KEY!,
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        systemInstruction: `You are the Plant Doctor performing a "Jungle Inventory". 
        Environment: ${JSON.stringify(homeProfile)}.
        USER INTERACTION:
        1. The user will walk around showing you many plants. 
        2. For EVERY new plant you see, call propose_plant_to_inventory.
        3. Grade their care habits (A-F) based on visual evidence.
        4. Be conversational. Do NOT stop the session after one plant.`,
        tools: [{ functionDeclarations: [proposePlantFunction] }],
        callbacks: {
          onOpen: async () => {
            session.sendInitialGreet("I'm ready for the grand tour! Show me your plants one by one, and I'll catalog your whole jungle.");
            
            const source = audioCtx.createMediaStreamSource(stream);
            await audioCtx.audioWorklet.addModule(
              new URL('../lib/pcm-capture-worklet.ts', import.meta.url)
            );
            const worklet = new AudioWorkletNode(audioCtx, 'pcm-capture-processor');
            workletRef.current = worklet;
            const muteGain = audioCtx.createGain();
            muteGain.gain.value = 0;
            muteGainRef.current = muteGain;
            worklet.port.onmessage = (event) => {
              if (!sessionRef.current?.session) return;
              const pcm = GeminiLiveSession.encodeAudio(event.data as Float32Array);
              sessionRef.current.sendMedia(pcm, `audio/pcm;rate=${audioCtx.sampleRate}`);
            };
            source.connect(worklet);
            worklet.connect(muteGain);
            muteGain.connect(audioCtx.destination);

            intervalRef.current = window.setInterval(() => {
              if (!sessionRef.current?.session || video.paused) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              canvas.width = 320;
              canvas.height = (320 * video.videoHeight) / video.videoWidth;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(blob => {
                if (blob && sessionRef.current?.session) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    sessionRef.current?.sendMedia(base64, 'image/jpeg');
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/jpeg', 0.5);
            }, 1000);
          },
          onMessage: async (msg) => {
            const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) await audioServiceRef.current.playRawChunk(GeminiLiveSession.decodeAudio(audio));
            
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'propose_plant_to_inventory') {
                  const args = fc.args as any;
                  
                  // Capture current frame for the plant photo
                  let capturedPhoto = '';
                  if (activeVideoRef.current && activeCanvasRef.current) {
                    const vid = activeVideoRef.current;
                    const can = activeCanvasRef.current;
                    const ctx = can.getContext('2d');
                    if (ctx) {
                      can.width = vid.videoWidth;
                      can.height = vid.videoHeight;
                      ctx.drawImage(vid, 0, 0);
                      capturedPhoto = can.toDataURL('image/jpeg', 0.8);
                    }
                  }

                  session.sendToolResponse(fc.id, fc.name, { success: true, acknowledged: args.commonName });
                  
                  setLastDetectedName(args.commonName);
                  setDiscoveryLog(prev => [args.commonName, ...prev].slice(0, 5));
                  
                  onPlantDetectedRef.current({
                    id: Math.random().toString(36).substr(2, 9),
                    name: '',
                    species: args.commonName,
                    photoUrl: capturedPhoto || `https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=400&auto=format&fit=crop`,
                    location: 'Detected via Inventory Sweep',
                    lastWateredAt: new Date().toISOString(),
                    cadenceDays: args.cadenceDays || 7,
                    status: 'pending',
                    idealConditions: args.idealConditions,
                    notes: [`Habit Grade: ${args.habitGrade}`, args.habitFeedback]
                  });
                }
              }
            }
          },
          onError: (e) => {
            console.error('Plant doctor session error:', e);
            stopCall();
          },
          onClose: stopCall
        }
      });

      sessionRef.current = session;
      await session.connect();
    } catch (e) {
      stopCall();
    }
  };

  return { isCalling, lastDetectedName, discoveryLog, startCall, stopCall };
};
