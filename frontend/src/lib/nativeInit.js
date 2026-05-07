import { Capacitor } from '@capacitor/core'

/* Only runs inside the native app */
export async function initNative() {
  if (!Capacitor.isNativePlatform()) return

  const [
    { StatusBar, Style },
    { SplashScreen },
    { App },
    { LocalNotifications },
  ] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
    import('@capacitor/local-notifications'),
  ])

  // Dark status bar to match app theme
  await StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  await StatusBar.setBackgroundColor({ color: '#0A0A0A' }).catch(() => {})

  // Hide splash once the app is ready
  await SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {})

  // Android hardware back button — close drawers/modals or go back in history
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.exitApp()
    }
  })

  // Request local notification permission
  const { display } = await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' }))
  if (display === 'granted') {
    // Re-register the notification channel for Android
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'FOLLOW_UP',
        actions: [{ id: 'dismiss', title: 'Dismiss' }],
      }],
    }).catch(() => {})
  }
}

/* Trigger a local notification for a follow-up reminder */
export async function scheduleFollowUpNotification({ leadName, date, time, notifId }) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const [h, m]  = (time ?? '09:00').split(':').map(Number)
    const fireAt  = new Date(date)
    fireAt.setHours(h, m, 0, 0)
    if (fireAt <= new Date()) return
    await LocalNotifications.schedule({
      notifications: [{
        id:       notifId ?? Math.floor(Math.random() * 100000),
        title:    'Follow-up due',
        body:     leadName,
        schedule: { at: fireAt, allowWhileIdle: true },
        actionTypeId: 'FOLLOW_UP',
        extra:    { leadName },
      }],
    })
  } catch (err) {
    console.warn('scheduleFollowUpNotification failed', err)
  }
}

/* Haptic tap feedback for button presses */
export async function tapFeedback() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {}
}

/* Haptic medium feedback for long-press confirm */
export async function longPressFeedback() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch {}
}
