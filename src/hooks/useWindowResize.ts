import { useRef, useEffect, useCallback } from 'react'
import electronAPI from './useElectron'

/**
 * useWindowResize Hook - 处理窗口调整大小逻辑
 */
export function useWindowResize() {
  const isResizing = useRef(false)
  const resizeDir = useRef<string>('')
  const startPos = useRef({ x: 0, y: 0 })
  const startBounds = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    e.preventDefault()
    isResizing.current = true
    resizeDir.current = dir
    startPos.current = { x: e.screenX, y: e.screenY }
    startBounds.current = {
      x: window.screenX,
      y: window.screenY,
      w: window.outerWidth,
      h: window.outerHeight
    }

    document.body.style.cursor = dir === 'se' ? 'nwse-resize' : 'nesw-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return

    requestAnimationFrame(() => {
      const deltaX = e.screenX - startPos.current.x
      const deltaY = e.screenY - startPos.current.y
      const dir = resizeDir.current

      let newW = startBounds.current.w
      let newH = startBounds.current.h
      let newX = startBounds.current.x
      const newY = startBounds.current.y

      if (dir === 'se') {
        newW = Math.max(320, startBounds.current.w + deltaX)
        newH = Math.max(480, startBounds.current.h + deltaY)
      } else if (dir === 'sw') {
        const rawW = startBounds.current.w - deltaX
        if (rawW >= 320) {
          newW = rawW
          newX = startBounds.current.x + deltaX
        } else {
          newW = 320
          newX = startBounds.current.x + (startBounds.current.w - 320)
        }
        newH = Math.max(480, startBounds.current.h + deltaY)
      }

      electronAPI.window.resize({
        width: newW,
        height: newH,
        x: newX,
        y: newY
      })
    })
  }, [])

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])

  return { handleResizeStart }
}

export default useWindowResize
