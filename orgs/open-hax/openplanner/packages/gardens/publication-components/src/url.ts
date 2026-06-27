export function audioUrlForPath(path: string, audioUrlBase = "/api/studio/stream"): string {
  return `${audioUrlBase}?path=${encodeURIComponent(path)}`;
}
