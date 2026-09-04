# KRITAM Local AI — Ollama

KRITAM now has its first local AI provider. The Electron main process talks to Ollama on `127.0.0.1:11434`; the renderer never talks to Ollama directly.

## Setup

1. Install Ollama for Windows: https://ollama.com/download/windows
2. Install a local model:

```powershell
ollama pull llama3.2:3b
```

3. Check it:

```powershell
ollama list
```

4. Start KRITAM:

```powershell
npm install
npm start
```

Ask KRITAM something that is not one of the built-in desktop commands, for example: `Explain recursion in JavaScript in simple terms.`

The header will show `OLLAMA: <model>` when Ollama is reachable and a model is installed.

## Selecting a model

KRITAM uses the first installed model by default. To select a specific model:

```powershell
$env:KRITAM_OLLAMA_MODEL="llama3.2:3b"
npm start
```

## Architecture

```text
KRITAM UI
   -> Electron IPC
   -> Ollama provider
   -> local model
   -> KRITAM response
```

This provider is local-only. The next architecture step is the model router, which will allow KRITAM to choose between Ollama and a cloud provider for online/offline operation.
