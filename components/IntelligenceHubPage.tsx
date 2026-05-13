import React, { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { LanguageContext } from '../i18n/LanguageContext';
import { KnowledgeBaseContext } from '../context/KnowledgeBaseContext';
import { NetworkBackground } from './NetworkBackground';
import { ChatInterface, ThreadMessage } from './intelligence-hub/ChatInterface';
import { AgentPillDef } from './intelligence-hub/AgentPillBar';
import { AgentName, Category, NewsItem } from '../types';

interface IntelligenceHubPageProps {
  userInterests: string[];
  currentProfileName: string;
}

// Simple id generator for thread messages
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const IntelligenceHubPage: React.FC<IntelligenceHubPageProps> = ({
  userInterests,
  currentProfileName,
}) => {
  const { t, lang } = useContext(LanguageContext);
  const { isReady, getTopScored, getScore } = useContext(KnowledgeBaseContext);

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentName | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<{ text: string; selectionStart?: number; selectionEnd?: number } | null>(null);

  // ---------- KB-derived agent inputs ----------

  const briefInputs = useMemo(() => {
    if (!isReady) return [];
    const scored = getTopScored(Category.News, 15);
    return scored.map((item) => {
      const news = item as NewsItem & { score: any };
      return {
        id: news.id,
        title: news.title,
        description: news.description,
        category: news.category,
        source: news.details?.source,
        publishedDate: news.details?.publishedDate,
        url: news.details?.articleUrl,
        gdrfaRelevance: news.score.gdrfaRelevance,
        whyItMatters: news.score.whyItMatters,
        suggestedAction: news.score.suggestedAction,
      };
    });
  }, [isReady, getTopScored]);

  const scoutCandidates = useMemo(() => {
    if (!isReady) return [];
    const startups = getTopScored(Category.Startups, 12);
    const investments = getTopScored(Category.Investments, 12);
    const all = [...startups, ...investments]
      .filter((i) => i.score.gdrfaRelevance >= 15)
      .sort((a, b) => b.score.gdrfaRelevance - a.score.gdrfaRelevance)
      .slice(0, 18);
    return all.map((item) => {
      const detail = (item as any).details || {};
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        source: detail.source,
        url: detail.websiteUrl || detail.companyUrl,
        gdrfaRelevance: item.score.gdrfaRelevance,
        whyItMatters: item.score.whyItMatters,
        suggestedAction: item.score.suggestedAction,
      };
    });
  }, [isReady, getTopScored]);

  const benchmarkContext = useMemo(() => {
    return briefInputs.slice(0, 5).map((i) => ({
      title: i.title,
      description: i.description,
      whyItMatters: i.whyItMatters,
    }));
  }, [briefInputs]);

  const policyItems = useMemo(() => {
    if (!isReady) return [];
    const allNews = getTopScored(Category.News, 50);
    const policyKeywords = /(regulation|policy|law|act|directive|compliance|GDPR|PDPL|AI Act|executive order|statute|rule|legislation)/i;
    return allNews
      .filter((item) => {
        if (item.score.suggestedAction === 'policy_watch') return true;
        const haystack = `${item.title} ${item.score.whyItMatters}`;
        return policyKeywords.test(haystack) && item.score.gdrfaRelevance >= 30;
      })
      .slice(0, 10)
      .map((item) => {
        const news = item as NewsItem & { score: any };
        return {
          id: news.id,
          title: news.title,
          description: news.description,
          category: news.category,
          source: news.details?.source,
          publishedDate: news.details?.publishedDate,
          url: news.details?.articleUrl,
          gdrfaRelevance: news.score.gdrfaRelevance,
          whyItMatters: news.score.whyItMatters,
          suggestedAction: news.score.suggestedAction,
        };
      });
  }, [isReady, getTopScored]);

  const customContext = useMemo(() => {
    return briefInputs.slice(0, 8).map((i) => ({
      title: i.title,
      description: i.description,
      category: i.category,
      whyItMatters: i.whyItMatters,
    }));
  }, [briefInputs]);

  // ---------- Build agent payloads from a free-form user prompt ----------

  // Heuristic memo target: try to find a brief input whose title overlaps most
  // with the user's prompt. Falls back to the top-scored item.
  const pickMemoTarget = useCallback((userText: string) => {
    if (briefInputs.length === 0) return null;
    const lower = userText.toLowerCase();
    const scored = briefInputs.map((item) => {
      const tokens = item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const overlap = tokens.filter((w) => lower.includes(w)).length;
      return { item, overlap };
    });
    scored.sort((a, b) => b.overlap - a.overlap);
    return scored[0].item;
  }, [briefInputs]);

  // Extract a [bracketed] argument or fall back to the rest of the prompt after stripping common prefixes.
  const extractArgument = (text: string, fallback: string): string => {
    const bracket = text.match(/\[([^\]]+)\]/);
    if (bracket) return bracket[1].trim();
    const stripped = text
      .replace(/^memo me on\s*/i, '')
      .replace(/^benchmark gdrfa against global peers on\s*/i, '')
      .replace(/^benchmark on\s*/i, '')
      .replace(/^policy watch( for)?\s*/i, '')
      .trim();
    return stripped || fallback;
  };

  const buildAgentMessage = useCallback(
    (agent: AgentName, userText: string): ThreadMessage | null => {
      const profileName = currentProfileName;
      const interests = userInterests;
      const langCode = lang as 'en' | 'ar';

      switch (agent) {
        case 'morning_brief':
          return {
            kind: 'agent_run',
            id: newId(),
            agentName: agent,
            agentLabel: 'Morning Brief',
            endpoint: '/api/agents/morning-brief',
            payload: {
              profileName,
              interests,
              topItems: briefInputs,
              lang: langCode,
            },
          };

        case 'memo_on_demand': {
          const target = pickMemoTarget(userText);
          if (!target) return null;
          const related = briefInputs.filter((i) => i.id !== target.id).slice(0, 5);
          return {
            kind: 'agent_run',
            id: newId(),
            agentName: agent,
            agentLabel: `Memo on Demand · ${target.title.slice(0, 50)}${target.title.length > 50 ? '...' : ''}`,
            endpoint: '/api/agents/memo-on-demand',
            payload: {
              profileName,
              interests,
              signal: target,
              relatedItems: related,
              lang: langCode,
            },
          };
        }

        case 'opportunity_scout':
          return {
            kind: 'agent_run',
            id: newId(),
            agentName: agent,
            agentLabel: 'Opportunity Scout',
            endpoint: '/api/agents/opportunity-scout',
            payload: {
              profileName,
              interests,
              candidates: scoutCandidates,
              lang: langCode,
            },
          };

        case 'peer_benchmark': {
          const topic = extractArgument(userText, 'Biometric e-gates and smart corridors');
          return {
            kind: 'agent_run',
            id: newId(),
            agentName: agent,
            agentLabel: `Peer Benchmark · ${topic.slice(0, 50)}`,
            endpoint: '/api/agents/peer-benchmark',
            payload: {
              profileName,
              interests,
              topic,
              contextItems: benchmarkContext,
              lang: langCode,
            },
          };
        }

        case 'policy_watch': {
          const arg = extractArgument(userText, 'UAE, EU, GCC');
          const jurisdictionFocus = arg.split(',').map((s) => s.trim()).filter(Boolean);
          return {
            kind: 'agent_run',
            id: newId(),
            agentName: agent,
            agentLabel: 'Policy Watch',
            endpoint: '/api/agents/policy-watch',
            payload: {
              profileName,
              interests,
              policyItems,
              jurisdictionFocus,
              lang: langCode,
            },
          };
        }

        case 'custom_task':
          return {
            kind: 'agent_run',
            id: newId(),
            agentName: agent,
            agentLabel: 'Custom Task',
            endpoint: '/api/agents/custom-task',
            payload: {
              profileName,
              interests,
              task: userText,
              contextItems: customContext,
              lang: langCode,
            },
          };
      }
    },
    [briefInputs, scoutCandidates, benchmarkContext, policyItems, customContext, currentProfileName, userInterests, lang, pickMemoTarget]
  );

  // ---------- Submit handler ----------

  const handleUserMessage = async ({ text, activeAgent }: { text: string; activeAgent: AgentName | null }) => {
    const userMsg: ThreadMessage = { kind: 'user', id: newId(), text };

    // Resolve which agent runs this turn:
    //  - a pill is active → that agent
    //  - no pill → Custom Task (free-form chat default)
    const targetAgent: AgentName = activeAgent ?? 'custom_task';

    const agentMsg = buildAgentMessage(targetAgent, text);
    if (!agentMsg) {
      // Fallback: render a simple assistant message explaining we couldn't run.
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          kind: 'assistant_chat',
          id: newId(),
          text: "I couldn't find a signal to memo on. Try picking the Memo on Demand pill and editing the bracketed text.",
          isStreaming: false,
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, userMsg, agentMsg]);
  };

  // ---------- Pill selection: insert template ----------

  const handleSelectAgent = (pill: AgentPillDef | null) => {
    if (!pill) {
      setActiveAgent(null);
      return;
    }
    setActiveAgent(pill.name);
    const tpl = pill.template();
    setPendingTemplate({
      text: tpl.full,
      selectionStart: tpl.selectionStart,
      selectionEnd: tpl.selectionEnd,
    });
  };

  // ---------- Cold-mount handoff from "Brief my team" ----------
  useEffect(() => {
    if (briefInputs.length === 0) return;
    const pending = (window as any).__pendingMemoSnapshot;
    if (!pending) return;
    (window as any).__pendingMemoSnapshot = null;

    const target = {
      id: pending.id,
      title: pending.title,
      description: pending.description,
      category: pending.category,
      source: pending.source,
      publishedDate: pending.publishedDate,
      url: pending.url,
      gdrfaRelevance: 50,
      whyItMatters: 'Selected from dashboard for memo generation.',
      suggestedAction: 'monitor',
    };
    const score = getScore(pending);
    if (score) {
      target.gdrfaRelevance = score.gdrfaRelevance;
      target.whyItMatters = score.whyItMatters;
      target.suggestedAction = score.suggestedAction;
    }
    const related = briefInputs.filter((i) => i.id !== target.id).slice(0, 5);

    const userMsg: ThreadMessage = {
      kind: 'user',
      id: newId(),
      text: `Memo me on ${target.title}`,
    };
    const agentMsg: ThreadMessage = {
      kind: 'agent_run',
      id: newId(),
      agentName: 'memo_on_demand',
      agentLabel: `Memo on Demand · ${target.title.slice(0, 50)}${target.title.length > 50 ? '...' : ''}`,
      endpoint: '/api/agents/memo-on-demand',
      payload: {
        profileName: currentProfileName,
        interests: userInterests,
        signal: target,
        relatedItems: related,
        lang: lang as 'en' | 'ar',
      },
    };
    setActiveAgent('memo_on_demand');
    setMessages([userMsg, agentMsg]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefInputs.length]);

  // Live "Brief my team" event (Hub already mounted)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.snapshot) return;
      (window as any).__pendingMemoSnapshot = detail.snapshot;
      // Force the pending-snapshot effect to re-run by changing a benign ref:
      // simplest is to clear messages so the user sees the new run cleanly.
      setMessages([]);
      // Yield, then re-trigger the cold-mount effect by reading from window.
      setTimeout(() => {
        const pending = (window as any).__pendingMemoSnapshot;
        if (!pending || briefInputs.length === 0) return;
        (window as any).__pendingMemoSnapshot = null;
        const target = {
          id: pending.id,
          title: pending.title,
          description: pending.description,
          category: pending.category,
          source: pending.source,
          publishedDate: pending.publishedDate,
          url: pending.url,
          gdrfaRelevance: 50,
          whyItMatters: 'Selected from dashboard for memo generation.',
          suggestedAction: 'monitor',
        };
        const score = getScore(pending);
        if (score) {
          target.gdrfaRelevance = score.gdrfaRelevance;
          target.whyItMatters = score.whyItMatters;
          target.suggestedAction = score.suggestedAction;
        }
        const related = briefInputs.filter((i) => i.id !== target.id).slice(0, 5);
        setActiveAgent('memo_on_demand');
        setMessages([
          { kind: 'user', id: newId(), text: `Memo me on ${target.title}` },
          {
            kind: 'agent_run',
            id: newId(),
            agentName: 'memo_on_demand',
            agentLabel: `Memo on Demand · ${target.title.slice(0, 50)}${target.title.length > 50 ? '...' : ''}`,
            endpoint: '/api/agents/memo-on-demand',
            payload: {
              profileName: currentProfileName,
              interests: userInterests,
              signal: target,
              relatedItems: related,
              lang: lang as 'en' | 'ar',
            },
          },
        ]);
      }, 50);
    };
    window.addEventListener('launch-memo-from-signal', handler as EventListener);
    return () => window.removeEventListener('launch-memo-from-signal', handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefInputs.length, currentProfileName, userInterests, lang]);

  // ---------- Render ----------

  const profileLine = (
    <>
      <span className="text-slate-400">Profile: </span>
      <span className="text-sky-400 font-medium">{currentProfileName}</span>
      {userInterests.length > 0 && (
        <>
          <span className="text-slate-400"> · </span>
          <span className="text-sky-400">{userInterests.join(', ')}</span>
        </>
      )}
    </>
  );

  return (
    <div className="relative min-h-screen">
      <NetworkBackground />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-sky-500">
            {t('nav.intelligenceHub')}
          </h1>
        </div>

        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          onUserMessage={handleUserMessage}
          activeAgent={activeAgent}
          onSelectAgent={handleSelectAgent}
          profileLine={profileLine}
          pendingTemplate={pendingTemplate}
          onTemplateConsumed={() => setPendingTemplate(null)}
        />
      </div>
    </div>
  );
};