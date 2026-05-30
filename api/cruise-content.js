const fs = require('node:fs/promises');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

function getAllowedEmails() {
    const raw = process.env.CRUISE_ALLOWED_EMAILS || '';
    return raw
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Missing Supabase server environment variables.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
        return res.status(401).json({ error: 'Missing bearer token.' });
    }

    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        });

        const {
            data: { user },
            error
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid session.' });
        }

        const allowedEmails = getAllowedEmails();
        if (allowedEmails.length > 0) {
            const email = (user.email || '').toLowerCase();
            if (!allowedEmails.includes(email)) {
                return res.status(403).json({ error: 'This account is not allowed to view the cruise page.' });
            }
        }

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
