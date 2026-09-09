# KRITAM

**KRITAM** is a privacy-first, local-first personal AI desktop agent for Windows. The goal is simple: say **"Hey KRITAM"**, speak naturally, and let KRITAM safely plan and perform desktop tasks for you.

## Current direction

KRITAM is evolving from a desktop AI companion into a **voice-first computer assistant** combining:

- ChatGPT-style conversational intelligence
- Siri-style voice activation
- Copilot-style desktop assistance
- Local Ollama models for private AI
- Safe native desktop tools
- Permission and policy controls
- A floating desktop companion
- English + Hinglish interaction
- Vision-assisted computer control with explicit approval

## What is implemented now

- Electron desktop host with system tray and floating companion
- Local Ollama integration
- English/Hinglish-friendly conversational responses
- Speech recognition and speech synthesis
- **"Hey KRITAM" wake-word prototype** using available SpeechRecognition support
- Tool planning layer for common desktop requests
- Typed, allowlisted desktop tools
- Permission-gated website/app actions
- Safe Windows tools for Calculator, Notepad and File Explorer
- Approved HTTPS website opening
- Local system information and time tools
- **Application state detection** for allowlisted Windows apps
- **Bounded multi-step task planning** with approval before each controlled step
- **Action verification foundation** for tool and post-action confirmation
- Safe mouse/keyboard input foundation with high-risk approval
- **Desktop-wide vision target detection** using local vision-capable Ollama models
- **Confidence-gated screen target clicking** with coordinate mapping to the primary display
- **Post-click desktop change verification** using before/after screen fingerprints
- Camera permission flow
- Dark/light UI themes
- Windows sign-in launch option
- Online/offline status and daily news briefing

## Architecture

```text
Voice / Chat
     |
     v
Wake Word / Speech-to-Text
     |
     v
KRITAM Agent Planner
     |
     +---------------------------+
     |                           |
     v                           v
Local Ollama              Structured Task Plan
     |                           |
     |                     Policy / Permission
     |                           |
     +--------------------> Native Tool Executor
                                  |
                                  v
                         Desktop Screen / UI
                                  |
                         Vision Target Detection
                                  |
                         Approved Mouse / Keyboard
                                  |
                                  v
                         Before/After Verification
                                  |
                                  v
                            Result / Voice
```

### Security boundary

The LLM is **not** given arbitrary shell access. Native actions pass through a small tool registry and policy layer. Tools are explicitly allowlisted and arguments are validated before execution.

Screen inspection and computer-control operations are treated as high-risk capabilities. Screen target detection requires explicit approval, target coordinates are confidence-gated, and controlled mouse/keyboard operations remain separate from unrestricted operating-system access.

Multi-step tasks are capped at eight steps and controlled actions are approved one step at a time. Application state uses a fixed allowlist and read-only Windows process inspection rather than arbitrary process commands.

Current tool categories include:

```text
open_url
open_app
open_path
system_info
get_time
app_state
capture_screen
analyze_screen
screen_targets
mouse_click
type_text
```

High-risk operations such as arbitrary shell commands, destructive file operations, credential access, or unrestricted process control are intentionally not exposed.

## Computer-control safety model

KRITAM follows a conservative visual-action loop:

```text
User command
    ↓
Identify intended screen action
    ↓
Request screen-inspection permission
    ↓
Capture primary desktop
    ↓
Local vision model finds relevant UI targets
    ↓
Reject non-actionable / low-confidence targets
    ↓
Request click approval
    ↓
Map vision coordinates to display coordinates
    ↓
Perform one controlled click
    ↓
Capture desktop again
    ↓
Compare before/after screen fingerprints
    ↓
Report confirmed or inconclusive result
```

This design deliberately avoids allowing the model to execute arbitrary PowerShell, shell commands, or unrestricted mouse/keyboard automation.

## Roadmap

### Phase 1 — Desktop Agent Core

- [x] Electron host
- [x] Local Ollama adapter
- [x] Voice input/output
- [x] Companion window
- [x] Tool registry
- [x] Policy validation
- [x] Permission-gated actions

### Phase 2 — Always-Available KRITAM

- [x] Hey KRITAM prototype
- [ ] Robust offline wake-word engine
- [ ] Push-to-talk fallback
- [ ] Microphone lifecycle controls
- [ ] Wake-word sensitivity settings

### Phase 3 — Personal Intelligence

- [ ] Local SQLite memory
- [x] User preferences
- [x] Conversation history
- [ ] Task history
- [ ] Long-term memory controls

### Phase 4 — Computer Control

- [x] Screenshot understanding foundation
- [x] Computer vision foundation
- [x] Safe mouse/keyboard tools
- [x] Application state detection
- [x] Multi-step task planner foundation
- [x] Action verification foundation
- [x] Desktop-wide screen capture foundation
- [x] Vision-based UI target detection
- [x] Confidence-gated target clicking
- [x] Post-action desktop change verification
- [ ] Multi-target selection and clarification
- [ ] Visual recovery/retry loop
- [ ] Full visual semantic before/after verification

### Phase 5 — KRITAM Ecosystem

- [ ] Browser/search tools
- [ ] File intelligence
- [ ] Calendar/tasks
- [ ] Media control
- [ ] Developer mode
- [ ] Focus mode
- [ ] Research mode
- [ ] Local/cloud model selection
- [ ] Full audit log

## Running locally

### Requirements

- Windows 10/11
- Node.js
- Ollama (optional, for local AI)
- A compatible local Ollama model, such as `llama3.2:3b`

### Install

```bash
npm install
```

### Run

```bash
npm start
```

For local AI, make sure Ollama is running and a model is installed.

## Important note about wake word

The current **Hey KRITAM** implementation is an early prototype built on the browser/Electron SpeechRecognition API. Its availability and behavior depend on the operating system and speech engine. The production version will use a dedicated offline wake-word engine so KRITAM can remain responsive without sending continuous microphone audio to a cloud speech service.

## Vision

> **KRITAM should feel like a personal computer companion—not another chatbot.**

The long-term goal is a secure desktop agent that can understand natural language, remember what the user allows it to remember, operate approved computer tools, verify its work, and explain every meaningful action it takes.
