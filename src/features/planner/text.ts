const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string) {
  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, body: string) => {
    if (body.startsWith("#x")) return String.fromCharCode(Number.parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCharCode(Number.parseInt(body.slice(1), 10));
    return ENTITY_MAP[body.toLowerCase()] ?? entity;
  });
}

export function htmlToPlainText(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainTextToMitHtml(value: string) {
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

export function taskHasText(text: string) {
  return text.trim().length > 0;
}
