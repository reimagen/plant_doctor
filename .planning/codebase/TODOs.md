# Project Status Checklist

## Completed
- [x] Ignore `.env*` files and allow `.env.example` to be tracked.
- [x] Add `.env.example` with `GEMINI_API_KEY` placeholder.
- [x] Ensure Vite loads the app entry by adding `/index.tsx` to `index.html`.
- [x] Replace deprecated `ScriptProcessorNode` capture with `AudioWorkletNode` in live audio hooks.
- [x] Log media send errors to surface live session failures.
- [x] Seasonal Mode: Auto-populate based on date/hemisphere

## Next Up
- [ ] Review `.planning/codebase/` docs and implement.
- [ ] Health notes: stop unbounded append during calls (dedupe/replace strategy).
- [ ] Health notes: add manual removal UI from plant details.
- [ ] Rehab checkups: confirm existing health notes are provided to the rehab specialist context.
