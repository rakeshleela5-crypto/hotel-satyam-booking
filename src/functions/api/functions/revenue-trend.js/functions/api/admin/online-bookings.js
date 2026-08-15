import { getDb } from '../../../db';

export async function onRequest({ request, env }) {
    try {
        const url = new URL(request.url);
        const date = url.searchParams.get('date');

        if (!date || !/^d{4}-d{2}-d{2}$/.test(date)) {
            return Response.json(
                { success: false, error: 'Invalid or missing date parameter' },
                { status: 400 }
            );
        }

        const db = getDb(env);

        // Adjust this WHERE condition if your "online" bookings are identified differently
        // Example: booking_type != 'walkin' OR booking_type = 'online'
        const { results } = await db
            .selectFrom('bookings')
            .select([
                'booking_id',
                'full_name',
                'phone',
                'check_in',
                'check_out',
                'nights',
                'total_amount',
                'booking_status',
                'booking_type',
            ])
            .where('check_in', '=', date)
            .where('booking_type', '!=', 'walkin') // treats non-walkin as online
            .orderBy('booking_id', 'desc')
            .execute();

        return Response.json({
            success: true,
            bookings: results,
        });
    } catch (err) {
        console.error('Error in /api/admin/online-bookings:', err);
        return Response.json(
            {
                success: false,
                error: 'Failed to fetch online bookings',
            },
            { status: 500 }
        );
    }
}