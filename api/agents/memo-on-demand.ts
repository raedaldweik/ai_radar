import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic, MODELS } from '../../lib/anthropic.js';
import { startEventStream } from '../../lib/stream.js';

interface SignalInput {
  id: string;
  title: string;
  description: string;
  category: string;
  source?: string;
  url?: string;
  publishedDate?: string;
  gdrfaRelevance: number;
  whyItMatters: string;
  suggestedAction: string;
}

interface MemoRequest {
  profileName: string;
  interests: string[];
  signal: SignalInput;
  relatedItems?: SignalInput[]; // optional context: similar items from KB
  lang?: 'en' | 'ar';
}

function buildSystemPrompt(profileName: string, interests: string[], lang: 'en' | 'ar'): string {
  const isPersonal = profileName.toLowerCase() !== 'general' && interests.length > 0;

  if (lang === 'ar') {
    return [
      'أنت محلل أول في الإدارة العامة للإقامة وشؤون الأجانب في دبي، تكتب مذكرة من صفحة واحدة جاهزة لمجلس الإدارة بناءً على إشارة محددة.',
      'الهيكل المطلوب (ماركداون):',
      '1. **العنوان** — جملة واحدة تلخص الفرصة أو التهديد',
      '2. **خلاصة تنفيذية** — 3 جمل كحد أقصى',
      '3. **ما هو** — وصف موجز للإشارة (4-5 جمل)',
      '4. **ما يعنيه لـ GDRFA** — التحليل الاستراتيجي (3-4 نقاط)',
      '5. **نطاق تجريبي مقترح** — ماذا نختبر، مع من، خلال أي إطار زمني',
      '6. **المخاطر والاعتبارات** — 3 مخاطر ملموسة',
      '7. **التوصية** — قرار واحد محدد للقيادة',
      'اكتب بأسلوب موجز ومحترف. كن محددًا في الأرقام والإطارات الزمنية.',
    ].join('\n\n');
  }

  return [
    'You are a senior intelligence analyst at GDRFA Dubai writing a board-ready 1-page memo on a specific signal.',
    isPersonal
      ? `This memo is for ${profileName}, whose focus areas include: ${interests.join(', ')}. Frame the memo through that lens where it applies.`
      : `This is a GDRFA-wide memo for senior leadership.`,
    'Required structure (markdown):',
    '1. **# Title** — one sentence capturing the opportunity or threat',
    '2. **## Executive summary** — 3 sentences max. The decision this memo asks for, distilled.',
    '3. **## What it is** — 4-5 sentences plainly describing the signal: who, what, where, when. No analysis yet.',
    '4. **## What it means for GDRFA** — 3-4 bullet points of strategic analysis. This is where you earn your salary.',
    '5. **## Suggested pilot scope** — concrete: what to test, with whom, in what timeframe (weeks/months), at what cost order-of-magnitude.',
    '6. **## Risks & considerations** — 3 specific risks. Avoid generic ones like "vendor lock-in" unless directly relevant.',
    '7. **## Recommendation** — one specific decision leadership should make. Use action verbs (approve, commission, defer, escalate).',
    'Tone: tight, professional, decision-oriented. Use specific numbers and timeframes. Cite web sources when relevant.',
    'You may use the web search tool if the signal is recent or if comparable peer deployments would strengthen the analysis.',
  ].join('\n\n');
}

function buildUserPrompt(signal: SignalInput, related: SignalInput[] | undefined, profileName: string): string {
  let prompt = `Profile: ${profileName}\n\n## Primary signal to memo\n\n`;
  prompt += `Title: ${signal.title}\n`;
  prompt += `Category: ${signal.category}\n`;
  prompt += `Description: ${signal.description}\n`;
  if (signal.source) prompt += `Source: ${signal.source}\n`;
  if (signal.publishedDate) prompt += `Published: ${signal.publishedDate}\n`;
  if (signal.url) prompt += `URL: ${signal.url}\n`;
  prompt += `GDRFA relevance score: ${signal.gdrfaRelevance}\n`;
  prompt += `Why it matters: ${signal.whyItMatters}\n`;
  prompt += `Initial suggested action: ${signal.suggestedAction}\n`;

  if (related && related.length > 0) {
    prompt += `\n## Related context from GDRFA's database\n\n`;
    related.slice(0, 5).forEach((item, i) => {
      prompt += `[${i + 1}] ${item.title} (${item.category}, relevance ${item.gdrfaRelevance})\n${item.whyItMatters}\n\n`;
    });
  }

  prompt += `\nWrite the memo now. Keep it to one page when printed.`;
  return prompt;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileName, interests, signal, relatedItems, lang = 'en' } = req.body as MemoRequest;

  if (!signal || !signal.title) {
    return res.status(400).json({ error: 'signal with title is required' });
  }

  const stream = startEventStream(res);

  try {
    stream.send({ type: 'step_start', step: `Reading signal: ${signal.title.slice(0, 60)}${signal.title.length > 60 ? '...' : ''}` });
    await new Promise((r) => setTimeout(r, 300));
    stream.send({ type: 'step_done', step: `Reading signal: ${signal.title.slice(0, 60)}${signal.title.length > 60 ? '...' : ''}` });

    if (relatedItems && relatedItems.length > 0) {
      stream.send({ type: 'step_start', step: `Cross-referencing ${relatedItems.length} related items` });
      await new Promise((r) => setTimeout(r, 300));
      stream.send({ type: 'step_done', step: `Cross-referencing ${relatedItems.length} related items` });
    }

    stream.send({ type: 'step_start', step: 'Drafting memo with peer-benchmark context' });

    const systemPrompt = buildSystemPrompt(profileName, interests || [], lang);
    const userPrompt = buildUserPrompt(signal, relatedItems, profileName);

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

    stream.send({ type: 'step_done', step: 'Drafting memo with peer-benchmark context' });

    if (collectedSources.length > 0) {
      stream.send({ type: 'sources', sources: collectedSources });
    }

    stream.send({ type: 'done', markdown: fullText });
  } catch (error: any) {
    console.error('Memo agent error:', error);
    stream.send({ type: 'error', message: error?.message || 'Unknown error' });
  } finally {
    stream.close();
  }
}