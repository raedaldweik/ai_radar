import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic, MODELS } from '../../lib/anthropic.js';
import { startEventStream } from '../../lib/stream.js';

interface PolicyWatchItem {
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

interface PolicyWatchRequest {
  profileName: string;
  interests: string[];
  policyItems: PolicyWatchItem[]; // items the lens scorer flagged as policy_watch (or near it)
  jurisdictionFocus?: string[];   // optional: leadership-supplied focus, e.g., ["UAE", "EU", "GCC"]
  lang?: 'en' | 'ar';
}

function buildSystemPrompt(profileName: string, interests: string[], lang: 'en' | 'ar'): string {
  if (lang === 'ar') {
    return [
      'أنت محلل تنظيمي أول في الإدارة العامة للإقامة وشؤون الأجانب في دبي، تعد تقرير مراقبة السياسات الأسبوعي لقيادة الإدارة.',
      'مهمتك: تتبع التطورات التنظيمية للذكاء الاصطناعي والهوية الرقمية والبيانات الحيوية عبر الولايات القضائية الرئيسية، وتقييم تأثيرها المباشر على عمليات GDRFA.',
      'الهيكل المطلوب (ماركداون):',
      '1. **# مراقبة السياسات: أسبوع [التاريخ]**',
      '2. **## الخلاصة** — جملتان عن أكبر تحول تنظيمي للأسبوع وما يعنيه لـ GDRFA',
      '3. **## التطورات حسب الولاية القضائية** — لكل ولاية ذات صلة (3-5):',
      '   - **### اسم الولاية القضائية**',
      '   - **ما تغير**: 1-2 جملة',
      '   - **متى يصبح ساريًا**: تاريخ محدد',
      '   - **التعرض على GDRFA**: عالي/متوسط/منخفض، مع جملة شرح',
      '   - **الإجراء المطلوب**: محدد، مع مالك مقترح',
      '4. **## أولويات الأسبوع** — قائمة 2-3 إجراءات يجب أن تتخذها GDRFA الآن',
      '5. **## على الرادار** — مخاطر تنظيمية ناشئة لم تظهر بعد لكنها مرئية',
      'استخدم بحث الويب بنشاط للحصول على آخر التحديثات.',
    ].join('\n\n');
  }

  return [
    'You are a senior regulatory analyst at GDRFA Dubai producing the weekly Policy Watch report for senior leadership.',
    `Profile lens: ${profileName}${interests.length ? ` (focus areas: ${interests.join(', ')})` : ''}.`,
    'Your job: track AI, digital identity, and biometric/data-protection regulatory developments across jurisdictions that affect GDRFA, and translate them into operational implications. You are NOT writing a news roundup — you are writing a compliance and strategy tracker.',
    'Jurisdictions to consider (pick 3-5 most active this cycle):',
    '  - UAE (National AI Strategy 2031, PDPL, NESA cybersecurity, MoIAT/AIO directives)',
    '  - GCC (KSA SDAIA, Saudi PDPL, Qatar AI Strategy, Bahrain ID Card, Oman e-government)',
    '  - EU (AI Act phased deadlines, GDPR enforcement, EES rollout, eIDAS 2.0, DSA)',
    '  - UK (AI Safety Institute, Online Safety Act, Border Force ETA framework)',
    '  - US (Executive Orders on AI, NIST AI RMF, state-level biometric laws like Illinois BIPA, CBP rules)',
    '  - Singapore (PDPA, Model AI Governance Framework, ICA biometric standards)',
    '  - China (Generative AI rules, PIPL, Cybersecurity Law)',
    'Required structure (markdown):',
    '1. **# Policy Watch: [date range]** heading',
    '2. **## Bottom line** — 2 sentences naming the single biggest regulatory shift this cycle and what it means for GDRFA',
    '3. **## Developments by jurisdiction** — for each of 3-5 jurisdictions, write a `### [Jurisdiction]` heading then:',
    '   - **What changed**: 1-2 sentences. Be specific (article numbers, dates, deadlines).',
    '   - **When it bites**: Concrete date or trigger event.',
    '   - **GDRFA exposure**: One of `High`, `Medium`, `Low`, plus a sentence explaining why.',
    '   - **Action required**: Specific next step, with a suggested owner (Legal, CISO, Borders, AI Strategy, etc.).',
    '4. **## This week\'s priorities** — 2-3 actions GDRFA should take right now, in priority order.',
    '5. **## On the radar** — emerging regulatory risks that haven\'t bitten yet but are visible 6-12 months out.',
    'Use web search aggressively for current statutes, deadlines, and enforcement actions. Cite sources.',
    'Tone: a Chief Compliance Officer briefing the Director General. Direct, specific, action-oriented. Never speculative without flagging it as such.',
  ].join('\n\n');
}

function buildUserPrompt(req: PolicyWatchRequest): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let prompt = `Today is ${today}. Profile: ${req.profileName}.\n\n`;

  if (req.jurisdictionFocus && req.jurisdictionFocus.length > 0) {
    prompt += `Leadership has asked us to focus on these jurisdictions this cycle: ${req.jurisdictionFocus.join(', ')}.\n\n`;
  }

  if (req.policyItems && req.policyItems.length > 0) {
    prompt += `Here are policy-flagged items from our knowledge base — use these as starting threads, but research the broader regulatory context via web search:\n\n`;
    req.policyItems.forEach((item, i) => {
      prompt += `[${i + 1}] (${item.category}, GDRFA relevance ${item.gdrfaRelevance})\n${item.title}\n${item.description}\nGDRFA note: ${item.whyItMatters}\n\n`;
    });
  } else {
    prompt += `No policy-flagged items in this cycle's knowledge base scan. Build the report from web research alone, focusing on regulatory developments in the last 30 days.\n\n`;
  }

  prompt += `Produce the Policy Watch report now. Be ruthless about relevance — if a jurisdiction had no meaningful change this cycle, drop it from the report rather than padding.`;
  return prompt;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as PolicyWatchRequest;
  const stream = startEventStream(res);

  try {
    const itemCount = body.policyItems?.length || 0;

    stream.send({ type: 'step_start', step: `Scanning ${itemCount} policy-flagged signals` });
    await new Promise((r) => setTimeout(r, 300));
    stream.send({ type: 'step_done', step: `Scanning ${itemCount} policy-flagged signals` });

    stream.send({ type: 'step_start', step: 'Researching regulatory updates across jurisdictions' });
    stream.send({ type: 'step_done', step: 'Researching regulatory updates across jurisdictions' });

    stream.send({ type: 'step_start', step: 'Drafting Policy Watch report' });

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

    stream.send({ type: 'step_done', step: 'Drafting Policy Watch report' });

    if (collectedSources.length > 0) {
      stream.send({ type: 'sources', sources: collectedSources });
    }

    stream.send({ type: 'done', markdown: fullText });
  } catch (error: any) {
    console.error('Policy Watch agent error:', error);
    stream.send({ type: 'error', message: error?.message || 'Unknown error' });
  } finally {
    stream.close();
  }
}