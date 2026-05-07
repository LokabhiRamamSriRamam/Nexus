import { useRef, useCallback } from 'react'
import { longPressFeedback } from '@/lib/nativeInit'

export function useLongPress(onLongPress, ms = 500) {
  const timer = useRef(null)
  const moved = useRef(false)

  const start = useCallback((e) => {
    moved.current = false
    timer.current = setTimeout(async () => {
      if (!moved.current) {
        await longPressFeedback()
        onLongPress(e)
      }
    }, ms)
  }, [onLongPress, ms])

  const cancel = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [])

  const move = useCallback(() => {
    moved.current = true
    cancel()
  }, [cancel])

  return {
    onTouchStart: start,
    onTouchEnd:   cancel,
    onTouchMove:  move,
  }
}
