export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

const NAVIGATION_STORAGE_KEY = 'balkan-ride-navigation-app';
const NAVIGATION_APPS = new Set(['google', 'apple', 'kurviger']);
let selectedNavigationApp;

export function getNavigationApp() {
  if (selectedNavigationApp) return selectedNavigationApp;
  try {
    const saved = localStorage.getItem(NAVIGATION_STORAGE_KEY);
    if (saved && !NAVIGATION_APPS.has(saved)) {
      console.error('Gespeicherte Navigations-App ist ungültig.');
    }
    selectedNavigationApp = NAVIGATION_APPS.has(saved) ? saved : 'google';
  } catch (error) {
    console.error('Navigations-App konnte nicht gelesen werden.', error);
    selectedNavigationApp = 'google';
  }
  return selectedNavigationApp;
}

export function setNavigationApp(app) {
  if (!NAVIGATION_APPS.has(app)) {
    throw new Error('Unbekannte Navigations-App.');
  }
  selectedNavigationApp = app;
  try {
    localStorage.setItem(NAVIGATION_STORAGE_KEY, app);
  } catch (error) {
    console.error('Navigations-App konnte nicht gespeichert werden.', error);
  }
}

export function directionsUrl(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error('Ungültige Koordinaten für die Navigation.');
  }
  const destination = encodeURIComponent(`${latitude},${longitude}`);
  switch (getNavigationApp()) {
    case 'apple':
      return `https://maps.apple.com/?daddr=${destination}`;
    case 'kurviger':
      return `https://kurviger.de/?point=${destination}`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }
}

export function formatDuration(value) {
  return String(value ?? '').replace(/(\d+(?:[,.]\d+)?)\s*Modell-h/g, (_match, amount) => {
    const minutes = Math.round(Number(amount.replace(',', '.')) * 60);
    if (minutes === 0) {
      return '0 Std.';
    }
    return `ca. ${Math.floor(minutes / 60)} Std. ${String(minutes % 60).padStart(2, '0')} Min.`;
  });
}

export function escapeDisplayText(value) {
  return escapeHtml(formatDuration(value));
}
