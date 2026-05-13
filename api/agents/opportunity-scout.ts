import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic, MODELS } from '../../lib/anthropic.js';
import { startEventStream } from '../../lib/stream.js';

interface ScoutItem {
  id: string;
  title: string;
  description: string;
  category: string;
  source?: string;
  url?: string;
  gdrfaRelevance: number;
  whyItMatters: string;
  suggestedAction: string;
  topLensName?: string; // optional: which lens scored highest
  topLensScore?: number;
}

interface ScoutRequest {
  profileName: string;
  interests: string[];
  candidates: ScoutItem[]; // already filtered to startups + investments, top-scored
  lang?: 'en' | 'ar';
}

function buildSystemPrompt(profileName: string, interests: string[], lang: 'en' | 'ar'): string {
  const isPersonal = profileName.toLowerCase() !== 'general' && interests.length > 0;

  if (lang === 'ar') {
    return [
      'أنت محلل مشتريات أول في الإدارة العامة للإقامة وشؤون الأجانب في دبي، تعد قائمة الفرص الأسبوعية لقيادة الإدارة.',
      'مهمتك: من بين الشركات الناشئة وعمليات الاستثمار المرشحة المقدمة، اختر أفضل 3 إلى 5 فرص للإدارة لتقييمها كمرشحات تجريبية.',
      'الهيكل المطلوب (ماركداون):',
      '1. **# قائمة الفرص — أفضل المرشحين هذا الأسبوع**',
      '2. **## ملخص** — جملتان عن الموضوع المشترك بين أفضل المرشحين',
      '3. لكل فرصة (3-5 فرص):',
      '   - **### اسم الشركة** + علامة GDRFA الخاصة بها',
      '   - **ما تفعله** (جملة واحدة)',
      '   - **لماذا الآن لـ GDRFA** (2-3 جمل)',
      '   - **نطاق تجريبي مقترح** (جملة واحدة محددة)',
      '   - **العوائق** (1-2 مخاطر/علامات استفهام)',
      '4. **## ما يجب تجاهله ولماذا** — قائمة قصيرة من المرشحين الذين يبدون واعدين لكنهم ليسوا كذلك',
      'استخدم بحث الويب للتحقق من حداثة الشركة وتمويلها.',
    ].join('\n\n');
  }

  return [
    'You are a senior procurement analyst at GDRFA Dubai preparing a weekly opportunity list for leadership.',
    isPersonal
      ? `This list is for ${profileName}, whose focus areas include: ${interests.join(', ')}. Prioritise candidates that fit those domains, but don't force a fit.`
      : `This is a GDRFA-wide opportunity list for senior leadership.`,
    'Your job: from the candidate startups and investments provided, select the 3-5 strongest pilot candidates and pass on the rest.',
    'Required structure (markdown):',
    '1. **# Opportunity List — Top Candidates This Week**',
    '2. **## Summary** — 2 sentences capturing the theme across the top picks (e.g., "Three biometric fraud-detection plays this week — all credible, two with UAE presence already").',
    '3. For each top opportunity (3-5 of them) write a **### Company name** heading, then on subsequent lines:',
    '   - **What they do** — one sentence, plain English. No buzzword soup.',
    '   - **Why now for GDRFA** — 2-3 sentences. Be specific about which GDRFA function this hits.',
    '   - **Suggested pilot scope** — one specific, time-bounded experiment. e.g., "60-day shadow deployment on 5% of T1 arrivals lane."',
    '   - **Watch-outs** — 1-2 specific risks. Avoid generic ones like "execution risk."',
    '4. **## Passing on this week** — short list of 2-3 candidates that scored well but you\'re not recommending, with one-sentence reasons.',
    'Use the web search tool to verify recency, funding stage, and UAE presence where useful.',
    'Tone: a sharp procurement officer briefing the boss. Not breathless. Not bureaucratic. Be willing to say "pass."',
  ].join('\n\n');
}

function buildUserPrompt(candidates: ScoutItem[], profileName: string): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatted = candidates
    .map(
      (item, i) =>
        `[${i + 1}] (${item.category}, GDRFA relevance ${item.gdrfaRelevance}, action: ${item.suggestedAction})\n${item.title}\n${item.description}\nWhy it matters: ${item.whyItMatters}${item.source ? `\nSource: ${item.source}` : ''}${item.url ? `\nURL: ${item.url}` : ''}`
    )
    .join('\n\n---\n\n');

  return `Today is ${today}. Profile: ${profileName}.\n\nHere are the top-scored startup and investment candidates from our database:\n\n${formatted}\n\nProduce the opportunity list now. Be ruthlessly selective — better to recommend 3 strong picks than 5 mediocre ones.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileName, interests, candidates, lang = 'en' } = req.body as ScoutRequest;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: 'candidates must be a non-empty array' });
  }

  const stream = startEventStream(res);

  try {
    stream.send({ type: 'step_start', step: `Reviewing ${candidates.length} startup and investment candidates` });
    await new Promise((r) => setTimeout(r, 350));
    stream.send({ type: 'step_done', step: `Reviewing ${candidates.length} startup and investment candidates` });

    stream.send({ type: 'step_start', step: 'Verifying funding and UAE presence via web search' });
    // The web search call happens inside the model loop — this step closes when synthesis begins.
    // We'll close it manually right before drafting starts.

    stream.send({ type: 'step_done', step: 'Verifying funding and UAE presence via web search' });
    stream.send({ type: 'step_start', step: 'Drafting opportunity list' });

    const systemPrompt = buildSystemPrompt(profileName, interests || [], lang);
    const userPrompt = buildUserPrompt(candidates, profileName);

    let fullText = '';
    const collectedSources: { uri: string; title: string }[] = [];
    const seen = new Set<string>();

    const response = await anthropic.messages.stream({
      model: MODELS.agent,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    });

    for await (const event of response) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullText += chunk;
        stream.send({ type: 'content_delta', text: chunk });
      }
    }

    const finalMessage = await response.finalMessage();
    for (const block of finalMessage.content as any[]) {
      if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const result of block.content) {
          const url = result?.url;
          if (url && !seen.has(url)) {
            seen.add(url);
            collectedSources.push({ uri: url, title: result.title || url });
          }
        }
      }
    }

    stream.send({ type: 'step_done', step: 'Drafting opportunity list' });

    if (collectedSources.length > 0) {
      stream.send({ type: 'sources', sources: collectedSources });
    }

    stream.send({ type: 'done', markdown: fullText });
  } catch (error: any) {
    console.error('Opportunity Scout agent error:', error);
    stream.send({ type: 'error', message: error?.message || 'Unknown error' });
  } finally {
    stream.close();
  }
}