// Utility functions for flight tracking logic

// List of common private jet ICAO type designators
const privateJetTypes = new Set([
    'GLF4', 'GLF5', 'GLF6', // Gulfstream
    'GLEX', 'GL5T', 'GL7T', // Global Express/5000/7500
    'CL30', 'CL35', 'CL60', // Challenger
    'C56X', 'C560', 'C680', 'C68A', 'C750', 'C25A', 'C25B', 'C525', // Citation
    'F2TH', 'F900', 'FA7X', 'FA8X', // Falcon
    'E55P', 'E50P', 'HDJT', // Phenom/HondaJet
    'LJ35', 'LJ45', 'LJ60', 'LJ70', 'LJ75', // Learjet
    'BE40', // Beechjet
    'H25B' // Hawker
]);

// List of common commercial airline prefixes
const commercialAirlines = new Set([
    'SWA', // Southwest
    'AAL', // American
    'DAL', // Delta
    'UAL', // United
    'JBU', // JetBlue
    'NK', 'NKS', // Spirit
    'FFT', // Frontier
    'ASA', // Alaska
    'SY', 'SCX', // Sun Country
    'G4', 'AAY', // Allegiant
    'SKW', // SkyWest
    'BAW', // British Airways
    'VIR', // Virgin Atlantic
    'ACA', // Air Canada
    'WJA', // WestJet
    'VIV', // VivaAerobus
    'VOI', // Volaris
    'AMX', // Aeromexico
    'KAL', // Korean Air
    'DLH', // Lufthansa
    'KLM'  // KLM
]);

/**
 * Classify aircraft based on its type code and callsign.
 * @param {string} type - Aircraft ICAO type code (e.g. B738, GLF5, C56X)
 * @param {string} callsign - Flight callsign (e.g. SWA1234, N12345)
 * @returns {string} Category: 'Private', 'Commercial', 'Cargo', or 'Other'
 */
export function classifyAircraft(type, callsign) {
    if (!type && !callsign) return 'Other';
    
    const cleanType = (type || '').toUpperCase().trim();
    const cleanCallsign = (callsign || '').toUpperCase().trim();

    if (privateJetTypes.has(cleanType)) {
        return 'Private';
    }

    // Check callsign prefix for commercial airlines
    for (const prefix of commercialAirlines) {
        if (cleanCallsign.startsWith(prefix)) {
            return 'Commercial';
        }
    }

    // Common cargo airlines
    if (cleanCallsign.startsWith('FDX') || cleanCallsign.startsWith('UPS') || cleanCallsign.startsWith('GTI') || cleanCallsign.startsWith('ABX')) {
        return 'Cargo';
    }

    // Additional commercial type heuristics if callsign doesn't match
    if (cleanType.startsWith('B7') || cleanType.startsWith('A3') || cleanType.startsWith('E7') || cleanType.startsWith('CRJ')) {
        return 'Commercial';
    }

    // Default heuristic for N-numbers which are often private (if not matched to above)
    if (cleanCallsign.startsWith('N') && cleanCallsign.length <= 6 && !cleanType.startsWith('B7') && !cleanType.startsWith('A3')) {
        return 'Private';
    }

    return 'Other';
}

/**
 * Estimate passenger capacity based on common commercial aircraft types.
 * Using typical configurations.
 * @param {string} type - Aircraft ICAO type code (e.g. B738, A320)
 * @returns {number} Estimated passenger count
 */
export function estimatePassengers(type) {
    if (!type) return 0;
    const cleanType = type.toUpperCase().trim();

    // Mapping of common types to typical passenger capacity
    const capacityMap = {
        // Airbus
        'A319': 128,
        'A320': 150,
        'A20N': 160, // A320neo
        'A321': 190,
        'A21N': 200, // A321neo
        'A332': 250,
        'A333': 290,
        'A339': 280, // A330-900neo
        'A359': 300,
        'A35K': 350,

        // Boeing
        'B737': 140, // Generic 737
        'B738': 175,
        'B739': 190,
        'B38M': 175, // 737 MAX 8
        'B39M': 190, // 737 MAX 9
        'B752': 200,
        'B753': 240,
        'B763': 210,
        'B764': 245,
        'B772': 270,
        'B77W': 350,
        'B788': 230,
        'B789': 280,
        'B78X': 330,

        // Regional / Embraer / CRJ
        'E170': 70,
        'E75L': 76,
        'E75S': 76,
        'E190': 100,
        'E290': 114,
        'CRJ2': 50,
        'CRJ7': 70,
        'CRJ9': 76,
        'BCS1': 110, // A220-100
        'BCS3': 130, // A220-300
    };

    if (capacityMap[cleanType]) {
        // Multiply by 0.85 to assume an 85% load factor (typical for US domestic/Vegas flights)
        return Math.floor(capacityMap[cleanType] * 0.85);
    }

    return 0; // Return 0 for unknown types or private jets
}

/**
 * Estimate origin airport based on airline callsign for prototype realism
 * @param {string} callsign 
 * @returns {string} ICAO airport code
 */
export function estimateOrigin(callsign) {
    if (!callsign) return 'KLAX'; // Default fallback West Coast
    const cleanCallsign = callsign.toUpperCase().trim();

    // Deterministic pseudo-random based on callsign for variance within hubs
    let hash = 0;
    for (let i = 0; i < cleanCallsign.length; i++) {
        hash = cleanCallsign.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rand = Math.abs(hash) % 100;

    // International
    if (cleanCallsign.startsWith('BAW') || cleanCallsign.startsWith('VIR')) return 'EGLL'; // EU/UK
    if (cleanCallsign.startsWith('DLH')) return 'EDDF'; // EU/UK
    if (cleanCallsign.startsWith('KLM')) return 'EHAM'; // EU/UK
    if (cleanCallsign.startsWith('ACA') || cleanCallsign.startsWith('WJA')) return 'CYYZ'; // Technically Intl (Canada) -> we'll let it fall to other Intl
    if (cleanCallsign.startsWith('AMX') || cleanCallsign.startsWith('VOI') || cleanCallsign.startsWith('VIV')) return 'MMMX'; // LATAM

    // US Domestic Hubs
    if (cleanCallsign.startsWith('DAL')) {
        return rand < 50 ? 'KATL' : (rand < 80 ? 'KDTW' : 'KJFK');
    }
    if (cleanCallsign.startsWith('AAL')) {
        return rand < 50 ? 'KDFW' : (rand < 80 ? 'KCLT' : 'KMIA');
    }
    if (cleanCallsign.startsWith('UAL')) {
        return rand < 40 ? 'KSFO' : (rand < 70 ? 'KORD' : 'KEWR');
    }
    if (cleanCallsign.startsWith('SWA')) {
        return rand < 30 ? 'KDAL' : (rand < 60 ? 'KMDW' : (rand < 80 ? 'KPHX' : 'KBWI'));
    }
    if (cleanCallsign.startsWith('JBU')) return rand < 70 ? 'KJFK' : 'KBOS';
    if (cleanCallsign.startsWith('ASA')) return 'KSEA';
    if (cleanCallsign.startsWith('NK') || cleanCallsign.startsWith('NKS')) return 'KFLL';

    // General pseudo-random distribution for others/private
    // 40% West, 20% East, 30% Midwest/South, 5% EU, 5% LATAM
    if (rand < 40) return ['KLAX', 'KSFO', 'KPHX', 'KSEA', 'KSAN'][rand % 5];
    if (rand < 60) return ['KJFK', 'KBOS', 'KMIA', 'KEWR', 'KIAD'][rand % 5];
    if (rand < 90) return ['KORD', 'KDFW', 'KATL', 'KIAH', 'KMDW'][rand % 5];
    if (rand < 95) return 'EGLL';
    return 'MMMX';
}
