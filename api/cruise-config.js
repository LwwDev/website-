module.exports = async (_req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    return res.status(200).send(
        `window.CRUISE_CONFIG = ${JSON.stringify({
            supabaseUrl,
            supabaseAnonKey
        })};`
    );
};
