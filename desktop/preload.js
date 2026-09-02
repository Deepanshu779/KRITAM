const path = require('path');
module.paths.unshift(path.join(__dirname, '..', 'runtime', 'node_modules'));
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kritamDesktop', {
  getNews: () => ipcRenderer.invoke('news:get'),
  openUrl: (url) => ipcRenderer.invoke('app:open-url', url),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke('login:set-enabled', enabled),
  showCompanion: () => ipcRenderer.invoke('companion:show'),
  onDailyBriefing: (handler) => ipcRenderer.on('daily-briefing-request', handler)
});
