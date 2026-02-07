# Execution-Lift Tasks

**Generated:** 2026-02-03

## Scope
- Execution-only tasks that do not require team strategy decisions.
- Source: `CONCERNS.md` (filtered).

## Backlog

**Utilities & Shared Infrastructure**
- [x] Centralize date handling utilities (watering schedule, grace period) and reuse across components.
- [x] Consolidate AudioContext lifecycle to avoid duplicate contexts across live hooks.

**Live Session Refactors**
- [x] Extract shared live-session logic for doctor/rehab into a common module (media pipeline).
- [x] Add explicit live-session state machine (idle/connecting/active/closing).

**UX & Performance**
- [x] Expand user-facing error UI beyond stream/care-guide errors (global banner or toast).
- [ ] Optimize frame capture work (consider OffscreenCanvas or move heavy work off main thread). - deprioritize. address if high CPU during calls.
- [ ] Add list virtualization if inventory size becomes large. - deprioritize. not needed until lists are 50-100+

**Type Safety**
- [x] Replace `any` usage in Gemini/tooling paths with typed interfaces and guards.

---

*Execution backlog generated: 2026-02-03*
