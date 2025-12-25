// VAPID keys for Web Push notifications
// These are public/private key pairs for Web Push authentication
// The public key is safe to include in client-side code

export const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Note: This is a demo public key. For production, you should:
// 1. Generate your own VAPID keys using: npx web-push generate-vapid-keys
// 2. Store the private key as a secret (VAPID_PRIVATE_KEY)
// 3. Update this public key to match your generated pair

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
