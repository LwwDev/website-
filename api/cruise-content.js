const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    try {
        const filePath = path.join(process.cwd(), 'private', 'cruise-page.html');
        const html = await fs.readFile(filePath, 'utf8');

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return res.status(200).send(html);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown server error.';
        return res.status(500).json({ error: message });
    }
};
