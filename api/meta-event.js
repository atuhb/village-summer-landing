module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://villagesummersurf.com.br');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PIXEL_ID || !ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Missing credentials' });
    }

    const { event_name, event_id } = req.body || {};

    if (!event_name || !event_id) {
        return res.status(400).json({ error: 'Missing event_name or event_id' });
    }

    const client_ip_address = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
    const client_user_agent = req.headers['user-agent'] || undefined;

    const payload = {
        data: [{
            event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_id,
            action_source: 'website',
            user_data: {
                client_ip_address,
                client_user_agent,
            },
        }],
        access_token: ACCESS_TOKEN,
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );
        const data = await response.json();
        console.log('Meta response:', JSON.stringify(data));
        console.log('Meta status:', response.status);
        console.log('Payload sent:', JSON.stringify({ ...payload, access_token: '[REDACTED]' }));
        return res.status(response.ok ? 200 : 400).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
