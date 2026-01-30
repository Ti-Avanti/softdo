import { useState, useEffect, useCallback } from 'react'
import electronAPI from './useElectron'
import type { Language } from '../i18n'

const OPACITY_KEY = 'softdo-opacity'
const LANGUAGE_KEY = 'softdo-language'
const LAST_RUN_VERSION_KEY = 'softdo-version'
const SKIP_VERSION_KEY = 'softdo-skip-version'
const DARK_MODE_KEY = 'softdo-dark-mode'

export const VERSION = 'v1.7.2'

export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  releaseUrl: string
  releaseNotes: string
}

/**
 * useAppSettings Hook - 管理应用设置
 */
export function useAppSettings() {
  // 透明度
  const [opacity, setOpacity] = useState(() => {
    const saved = localStorage.getItem(OPACITY_KEY)
    return saved ? parseFloat(saved) : 1
  })

  // 语言
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    return (saved === 'zh' || saved === 'en') ? saved : 'en'
  })

  // 窗口置顶
  const [isPinned, setIsPinned] = useState(false)

  // 自动启动
  const [autoStart, setAutoStart] = useState(false)

  // 暗色模式
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY)
    return saved === 'true'
  })

  // 更新信息
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  // 欢迎提示
  const [showWelcome, setShowWelcome] = useState(false)

  // 版本提示
  const [showVersionToast, setShowVersionToast] = useState(false)

  // 持久化透明度
  useEffect(() => {
    localStorage.setItem(OPACITY_KEY, opacity.toString())
  }, [opacity])

  // 持久化暗色模式
  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, darkMode.toString())
  }, [darkMode])

  // 检查版本显示欢迎信息
  useEffect(() => {
    const lastRunVersion = localStorage.getItem(LAST_RUN_VERSION_KEY)
    if (lastRunVersion !== VERSION) {
      setTimeout(() => setShowWelcome(true), 1000)
      localStorage.setItem(LAST_RUN_VERSION_KEY, VERSION)
    }
  }, [])

  // 检查自动启动状态
  useEffect(() => {
    const checkAutoLaunch = async () => {
      const enabled = await electronAPI.autoLaunch.get()
      if (enabled !== null) setAutoStart(enabled)
    }
    checkAutoLaunch()
  }, [])

  // 自动检查更新
  useEffect(() => {
    const checkUpdate = async () => {
      const result = await electronAPI.updates.check()
      if (!result) return

      const currentVerNum = VERSION.replace('v', '')
      const latestVerNum = result.latestVersion?.replace('v', '') || ''

      if (result.hasUpdate && latestVerNum !== currentVerNum) {
        const skippedVersion = localStorage.getItem(SKIP_VERSION_KEY)
        if (skippedVersion !== result.latestVersion) {
          setTimeout(() => {
            setUpdateInfo(result as UpdateInfo)
          }, 5000)
        }
      }
    }
    checkUpdate()
  }, [])

  // 切换语言
  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'zh' : 'en'
    setLanguage(newLang)
    localStorage.setItem(LANGUAGE_KEY, newLang)
  }, [language])

  // 切换置顶
  const togglePin = useCallback(() => {
    setIsPinned(prev => {
      const newValue = !prev
      electronAPI.window.setAlwaysOnTop(newValue)
      return newValue
    })
  }, [])

  // 切换自动启动
  const toggleAutoStart = useCallback(async () => {
    const newValue = await electronAPI.autoLaunch.set(!autoStart)
    if (newValue !== null) setAutoStart(newValue)
  }, [autoStart])

  // 切换暗色模式
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  // 处理更新
  const handleUpdate = useCallback(() => {
    electronAPI.updates.openReleasePage()
    setUpdateInfo(null)
  }, [])

  // 跳过更新
  const skipUpdate = useCallback(() => {
    if (updateInfo) {
      localStorage.setItem(SKIP_VERSION_KEY, updateInfo.latestVersion)
      setUpdateInfo(null)
    }
  }, [updateInfo])

  // 检查更新（手动）
  const checkForUpdates = useCallback(async () => {
    const result = await electronAPI.updates.check()
    if (!result) {
      setShowVersionToast(true)
      setTimeout(() => setShowVersionToast(false), 3000)
      return
    }

    if (!result.hasUpdate) {
      setShowVersionToast(true)
      setTimeout(() => setShowVersionToast(false), 3000)
    } else {
      setUpdateInfo(result as UpdateInfo)
    }
  }, [])

  return {
    // 状态
    opacity,
    language,
    isPinned,
    autoStart,
    darkMode,
    updateInfo,
    showWelcome,
    showVersionToast,
    VERSION,

    // 设置器
    setOpacity,
    setShowWelcome,
    setUpdateInfo,

    // 操作
    toggleLanguage,
    togglePin,
    toggleAutoStart,
    toggleDarkMode,
    handleUpdate,
    skipUpdate,
    checkForUpdates,
    closeWelcome: () => setShowWelcome(false),
    closeUpdate: () => setUpdateInfo(null),
  }
}

export default useAppSettings
