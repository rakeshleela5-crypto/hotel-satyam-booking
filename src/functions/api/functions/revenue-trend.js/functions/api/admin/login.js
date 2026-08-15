export async function onRequest({ request, env }) {
    // Only allow POST
    if (request.method !== 'POST') {
        return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { password } = body || {};

        const correctPassword = env.ADMIN_PASSWORD;

        if (!correctPassword || typeof correctPassword !== 'string') {
            console.error('ADMIN_PASSWORD not configured');
            return Response.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (password === correctPassword) {
            // In a real app, you might set a secure cookie or JWT here.
            // For simplicity, we just return success and let the frontend store a flag.
            return Response.json({ success: true });
        } else {
            return Response.json({ success: false, error: 'Invalid password' }, { status: 401 });
        }
    } catch (err) {
        console.error('Error in /api/admin/login:', err);
        return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
}