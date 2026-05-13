import React, { useContext, useMemo } from 'react';
import { NewsItem, DirectoryItem, ItemScore } from '../../types';
import { LanguageContext } from '../../i18n/LanguageContext';
import { KnowledgeBaseContext } from '../../context/KnowledgeBaseContext';
import {
  ADMIN_PINNED_ALERT_TITLES,
  URGENCY_KEYWORDS,
  RECENCY_HOURS,
  MAX_ALERTS,
} from '../../data/alerts-config';

interface AlertsBannerProps {
  newsItems: NewsItem[];
  userInterestTags: Set<string>;
  onSelect: (item: DirectoryItem) => void;
}

interface ScoredAlert extends NewsItem {
  _score: number;
  _isAdminPinned: boolean;
  _gdrfaScore?: ItemScore;
}

const formatRelative = (iso: string, lang: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const isAr = lang === 'ar';
  if (minutes < 60) return isAr ? `${minutes}د` : `${minutes}m`;
  if (hours < 24) return isAr ? `${hours}س` : `${hours}h`;
  return isAr ? `${days}ي` : `${days}d`;
};

const matchesUrgencyKeyword = (item: NewsItem): boolean => {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  return URGENCY_KEYWORDS.some((kw) => haystack.includes(kw.toLowerCase()));
};

const matchesAdminPin = (item: NewsItem): boolean => {
  if (ADMIN_PINNED_ALERT_TITLES.length === 0) return false;
  const title = item.title.toLowerCase();
  return ADMIN_PINNED_ALERT_TITLES.some((p) => title.includes(p.toLowerCase()));
};

const isRecent = (iso: string, hours: number): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= hours * 3600 * 1000;
};

const matchesUserInterest = (item: NewsItem, interestTags: Set<string>): boolean => {
  if (interestTags.size === 0) return false;
  const lowerTags = new Set(Array.from(interestTags).map((t) => t.toLowerCase()));
  if (item.tags.some((t) => lowerTags.has(t.toLowerCase()))) return true;
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  return Array.from(lowerTags).some((t) => haystack.includes(t));
};

// Style the suggested-action pill so the four categories are visually distinct.
const actionPillClass = (action?: string): string => {
  switch (action) {
    case 'pilot_candidate':
      return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30';
    case 'policy_watch':
      return 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30';
    case 'monitor':
      return 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30';
    default:
      return 'bg-slate-600/30 text-slate-400 ring-1 ring-slate-500/30';
  }
};

const actionLabel = (action?: string): string => {
  switch (action) {
    case 'pilot_candidate': return 'Pilot candidate';
    case 'policy_watch': return 'Policy watch';
    case 'monitor': return 'Monitor';
    default: return '';
  }
};

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  newsItems,
  userInterestTags,
  onSelect,
}) => {
  const { t, lang } = useContext(LanguageContext);
  const { getScore } = useContext(KnowledgeBaseContext);

  const alerts = useMemo<ScoredAlert[]>(() => {
    const scored: ScoredAlert[] = newsItems.map((item) => {
      const adminPinned = matchesAdminPin(item);
      const isPinnedFlag = !!item.isPinned;
      const urgent = matchesUrgencyKeyword(item);
      const recent = isRecent(item.details.publishedDate, RECENCY_HOURS);
      const interesting = matchesUserInterest(item, userInterestTags);
      const gdrfaScore = getScore(item);
      const relevance = gdrfaScore?.gdrfaRelevance ?? 0;

      // Tiered relevance bonus — pilot-worthy items dominate, near-misses still surface.
      let relevanceBoost = 0;
      if (relevance >= 70) relevanceBoost = 200;
      else if (relevance >= 40) relevanceBoost = 60;
      else if (relevance >= 20) relevanceBoost = 20;

      let score = relevanceBoost;
      if (adminPinned) score += 1000;
      if (isPinnedFlag) score += 500 - (item.pinPriority || 99);
      if (urgent && recent) score += 100;
      if (urgent) score += 40;
      if (recent && interesting) score += 30;
      if (recent) score += 10;
      if (interesting) score += 5;

      return { ...item, _score: score, _isAdminPinned: adminPinned, _gdrfaScore: gdrfaScore };
    });

    // Surface anything pinned, anything score-worthy, OR anything ≥40 GDRFA relevance.
    const filtered = scored.filter(
      (s) =>
        s._score >= 10 ||
        s._isAdminPinned ||
        s.isPinned ||
        (s._gdrfaScore?.gdrfaRelevance ?? 0) >= 40
    );

    filtered.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      const tA = new Date(a.details.publishedDate).getTime() || 0;
      const tB = new Date(b.details.publishedDate).getTime() || 0;
      return tB - tA;
    });

    return filtered.slice(0, MAX_ALERTS);
  }, [newsItems, userInterestTags, getScore]);

  if (alerts.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="alerts-heading">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          <h2 id="alerts-heading" className="text-sm font-bold text-slate-200 uppercase tracking-widest">
            {t('dashboardV2.alertsTitle')}
          </h2>
          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
            • {t('dashboardV2.alertsSubtitle')}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
          {alerts.length} {alerts.length === 1 ? t('dashboardV2.alertSingular') : t('dashboardV2.alertPlural')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert, idx) => {
          const isPrimary = idx === 0;
          const relevance = alert._gdrfaScore?.gdrfaRelevance;
          const action = alert._gdrfaScore?.suggestedAction;
          const why = alert._gdrfaScore?.whyItMatters;

          return (
            <button
              key={alert.id}
              onClick={() => onSelect(alert)}
              className={`group text-start relative rounded-lg p-3.5 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden
                ${isPrimary
                  ? 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/40 shadow-[0_0_20px_-8px_rgba(251,191,36,0.4)]'
                  : 'bg-white/[0.04] backdrop-blur-lg border border-amber-500/20 hover:border-amber-500/40'
                }`}
              aria-label={`Alert: ${alert.title}`}
            >
              <span className={`absolute start-0 top-0 bottom-0 w-0.5 ${isPrimary ? 'bg-amber-400' : 'bg-amber-500/40'}`} aria-hidden="true" />

              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded
                  ${alert._isAdminPinned
                    ? 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40'
                    : 'bg-amber-500/10 text-amber-400'
                  }`}>
                  {alert._isAdminPinned ? t('dashboardV2.alertPinned') : t('dashboardV2.alertBadge')}
                </span>
                <span className="text-[11px] text-slate-400 truncate flex-1" title={alert.details.source}>
                  {alert.details.source}
                </span>
                <span className="text-[11px] text-slate-500 shrink-0 tabular-nums">
                  {formatRelative(alert.details.publishedDate, lang)}
                </span>
              </div>

              <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {alert.title}
              </h3>

              {/* GDRFA intelligence layer: why-it-matters + relevance score + action */}
              {why && (
                <p className="mt-2 text-[12px] leading-relaxed text-slate-400 line-clamp-2 italic">
                  {why}
                </p>
              )}

              {(relevance !== undefined || action) && (
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  {relevance !== undefined && relevance > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20 tabular-nums">
                      GDRFA {relevance}
                    </span>
                  )}
                  {action && action !== 'ignore' && (
                    <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${actionPillClass(action)}`}>
                      {actionLabel(action)}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};