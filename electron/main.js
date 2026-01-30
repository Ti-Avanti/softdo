import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell, Notification, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray = null;
let isQuitting = false; // 标记应用是否正在退出
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../package.json')));
const CURRENT_VERSION = packageJson.version;
const GITHUB_REPO = 'xxomega2077xx/softdo';
// 移除未使用的常量: UPDATE_CHECK_KEY, SKIP_VERSION_KEY

if (process.platform === 'win32') {
  app.setAppUserModelId('com.todolist.app');
}

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      // 确保窗口在屏幕可见范围内
      const bounds = mainWindow.getBounds();
      const displays = screen.getAllDisplays();
      const isVisible = displays.some(display => {
        const { x, y, width, height } = display.bounds;
        return bounds.x >= x && bounds.x < x + width && bounds.y >= y && bounds.y < y + height;
      });
      if (!isVisible) {
        mainWindow.center();
      }
    } else {
      createWindow();
    }
  });
}

// Auto-launch (startup) handlers
ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-auto-launch', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
  });
  return app.getLoginItemSettings().openAtLogin;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 540,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    minWidth: 320,
    minHeight: 480,
    icon: path.join(__dirname, '../build/icon.png')
  });

  // 阻止窗口关闭，改为隐藏到托盘
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
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
      label: 'Show ToDoList',
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

  tray.setToolTip('ToDoList - Your Tasks');
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

// Robust Notification System
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
            title: 'ToDoList Reminder',
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
  // 不在这里退出，因为我们有托盘图标
  // 用户可以通过托盘图标重新显示窗口
});

// Update window creation to handle "Run at startup" logic if needed (handled by builder)
// ... (previous logic)

app.on('before-quit', () => {
  isQuitting = true; // 标记正在退出
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
