import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic, MODELS } from '../../lib/anthropic';
import { startEventStream } from '../../lib/stream';

interface BenchmarkRequest {
  profileName: string;
  interests: string[];
  topic: string;                  // e.g., "biometric e-gates" or "AI for visa adjudication"
  peerHint?: string[];            // optional: leadership-supplied list of peers to focus on
  contextItems?: { title: string; description: string; whyItMatters: string }[];
  lang?: 'en' | 'ar';
}

function buildSystemPrompt(profileName: string, interests: string[], lang: 'en' | 'ar'): string {
  if (lang === 'ar') {
    return [
      'أنت محلل استراتيجي أول في الإدارة العامة للإقامة وشؤون الأجانب في دبي، تنتج مقارنة تنافسية بين GDRFA ونظرائها العالميين.',
      'الهيكل المطلوب (ماركداون):',
      '1. **# المقارنة المرجعية: [الموضوع]**',
      '2. **## الخلاصة** — جملتان عن مكانة GDRFA النسبية',
      '3. **## نطاق المقارنة** — قائمة 4-5 جهات نظيرة (مثل سنغافورة ICA، وزارة الداخلية البريطانية، استونيا e-Residency...)',
      '4. **## جدول المقارنة** — جدول ماركداون مع أعمدة: الجهة، حالة النشر، التقنية الأساسية، نقاط القوة، الفجوات',
      '5. **## أين نتفوق** — 2-3 نقاط',
      '6. **## أين نتأخر** — 2-3 نقاط، صريحة لكن بناءة',
      '7. **## ما يجب تعلمه** — درسان قابلان للتطبيق من نظراء محددين',
      'استخدم بحث الويب بنشاط — هذا الوكيل يعتمد على بيانات حديثة عن جهات حقيقية.',
    ].join('\n\n');
  }

  return [
    'You are a senior strategic analyst at GDRFA Dubai producing a competitive benchmark of GDRFA vs. global peer agencies on a specific capability.',
    `Profile lens: ${profileName}${interests.length ? ` (focus areas: ${interests.join(', ')})` : ''}.`,
    'Pick 4-5 of the most relevant peer agencies for the topic. Strong candidates depending on topic include:',
    '  - Singapore ICA (Immigration & Checkpoints Authority)',
    '  - UK Home Office / Border Force',
    '  - Estonia (e-Residency, X-Road, identity stack)',
    '  - US CBP and TSA',
    '  - Saudi Absher / GDP',
    '  - Australia ABF (Australian Border Force)',
    '  - Hong Kong ImmD',
    '  - Canada CBSA',
    '  - Netherlands KMar / Schiphol biometric pilots',
    'Required structure (markdown):',
    '1. **# Peer Benchmark: [Topic]** (heading)',
    '2. **## Bottom line** — 2 sentences positioning GDRFA relative to the field',
    '3. **## Peer set** — bulleted list naming the 4-5 agencies you compared and a one-line rationale for each ("included because...")',
    '4. **## Comparison matrix** — a markdown table with columns: Agency | Deployment status | Core technology | Strengths | Gaps',
    '5. **## Where GDRFA leads** — 2-3 bullets, specific',
    '6. **## Where GDRFA lags** — 2-3 bullets, candid but constructive',
    '7. **## What to learn** — 2 actionable lessons from named peers ("From Singapore ICA: ..."; "From Estonia: ...")',
    'Use the web search tool actively — this agent\'s value is fresh, accurate data on real agencies. Cite findings.',
    'Tone: a strategy consultant briefing a Director General. Not flattering. Not defeatist. Specific.',
  ].join('\n\n');
}

function buildUserPrompt(req: BenchmarkRequest): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let prompt = `Today: ${today}.\n\nTopic: ${req.topic}\n`;
  if (req.peerHint && req.peerHint.length > 0) {
    prompt += `\nLeadership has specifically asked us to compare against: ${req.peerHint.join(', ')}.\n`;
  }
  if (req.contextItems && req.contextItems.length > 0) {
    prompt += `\nGDRFA context from our knowledge base (use to ground "Where GDRFA leads/lags"):\n\n`;
    req.contextItems.forEach((item, i) => {
      prompt += `[${i + 1}] ${item.title}\n${item.description}\nGDRFA relevance note: ${item.whyItMatters}\n\n`;
    });
  }
  prompt += `\nProduce the benchmark now. Use web search to get current peer-agency deployment status — don't rely on what you remember.`;
  return prompt;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as BenchmarkRequest;
  if (!body.topic || body.topic.trim().length < 3) {
    return res.status(400).json({ error: 'topic is required (min 3 chars)' });
  }

  const stream = startEventStream(res);

  try {
    stream.send({ type: 'step_start', step: `Scoping benchmark: ${body.topic}` });
    await new Promise((r) => setTimeout(r, 300));
    stream.send({ type: 'step_done', step: `Scoping benchmark: ${body.topic}` });

    stream.send({ type: 'step_start', step: 'Researching peer agencies via web search' });
    stream.send({ type: 'step_done', step: 'Researching peer agencies via web search' });

    stream.send({ type: 'step_start', step: 'Drafting comparison matrix' });

    const systemPrompt = buildSystemPrompt(body.profileName, body.interests || [], body.lang || 'en');
    const userPrompt = buildUserPrompt(body);

    let fullText = '';
    const collectedSources: { uri: string; title: string }[] = [];
    const seen = new Set<string>();

    const response = await anthropic.messages.stream({
      model: MODELS.agent,
      max_tokens: 5000,
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

    stream.send({ type: 'step_done', step: 'Drafting comparison matrix' });

    if (collectedSources.length > 0) {
      stream.send({ type: 'sources', sources: collectedSources });
    }

    stream.send({ type: 'done', markdown: fullText });
  } catch (error: any) {
    console.error('Peer Benchmark agent error:', error);
    stream.send({ type: 'error', message: error?.message || 'Unknown error' });
  } finally {
    stream.close();
  }
}