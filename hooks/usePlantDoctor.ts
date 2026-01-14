
import { useState, useRef, useCallback } from 'react';
import { LiveServerMessage, Type, FunctionDeclaration } from "@google/genai";
import { HomeProfile, Plant, LightLevel } from '../types';
import { GeminiLiveSession } from '../lib/gemini-live';
import { AudioService } from '../lib/audio-service';

export const usePlantDoctor = (homeProfile: HomeProfile, onPlantDetected: (p: Plant) => void) => {
  const [isCalling, setIsCalling] = useState(false);
  const [lastDetectedName, setLastDetectedName] = useState<string | null>(null);
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const audioServiceRef = useRef(new AudioService());
  const frameIntervalRef = useRef<number | null>(null);

  const proposePlantFunction: FunctionDeclaration = {
    name: 'propose_plant_to_inventory',
    parameters: {
      type: Type.OBJECT,
      description: 'Proposes a plant to be added to the inventory based on current visual assessment.',
      properties: {
        species: { type: Type.STRING },
        soilStatus: { type: Type.STRING },
        cadenceDays: { type: Type.NUMBER },
        careScore: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
        location: { type: Type.STRING },
        careGuide: { type: Type.ARRAY, items: { type: Type.STRING } },
        lightLevel: { 
          type: Type.STRING, 
          description: 'Observed or inferred light level: Low, Medium, Bright, Indirect, or Direct.' 
        },
        nearWindow: { 
          type: Type.BOOLEAN, 
          description: 'Whether the plant appears to be situated near a window.' 
        }
      },
      required: ['species', 'soilStatus', 'cadenceDays', 'careScore', 'reasoning', 'careGuide']
    }
  };

  const stopCall = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    sessionRef.current?.close();
    audioServiceRef.current.stopAll();
    setIsCalling(false);
  }, []);

  const startCall = useCallback(async (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    try {
      stopCall();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 640, height: 480, facingMode: "environment" } 
      });
      videoElement.srcObject = stream;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });

      sessionRef.current = new GeminiLiveSession({
        apiKey: process.env.API_KEY!,
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        systemInstruction: `You are a real-time Plant Doctor. Home context: ${JSON.stringify(homeProfile)}. 
        Identify plants and use 'propose_plant_to_inventory' tool when certain.
        Pay attention to the plant's placement: Is it near a window? What is the light quality (Direct, Indirect, Bright, etc.)?`,
        tools: [{ functionDeclarations: [proposePlantFunction] }],
        callbacks: {
          onOpen: () => {
            setIsCalling(true);
            const source = inputAudioCtx.createMediaStreamSource(stream);
            const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const base64 = GeminiLiveSession.encodeAudio(e.inputBuffer.getChannelData(0));
              sessionRef.current?.sendMedia(base64, 'audio/pcm;rate=16000');
            };
            source.connect(processor);
            processor.connect(inputAudioCtx.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (canvasElement && videoElement.readyState >= 2) {
                const ctx = canvasElement.getContext('2d');
                ctx?.drawImage(videoElement, 0, 0, 640, 480);
                const data = canvasElement.toDataURL('image/jpeg', 0.5).split(',')[1];
                sessionRef.current?.sendMedia(data, 'image/jpeg');
              }
            }, 1000);
          },
          onMessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                const args = fc.args as any;
                setLastDetectedName(args.species);
                onPlantDetected({
                  id: Math.random().toString(36).substr(2, 9),
                  name: args.species,
                  species: args.species,
                  photoUrl: canvasElement.toDataURL('image/jpeg'),
                  location: args.location || 'Unknown',
                  lastWateredAt: new Date().toISOString(),
                  cadenceDays: args.cadenceDays || 7,
                  status: 'pending',
                  careGuide: args.careGuide,
                  lightLevel: args.lightLevel as LightLevel,
                  nearWindow: args.nearWindow
                });
                sessionRef.current?.sendToolResponse(fc.id, fc.name, { result: "ok" });
                setTimeout(() => setLastDetectedName(null), 5000);
              }
            }
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              audioServiceRef.current.playRawChunk(GeminiLiveSession.decodeAudio(audioData));
            }
          }
        }
      });
      await sessionRef.current.connect();
    } catch (e) {
      console.error(e);
      setIsCalling(false);
    }
  }, [homeProfile, stopCall, onPlantDetected]);

  return { isCalling, lastDetectedName, startCall, stopCall };
};
