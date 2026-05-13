/**
 * Alerts configuration
 * --------------------
 * Controls what shows up in the "Alerts" banner on the dashboard.
 *
 * Two-layer logic:
 *   1. AUTO  — News items already flagged with `isPinned` (set in csv-parser.ts
 *              for GDRFA / Red Carpet articles), OR items whose title/description
 *              contains one of the URGENCY_KEYWORDS, OR items posted in the last
 *              RECENCY_HOURS that match user interest tags.
 *   2. ADMIN — Hard overrides. Anything matching ADMIN_PINNED_ALERT_TITLES (case-
 *              insensitive substring on the title) is force-promoted to the top
 *              of the Alerts list, regardless of recency or auto-flagging.
 *
 * To pin an alert manually, just add a unique substring of the article title
 * to ADMIN_PINNED_ALERT_TITLES below. No code changes required elsewhere.
 */

export const ADMIN_PINNED_ALERT_TITLES: string[] = [
  // Examples — uncomment / edit as needed:
  // 'EU AI Act',
  // 'GPT-5',
];

/**
 * Keywords that auto-promote a news item to "Alert" status.
 * Matched against `title + description`, case-insensitive substring.
 * Keep this list tight — too many matches dilute the urgency signal.
 */
export const URGENCY_KEYWORDS: string[] = [
  // Product / model launches
  'launches', 'launch', 'releases', 'unveils', 'announces',
  'breakthrough', 'milestone', 'first ever', 'world\'s first',
  // Money & deals
  'billion', 'raises $', 'funding round', 'mega round',
  'acquires', 'acquisition', 'ipo',
  // Regulation & legal
  'regulation', 'banned', 'lawsuit', 'court rules', 'ruling',
  'eu ai act', 'executive order',
  // Headline models / tools
  'gpt-5', 'gpt-6', 'claude 5', 'claude opus', 'gemini', 'sora',
  'open-source', 'open source release',
];

/** How recent (in hours) an item must be to count as time-sensitive. */
export const RECENCY_HOURS = 72;

/** Maximum number of alerts shown on the dashboard. */
export const MAX_ALERTS = 3;

/** Maximum top-news cards on the dashboard (excluding items already in alerts). */
export const MAX_TOP_NEWS = 6;

/** Maximum recommended courses on the dashboard. */
export const MAX_RECOMMENDED_COURSES = 6;

/** Maximum items in the watchlist feed (across all topics combined). */
export const MAX_WATCHLIST_ITEMS = 12;
