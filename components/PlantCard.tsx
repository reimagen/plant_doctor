
import React from 'react';
import { Plant } from '../types';
import { Icons } from '../constants';

interface Props {
  plant: Plant;
  onWater: (id: string) => void;
  onAdopt?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCheckIn?: (id: string) => void;
  onRescue?: (id: string) => void;
}

export const PlantCard: React.FC<Props> = ({ plant, onWater, onAdopt, onDelete, onCheckIn, onRescue }) => {
  const getNextWaterDate = () => {
    const lastDate = new Date(plant.lastWateredAt);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + plant.cadenceDays);
    return nextDate;
  };

  const daysUntilWater = () => {
    const next = getNextWaterDate();
    const now = new Date();
    const diff = next.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isPending = plant.status === 'pending';
  const isMonitoring = plant.status === 'warning';
  const isCritical = plant.status === 'critical';
  const isCheckInNeeded = plant.needsCheckIn;
  const daysLeft = daysUntilWater();
  const isOverdue = daysLeft < 0;

  const getStatusColor = () => {
    if (isCritical) return 'bg-red-500 animate-pulse';
    if (isOverdue) return 'bg-red-500 animate-pulse';
    if (isMonitoring) return 'bg-amber-500 animate-pulse';
    if (isCheckInNeeded) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusLabel = () => {
    if (isCritical) return 'Critical';
    if (isOverdue) return 'Thirsty';
    if (isMonitoring) return 'Monitoring';
    if (isCheckInNeeded) return 'Checkup';
    return 'Healthy';
  };

  // Determine which overlay to show
  const showRescueOverlay = (isCritical || isOverdue) && !isPending;
  const showCheckInOverlay = isCheckInNeeded && !isPending && !showRescueOverlay;

  return (
    <div className={`relative overflow-hidden bg-white rounded-[32px] border border-stone-100 shadow-sm transition-all hover:shadow-md ${isPending ? 'ring-2 ring-orange-100' : ''} ${isMonitoring ? 'ring-2 ring-amber-100' : ''} ${isCheckInNeeded ? 'ring-2 ring-blue-100' : ''}`}>
      <div className="flex items-stretch min-h-[140px]">
        {/* Plant Photo with Overlays */}
        <div className="w-28 sm:w-32 relative overflow-hidden bg-stone-100 flex-shrink-0">
          <img 
            src={plant.photoUrl || 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=400&auto=format&fit=crop'} 
            className={`w-full h-full object-cover ${isMonitoring ? 'grayscale-[0.3]' : ''}`} 
            alt={plant.species}
          />
          
          {/* Rescue Overlay (Centered) */}
          {showRescueOverlay && (
            <div 
              onClick={(e) => { e.stopPropagation(); onRescue?.(plant.id); }}
              className="absolute inset-0 bg-red-600/30 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group"
            >
               <div className="bg-white p-2.5 rounded-full text-red-600 shadow-xl animate-bounce group-hover:scale-110 transition-transform">
                 <span className="text-xl font-black">🆘</span>
               </div>
            </div>
          )}

          {/* Check-in Overlay (Centered) */}
          {showCheckInOverlay && (
            <div 
              onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id); }}
              className="absolute inset-0 bg-blue-500/20 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group"
            >
               <div className="bg-white p-2.5 rounded-full text-blue-500 shadow-xl animate-bounce group-hover:scale-110 transition-transform">
                 <Icons.Camera />
               </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-1.5 truncate">
                {!isPending && (
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor()}`} />
                )}
                <h3 className="font-black text-stone-800 truncate text-base leading-tight">
                  {plant.name || plant.species}
                </h3>
              </div>
              
              {!isPending && (
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                   isCritical || isOverdue ? 'bg-red-100 text-red-600' : 
                   isMonitoring ? 'bg-amber-100 text-amber-700' : 
                   isCheckInNeeded ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700'
                }`}>
                  {getStatusLabel()}
                </span>
              )}
            </div>
            
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-tighter truncate">
              {plant.species}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Next Water</span>
              <span className={`text-xs font-black ${isOverdue ? 'text-red-500' : 'text-stone-600'}`}>
                {isOverdue ? 'Overdue!' : isMonitoring ? 'Post-Hydration' : `in ${daysLeft} days`}
              </span>
            </div>

            <div className="flex gap-1.5">
              {isPending ? (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(plant.id); }} className="p-2.5 bg-stone-50 text-stone-400 rounded-2xl">
                    <Icons.X />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onAdopt?.(plant.id); }} className="px-4 py-2 bg-stone-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    Adopt
                  </button>
                </>
              ) : isCheckInNeeded ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200"
                >
                  Verify Health
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); onWater(plant.id); }}
                  disabled={isMonitoring}
                  className={`p-2.5 rounded-2xl transition-all shadow-lg ${
                    isOverdue ? 'bg-blue-500 text-white' : 'bg-stone-50 text-blue-500'
                  } ${isMonitoring ? 'opacity-30' : ''}`}
                >
                  <Icons.WaterDrop />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
