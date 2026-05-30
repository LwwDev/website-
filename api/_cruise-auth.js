const crypto = require('node:crypto');

const COOKIE_NAME = 'cruise_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function getSecret() {
    return process.env.CRUISE_SESSION_SECRET || '';
}

function getExpectedUsername() {
    return process.env.CRUISE_LOGIN_NAME || process.env.CRUISE_LOGIN_USERNAME || '';
}

function getAllowedNames() {
    return getExpectedUsername()
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

function parseCookies(req) {
    const raw = req.headers.cookie || '';
    const cookies = {};

    raw.split(';').forEach((part) => {
        const [key, ...rest] = part.trim().split('=');
        if (!key) return;
        cookies[key] = decodeURIComponent(rest.join('='));
    });

    return cookies;
}

function createSignature(payload, secret) {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function createSessionValue(username, secret) {
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    const payload = `${username}|${expiresAt}`;
    const signature = createSignature(payload, secret);
    return `${payload}|${signature}`;
}

function readSession(req) {
    const secret = getSecret();
    if (!secret) return { valid: false, reason: 'missing-secret' };

    const cookies = parseCookies(req);
    const value = cookies[COOKIE_NAME];
    if (!value) return { valid: false, reason: 'missing-cookie' };

    const parts = value.split('|');
    if (parts.length !== 3) return { valid: false, reason: 'bad-cookie' };

    const [username, expiresAtRaw, signature] = parts;
    const payload = `${username}|${expiresAtRaw}`;
    const expected = createSignature(payload, secret);

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return { valid: false, reason: 'bad-signature' };
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
        return { valid: false, reason: 'expired' };
    }

    return { valid: true, username };
}

function setSessionCookie(res, username) {
    const secret = getSecret();
    const value = createSessionValue(username, secret);
    res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}; Secure`
    );
}

function clearSessionCookie(res) {
    res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`
    );
}

function loginMatches(username) {
    const allowedNames = getAllowedNames();

    if (!allowedNames.length) {
        return false;
    }

    return allowedNames.includes(username.toLowerCase());
}

module.exports = {
    clearSessionCookie,
    getAllowedNames,
    getExpectedUsername,
    parseCookies,
    readSession,
    loginMatches,
    setSessionCookie,
};
