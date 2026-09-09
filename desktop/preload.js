const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kritamDesktop', {
  getNews: () => ipcRenderer.invoke('news:get'),
  openUrl: (url) => ipcRenderer.invoke('app:open-url', url),
  planAgent: (text) => ipcRenderer.invoke('agent:plan', text),
  runLocalAgent: (text) => ipcRenderer.invoke('agent:run-local', text),
  executeTool: (request) => ipcRenderer.invoke('tool:execute', request),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke('login:set-enabled', enabled),
  showCompanion: () => ipcRenderer.invoke('companion:show'),
  setCompanionState: (state, text) => ipcRenderer.invoke('companion:set-state', state, text),
  getOllamaStatus: () => ipcRenderer.invoke('ollama:status'),
  ollamaChat: (messages, options) => ipcRenderer.invoke('ollama:chat', messages, options),
  getRecentMemory: (conversationId = 'default', limit = 50) => ipcRenderer.invoke('memory:get-recent', conversationId, limit),
  addMemoryMessage: (payload) => ipcRenderer.invoke('memory:add-message', payload),
  getMemoryPreferences: () => ipcRenderer.invoke('memory:get-preferences'),
  setMemoryPreference: (key, value) => ipcRenderer.invoke('memory:set-preference', key, value),
  clearMemory: () => ipcRenderer.invoke('memory:clear'),
  captureScreen: () => ipcRenderer.invoke('screen:capture'),
  onCompanionState: (handler) => ipcRenderer.on('companion:state', (_event, payload) => handler(payload)),
  onDailyBriefing: (handler) => ipcRenderer.on('daily-briefing-request', handler)
});
