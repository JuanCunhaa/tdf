import type { NextFunction, Request, Response } from 'express';

function isPlainObject(v: any) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

// Very conservative detector for obvious SQLi meta-tokens.
// Prisma uses parameterization, so this is defense-in-depth to block noisy payloads.
const TOKEN_RE = /(--|\/\*|\*\/|;)/; // avoid false positives with keywords
const BODY_KEY_ALLOWLIST = new Set([
  'motivation',
  'prior_clans',
  'portfolio_links',
  'note',
  'description',
  'explanation',
  'message',
]);

function lastKey(path: string) {
  const parts = path.split('.');
  const last = parts[parts.length - 1];
  const key = last.replace(/\[[0-9]+\]$/, '');
  return key;
}

function scanValue(val: any, path: string, hits: string[]) {
  if (typeof val === 'string') {
    const key = lastKey(path);
    if (BODY_KEY_ALLOWLIST.has(key)) return; // allow free-text fields
    if (val.length > 128) return; // ignore long free-text inputs
    if (TOKEN_RE.test(val)) hits.push(path);
  } else if (Array.isArray(val)) {
    val.forEach((item, i) => scanValue(item, `${path}[${i}]`, hits));
  } else if (isPlainObject(val)) {
    Object.entries(val).forEach(([k, v]) => scanValue(v, `${path}.${k}`, hits));
  }
}

export function blockSqlMeta(req: Request, res: Response, next: NextFunction) {
  try {
    const hits: string[] = [];
    if (req.query) scanValue(req.query, 'query', hits);
    if (req.params) scanValue(req.params, 'params', hits);
    if (req.body) scanValue(req.body, 'body', hits);
    if (hits.length) {
      return res.status(400).json({ error: 'Invalid characters in input' });
    }
    return next();
  } catch {
    return res.status(400).json({ error: 'Bad request' });
  }
}
