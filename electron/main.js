import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell, Notification } from 'electron';
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

if (process.platform === 'win32') {
  app.setAppUserModelId('com.softdo.app');
}

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
  // Use icon.png (generated high res) and let internal resizing handle it, or resize here
  const iconPath = path.join(__dirname, '../build/icon.png');
  let trayIcon = nativeImage.createFromPath(iconPath);
  // nativeImage resizing handles scaling better than just loading raw?
  // 16x16 is small. Try 24x24 or 32x32 for modern displays
  trayIcon = trayIcon.resize({ width: 22, height: 22 }); 
  
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

// Notification Scheduler
let notificationTimer = null;
let scheduledTodos = [];

ipcMain.on('update-notification-schedule', (event, todos) => {
  scheduledTodos = todos.filter(t => t.dueTime && t.notify);
});

function checkNotifications() {
  const now = new Date();
  
  scheduledTodos.forEach(todo => {
    if (!todo.dueTime) return;
    const due = new Date(todo.dueTime);
    const diff = (due - now) / 1000; // seconds

    // Thresholds: 24h (86400), 1h (3600), 30m (1800), 5m (300), 0m (0)
    // We need a mechanism to not repeat notifications.
    // For simplicity in this version, we'll check if it's "close enough" and hasn't been fired recently?
    // Actually, renderer can send "next notification time" or main can track "last notified".
    // Let's use a simpler approach: Check if we just crossed a threshold.
    // To do this reliably without state, we might need a "lastCheckTime".
    
    // Better approach: User wanted "Windows Level Notification".
    // We will check strict ranges. e.g. if diff is between 0 and 10s -> Show "Due Now".
    // We need to store state "notified_due", "notified_5m", etc.
    // But main process is stateless regarding todo ID details usually.
    // Let's attach state to the todo list in main memory.
  });
}

// Robust Notification System using `node-schedule` logic or simple polling with state tracking
let notificationState = new Map(); // id -> { lastNotifiedStage: string }

function runScheduler() {
  const now = new Date();
  
  scheduledTodos.forEach(todo => {
    if (!todo.dueTime || todo.completed) return;
    const due = new Date(todo.dueTime);
    const diffInSeconds = (due - now) / 1000;
    const diffInMinutes = diffInSeconds / 60;
    
    let stage = '';
    let message = '';

    if (diffInSeconds <= 0 && diffInSeconds > -60) {
      stage = 'due';
      message = 'is due now!';
    } else if (diffInMinutes <= 5 && diffInMinutes > 4) {
      stage = '5m';
      message = 'is due in 5 minutes.';
    } else if (diffInMinutes <= 30 && diffInMinutes > 29) {
      stage = '30m';
      message = 'is due in 30 minutes.';
    } else if (diffInMinutes <= 60 && diffInMinutes > 59) {
      stage = '1h';
      message = 'is due in 1 hour.';
    } else if (diffInMinutes <= 1440 && diffInMinutes > 1439) {
      stage = '24h';
      message = 'is due in 24 hours.';
    }

    if (stage) {
      const state = notificationState.get(todo.id) || {};
      if (state.lastNotifiedStage !== stage) {
        // Send Notification
        if (Notification.isSupported()) {
          new Notification({
            title: 'SoftDo Reminder',
            body: `Task "${todo.text}" ${message}`,
            icon: path.join(__dirname, '../build/icon.ico')
          }).show();
        }
        
        notificationState.set(todo.id, { ...state, lastNotifiedStage: stage });
      }
    }
  });
}

// Start scheduler when app launches
app.whenReady().then(() => {
  createWindow();
  notificationTimer = setInterval(runScheduler, 10000); // Check every 10s
  
  // Auto-check for updates
  setTimeout(() => {
    checkForUpdates().then(update => {
       if (update.hasUpdate && mainWindow) {
           mainWindow.webContents.send('update-available', update);
       }
    });
  }, 3000); // Check 3s after launch
});

app.on('window-all-closed', () => {
  // Minimize to tray behavior on Windows usually keeps app running.
  // We check handle usage.
  if (process.platform !== 'darwin') {
    // If tray exists, we don't quit? 
    // Actually user wants "minimize to tray". our close logic does that or quit?
    // Current main.js: "close-to-tray" hides window.
    // native "close" event usually destroys window unless intercepted.
    // We assume App.tsx calls "minimizeApp" (minimize) or "closeApp" (window.close()).
    // If window.close() is called, window-all-closed fires.
    // We should probably keep running for notifications if configured?
    // User requested "System Tray". If we quit, notifications stop.
    // We should intercept close and hide instead, or let them quit via tray.
    // For now, respect explicit quit.
    // If user wants notifications, they should minimize.
  }
});

// Update window creation to handle "Run at startup" logic if needed (handled by builder)
// ... (previous logic)

app.on('before-quit', () => {
  clearInterval(notificationTimer);
  tray?.destroy();
});

// Helper to check updates
async function checkForUpdates() {
  try {
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${GITHUB_REPO}/releases/latest`,
        headers: { 'User-Agent': 'SoftDo-App' }
    };
    
    return new Promise((resolve) => {
        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const release = JSON.parse(data);
                    const latestVersionTag = release.tag_name; // e.g. "v1.2.4"
                    
                    // Normalize versions
                    const currentNorm = CURRENT_VERSION.replace(/^v/, '');
                    const latestNorm = latestVersionTag ? latestVersionTag.replace(/^v/, '') : '';

                    if (latestNorm && latestNorm !== currentNorm) {
                        resolve({ 
                            hasUpdate: true, 
                            latestVersion: latestVersionTag, 
                            releaseUrl: release.html_url,
                            releaseNotes: release.body 
                        });
                    } else {
                        resolve({ hasUpdate: false });
                    }
                } catch (e) {
                    resolve({ hasUpdate: false, error: e.message });
                }
            });
        }).on('error', (e) => resolve({ hasUpdate: false, error: e.message }));
    });
  } catch (error) {
    return { hasUpdate: false, error: error.message };
  }
}
