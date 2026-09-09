<div align="center">

# KRITAM

### Privacy-first • Local-first • Voice-first AI Desktop Companion

**Talk naturally. KRITAM understands the intent, plans the task, and safely acts on your Windows PC.**

[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows)](https://github.com/Deepanshu779/KRITAM)
[![Electron](https://img.shields.io/badge/Electron-37-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![AI](https://img.shields.io/badge/AI-Ollama-black?style=for-the-badge)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

### [⬇️ Download KRITAM for Windows](../../releases/latest)

*The latest Windows installer is published through GitHub Releases.*

</div>

---

## Overview

KRITAM is a Windows desktop AI companion designed to make computer interaction more natural.

Instead of forcing users to learn rigid commands, KRITAM is being built to understand everyday language such as:

> **“Hey KRITAM, mere bhai ko ek cartoon dekhna hai.”**

> **“Mummy ke liye Banarasi saree dhoondh do.”**

> **“Ek gaana chala do.”**

The assistant identifies the user's intent, understands who the task is for, asks only for genuinely missing information, and routes actions through controlled native tools.

## Why KRITAM?

| Capability | KRITAM |
|---|---|
| Natural language commands | ✅ |
| Voice interaction | ✅ |
| Hindi / Hinglish interaction | ✅ |
| Local AI with Ollama | ✅ |
| Windows desktop integration | ✅ |
| Safe native tool execution | ✅ |
| Vision-assisted computer control | ✅ |
| Action verification | ✅ |
| Floating desktop companion | ✅ |
| Privacy-first architecture | ✅ |
| Arbitrary shell access | ❌ Intentionally blocked |

## ✨ Key Features

### 🧠 Natural Intent Understanding

KRITAM is designed around **intent rather than exact commands**. It can distinguish requests such as shopping, searching, opening applications, watching content, studying, weather, news, messaging, calling and reminders, while retaining a deterministic safety layer.

### 🎙️ Voice-first interaction

- Speech recognition
- Speech synthesis
- `Hey KRITAM` wake-word prototype
- Interruptible voice interaction
- Indian English, Hindi and Hinglish-oriented interaction
- Additional Indian-language voice mappings

### 🤖 Local AI

KRITAM integrates with **Ollama** so conversational intelligence can run locally when a compatible model is available.

This keeps the core assistant architecture local-first and reduces unnecessary dependence on cloud AI services.

### 🖥️ Desktop assistance

KRITAM can safely work with controlled desktop capabilities including:

- Applications
- Websites
- Approved folders
- System information
- Time
- Application state
- Screen understanding
- Controlled mouse and keyboard actions

### 👁️ Vision-assisted computer control

KRITAM can use local vision-capable models to identify UI targets on the Windows desktop.

The control pipeline uses:

```text
User intent
    ↓
Screen inspection
    ↓
Local vision analysis
    ↓
Target confidence check
    ↓
Explicit approval
    ↓
Controlled action
    ↓
Before / after verification
    ↓
Result
```

Low-confidence targets are rejected instead of blindly clicked.

### 🔐 Security by design

The LLM does **not** receive arbitrary operating-system shell access.

Native actions pass through an explicit tool registry and policy layer. Arguments are validated before execution, and sensitive computer-control operations require approval.

Intentionally unavailable capabilities include:

- Arbitrary PowerShell / shell execution
- Destructive unrestricted file operations
- Credential extraction
- Unrestricted process control
- Unrestricted computer automation

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│                 User / Voice                 │
└──────────────────────┬───────────────────────┘
                       ↓
              Wake Word / Speech
                       ↓
             Natural Intent Layer
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
   Local Ollama AI          Deterministic Planner
          │                         │
          └────────────┬────────────┘
                       ↓
                Policy Boundary
                       ↓
              Validated Tool Layer
                       ↓
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
   Web / Apps       Files / OS      Screen / UI
                                       ↓
                                  Vision Model
                                       ↓
                              Verified Action
                                       ↓
                                Voice / UI Result
```

## 🛡️ Safety Model

KRITAM separates **reasoning** from **execution**.

The model can propose an intent, but the native runtime decides whether an action is allowed.

### Risk levels

- **Low risk:** opening approved URLs, applications and paths
- **High risk:** screen capture, screen analysis, mouse clicks, typing and keyboard shortcuts
- **Critical:** unknown or unregistered tools are rejected

Multi-step tasks are bounded and controlled actions are not converted into unrestricted shell commands.

## 📦 Download & Installation

### Windows

**[⬇️ Download the latest KRITAM Windows installer](../../releases/latest)**

1. Open the latest GitHub Release.
2. Download `KRITAM-Setup-*.exe`.
3. Run the installer.
4. Launch **KRITAM** from the Start Menu or desktop shortcut.
5. Optionally install Ollama and a compatible local model for local AI capabilities.

> **Note:** The installer is currently generated through GitHub Actions. A signed Windows installer will be added as the project moves toward public production distribution.

## ⚙️ Run from Source

### Requirements

- Windows 10/11
- Node.js 20+
- npm
- Ollama — optional, for local AI
- A compatible Ollama model — for example `llama3.2:3b`

### Install

```bash
git clone https://github.com/Deepanshu779/KRITAM.git
cd KRITAM
npm install
```

### Start

```bash
npm start
```

### Run tests

```bash
npm test
```

### Build Windows installer

```bash
npm run dist:win
```

The generated installer is placed in the `dist/` directory.

## 🧩 Technology Stack

- **Electron** — Windows desktop runtime
- **Node.js** — native runtime and application services
- **Ollama** — local AI inference
- **JavaScript** — core application logic
- **SpeechRecognition / SpeechSynthesis** — current voice prototype
- **Local vision models** — screen understanding foundation
- **GitHub Actions** — automated testing and Windows builds
- **Electron Builder** — Windows NSIS installer packaging

## 📁 Project Structure

```text
KRITAM/
├── core/
│   ├── agent.js
│   ├── agent-runtime.js
│   ├── action-verifier.js
│   ├── audit-log.js
│   ├── conversation-agent.js
│   ├── keyboard.js
│   ├── memory.js
│   ├── natural-command-runtime.js
│   ├── natural-intent.js
│   ├── ollama.js
│   ├── policy.js
│   ├── task-history.js
│   ├── task-planner.js
│   ├── verified-typing.js
│   ├── vision-runtime.js
│   └── ...
├── desktop/
│   ├── main.js
│   └── preload.js
├── assets/
├── .github/workflows/
│   ├── test.yml
│   └── build-windows.yml
├── app.js
├── index.html
├── package.json
└── README.md
```

## 🚀 Release Pipeline

KRITAM uses GitHub Actions for production packaging:

```text
Git tag vX.Y.Z
      ↓
Windows runner
      ↓
npm ci
      ↓
npm test
      ↓
Electron Builder
      ↓
KRITAM-Setup-X.Y.Z.exe
      ↓
GitHub Release
```

## 🗺️ Roadmap

### Foundation

- [x] Electron desktop application
- [x] Local Ollama integration
- [x] Voice input/output
- [x] Floating companion
- [x] Tool registry and policy layer
- [x] Local memory
- [x] Audit/task history foundations

### Natural Assistant

- [x] Natural intent foundation
- [x] Conversational shopping flow
- [x] Beneficiary/person understanding
- [x] Hindi/Hinglish command handling
- [ ] General semantic intent planner
- [ ] Rich multi-turn task context
- [ ] Automatic task decomposition

### Computer Use

- [x] Screen capture foundation
- [x] Local vision analysis
- [x] UI target detection
- [x] Confidence-gated clicking
- [x] Post-action verification
- [ ] Visual recovery/retry loop
- [ ] Multi-target clarification
- [ ] Full semantic before/after verification

### Production

- [x] Automated tests workflow
- [x] Windows installer workflow
- [ ] Signed Windows installer
- [ ] Automatic updater
- [ ] Offline wake-word engine
- [ ] Production onboarding
- [ ] Crash reporting with privacy controls

## 🔒 Privacy

KRITAM is designed around a **local-first architecture**.

Local application state, memory and audit data are stored on the user's machine. Ollama can provide local model inference without requiring every conversation to be sent to a hosted AI service.

The project is intentionally conservative about computer-control permissions and does not expose unrestricted operating-system execution to the language model.

## 🤝 Contributing

Contributions, bug reports and ideas are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run `npm test`.
5. Open a pull request.

## 📄 License

KRITAM is released under the **MIT License**. See [LICENSE](LICENSE) for details.

## 👤 Author

**Deepanshu779**

AI/ML • Full-Stack • Desktop AI Systems

---

<div align="center">

### KRITAM

**A personal AI companion for your computer.**

[⬇️ Download](../../releases/latest) · [Source Code](../../) · [Issues](../../issues)

</div>
