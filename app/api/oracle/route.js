import { getUserProfile } from '../../../lib/authMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const { isPremium } = await getUserProfile(req);

        if (!isPremium) {
            return Response.json({
                reply: "Access Denied. The Oracle requires Intelligence or Enterprise tier clearance.",
                locked: true
            });
        }

        const body = await req.json();
        const userQuery = body.query ? body.query.toLowerCase() : "";

        // Simulate an LLM parsing the request and returning contextual intelligence.
        // In a real application, this would pass the query and context (current CVI, events) to OpenAI.
        
        let responseText = "I am analyzing the telemetry. Current market indicators are stable, but look out for weekend surges.";

        if (userQuery.includes('f1') || userQuery.includes('formula 1') || userQuery.includes('grand prix')) {
            responseText = "The Las Vegas Grand Prix is currently forecasted to drive a 2.8x multiplier on baseline velocity. I recommend pushing RevPAR (Revenue Per Available Room) up by at least 45% for the primary weekend dates to capture the inelastic demand.";
        } else if (userQuery.includes('ces') || userQuery.includes('electronics')) {
            responseText = "CES historically compresses the entire strip. Our models suggest a 98/100 compression score. Expect massive inbound corporate flight volume starting on Monday morning.";
        } else if (userQuery.includes('flight') || userQuery.includes('velocity')) {
            responseText = "Current City Velocity Index is hovering around 54/100, which is normal for this time of week. We are tracking a steady stream of arrivals at KLAS with no major holding patterns.";
        } else if (userQuery.includes('hello') || userQuery.includes('hi')) {
            responseText = "Greetings, Operator. How can I assist with your market strategy today?";
        }

        // Add a slight delay to simulate "thinking"
        await new Promise(resolve => setTimeout(resolve, 1500));

        return Response.json({
            reply: responseText,
            locked: false
        });

    } catch (error) {
        console.error("Oracle API Error:", error);
        return Response.json({ reply: "Connection to Oracle mainframe lost." }, { status: 500 });
    }
}
