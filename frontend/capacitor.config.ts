import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.nexus.crm',
  appName: 'Nexus CRM',
  webDir:  'dist',

  server: {
    androidScheme: 'https',
    // For local development: uncomment and set your backend IP
    // url: 'http://192.168.1.100:5000',
    // cleartext: true,
  },

  android: {
    backgroundColor: '#0A0A0A',
    // Allow mixed content in dev (HTTP backend on local network)
    allowMixedContent: true,
  },

  plugins: {
    StatusBar: {
      style:           'DARK',
      backgroundColor: '#0A0A0A',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration:          2000,
      launchAutoHide:              true,
      backgroundColor:             '#0A0A0A',
      androidSplashResourceName:   'splash',
      androidScaleType:            'CENTER_INSIDE',
      showSpinner:                 false,
    },
    LocalNotifications: {
      smallIcon:          'ic_stat_icon_config_sample',
      iconColor:          '#E8FF47',
      sound:              'beep.wav',
    },
  },
}

export default config
