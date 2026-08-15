import { getDb } from '../../../db';

export async function onRequest({ request, env }) {
    try {
        const url = new URL(request.url);
        const daysParam = url.searchParams.get('days') || '7';
        const days = Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 90); // 1–90 days

        const db = getDb(env);

        // Get today's date in YYYY-MM-DD (local to server; adjust if you store in a specific timezone)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days + 1);

        const startDateStr = startDate.toISOString().slice(0, 10);
        const todayStr = today.toISOString().slice(0, 10);

        // Query bookings in the date range
        const { results } = await db
            .selectFrom('bookings')
            .select(['check_in', 'total_amount', 'booking_type'])
            .where('check_in', '>=', startDateStr)
            .where('check_in', '<=', todayStr)
            .execute();

        // Aggregate by date
        const map = new Map();

        // Initialize all dates in range with 0
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            map.set(dateStr, { date: dateStr, walkin_revenue: 0, online_revenue: 0 });
        }

        for (const row of results) {
            const date = row.check_in;
            if (!map.has(date)) continue;

            const amount = parseFloat(row.total_amount) || 0;
            const type = (row.booking_type || '').toLowerCase();

            const entry = map.get(date);
            if (type === 'walkin') {
                entry.walkin_revenue += amount;
            } else {
                entry.online_revenue += amount;
            }
        }

        // Convert to array sorted by date
        const data = Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));

        return Response.json({
            success: true,
            data,
        });
    } catch (err) {
        console.error('Error in /api/admin/revenue-trend:', err);
        return Response.json(
            {
                success: false,
                error: 'Failed to fetch revenue trend',
            },
            { status: 500 }
        );
    }
}