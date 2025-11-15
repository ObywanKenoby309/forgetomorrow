// Minimal HMAC-signed session (no external deps)
import crypto from 'node:crypto';

const COOKIE_NAME = 'ft_session';
const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function b64url(str) {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}
function sign(input, secret) {
  return crypto.createHmac('sha256', secret).update(input).digest('hex');
}

export function createSessionCookie({ user, maxAgeSec = DEFAULT_MAX_AGE_SEC }) {
  const secret = process.env.AUTH_SECRET || 'dev-secret-change-me';
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role || 'USER',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const payloadStr = JSON.stringify(payload);
  const token = `${b64url(payloadStr)}.${sign(payloadStr, secret)}`;
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSec,
    },
    payload,
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    },
  };
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return acc;
    acc[decodeURIComponent(k)] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}

export function verifySessionFromReq(req) {
  const secret = process.env.AUTH_SECRET || 'dev-secret-change-me';
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const payloadStr = b64urlDecode(payloadB64);

  const expected = sign(payloadStr, secret);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
  return payload; // { sub, email, role, iat, exp }
}
