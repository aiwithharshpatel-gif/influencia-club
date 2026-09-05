/**
 * Normalizes any deliverable URL or handle (e.g. "@username", "instagram.com/p/...", "drive.google.com/...")
 * into an absolute, safe URL that opens properly in a new browser tab without causing local 404 errors.
 */
export const formatDeliverableUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';

  // 1. Handle Instagram handle with '@' e.g. "@pinkshaktiofficial"
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).trim();
    return `https://instagram.com/${handle}`;
  }

  // 2. Already has protocol (http:// or https://)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // 3. Domain pattern (e.g. "instagram.com/p/...", "drive.google.com/...", "youtu.be/...")
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  // 4. Looks like an Instagram username without '@' (e.g. pinkshaktiofficial)
  if (/^[a-zA-Z0-9._]{3,30}$/.test(trimmed)) {
    return `https://instagram.com/${trimmed}`;
  }

  // 5. Fallback prepend https://
  return `https://${trimmed}`;
};
