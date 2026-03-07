export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get('url');

        // Handle CORS preflight requests
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Max-Age': '86400',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (!targetUrl) {
            return new Response('Missing ?url= parameter', { status: 400, headers: corsHeaders });
        }

        try {
            // Pass authorization if it exists
            const authHeader = request.headers.get('Authorization');
            const targetHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            };
            if (authHeader) {
                targetHeaders['Authorization'] = authHeader;
            }

            // Fetch the requested OpenSky URL
            const response = await fetch(targetUrl, {
                headers: targetHeaders
            });

            const responseHeaders = new Headers(response.headers);
            // Append CORS to the final response so Firebase can read it
            responseHeaders.set('Access-Control-Allow-Origin', '*');

            return new Response(response.body, {
                status: response.status,
                headers: responseHeaders
            });
        } catch (e) {
            return new Response(e.message, { status: 500, headers: corsHeaders });
        }
    },
};
