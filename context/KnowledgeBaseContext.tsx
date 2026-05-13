import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { knowledgeBase } from '../services/knowledge-base';
import { LanguageContext } from '../i18n/LanguageContext';
import {
  DirectoryItem,
  ItemScore,
  ScoresMap,
  Category,
  NewsItem,
  JobItem,
  InvestmentItem,
  ResearchItem,
  StartupItem,
} from '../types';

interface KnowledgeBaseContextType {
  isReady: boolean;
  search: (query: string, maxResults?: number) => any[];
  formatContext: (items: any[]) => string;
  getDirectoryItems: () => DirectoryItem[];
  getRecommendedItems: (userInterests: string[], count?: number, category?: Category) => DirectoryItem[];
  // Scoring: pass full item so we can fall back to URL-based lookup when ids don't align.
  getScore: (item: DirectoryItem) => ItemScore | undefined;
  getTopScored: (category?: Category, count?: number) => Array<DirectoryItem & { score: ItemScore }>;
}

export const KnowledgeBaseContext = createContext<KnowledgeBaseContextType>({
  isReady: false,
  search: () => [],
  formatContext: () => '',
  getDirectoryItems: () => [],
  getRecommendedItems: () => [],
  getScore: () => undefined,
  getTopScored: () => [],
});

// Pull the URL out of a score key like "news-https://example.com/path" → "https://example.com/path".
// Returns null for keys that don't carry a URL (e.g., "arxiv-2509.x", "startup-Sift-2").
function extractUrlFromKey(key: string): string | null {
  const idx = key.indexOf('-http');
  if (idx === -1) return null;
  return key.slice(idx + 1); // drops the leading "-"
}

// Resolve the URL field for any DirectoryItem subtype. Different item types stash the URL
// under different keys (articleUrl, applyUrl, companyUrl, paperUrl, websiteUrl).
function getItemUrl(item: any): string | undefined {
  // Flat snapshot path (used by "Brief my team" handoff): item already has a .url field
  if (item?.url && typeof item.url === 'string') return item.url;
  // Full DirectoryItem path: dig into the typed details bag
  const details = item?.details;
  if (!details) return undefined;
  switch (item.category) {
    case Category.News: return details.articleUrl;
    case Category.Jobs: return details.applyUrl;
    case Category.Investments: return details.companyUrl;
    case Category.Research: return details.paperUrl;
    case Category.Startups: return details.websiteUrl;
    default: return undefined;
  }
}

export const KnowledgeBaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [scores, setScores] = useState<ScoresMap>({});
  const { lang } = useContext(LanguageContext);

  useEffect(() => {
    const init = async () => {
      setIsReady(false);
      const [, scoresRes] = await Promise.all([
        knowledgeBase.initialize(lang),
        fetch('/data/scores.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (scoresRes?.items) {
        setScores(scoresRes.items as ScoresMap);
        console.log(`Loaded ${Object.keys(scoresRes.items).length} GDRFA relevance scores.`);
      } else {
        console.warn('No scores.json found — relevance features will be limited.');
      }

      setIsReady(true);
    };
    init();
  }, [lang]);

  // Build a URL → score index once when scores load. This bridges the gap between
  // KB ids (e.g., "news-GDRFA Dubai-0") and score keys (e.g., "news-https://...").
  const scoresByUrl = useMemo(() => {
    const map = new Map<string, ItemScore>();
    for (const [key, score] of Object.entries(scores)) {
      const url = extractUrlFromKey(key);
      if (url) map.set(url, score);
    }
    return map;
  }, [scores]);

  const getScore = (item: DirectoryItem): ItemScore | undefined => {
    // 1) Exact id match (works for arxiv, sometimes startups)
    if (scores[item.id]) return scores[item.id];
    // 2) URL-based fallback (works for news, jobs, investments)
    const url = getItemUrl(item);
    if (url && scoresByUrl.has(url)) return scoresByUrl.get(url);
    return undefined;
  };

  const getTopScored = (category?: Category, count: number = 10) => {
    const items = knowledgeBase.getDirectoryItems();
    const filtered = category ? items.filter((i) => i.category === category) : items;
    return filtered
      .map((item) => {
        const score = getScore(item);
        return score ? { ...item, score } : null;
      })
      .filter((x): x is DirectoryItem & { score: ItemScore } => x !== null)
      .sort((a, b) => b.score.gdrfaRelevance - a.score.gdrfaRelevance)
      .slice(0, count);
  };

  const value = {
    isReady,
    search: knowledgeBase.search.bind(knowledgeBase),
    formatContext: knowledgeBase.formatContext.bind(knowledgeBase),
    getDirectoryItems: knowledgeBase.getDirectoryItems.bind(knowledgeBase),
    getRecommendedItems: knowledgeBase.getRecommendedItems.bind(knowledgeBase),
    getScore,
    getTopScored,
  };

  return <KnowledgeBaseContext.Provider value={value}>{children}</KnowledgeBaseContext.Provider>;
};