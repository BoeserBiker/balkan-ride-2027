export const MOBILE_UPDATE_QUERY = '(max-width: 767px)';

// Update-Dialog und Daten-Hinweis erscheinen nur auf Mobilgeräten (< 768 px); Desktop und Tablet bleiben ungestört.
export function mobileUpdatesEnabled(win = globalThis.window) {
  return Boolean(win?.matchMedia?.(MOBILE_UPDATE_QUERY).matches);
}
