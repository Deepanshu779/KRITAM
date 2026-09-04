const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kritamDesktop', {
  getNews: () => ipcRenderer.invoke('news:get'),
  openUrl: (url) => ipcRenderer.invoke('app:open-url', url),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke('login:set-enabled', enabled),
  showCompanion: () => ipcRenderer.invoke('companion:show'),
  setCompanionState: (state, text) => ipcRenderer.invoke('companion:set-state', state, text),
  getOllamaStatus: () => ipcRenderer.invoke('ollama:status'),
  ollamaChat: (messages, options) => ipcRenderer.invoke('ollama:chat', messages, options),
  onCompanionState: (handler) => ipcRenderer.on('companion:state', (_event, payload) => handler(payload)),
  onDailyBriefing: (handler) => ipcRenderer.on('daily-briefing-request', handler)
});
