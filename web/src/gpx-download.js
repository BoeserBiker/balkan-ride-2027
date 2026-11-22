export function gpxDownload(day, gpx, baseUrl) {
  if (gpx.state !== 'loaded' || gpx.segments.length === 0) {
    return null;
  }
  const path = day.frontmatter.gpx_datei;
  return { href: `${baseUrl}${path}`, filename: path.split('/').pop() };
}
