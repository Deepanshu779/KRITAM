const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let initialized = false;

function initAutoUpdater() {
  if (initialized || !app.isPackaged) return false;
  initialized = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('update-available', (info) => {
    console.log(`[KRITAM updater] update available: ${info.version}`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'KRITAM update ready',
      message: `KRITAM ${info.version} is ready to install.`,
      detail: 'The update has been downloaded. Restart KRITAM now to finish the update, or continue using the current version and install it when KRITAM closes.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall(false, true));
    }
  });

  autoUpdater.on('error', (error) => {
    console.warn(`[KRITAM updater] ${error?.message || error}`);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.warn(`[KRITAM updater] check failed: ${error?.message || error}`);
    });
  }, 8000);

  return true;
}

function checkForUpdates() {
  if (!app.isPackaged) return Promise.resolve(null);
  return autoUpdater.checkForUpdates();
}

module.exports = { initAutoUpdater, checkForUpdates };
