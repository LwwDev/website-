const { readSession } = require('./_cruise-auth');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const session = readSession(req);
    return res.status(200).json({ authenticated: session.valid });
};
