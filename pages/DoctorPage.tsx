
import React, { useRef, useEffect } from 'react';
import { HomeProfile, Plant } from '../types';
import { Icons } from '../constants';
import { usePlantDoctor } from '../hooks/usePlantDoctor';

interface Props {
  homeProfile: HomeProfile;
  onAutoDetect: (plant: Plant) => void;
}

export const DoctorPage: React.FC<Props> = ({ homeProfile, onAutoDetect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isCalling, lastDetectedName, startCall, stopCall } = usePlantDoctor(homeProfile, onAutoDetect);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      stopCall();
    };
  }, [stopCall]);

  const toggleCall = async () => {
    if (isCalling) {
      stopCall();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    } else {
      if (videoRef.current && canvasRef.current) {
        await startCall(videoRef.current, canvasRef.current);
      }
    }
  };

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col font-sans">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isCalling ? 'opacity-80' : 'opacity-0'}`} 
      />
      <canvas ref={canvasRef} className="hidden" />

      {isCalling && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-white/20 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-1 h-1 bg-white/50 rounded-full shadow-[0_0_20px_white]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        </div>
      )}

      <div className="relative z-10 flex-1 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 w-fit">
            <h1 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
              <span className={`w-2 h-2 rounded-full ${isCalling ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              Live Doctor
            </h1>
          </div>
        </div>

        {/* Silent Notification Toast */}
        {lastDetectedName && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[80%] animate-slide-down">
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl py-3 px-6 shadow-2xl border border-white/20 flex items-center gap-3 ring-1 ring-black/5">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Icons.Leaf />
              </div>
              <div>
                <p className="text-stone-800 text-[11px] font-black uppercase tracking-tight">Detection Successful</p>
                <p className="text-stone-500 text-xs truncate">Added {lastDetectedName} to Jungle</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 items-center pb-24">
          <button 
            onClick={toggleCall} 
            className={`p-10 rounded-full transition-all active:scale-90 shadow-2xl flex items-center justify-center border-4 ${isCalling ? 'bg-red-500 text-white border-red-400' : 'bg-green-600 text-white border-green-500'}`}
          >
            {isCalling ? <Icons.X /> : <Icons.Video />}
          </button>
          <div className="text-center drop-shadow-lg">
            <p className="text-white font-black text-sm uppercase tracking-widest">{isCalling ? 'End Call' : 'Start Session'}</p>
            <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-tighter">
              {isCalling ? 'I am watching & listening...' : 'Point camera at your plant'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
