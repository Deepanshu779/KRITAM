# KRITAM

A privacy-first personal desktop AI companion. Install dependencies with `npm install` and then run `npm start` to launch the native desktop companion.

## What works in this slice

- Chat interface with English and Hinglish-friendly responses
- Animated assistant states: ready, listening, thinking, and speaking
- Browser speech recognition input and speech-synthesis responses (when supported)
- Structured, reviewable actions for opening sites and requesting camera access
- Explicit one-time approvals for sensitive actions; no arbitrary shell execution
- Online/offline indicator and local privacy-control entry point
- Dark and light themes
- Native Electron host: system tray presence, companion popup, and opt-in Windows sign-in launch
- Online daily-news briefing from Google News RSS, with an offline fallback

## Architecture boundary

This is intentionally a UI/protocol prototype, not a privileged desktop agent. Browser code cannot safely open local applications, enumerate files, implement a true background wake-word listener, or persist system permissions. Those capabilities should live behind a native host such as Electron or Tauri, with separate modules:

```
UI / Voice state → intent parser → policy & permission gate → approved native tools
                              ↘ LLM provider adapter (local or cloud)
```

The browser interface already follows that contract: it recognizes a request, displays the structured action, and requires a user decision before invoking the limited handler. A native implementation should replace only the final approved-tool handler, never give an LLM direct shell access, and use OS permission prompts for microphone, camera, filesystem, and application control.

## Suggested next milestone

Wrap this UI in Tauri, add a local command allowlist (`open_url`, `launch_app`, `open_path`, `media_control`), and implement each tool with OS-native confirmation and audit logging. Add an offline wake-word/STT engine only after its microphone lifecycle and clear disable control are in place.
