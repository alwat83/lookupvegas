export const dynamic = 'force-dynamic';

export async function GET() {
    const status = {
        ticketmaster: !!process.env.TICKETMASTER_API_KEY,
        seatgeek: !!process.env.SEATGEEK_CLIENT_ID,
        eventbrite: !!process.env.EVENTBRITE_API_KEY,
        flightradar24: !!process.env.FR24_API_KEY
    };

    return Response.json({
        data: status
    });
}
