import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray = null;
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../package.json')));
const CURRENT_VERSION = packageJson.version;
const GITHUB_REPO = 'xxomega2077xx/softdo';
const UPDATE_CHECK_KEY = 'softdo-skip-update';
const SKIP_VERSION_KEY = 'softdo-skip-version';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 540,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    minWidth: 320,
    minHeight: 480,
    icon: path.join(__dirname, '../build/icon.png')
  });

  // IPC handlers for window controls
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('toggle-always-on-top', (event, shouldPin) => {
    mainWindow?.setAlwaysOnTop(shouldPin);
  });

  ipcMain.on('resize-window', (event, { width, height, x, y }) => {
    if (x !== undefined && y !== undefined) {
      mainWindow?.setBounds({ 
        x: Math.round(x), 
        y: Math.round(y), 
        width: Math.round(width), 
        height: Math.round(height) 
      });
    } else {
      mainWindow?.setSize(Math.round(width), Math.round(height));
    }
  });

  ipcMain.on('close-to-tray', () => {
    mainWindow?.hide();
  });

  // Update check handlers
  ipcMain.handle('check-for-updates', async () => {
    return await checkForUpdates();
  });

  ipcMain.handle('get-current-version', () => {
    return CURRENT_VERSION;
  });

  ipcMain.on('open-release-page', () => {
    shell.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`);
  });

  // Load content
  const isDev = process.env.ELECTRON_START_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Create tray icon
  createTray();
}

function createTray() {
  // Use a small icon for tray
  const iconPath = path.join(__dirname, '../build/icon.png');
  let trayIcon = nativeImage.createFromPath(iconPath);
  trayIcon = trayIcon.resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show SoftDo', 
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    { type: 'separator' },
    { 
      label: 'Always on Top', 
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        mainWindow?.setAlwaysOnTop(menuItem.checked);
        mainWindow?.webContents.send('pin-state-changed', menuItem.checked);
      }
    },
    { type: 'separator' },
    { 
      label: 'Check for Updates', 
      click: async () => {
        const update = await checkForUpdates();
        if (update.hasUpdate) {
          const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (${update.latestVersion}) is available!`,
            detail: 'Would you like to download it now?',
            buttons: ['Download', 'Later'],
            defaultId: 0
          });
          if (result === 0) {
            shell.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`);
          }
        } else {
          dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version!',
            buttons: ['OK']
          });
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('SoftDo - Your Tasks');
  tray.setContextMenu(contextMenu);

  // Click to show/hide window
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// Check for updates from GitHub
async function checkForUpdates() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'SoftDo-App'
      },
      timeout: 5000
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const latestVersion = release.tag_name?.replace('v', '') || '';
          const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;
          resolve({
            hasUpdate,
            latestVersion,
            currentVersion: CURRENT_VERSION,
            releaseUrl: release.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`,
            releaseNotes: release.body || ''
          });
        } catch {
          resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, error: 'parse_error' });
        }
      });
    });

    req.on('error', () => {
      resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, error: 'network_error' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, error: 'timeout' });
    });
  });
}

// Compare semantic versions
function compareVersions(v1, v2) {
  const parts1 = v1.replace(/-.*$/, '').split('.').map(Number);
  const parts2 = v2.replace(/-.*$/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

// Cleanup tray on quit
app.on('before-quit', () => {
  tray?.destroy();
});
