
export type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';


export function getCurrentSeason(hemisphere: 'Northern' | 'Southern' = 'Northern'): Season {
    const month = new Date().getMonth(); // 0-11

    if (hemisphere === 'Northern') {
        // Winter: Dec (11), Jan (0), Feb (1)
        if (month === 11 || month === 0 || month === 1) return 'Winter';
        // Spring: Mar (2), Apr (3), May (4)
        if (month >= 2 && month <= 4) return 'Spring';
        // Summer: Jun (5), Jul (6), Aug (7)
        if (month >= 5 && month <= 7) return 'Summer';
        // Fall: Sep (8), Oct (9), Nov (10)
        return 'Fall';
    } else {
        // Southern Hemisphere (Seasons are reversed)
        // Summer: Dec (11), Jan (0), Feb (1)
        if (month === 11 || month === 0 || month === 1) return 'Summer';
        // Fall: Mar (2), Apr (3), May (4)
        if (month >= 2 && month <= 4) return 'Fall';
        // Winter: Jun (5), Jul (6), Aug (7)
        if (month >= 5 && month <= 7) return 'Winter';
        // Spring: Sep (8), Oct (9), Nov (10)
        return 'Spring';
    }
}
