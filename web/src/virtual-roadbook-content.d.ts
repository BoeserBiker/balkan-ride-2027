declare module 'virtual:roadbook-content' {
  const days: Array<{
    sourcePath: string;
    frontmatter: {
      tag: number;
      datum: string;
      titel: string;
      start: string;
      ziel: string;
      koordinaten_start: [number, number];
      koordinaten_ziel: [number, number];
      kilometer: number;
      fahrzeit: string;
      hoehenmeter: number;
      gpx_datei: string;
      highlights: string[];
      bilder: Array<{ datei: string; beschreibung: string }>;
      videos: Array<{ typ: string; quelle: string; poster?: string; titel?: string }>;
    };
    body: string;
  }>;
  export default days;
}
