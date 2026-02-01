<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Plant Doctor AI

View your app in AI Studio: https://ai.studio/apps/drive/1oNvmu0BLbJMCd1GmrOziBh8Y-w4ewnsH

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill in your keys
3. Run the app:
   `npm run dev`

## Deployment

### Frontend changes (components, hooks, styles, lib/)
```bash
npm run build
firebase deploy --only hosting
```

### Cloud Function changes (functions/src/)
```bash
firebase deploy --only functions
```

### WebSocket proxy changes (websocket-proxy/)
```bash
cd websocket-proxy
gcloud run deploy plant-doctor-ws \
  --project=YOUR_PROJECT_ID \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-key \
  --session-affinity
```

### Firestore rules changes (firestore.rules)
```bash
firebase deploy --only firestore:rules
```

### Deploy everything at once
```bash
npm run build
firebase deploy
```
(This deploys hosting + functions + firestore rules together. Cloud Run is separate.)
