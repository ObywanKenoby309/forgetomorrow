// lib/stateNormalize.js
// Expands full US state names → abbreviations (and vice-versa) so that
// a search for "Tennessee" matches records stored as "Nashville, TN".
//
// Usage:
//   normalizeLocationQuery('Tennessee')   → 'TN'
//   normalizeLocationQuery('New York')    → 'NY'
//   normalizeLocationQuery('Nashville')   → 'Nashville'  (city, passthrough)
//   expandStateQuery('Tennessee')         → ['Tennessee', 'TN']

const STATE_NAME_TO_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
  // DC + territories
  'district of columbia': 'DC', 'washington dc': 'DC',
  'puerto rico': 'PR', guam: 'GU',
};

const STATE_ABBR_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
);

/**
 * Given a location string, returns both the original and the
 * state abbreviation (or full name) so the search service can
 * match either form stored in the DB.
 *
 * Returns an array of strings to try.
 * If no expansion found, returns [original].
 */
export function expandStateQuery(location) {
  if (!location || typeof location !== 'string') return [location];

  const trimmed = location.trim();
  const lower = trimmed.toLowerCase();

  // Full state name → abbreviation  e.g. "Tennessee" → ["Tennessee","TN"]
  if (STATE_NAME_TO_ABBR[lower]) {
    return [trimmed, STATE_NAME_TO_ABBR[lower]];
  }

  // Abbreviation → full name  e.g. "TN" → ["TN","Tennessee"]
  const upperAbbr = trimmed.toUpperCase();
  if (STATE_ABBR_TO_NAME[upperAbbr]) {
    return [trimmed, STATE_ABBR_TO_NAME[upperAbbr]];
  }

  return [trimmed];
}

/**
 * Replaces a full state name with its abbreviation.
 * If the input is already an abbreviation or a city, returns it unchanged.
 * Use this when you need a single canonical value for a filter field.
 */
export function normalizeStateAbbr(location) {
  if (!location) return location;
  const lower = location.trim().toLowerCase();
  return STATE_NAME_TO_ABBR[lower] ?? location.trim();
}

/**
 * Expands state names found inside a free-text query string.
 * e.g. "software engineer Tennessee" → "software engineer Tennessee TN"
 * Leaves all non-state words untouched.
 */
export function expandStateNamesInQuery(query) {
  if (!query) return query;

  // Try multi-word state names first (longest match wins)
  let result = query;
  const sorted = Object.entries(STATE_NAME_TO_ABBR).sort(
    ([a], [b]) => b.split(' ').length - a.split(' ').length
  );

  for (const [name, abbr] of sorted) {
    const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
    if (pattern.test(result)) {
      // Append abbreviation only if not already present
      const abbrPattern = new RegExp(`\\b${abbr}\\b`, 'i');
      if (!abbrPattern.test(result)) {
        result = result.replace(pattern, (match) => `${match} ${abbr}`);
      }
      break; // only expand the first state found to avoid noise
    }
  }

  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}