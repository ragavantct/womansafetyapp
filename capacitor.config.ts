import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ragavan.womensafety',
  appName: 'Safety Reach',
  webDir: 'mobile-fallback',
  server: {
    url: 'https://woman-safety-reach-main.vercel.app',
    cleartext: false,
    allowNavigation: ['woman-safety-reach-main.vercel.app'],
  },
};

export default config;
