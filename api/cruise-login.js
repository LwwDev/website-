const {
    loginMatches,
    setSessionCookie,
    getExpectedUsername,
} = require('./_cruise-auth');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    if (!getExpectedUsername() || !process.env.CRUISE_SESSION_SECRET) {
        return res.status(500).json({ error: 'Cruise login is not configured yet.' });
    }

    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';

    if (!username) {
        return res.status(400).json({ error: 'Missing login name.' });
    }

    if (!loginMatches(username)) {
        return res.status(401).json({ error: 'That name is not allowed for this page.' });
    }

    setSessionCookie(res, username);
    return res.status(200).json({ ok: true });
};
