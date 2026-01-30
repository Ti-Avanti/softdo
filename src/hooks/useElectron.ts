/**
 * useElectron Hook - 封装 Electron IPC 通信
 * 提供统一的 API 来与 Electron 主进程交互
 */

type IpcRenderer = {
  send: (channel: string, ...args: unknown[]) => void
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
  on: (channel: string, listener: (...args: unknown[]) => void) => void
  removeListener: (channel: string, listener: (...args: unknown[]) => void) => void
}

let ipcRenderer: IpcRenderer | null = null

// 尝试获取 ipcRenderer，仅在 Electron 环境中可用
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require('electron')
  ipcRenderer = electron.ipcRenderer
} catch {
  // 不在 Electron 环境中
}

/**
 * 检查是否在 Electron 环境中运行
 */
export const isElectron = (): boolean => ipcRenderer !== null

/**
 * 发送消息到主进程（无返回值）
 */
export const send = (channel: string, ...args: unknown[]): void => {
  ipcRenderer?.send(channel, ...args)
}

/**
 * 调用主进程方法并等待返回值
 */
export const invoke = async <T = unknown>(channel: string, ...args: unknown[]): Promise<T | null> => {
  if (!ipcRenderer) return null
  try {
    return await ipcRenderer.invoke<T>(channel, ...args)
  } catch {
    return null
  }
}

/**
 * 监听主进程消息
 */
export const on = (channel: string, listener: (...args: unknown[]) => void): (() => void) => {
  if (!ipcRenderer) return () => {}
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer?.removeListener(channel, listener)
}

// ============ 具体功能封装 ============

/**
 * 窗口控制
 */
export const windowControls = {
  minimize: () => send('minimize-window'),
  setAlwaysOnTop: (value: boolean) => send('toggle-always-on-top', value),
  resize: (bounds: { width: number; height: number; x?: number; y?: number }) =>
    send('resize-window', bounds),
  closeToTray: () => send('close-to-tray'),
}

/**
 * 自动启动设置
 */
export const autoLaunch = {
  get: () => invoke<boolean>('get-auto-launch'),
  set: (enabled: boolean) => invoke<boolean>('set-auto-launch', enabled),
}

/**
 * 更新检查
 */
export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion?: string
  releaseUrl?: string
  releaseNotes?: string
  error?: string
}

export const updates = {
  check: () => invoke<UpdateInfo>('check-for-updates'),
  openReleasePage: () => send('open-release-page'),
  getCurrentVersion: () => invoke<string>('get-current-version'),
}

/**
 * 通知调度
 */
export const notifications = {
  updateSchedule: (todos: unknown[]) => send('update-notification-schedule', todos),
}

/**
 * 默认导出 - 提供所有功能的统一访问
 */
const electronAPI = {
  isElectron,
  send,
  invoke,
  on,
  window: windowControls,
  autoLaunch,
  updates,
  notifications,
}

export default electronAPI
