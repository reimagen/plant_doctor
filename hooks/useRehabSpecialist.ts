
import { useState, useRef, useCallback } from 'react';
import { Type, FunctionDeclaration } from "@google/genai";
import { HomeProfile, Plant } from '../types';
import { GeminiLiveSession } from '../lib/gemini-live';
import { AudioService } from '../lib/audio-service';
import { useMediaStream } from './useMediaStream';

export const useRehabSpecialist = (homeProfile: HomeProfile, onUpdate: (id: string, updates: Partial<Plant>) => void) => {
  const [isCalling, setIsCalling] = useState(false);
  const [lastVerifiedId, setLastVerifiedId] = useState<string | null>(null);
  
  const hardware = useMediaStream();
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const audioServiceRef = useRef(new AudioService(24000));
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const verifyRehabFunction: FunctionDeclaration = {
    name: 'verify_rehab_success',
    parameters: {
      type: Type.OBJECT,
      description: 'Confirms the plant has recovered.',
      properties: {
        success: { type: Type.BOOLEAN },
        newStatus: { type: Type.STRING, enum: ['healthy', 'warning'] },
        recoveryNote: { type: Type.STRING },
        updatedCadence: { type: Type.NUMBER }
      },
      required: ['success', 'newStatus']
    }
  };

  const stopCall = useCallback(async () => {
    setIsCalling(false);
    
    // Stop intervals and disconnect audio nodes immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (workletRef.current) {
      workletRef.current.port.onmessage = null;
      workletRef.current.disconnect();
      workletRef.current = null;
    }
    if (muteGainRef.current) {
      muteGainRef.current.disconnect();
      muteGainRef.current = null;
    }

    // Close Gemini Session
    sessionRef.current?.close();
    sessionRef.current = null;

    // Release Hardware
    hardware.stop();

    // Cleanup Audio Services
    await audioServiceRef.current.close();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [hardware]);

  const startRehabCall = async (video: HTMLVideoElement, canvas: HTMLCanvasElement, plant: Plant) => {
    setIsCalling(true);

    try {
      const stream = await hardware.start();
      video.srcObject = stream;

      // Initialize Input Audio Context (16kHz for Gemini)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioCtx.resume();
      audioContextRef.current = audioCtx;

      // Initialize Output Audio Service (24kHz)
      await audioServiceRef.current.ensureContext();

      const systemInstruction = `REHAB CLINIC MODE. You are verifying the recovery of "${plant.name || plant.species}". 
      History: It was previously in ${plant.status} condition. 
      Analyze the leaves, soil, and stems. If it looks recovered, use verify_rehab_success. 
      Environment: ${JSON.stringify(homeProfile)}.`;

      const session = new GeminiLiveSession({
        apiKey: process.env.API_KEY!,
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        systemInstruction,
        tools: [{ functionDeclarations: [verifyRehabFunction] }],
        callbacks: {
          onOpen: async () => {
            session.sendInitialGreet(`Hello! I'm here to check on ${plant.name || plant.species}. Please show me its current condition.`);
            
            // Start Audio Streaming
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
              if (!session.session) return;
              const pcm = GeminiLiveSession.encodeAudio(event.data as Float32Array);
              session.sendMedia(pcm, `audio/pcm;rate=${audioCtx.sampleRate}`);
            };

            source.connect(worklet);
            worklet.connect(muteGain);
            muteGain.connect(audioCtx.destination);

            // Start Video Streaming
            intervalRef.current = window.setInterval(() => {
              const ctx = canvas.getContext('2d');
              if (!ctx || !session.session) return;
              
              canvas.width = 320;
              canvas.height = (320 * video.videoHeight) / video.videoWidth;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob((blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    session.sendMedia(base64, 'image/jpeg');
                  };
                  reader.readAsDataURL(blob);
                }
              }, 'image/jpeg', 0.4);
            }, 1000);
          },
          onMessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              await audioServiceRef.current.playRawChunk(GeminiLiveSession.decodeAudio(audioData));
            }
            
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'verify_rehab_success') {
                  const args = fc.args as any;
                  onUpdate(plant.id, {
                    status: args.newStatus,
                    needsCheckIn: !args.success,
                    notes: args.recoveryNote ? [args.recoveryNote, ...(plant.notes || [])] : plant.notes
                  });
                  setLastVerifiedId(plant.id);
                  session.sendToolResponse(fc.id, fc.name, { confirmed: true });
                }
              }
            }
          },
          onError: (e) => {
            console.error('Rehab session error:', e);
            stopCall();
          },
          onClose: stopCall
        }
      });

      sessionRef.current = session;
      await session.connect();

    } catch (e) {
      console.error("Rehab Start Failed:", e);
      stopCall();
    }
  };

  return { isCalling, lastVerifiedId, startRehabCall, stopCall };
};
