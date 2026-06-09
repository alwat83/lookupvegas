export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Las Vegas Coordinates: 36.1628° N, 115.1398° W
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=36.1628&longitude=-115.1398&current=temperature_2m,wind_speed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FLos_Angeles';
        
        const response = await fetch(url, {
            next: { revalidate: 1800 } // Cache for 30 minutes
        });

        if (!response.ok) {
            throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        const current = data.current || {};
        
        const temp = current.temperature_2m || 0;
        const wind = current.wind_speed_10m || 0;
        const precip = current.precipitation || 0;

        let impactScore = 0;
        let severity = "Optimal";
        let conditions = [];

        // Temperature Impact
        if (temp >= 110) {
            impactScore += 80;
            conditions.push("Extreme Heat");
        } else if (temp >= 105) {
            impactScore += 40;
            conditions.push("High Heat");
        } else if (temp <= 40) {
            impactScore += 20;
            conditions.push("Cold");
        }

        // Wind Impact (Planes grounded or slow, people stay inside)
        if (wind >= 30) {
            impactScore += 60;
            conditions.push("Severe Winds");
        } else if (wind >= 20) {
            impactScore += 30;
            conditions.push("High Winds");
        }

        // Precipitation
        if (precip > 0.5) {
            impactScore += 50;
            conditions.push("Heavy Rain");
        } else if (precip > 0.1) {
            impactScore += 30;
            conditions.push("Light Rain");
        }

        if (conditions.length === 0) {
            conditions.push("Clear Skies");
        }

        impactScore = Math.min(100, impactScore);

        if (impactScore >= 80) severity = "Severe Disruption";
        else if (impactScore >= 50) severity = "High Impact";
        else if (impactScore >= 20) severity = "Minor Delay";

        return Response.json({
            data: {
                temp: Math.round(temp),
                wind: Math.round(wind),
                precip: precip,
                impactScore: impactScore,
                severity: severity,
                conditions: conditions.join(', ')
            }
        });

    } catch (error) {
        console.error("Weather API Error:", error);
        return Response.json({
            data: {
                temp: 75,
                wind: 5,
                precip: 0,
                impactScore: 0,
                severity: "Optimal",
                conditions: "Clear Skies"
            },
            source: 'fallback'
        }, { status: 200 });
    }
}
