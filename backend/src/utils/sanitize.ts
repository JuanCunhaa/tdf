export function sanitizeText(input: string | null | undefined, max = 1000): string | null {
  if (input == null) return null;
  let s = String(input);
  s = s.replace(/<[^>]*>/g, '');
  s = s.replace(/[\0\x08\x09\x1a\n\r\x22\x27\\]/g, ' ');
  // Remove common SQL comment/delimiter tokens
  s = s.replace(/--/g, ' ');
  s = s.replace(/(\/\*|\*\/)/g, ' ');
  s = s.replace(/;/g, ' ');
  s = s.trim();
  if (s.length > max) s = s.slice(0, max);
  return s;
}
