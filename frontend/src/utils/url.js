/**
 * Normalizes any deliverable URL or handle (e.g. "@username", "instagram.com/p/...", "drive.google.com/...")
 * into an absolute, safe URL that opens properly in a new browser tab without causing local 404 errors.
 */
export const formatDeliverableUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'none') {
    return '#';
  }

  // 1. Handle Instagram handle with '@' e.g. "@pinkshaktiofficial"
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).trim().replace(/^@+/, '');
    return handle ? `https://instagram.com/${handle}` : '#';
  }

  // 2. Already has protocol (http:// or https://)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // 3. Starts with common social/storage domain without protocol
  if (/^(?:www\.)?(?:instagram\.com|facebook\.com|youtube\.com|youtu\.be|tiktok\.com|drive\.google\.com|dropbox\.com|linkedin\.com|twitter\.com|x\.com)\//i.test(trimmed)) {
    return `https://${trimmed.replace(/^https?:\/\//i, '')}`;
  }

  // 4. Any domain pattern with TLD and no spaces (e.g. "example.com/xyz", "drive.google.com")
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // 5. Looks like an Instagram username without '@' (e.g. pinkshaktiofficial)
  if (/^[a-zA-Z0-9._]{3,30}$/.test(trimmed)) {
    return `https://instagram.com/${trimmed}`;
  }

  // 6. If it contains a dot and no spaces
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return '#';
};

