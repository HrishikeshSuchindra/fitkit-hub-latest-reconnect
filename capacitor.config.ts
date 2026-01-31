import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3d03144805f34549a6e248f9f37ca43a',
  appName: 'fitkitsturf',
  webDir: 'dist',
  server: {
    url: 'https://3d031448-05f3-4549-a6e2-48f9f37ca43a.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
