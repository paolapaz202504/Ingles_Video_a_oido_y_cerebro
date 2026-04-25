export const STANDARD_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

// Función para obtener la fecha y hora exacta de Guatemala (UTC-6)
export function getGuatemalaDate() {
  const now = new Date();
  const gtTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(gtTime.getUTCDate())}/${pad(gtTime.getUTCMonth() + 1)}/${gtTime.getUTCFullYear()} ${pad(gtTime.getUTCHours())}:${pad(gtTime.getUTCMinutes())}:${pad(gtTime.getUTCSeconds())}`;
}