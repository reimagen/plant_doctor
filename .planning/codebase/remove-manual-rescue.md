╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Remove Manual Rescue Plan Generation - Livestream Only                      
                                                                             
 Context                                                                     
                                                                             
 The rescue plan generation flow has been updated:                           
 - OLD: Manual "Generate" buttons in plant details and "Begin Rescue         
 Protocol" quick-action                                                      
 - NEW: AI generates rescue plans automatically during livestream checkup    
 via create_rescue_plan tool                                                 
                                                                             
 User decision: Remove all manual generation - force livestream-only rescue  
 plan creation.                                                              
                                                                             
 Components to Remove/Modify                                                 
                                                                             
 1. useRescuePlan Hook (hooks/useRescuePlan.ts)                              
                                                                             
 Current responsibilities:                                                   
 - Lines 14-63: generateRescuePlan() - Calls API to generate rescue plan     
 - Lines 65-80: Auto-generation useEffect - Generates plans when plant       
 status = 'critical'                                                         
 - Lines 82-116: handleTaskComplete() - Toggles task completion with side    
 effects                                                                     
                                                                             
 Changes:                                                                    
 - REMOVE: generateRescuePlan function (lines 14-63)                         
 - REMOVE: Auto-generation useEffect (lines 65-80)                           
 - REMOVE: isRescueGenerating and error state                                
 - KEEP: handleTaskComplete function - still needed for manual task          
 completion                                                                  
 - Rename hook: Consider renaming to useRescueTaskManager to reflect new     
 purpose                                                                     
                                                                             
 2. RescueTimeline Component (components/plant-details/RescueTimeline.tsx)   
                                                                             
 Current responsibilities:                                                   
 - Lines 48-209: Displays all rescue tasks grouped by phase                  
 - Lines 183-189: "Generate" / "Regenerate" button for manual rescue plan    
 creation                                                                    
 - Lines 59-168: Render phase groups with task checkboxes                    
                                                                             
 Changes:                                                                    
 - REMOVE: onGenerate prop and "Generate" button (lines 183-189)             
 - REMOVE: isGenerating prop                                                 
 - UPDATE: Props interface to remove generation-related props                
 - UPDATE: Empty state message (lines 199-206) to direct users to livestream 
  checkup                                                                    
 - KEEP: Task display and checkbox toggling functionality                    
                                                                             
 3. RescuePlanSection Component                                              
 (components/plant-details/RescuePlanSection.tsx)                            
                                                                             
 Current responsibilities:                                                   
 - Lines 6-25: Wrapper that passes onGenerate and isRescueGenerating to      
 RescueTimeline                                                              
                                                                             
 Changes:                                                                    
 - REMOVE: onGenerate and isRescueGenerating props                           
 - UPDATE: Pass only onTaskComplete to RescueTimeline                        
                                                                             
 4. Manager Component (components/Manager.tsx)                               
                                                                             
 Current responsibilities:                                                   
 - Lines 48-53: Uses useRescuePlan hook                                      
 - Lines 72-79: Conditionally shows RescuePlanSection                        
 - Lines 87-96: Error display for rescue generation failures                 
                                                                             
 Changes:                                                                    
 - UPDATE: Use renamed hook (e.g., useRescueTaskManager) with only           
 handleTaskComplete                                                          
 - REMOVE: isRescueGenerating, error, and generateRescuePlan from hook       
 destructuring                                                               
 - UPDATE: RescuePlanSection props to remove generation-related props        
 - REMOVE: Rescue error display (lines 92-94)                                
                                                                             
 5. RescueProtocolView Component (components/RescueProtocolView.tsx)         
                                                                             
 Current responsibilities:                                                   
 - Full-screen modal for quick rescue plan generation from inventory page    
 - Lines 25-46: handleRescueTrigger - Generates rescue plan via API          
 - Lines 80-96: "Start Rescue Mission" button                                
                                                                             
 Changes:                                                                    
 - DELETE FILE ENTIRELY - This component is inventory quick-action for       
 manual generation                                                           
                                                                             
 6. InventoryPage Component (components/pages/InventoryPage.tsx)             
                                                                             
 Current responsibilities:                                                   
 - Line 7: Imports RescueProtocolView                                        
 - Line 23: rescuePlantId state for showing rescue modal                     
 - Line 200: PlantCard receives onRescue callback                            
 - Lines 210-216: Renders RescueProtocolView modal                           
                                                                             
 Changes:                                                                    
 - REMOVE: Import of RescueProtocolView                                      
 - REMOVE: rescuePlantId state (line 23)                                     
 - REMOVE: onRescue prop passed to PlantCard (line 200)                      
 - REMOVE: RescueProtocolView modal rendering (lines 210-216)                
                                                                             
 7. PlantCard Component (components/PlantCard.tsx)                           
                                                                             
 Current responsibilities:                                                   
 - Line 14: onRescue prop                                                    
 - Lines 136-141: "Begin Rescue Protocol" button for emergency plants        
                                                                             
 Changes:                                                                    
 - REMOVE: onRescue prop from interface (line 14)                            
 - REMOVE: onRescue from component props (line 17)                           
 - REPLACE: "Begin Rescue Protocol" button with "Start Checkup" that         
 navigates to /doctor?plantId=xxx                                            
 - Keep the emergency detection logic, just change the action                
                                                                             
 New User Flow                                                               
                                                                             
 For Plants Needing Rescue:                                                  
                                                                             
 BEFORE (Manual):                                                            
 1. Plant shows "Begin Rescue Protocol" button on card                       
 2. Click → Opens RescueProtocolView modal                                   
 3. Click "Start Rescue Mission" → Generates plan via API                    
 4. View plan in modal, click "Commit to Plan"                               
 5. OR: Navigate to plant details → Click "Generate" button in               
 RescueTimeline                                                              
                                                                             
 AFTER (Livestream Only):                                                    
 1. Plant shows "Start Checkup" button on card (for emergency/critical       
 plants)                                                                     
 2. Click → Navigates to /doctor?plantId=xxx (checkup page)                  
 3. Start livestream → AI assesses plant                                     
 4. AI calls create_rescue_plan tool automatically                           
 5. FirstAidStepOverlay appears showing first rescue task                    
 6. AI marks tasks complete during conversation                              
 7. Navigate to plant details → RescueTimeline shows all tasks for manual    
 tracking                                                                    
                                                                             
 Files to Modify                                                             
                                                                             
 1. hooks/useRescuePlan.ts - Remove generation, keep task completion         
 2. components/plant-details/RescueTimeline.tsx - Remove Generate button     
 3. components/plant-details/RescuePlanSection.tsx - Remove generation props 
 4. components/Manager.tsx - Update hook usage                               
 5. components/RescueProtocolView.tsx - DELETE FILE                          
 6. components/pages/InventoryPage.tsx - Remove rescue modal logic           
 7. components/PlantCard.tsx - Replace "Begin Rescue Protocol" with "Start   
 Checkup"                                                                    
                                                                             
 Implementation Details                                                      
                                                                             
 PlantCard "Start Checkup" Button                                            
                                                                             
 Replace emergency button with navigation to checkup:                        
                                                                             
 // Replace lines 136-141                                                    
 if (isEmergency) {                                                          
   return (                                                                  
     <button                                                                 
       onClick={(e) => { e.stopPropagation(); onCheckIn?.(plant.id, 'rehab') 
  }}                                                                         
       className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-[10px]  
 font-black uppercase tracking-widest shadow-lg shadow-red-100               
 active:scale-95 transition-all"                                             
     >                                                                       
       Start Checkup                                                         
     </button>                                                               
   )                                                                         
 }                                                                           
                                                                             
 RescueTimeline Empty State                                                  
                                                                             
 Update message to guide users to livestream:                                
                                                                             
 <div className="p-8 border-2 border-dashed border-red-100 rounded-3xl       
 text-center">                                                               
   <p className="text-[10px] font-black text-red-300 uppercase">             
     No rescue plan yet                                                      
   </p>                                                                      
   <p className="text-[9px] text-red-400/60 mt-2">                           
     Start a livestream checkup with the Plant Doctor to generate a          
 personalized rescue plan                                                    
   </p>                                                                      
 </div>                                                                      
                                                                             
 Rename useRescuePlan Hook                                                   
                                                                             
 Consider renaming to useRescueTaskManager to reflect its new single-purpose 
  role:                                                                      
                                                                             
 export const useRescueTaskManager = (                                       
   plant: Plant,                                                             
   onUpdate: (id: string, updates: Partial<Plant>) => void                   
 ) => {                                                                      
   const handleTaskComplete = useCallback((taskId: string, completed:        
 boolean) => {                                                               
     // ... existing logic                                                   
   }, [plant.rescuePlanTasks, plant.status, plant.id, onUpdate])             
                                                                             
   return { handleTaskComplete }                                             
 }                                                                           
                                                                             
 Verification Steps                                                          
                                                                             
 1. Plant Card Emergency Flow:                                               
   - Mark a plant as critical                                                
   - Verify "Start Checkup" button appears (not "Begin Rescue Protocol")     
   - Click → Verify navigates to /doctor?plantId=xxx                         
 2. Livestream Rescue Plan Generation:                                       
   - Start livestream from checkup page                                      
   - Wait for AI to assess plant                                             
   - Verify AI calls create_rescue_plan tool                                 
   - Verify FirstAidStepOverlay appears with phase-1 tasks                   
 3. Plant Detail Page:                                                       
   - After rescue plan created, navigate to plant details                    
   - Verify RescueTimeline shows all tasks                                   
   - Verify NO "Generate" button present                                     
   - Verify task checkboxes work for manual completion                       
   - If no rescue plan exists, verify message directs to "livestream         
 checkup"                                                                    
 4. Inventory Page:                                                          
   - Verify RescueProtocolView modal never appears                           
   - Verify no rescue-related state or callbacks                             
 5. Task Completion Side Effects:                                            
   - Complete a watering task → Verify lastWateredAt updates                 
   - Complete first task on critical plant → Verify status flips to warning  
                                                                             
 Migration Notes                                                             
                                                                             
 - No data migration needed: Existing rescuePlanTasks remain intact          
 - Backward compatible: Plants with existing rescue plans continue to work   
 - User education: Consider in-app message explaining new livestream-only    
 flow                                                                        
 - Future enhancement: Could add "regenerate via checkup" hint in plant      
 details                                                                     
                                                                             
 Technical Dependencies                                                      
                                                                             
 - AI create_rescue_plan tool already implemented in useRehabSpecialist.ts   
 - FirstAidStepOverlay already working with phase-based display              
 - DoctorPage already handling rescue task overlay display                   
 - Task completion logic (handleTaskComplete) still needed for manual        
 checkbox toggling                           