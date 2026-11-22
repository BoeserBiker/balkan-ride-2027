export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function googleMapsDirectionsUrl(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error('Ungültige Koordinaten für Google Maps.');
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude}%2C${longitude}`;
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
