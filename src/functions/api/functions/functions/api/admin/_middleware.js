export async function onRequest({ request, env, next }) {
    // Allow preflight for CORS if needed
    if (request.method === 'OPTIONS') {
        return next();
    }

    const url = new URL(request.url);

    // Skip auth for login endpoint
    if (url.pathname.endsWith('/api/admin/login')) {
        return next();
    }

    // Check for a simple auth header or query param
    // Frontend will send: ?token=ADMIN_PASSWORD (over HTTPS only)
    const token = url.searchParams.get('token');

    const correctPassword = env.ADMIN_PASSWORD;

    if (!correctPassword || token !== correctPassword) {
        return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return next();
}