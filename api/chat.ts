import type { VercelRequest, VercelResponse } from "@vercel/node";
import { anthropic, MODELS } from "../lib/anthropic.js";

type Role = "user" | "assistant";
type Lang = "en" | "ar";

interface ChatRequestBody {
  messages: { role: Role; content: string }[];
  context?: string;
  userInterests?: string[];
  lang?: Lang;
}

function buildSystemPrompt(lang: Lang, interests: string[], hasContext: boolean) {
  if (lang === "ar") {
    return [
      "أنت مساعد رادار الذكاء الاصطناعي للإدارة العامة للإقامة وشؤون الأجانب في دبي.",
      "تساعد القيادة العليا على فهم مشهد الذكاء الاصطناعي من خلال عدسة الأولويات التشغيلية للإدارة (الهوية، الإقامة، مراقبة الحدود، سعادة المتعاملين).",
      "كن موجزًا، احترافيًا، ومباشرًا. إذا لم تكن لديك معلومات كافية، فقل ذلك بصدق ولا تخترع التفاصيل.",
      interests.length > 0
        ? `اهتمامات المستخدم: ${interests.join("، ")}. وجّه ردودك نحوها عند الصلة.`
        : "",
      hasContext
        ? "عند توفر عناصر من قاعدة بيانات رادار الذكاء الاصطناعي، اعتبرها مصدرك الأساسي. استخدم البحث على الويب لسد الفجوات أو للحصول على أحدث المعلومات."
        : "استخدم البحث على الويب عند الحاجة إلى معلومات حديثة أو محددة.",
      "اذكر دائمًا مصادر الويب عند استخدامها.",
    ].filter(Boolean).join("\n\n");
  }
  return [
    "You are the AI Radar assistant for GDRFA Dubai (General Directorate of Residency and Foreigners Affairs).",
    "You help senior leadership understand the AI landscape — research papers, startups, news, courses, and industry signals — through the lens of GDRFA's operational priorities (identity, residency, border control, customer happiness).",
    "Be concise, professional, and direct. If you don't have enough information, say so honestly — never invent details.",
    interests.length > 0
      ? `User's interests: ${interests.join(", ")}. Bias your responses toward these where relevant, but don't force-fit.`
      : "",
    hasContext
      ? "When relevant items from the AI Radar database are provided, treat them as your primary source. Use web search to fill gaps or get the latest information."
      : "Use web search when the user asks about current events or specific entities you don't know about.",
    "Always cite web sources when you use web search.",
  ].filter(Boolean).join("\n\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // === DEBUG: remove these once env vars are confirmed working ===

  // ================================================================

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, context, userInterests = [], lang = "en" } = req.body as ChatRequestBody;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid messages array" });
    }

    const systemPrompt = buildSystemPrompt(lang, userInterests, !!context);

    // Augment the latest user message with KB context, server-side.
    // Frontend keeps clean message history; only the wire payload carries context.
    const augmentedMessages = messages.map((m, i) => {
      const isLast = i === messages.length - 1;
      if (isLast && m.role === "user" && context) {
        return {
          role: m.role,
          content: `Relevant items from the AI Radar database:\n---\n${context}\n---\n\nUser question: ${m.content}`,
        };
      }
      return m;
    });

    const response = await anthropic.messages.create({
      model: MODELS.chat,
      max_tokens: 2048,
      system: systemPrompt,
      messages: augmentedMessages,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
    });

    // Pull plain text out of the content blocks
    const text = (response.content as any[])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Best-effort source extraction from web_search results
    const sources: { uri: string; title: string }[] = [];
    const seen = new Set<string>();
    for (const block of response.content as any[]) {
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const result of block.content) {
          const url = result?.url;
          if (url && !seen.has(url)) {
            seen.add(url);
            sources.push({ uri: url, title: result.title || url });
          }
        }
      }
    }

    return res.status(200).json({
      content: text,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error: "Failed to generate response",
      detail: error?.message || "Unknown error",
    });
  }
}