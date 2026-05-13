import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic, MODELS } from '../../lib/anthropic.js';
import { startEventStream } from '../../lib/stream.js';

interface ScoredItem {
  id: string;
  title: string;
  description: string;
  category: string;
  source?: string;
  publishedDate?: string;
  url?: string;
  gdrfaRelevance: number;
  whyItMatters: string;
  suggestedAction: string;
  topLens?: string;
}

interface MorningBriefRequest {
  profileName: string;
  interests: string[];
  topItems: ScoredItem[]; // pre-filtered, top 15-20 highest GDRFA relevance
  lang?: 'en' | 'ar';
}

function buildSystemPrompt(profileName: string, interests: string[], lang: 'en' | 'ar'): string {
  const isPersonal = profileName.toLowerCase() !== 'general' && interests.length > 0;
  const interestLine = isPersonal
    ? `This brief is personalised for ${profileName}, whose stated focus areas are: ${interests.join(', ')}. Bias toward items that touch these areas, but still flag anything of GDRFA-wide importance.`
    : `This is the General view — the official GDRFA-wide morning brief. Cover what matters across the whole directorate's remit.`;

  if (lang === 'ar') {
    return [
      'أنت محلل أول في الإدارة العامة للإقامة وشؤون الأجانب في دبي، تعد موجزًا تنفيذيًا صباحيًا للقيادة العليا.',
      isPersonal
        ? `هذا الموجز مخصص للمستخدم ${profileName}، اهتماماته: ${interests.join('، ')}.`
        : 'هذا هو الموجز العام للإدارة بأكملها.',
      'اكتب بأسلوب موجز ومباشر، تستطيع قراءته في 3 دقائق. استخدم تنسيق ماركداون.',
      'يجب أن يحتوي الموجز على:',
      '1. عنوان واضح',
      '2. خلاصة تنفيذية في جملتين على الأكثر',
      '3. أهم 3-5 إشارات (ليس قائمة عناوين، بل تحليل)',
      '4. قسم "ما يجب فعله اليوم" يقترح إجراءً ملموسًا',
      'استشهد بمصادر الويب عند الحاجة.',
    ].join('\n\n');
  }

  return [
    'You are a senior intelligence analyst at GDRFA Dubai (General Directorate of Residency and Foreigners Affairs), preparing a morning executive brief for senior leadership.',
    interestLine,
    'Write in a tight, executive style — the kind of brief a Director General reads in three minutes before the day starts. Use markdown.',
    'Required structure:',
    '1. **Title** — pick one that captures the morning\'s theme. Date in parentheses.',
    '2. **Bottom line** — two sentences max. The one thing leadership needs to know if they read nothing else.',
    '3. **Top signals** — 3 to 5 items. For each: bold the headline-level insight, then 1–3 sentences of analysis. Don\'t just summarise the source; tell leadership what it *means* for GDRFA.',
    '4. **What to do today** — 1 to 2 specific suggested actions, each tied to a signal above.',
    '5. **On the radar** — single sentence flagging anything brewing that isn\'t urgent yet.',
    'Tone: confident, specific, no filler. Cite web sources when relevant. Never invent details — if a signal is thin, say so.',
  ].join('\n\n');
}

function buildUserPrompt(items: ScoredItem[], profileName: string): string {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatted = items
    .map(
      (item, i) =>
        `[${i + 1}] (${item.category}, GDRFA relevance ${item.gdrfaRelevance}, action: ${item.suggestedAction})\n${item.title}\n${item.description}\nWhy it matters: ${item.whyItMatters}${item.source ? `\nSource: ${item.source}` : ''}${item.publishedDate ? `\nPublished: ${item.publishedDate}` : ''}`
    )
    .join('\n\n---\n\n');

  return `Today is ${today}. Profile: ${profileName}.\n\nHere are the highest-relevance signals from the past 24-48 hours, pre-scored by our GDRFA lens system:\n\n${formatted}\n\nWrite the morning brief now.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileName, interests, topItems, lang = 'en' } = req.body as MorningBriefRequest;

  if (!Array.isArray(topItems) || topItems.length === 0) {
    return res.status(400).json({ error: 'topItems must be a non-empty array' });
  }

  const stream = startEventStream(res);

  // Helpful pacing: emit named steps so the UI can show "the agent is doing X right now".
  // These are descriptive, not gates — they just narrate what's happening.
  try {
    stream.send({ type: 'step_start', step: `Reading ${topItems.length} top-scored signals` });
    await new Promise((r) => setTimeout(r, 350));
    stream.send({ type: 'step_done', step: `Reading ${topItems.length} top-scored signals` });

    const personaLabel = profileName.toLowerCase() === 'general' ? 'GDRFA-wide' : `${profileName}'s lens`;
    stream.send({ type: 'step_start', step: `Synthesising through ${personaLabel}` });

    const systemPrompt = buildSystemPrompt(profileName, interests || [], lang);
    const userPrompt = buildUserPrompt(topItems, profileName);

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

    // Stream tokens as they arrive so the user watches the brief write itself.
    for await (const event of response) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullText += chunk;
        stream.send({ type: 'content_delta', text: chunk });
      }
    }

    const finalMessage = await response.finalMessage();

    // Pull web search citations out of the final message, dedupe by URL.
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

    stream.send({ type: 'step_done', step: `Synthesising through ${personaLabel}` });

    if (collectedSources.length > 0) {
      stream.send({ type: 'sources', sources: collectedSources });
    }

    stream.send({ type: 'done', markdown: fullText });
  } catch (error: any) {
    console.error('Morning Brief agent error:', error);
    stream.send({ type: 'error', message: error?.message || 'Unknown error' });
  } finally {
    stream.close();
  }
}