import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { loadAllItems, ScorableItem } from './load-items';
import { LENSES, ItemScore, SuggestedAction } from './lenses';

const OUTPUT_PATH = path.resolve(process.cwd(), 'public/data/scores.json');
const BATCH_SIZE = 5;
const MODEL = 'claude-sonnet-4-6';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ScoresFile {
  version: number;
  scoredAt: string;
  items: Record<string, ItemScore>;
}

function loadExistingScores(): ScoresFile {
  if (!fs.existsSync(OUTPUT_PATH)) {
    return { version: 1, scoredAt: new Date().toISOString(), items: {} };
  }
  return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
}

function saveScores(scores: ScoresFile) {
  scores.scoredAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(scores, null, 2));
}

function buildSystemPrompt(): string {
  const lensDescriptions = Object.entries(LENSES)
    .map(([key, l]) => `  - ${key}: ${l.description}`)
    .join('\n');

  return `You are an analyst evaluating items for GDRFA Dubai (General Directorate of Residency and Foreigners Affairs). For each item provided, score its relevance to GDRFA's mission across six operational lenses.

For each item, return a JSON object with these fields:
- "id": string (echo the item's id exactly)
- "gdrfaRelevance": integer 0-100 — overall how much this matters for GDRFA leadership
- "lenses": object with these six integer fields, each 0-100:
${lensDescriptions}
- "suggestedAction": one of "pilot_candidate" (deploy-ready, GDRFA could pilot now), "monitor" (interesting trajectory, watch), "policy_watch" (regulation/policy implications), "ignore" (not relevant to GDRFA)
- "whyItMatters": ONE sentence, max 25 words, concrete and specific. Reference GDRFA's domain explicitly. Avoid generic phrases like "could be useful" or "interesting development."

Scoring guidance:
- Be conservative. Most items should NOT exceed 70 on any lens unless they directly address that domain.
- An "ignore" item can have all-zero lens scores — that's fine.
- gdrfaRelevance should roughly track the maximum lens score, not be averaged.
- A pure academic paper on theoretical math: ignore, low scores.
- A startup deploying biometric e-gates: pilot_candidate, high identity_biometrics + border_control.
- A new EU AI Act provision: policy_watch, moderate scores across the board.

Return ONLY a JSON array of objects, one per input item, in the same order. No preamble, no markdown fences, no commentary. Just the array.`;
}

function buildUserPrompt(items: ScorableItem[]): string {
  const formatted = items
    .map(
      (item, i) =>
        `[${i + 1}]\nid: ${item.id}\ncategory: ${item.category}\ntitle: ${item.title}\ndescription: ${item.description}\ntags: ${item.tags.join(', ') || '(none)'}`
    )
    .join('\n\n---\n\n');

  return `Score these ${items.length} items:\n\n${formatted}`;
}

async function scoreBatch(items: ScorableItem[]): Promise<ItemScore[]> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(items) }],
  });

  const text = (response.content as any[])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  // Strip any accidental markdown fences just in case
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('  ⚠ failed to parse JSON response:');
    console.error(cleaned.slice(0, 500));
    throw new Error('Invalid JSON from model');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Model did not return a JSON array');
  }

  return parsed as ItemScore[];
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set. Make sure .env.local has the key.');
    process.exit(1);
  }

  console.log('Loading items from CSVs...');
  const allItems = await loadAllItems();
  const scores = loadExistingScores();

  const todo = allItems.filter((item) => !scores.items[item.id]);
  console.log(`\n${allItems.length} items total · ${Object.keys(scores.items).length} already scored · ${todo.length} to score`);

  if (todo.length === 0) {
    console.log('Nothing to do. Re-run after adding new items.');
    return;
  }

  let processed = 0;
  let failed = 0;
  const batches = Math.ceil(todo.length / BATCH_SIZE);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\nBatch ${batchNum}/${batches} (${batch.length} items)...`);

    try {
      const results = await scoreBatch(batch);
      for (const result of results) {
        if (result?.id) {
          scores.items[result.id] = result;
          processed++;
        }
      }
      saveScores(scores);
      console.log(`  ✓ scored ${results.length}, saved progress`);
    } catch (err: any) {
      failed += batch.length;
      console.error(`  ✗ batch failed: ${err.message}`);
      // Continue to next batch — don't lose all progress on one failure
    }

    // Gentle rate-limit cushion
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n=== Done ===`);
  console.log(`Scored: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});