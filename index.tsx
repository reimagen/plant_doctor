
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DoctorPage } from './pages/DoctorPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navigation } from './components/Navigation';
import { useAppState } from './hooks/useAppState';

const App = () => {
  const state = useAppState();

  // The app boots directly into the main interface using the injected process.env.API_KEY
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <main className="max-w-xl mx-auto pb-24">
        {state.view === 'doctor' && (
          <DoctorPage 
            homeProfile={state.homeProfile}
            onAutoDetect={state.addPlant}
            onUpdatePlant={state.updatePlant}
            plants={state.plants}
            rehabTargetId={state.rehabTarget}
          />
        )}
        {state.view === 'inventory' && (
          <InventoryPage 
            plants={state.plants}
            homeProfile={state.homeProfile}
            onWater={state.waterPlant}
            onAdopt={state.adoptPlant}
            onDelete={state.removePlant}
            onUpdate={state.updatePlant}
            onOpenDoctor={() => state.setView('doctor')}
            onOpenRehab={state.handleOpenRehab}
          />
        )}
        {state.view === 'settings' && (
          <SettingsPage 
            profile={state.homeProfile}
            onChange={state.setHomeProfile}
          />
        )}
      </main>
      
      <Navigation currentView={state.view} setView={state.setView} />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
