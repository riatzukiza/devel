const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getWSPort: () => ipcRenderer.invoke('get-ws-port'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Event listeners
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onDeepLink: (callback) => ipcRenderer.on('deep-link', callback),
});
