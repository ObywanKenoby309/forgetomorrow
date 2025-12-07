// lib/slug.js
//
// Final production version.
// Strong sanitation, banned term filtering, and suffix generation.
//
// IMPORTANT: Do NOT ever import this file client-side.
// Keep all banned-term logic on the server only.

// ------------------------------------------------------------
// BANNED TERMS
// ------------------------------------------------------------

export const BANNED_SLUG_TERMS = [
  // General profanity
  'fuck','fuk','fck','fucker','fucking','motherfucker','mofo','mf','shit','sh1t',
  'bullshit','bs','bitch','btch','bastard','asshole','dumbass','jackass','dipshit',
  'crap','piss','pissed','damn','goddamn',

  // Sex / porn
  'sex','sexy','porn','porno','pornhub','xvideos','xnxx','xxx','nsfw','naked',
  'nude','nud3','stripper','escort','camgirl','onlyfans','ofans','fetish','bdsm',
  'kink','horny','erotic',

  // Genitals
  'dick','dik','d1ck','cock','c0ck','kok','penis','phallus','pussy','pusy','cunt',
  'twat','vagina','vag','clit','boob','boobs','tits','tit','boobies','nipple',
  'nips','ballsack','balls','testicle','scrotum',

  // Sex acts
  'blowjob','bj','handjob','hj','jerkoff','jerkingoff','cum','cumming','jizz',
  'orgasm','deepthroat','anal','buttsex','rimjob','69',

  // Degrading sexual terms
  'slut','whore','hoe','ho','skank','tramp','thot','milf','dilf',

  // Violence / threats
  'rape','rapist','raping','killmyself','killyourself','kys','kms','suicide',
  'selfharm','murder','massmurder','schoolshooter','serialkiller','terror',
  'terrorist','bomb','bomber','diebitch',

  // Extremist
  'nazi','hitler','heilhitler','sssoldier','kkk','whitepower','whitepride',
  'bloodandsoil',

  // Hateful slurs
  'nigger','nigga','chink','gook','spic','wetback','kike','faggot','fag','dyke',
  'tranny','retard','retarded','towelhead','sandnigger','raghead',

  // Anti-religious hate
  'islamist','islamterror','christcuck','jewhatred','gasjews',

  // Harassment
  'loser','worthless','killurself','uglybitch','fatwhore',

  // Drugs
  'coke','cocaine','heroin','meth','methhead','crack','crackhead','weed',
  'marijuana','stoner','420','lsd','shrooms','mdma','ecstasy',

  // Crime / gangs
  'cartel','gangbanger','gangbang','hitman','assassin','druglord',

  // Bodily fluids
  'vomit','vomitface','puke','peepee','poop','feces','shitface','shithead',

  // Self-harm shorthand
  'enditall','nolife','diealone','lifeisover',
];

// ------------------------------------------------------------
// NORMALIZATION
// ------------------------------------------------------------

/**
 * Normalize user input into a safe slug:
 * - Lowercase
 * - Trim spaces
 * - Convert non-alphanumeric → hyphens
 * - Collapse multiple hyphens
 * - Trim leading/trailing hyphens
 * - Normalize Unicode to prevent homoglyph bypass
 */
export function normalizeSlug(input) {
  if (!input) return '';

  const unicodeSafe = input.normalize('NFKD');

  return unicodeSafe
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')   // non alphanumeric → "-"
    .replace(/-+/g, '-')           // collapse --- into -
    .replace(/^-+|-+$/g, '');      // remove leading/trailing -
}

// ------------------------------------------------------------
// BANNED TERM CHECK
// ------------------------------------------------------------

/**
 * Return true if slug contains a banned term (substring).
 * Unicode-safe.
 */
export function hasBannedTerm(slug) {
  if (!slug) return false;
  const s = slug.normalize('NFKD').toLowerCase();
  return BANNED_SLUG_TERMS.some(term => s.includes(term));
}

// ------------------------------------------------------------
// RANDOM SUFFIX (unique fallback)
// ------------------------------------------------------------

/**
 * A clean alphanumeric suffix.
 * Excludes ambiguous characters (O, 0, l, I).
 */
export function randomSuffix(length = 5) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ------------------------------------------------------------
// BASE SLUG FROM IDENTITY
// ------------------------------------------------------------

/**
 * Derive a base slug from first/last name or email local-part.
 * This does NOT check uniqueness or banned terms; it's just a base string.
 */
export function baseSlugFromIdentity({
  firstName,
  lastName,
  email,
}) {
  const safeEmail = (email || '').toLowerCase().trim();
  const localPart = safeEmail.includes('@')
    ? safeEmail.split('@')[0]
    : safeEmail;

  let raw = '';

  if (firstName || lastName) {
    raw = `${firstName || ''} ${lastName || ''}`.trim();
  }

  if (!raw && localPart) {
    raw = localPart;
  }

  if (!raw) {
    // absolute worst-case fallback
    raw = 'user';
  }

  return normalizeSlug(raw);
}
