const {
    loginMatches,
    setSessionCookie,
    getExpectedUsername,
} = require('./_cruise-auth');

async function readJsonBody(req) {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }

    const chunks = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    if (!getExpectedUsername() || !process.env.CRUISE_SESSION_SECRET) {
        return res.status(500).json({ error: 'Cruise login is not configured yet.' });
    }

    const body = await readJsonBody(req);
    const username = typeof body.username === 'string' ? body.username.trim() : '';

    if (!username) {
        return res.status(400).json({ error: 'Missing login name.' });
    }

    if (!loginMatches(username)) {
        return res.status(401).json({ error: 'That name is not allowed for this page.' });
    }

    setSessionCookie(res, username);
    return res.status(200).json({ ok: true });
};
