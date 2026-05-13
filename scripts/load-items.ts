import Papa from 'papaparse';

const BASE_URL = 'https://raedaldweik.github.io/AIRadar';

export interface ScorableItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

async function fetchCsv(filename: string): Promise<any[]> {
  const url = `${BASE_URL}/${filename}`;
  console.log(`  fetching ${filename}...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠ failed to fetch ${filename} (${res.status}) — skipping`);
    return [];
  }
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data as any[];
}

export async function loadAllItems(): Promise<ScorableItem[]> {
  const items: ScorableItem[] = [];

  // arXiv research papers
  const arxiv = await fetchCsv('arxiv_ai_papers.csv');
  for (const row of arxiv) {
    if (!row.id || !row.title) continue;
    items.push({
      id: `arxiv-${row.id}`,
      title: row.title,
      description: (row.summary || '').slice(0, 800),
      category: 'Research',
      tags: row.authors ? [row.authors.split(',')[0]?.trim()].filter(Boolean) : [],
    });
  }

  // News articles
  const news = await fetchCsv('ai_news.csv');
  for (const [i, row] of news.entries()) {
    if (!row.title) continue;
    items.push({
      id: `news-${row.url || i}`,
      title: row.title,
      description: row.description || '',
      category: 'News',
      tags: row.source ? [row.source] : [],
    });
  }

  // Jobs
  const jobs = await fetchCsv('ai_jobs_enriched.csv');
  for (const [i, row] of jobs.entries()) {
    if (!row.title) continue;
    items.push({
      id: `job-${row.apply_url || i}`,
      title: row.title,
      description: `${row.company || ''} — ${(row.description || '').slice(0, 500)}`,
      category: 'Jobs',
      tags: row.skills ? row.skills.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 5) : [],
    });
  }

  // Startups
  const startups = await fetchCsv('startups.csv');
  for (const [i, row] of startups.entries()) {
    const title = row.name || row.title;
    if (!title) continue;
    items.push({
      id: `startup-${title}-${i}`,
      title,
      description: row.description || '',
      category: 'Startups',
      tags: row.industry ? [row.industry] : [],
    });
  }

  // Investments
  const investments = await fetchCsv('investments.csv');
  for (const [i, row] of investments.entries()) {
    if (!row.title) continue;
    items.push({
      id: `investment-${row.url || i}`,
      title: row.title,
      description: row.summary || '',
      category: 'Investments',
      tags: row.source ? [row.source] : [],
    });
  }

  console.log(`Loaded ${items.length} items total`);
  return items;
}