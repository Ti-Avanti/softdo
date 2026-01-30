/**
 * Preload 脚本 - 安全地暴露 Electron API 给渲染进程
 * 使用 contextBridge 确保安全的进程间通信
 */
const { contextBridge, ipcRenderer } = require('electron')

// 定义允许的 IPC 通道
const validSendChannels = [
  'minimize-window',
  'toggle-always-on-top',
  'resize-window',
  'close-to-tray',
  'open-release-page',
  'update-notification-schedule',
]

const validInvokeChannels = [
  'get-auto-launch',
  'set-auto-launch',
  'check-for-updates',
  'get-current-version',
]

const validReceiveChannels = [
  'update-available',
  'pin-state-changed',
]

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 发送消息到主进程（无返回值）
  send: (channel, ...args) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    } else {
      console.warn(`Invalid send channel: ${channel}`)
    }
  },

  // 调用主进程方法并等待返回值
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    } else {
      console.warn(`Invalid invoke channel: ${channel}`)
      return Promise.resolve(null)
    }
  },

  // 监听主进程消息
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args)
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    } else {
      console.warn(`Invalid receive channel: ${channel}`)
      return () => {}
    }
  },

  // 移除监听器
  removeListener: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  },
})

// 暴露平台信息
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  platform: process.platform,
})
