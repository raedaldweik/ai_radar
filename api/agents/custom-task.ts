import type { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic, MODELS } from '../../lib/anthropic.js';
import { startEventStream } from '../../lib/stream.js';

interface ContextItem {
  title: string;
  description: string;
  category: string;
  whyItMatters?: string;
}

interface CustomTaskRequest {
  profileName: string;
  interests: string[];
  task: string; // free-form user instruction
  contextItems?: ContextItem[]; // optional: the user's current top-scored knowledge base items
  lang?: 'en' | 'ar';
}

function buildSystemPrompt(profileName: string, interests: string[], lang: 'en' | 'ar'): string {
  if (lang === 'ar') {
    return [
      'أنت محلل أول في الإدارة العامة للإقامة وشؤون الأجانب في دبي، تنفذ مهمة بحثية أو تحليلية مخصصة لقيادة الإدارة.',
      `الملف الشخصي: ${profileName}${interests.length ? ` (مجالات التركيز: ${interests.join('، ')})` : ''}.`,
      'مهمتك: نفذ ما يطلبه المستخدم بدقة. لا تتبع قالبًا ثابتًا — اختر الشكل الأنسب للسؤال.',
      'إرشادات:',
      '- إذا كان السؤال يتطلب بيانات حديثة، استخدم بحث الويب بنشاط',
      '- إذا كانت قاعدة المعرفة المرفقة تحتوي على سياق ذي صلة، استخدمها',
      '- اكتب بأسلوب احترافي ومحدد، وكن صريحًا بشأن عدم اليقين',
      '- استخدم تنسيق ماركداون مع عناوين وقوائم حيث يكون ذلك مفيدًا',
      '- إذا كان الطلب غامضًا، اطرح أفضل تفسير ممكن وأكمل (لا تطلب التوضيح — يجب أن تنتج إجابة قابلة للاستخدام)',
    ].join('\n\n');
  }

  return [
    'You are a senior intelligence analyst at GDRFA Dubai executing a custom research or analysis task on behalf of leadership.',
    `Profile: ${profileName}${interests.length ? ` (focus areas: ${interests.join(', ')})` : ''}.`,
    'Your job: execute exactly what the user asked for. Do not force it into a template — pick the format that best fits the question. A list, a memo, a comparison, a draft email, a one-pager, a calculation — whatever the request implies.',
    'Guidelines:',
    '- Use web search aggressively if the request requires current information.',
    '- If the attached knowledge-base context is relevant, lean on it; if it isn\'t, ignore it.',
    '- Write in a professional, specific tone. Be candid about uncertainty rather than padding.',
    '- Use markdown formatting (headings, lists, bold) where it improves readability — but only where it does. Conversational answers can be conversational.',
    '- If the request is ambiguous, take the most useful interpretation and proceed. Do not ask for clarification — the user wants an output, not a follow-up question.',
    '- Match the depth to the request. A one-line question gets a focused answer; an open-ended brief gets a fuller treatment.',
    'You are GDRFA-aware: when relevant, frame implications through GDRFA\'s mandate (residency, visas, border control, identity, customer happiness, AI sovereignty, cybersecurity).',
  ].join('\n\n');
}

function buildUserPrompt(req: CustomTaskRequest): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let prompt = `Today: ${today}.\n\n`;

  if (req.contextItems && req.contextItems.length > 0) {
    prompt += `Optional knowledge-base context (use only if relevant):\n\n`;
    req.contextItems.forEach((item, i) => {
      prompt += `[${i + 1}] (${item.category}) ${item.title}\n${item.description}\n${item.whyItMatters ? `GDRFA note: ${item.whyItMatters}\n` : ''}\n`;
    });
    prompt += `\n---\n\n`;
  }

  prompt += `User request:\n\n${req.task}`;
  return prompt;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as CustomTaskRequest;
  if (!body.task || body.task.trim().length < 5) {
    return res.status(400).json({ error: 'task must be at least 5 characters' });
  }

  const stream = startEventStream(res);

  try {
    const taskPreview = body.task.length > 80 ? body.task.slice(0, 80) + '...' : body.task;

    stream.send({ type: 'step_start', step: `Interpreting task: ${taskPreview}` });
    await new Promise((r) => setTimeout(r, 300));
    stream.send({ type: 'step_done', step: `Interpreting task: ${taskPreview}` });

    if (body.contextItems && body.contextItems.length > 0) {
      stream.send({ type: 'step_start', step: `Pulling ${body.contextItems.length} relevant items from knowledge base` });
      await new Promise((r) => setTimeout(r, 300));
      stream.send({ type: 'step_done', step: `Pulling ${body.contextItems.length} relevant items from knowledge base` });
    }

    stream.send({ type: 'step_start', step: 'Researching and drafting response' });

    const systemPrompt = buildSystemPrompt(body.profileName, body.interests || [], body.lang || 'en');
    const userPrompt = buildUserPrompt(body);

    let fullText = '';
    const collectedSources: { uri: string; title: string }[] = [];
    const seen = new Set<string>();

    const response = await anthropic.messages.stream({
      model: MODELS.agent,
      max_tokens: 6000,
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

    stream.send({ type: 'step_done', step: 'Researching and drafting response' });

    if (collectedSources.length > 0) {
      stream.send({ type: 'sources', sources: collectedSources });
    }

    stream.send({ type: 'done', markdown: fullText });
  } catch (error: any) {
    console.error('Custom Task agent error:', error);
    stream.send({ type: 'error', message: error?.message || 'Unknown error' });
  } finally {
    stream.close();
  }
}