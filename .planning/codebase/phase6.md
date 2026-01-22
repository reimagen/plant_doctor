● Phase 6 implementation is complete. Here's a summary of the changes:

  Part 1: Pending Plant Adoption Flow

  - types/index.ts: Made lastWateredAt optional
  - PlantCard.tsx: Changed "Adopt Plant" to "Review Plant" button, moved release to X icon at top-right, added null checks for dates
  - PlantDetailPage.tsx: Added adoption banner for pending plants with disabled "Adopt Plant" button until lastWateredAt is set
  - LastWateredSection.tsx: Added isRequired prop with red indicator for adoption requirement
  - useAppState.ts: Updated adoptPlant to guard against missing lastWateredAt and not auto-set it
  - usePlantDoctor.ts: Removed lastWateredAt from plant detection
  - InventoryPage.tsx: Added onReview callback to PlantCard
  - ClientApp.tsx: Added onAdopt prop to PlantDetailPage

  Part 2: Generate Rescue Plans During Livestream

  - useRehabSpecialist.ts: Added generate_rescue_plan tool with API call to generate rescue tasks, updated system instruction to prompt AI to generate rescue plans for plants without them

  Part 3: Livestream Notifications + Timeline Overlay

  - types/index.ts: Added NotificationType and LivestreamNotification types
  - useRehabSpecialist.ts: Added notification callbacks for task completion, status changes, and rescue plan generation
  - usePlantDoctor.ts: Added notification callback for plant detection
  - Doctor.tsx: Replaced discoveryLog with unified notifications prop, updated styling per notification type
  - RescueTimelineOverlay.tsx: Created new component showing phase-1 rescue tasks
  - DoctorPage.tsx: Added notification state management and RescueTimelineOverlay rendering

  Additional Fixes

  Fixed TypeScript errors in:
  - PlantStatusBadge.tsx
  - RescueProtocolView.tsx
  - lib/gemini-content.ts
  - app/api/gemini/content/route.ts
  - Manager.tsx