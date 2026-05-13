import { ResearchItem, GithubRepositoryItem, NewsItem, JobItem, Category, StartupItem, InvestmentItem, TechnologyItem, EmergingTech } from '../types';

// PapaParse is loaded from a script tag in index.html and is available on the window object
declare const Papa: any;

interface ArxivCsvRow {
  id: string;
  title: string;
  authors: string;
  published: string;
  summary: string;
  link: string;
}

interface GithubCsvRow {
  name: string;
  url: string;
  description: string;
  stars: string;
  forks: string;
  language: string;
  created_at: string;
  last_update: string;
}

interface NewsCsvRow {
    title: string;
    description: string;
    url: string;
    source: string;
    published_at: string;
}

interface JobCsvRow {
    source: string;
    title: string;
    company: string;
    team_or_department: string;
    commitment: string;
    location: string;
    remote: string;
    salary: string;
    skills: string;
    posted_at: string;
    updated_at: string;
    apply_url: string;
    description: string;
}

interface StartupCsvRow {
  source: string;
  name: string;
  one_liner: string;
  long_description: string;
  website: string;
  batch: string;
  industry: string;
  subindustry: string;
  industries: string;
  tags: string;
  regions: string;
  team_size: string;
  is_hiring: string;
  status: string;
  yc_url: string;
  votes: string;
  created_at: string;
}

interface InvestmentCsvRow {
  source: string;
  title: string;
  url: string;
  published: string;
  summary: string;
}

interface TechnologyCsvRow {
  id: string;
  title: string;
  description: string;
  tags: string;
  impact: string;
  maturity: 'Nascent' | 'Growing' | 'Mature';
  websiteUrl: string;
  isFeatured: string;
}

interface EmergingTechCsvRow {
  tags: string;
  name: string;
  score: string;
  trend_3m: string;
  trend_12m: string;
  whats_happening: string;
  why_it_matters: string;
  key_insight: string;
  funding: string;
}


const categoryImageMap: Record<Category, string> = {
    [Category.Research]: 'https://raedaldweik.github.io/AIRadar/research_image.jpeg',
    [Category.Startups]: 'https://raedaldweik.github.io/AIRadar/startups1.jpeg',
    [Category.Jobs]: 'https://raedaldweik.github.io/AIRadar/jobs.jpeg',
    [Category.News]: 'https://raedaldweik.github.io/AIRadar/news.jpeg',
    [Category.Technologies]: 'https://raedaldweik.github.io/AIRadar/tech.jpg',
    [Category.Investments]: 'https://raedaldweik.github.io/AIRadar/investments.jpeg',
    [Category.GithubRepository]: 'https://raedaldweik.github.io/AIRadar/github2.jpg',
    [Category.All]: '', // Not used for items
};


const extractTagsFromText = (text: string): string[] => {
    const commonTags: Record<string, string[]> = {
        'LLM': ['LLMs', 'NLP'], 'Language Model': ['LLMs', 'NLP'], 'llama': ['LLMs'],
        'Transformer': ['Transformers', 'Architecture'],
        'Vision': ['Computer Vision', 'Image Processing'], 'diffusion': ['Image Generation', 'Generative AI'],
        'GAN': ['GANs', 'Generative AI'], 'Generative': ['Generative AI'], 'genAI': ['Generative AI'],
        'Agent': ['AI Agents', 'Automation'],
        'Reinforcement Learning': ['RL', 'Reinforcement Learning'],
        'Robotics': ['Robotics', 'Automation'],
        'Speech': ['Speech AI', 'NLP'], 'whisper': ['Speech AI'],
        'Medical': ['Healthcare AI', 'Biotech'], 'Health': ['Healthcare AI'], 'drug': ['AI Drug Discovery'],
        'Safety': ['AI Safety', 'AI Ethics'], 'Bias': ['AI Ethics'], 'fairness': ['AI Ethics'], 'Ethic': ['AI Ethics'],
        'Climate': ['AI for Climate Change'], 'Weather': ['AI for Climate Change'],
        'Code': ['Code Generation', 'Developer Tools'],
        'Cyber': ['Cybersecurity'],
        'Quantum': ['Quantum ML', 'QML'],
    };
    const foundTags = new Set<string>();
    const lowerText = text.toLowerCase();

    for (const [keyword, tags] of Object.entries(commonTags)) {
        if (lowerText.includes(keyword.toLowerCase())) {
            tags.forEach(tag => foundTags.add(tag));
        }
    }
    // Add a default tag if no specific tags are found
    if(foundTags.size === 0) {
        foundTags.add('General AI');
    }
    return Array.from(foundTags);
}


export const parseArxivCsv = async (lang: string): Promise<ResearchItem[]> => {
  const filePath = `https://raedaldweik.github.io/AIRadar/arxiv_ai_papers${lang === 'ar' ? '_ar' : ''}.csv`;
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: ArxivCsvRow[] }) => {
        try {
          const researchItems: ResearchItem[] = results.data
            .filter(row => row.id && row.title && row.link && row.summary && row.authors)
            .map((row) => {
              const itemId = `arxiv-${row.id}`;
              const authors = (row.authors || '').split(';').map(name => name.trim());
              const title = row.title.replace(/[\r\n]+/g, ' ').trim();
              const summaryText = row.summary || '';
              const description = summaryText.replace(/[\r\n]+/g, ' ').trim().substring(0, 150) + '...';

              return {
                id: itemId,
                category: Category.Research,
                title: title,
                description: description,
                imageUrl: categoryImageMap[Category.Research],
                tags: extractTagsFromText(title + ' ' + summaryText),
                details: {
                  authors: authors,
                  publishedDate: row.published, // Use the raw, accurate date string
                  abstract: summaryText,
                  paperUrl: row.link,
                },
              };
            });
          resolve(researchItems);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};


export const parseGithubCsv = async (lang: string): Promise<GithubRepositoryItem[]> => {
    const filePath = `https://raedaldweik.github.io/AIRadar/github_ai_repos${lang === 'ar' ? '_ar' : ''}.csv`;
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const csvText = await response.text();
  
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: { data: GithubCsvRow[] }) => {
          try {
            const githubItems: GithubRepositoryItem[] = results.data
              .filter(row => row.name && row.url && row.stars) // Ensure essential fields exist
              .map((row) => {
                const itemId = `github-${row.name.replace('/', '-')}`;
                const title = row.name;
                const description = (row.description || 'No description available.').substring(0, 150);
                const fullText = title + ' ' + description;
  
                // Clean the URL to remove any surrounding quotes that might be included from CSV parsing
                const cleanedUrl = row.url.trim().replace(/^"|"$/g, '');

                return {
                  id: itemId,
                  category: Category.GithubRepository,
                  title: title,
                  description: description,
                  imageUrl: categoryImageMap[Category.GithubRepository],
                  tags: extractTagsFromText(fullText),
                  details: {
                    repoUrl: cleanedUrl, // Use the cleaned URL
                    stars: parseInt(row.stars, 10) || 0,
                    forks: parseInt(row.forks, 10) || 0,
                    language: row.language || 'N/A',
                    lastUpdate: row.last_update,
                  },
                };
              });
            resolve(githubItems);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  };

export const parseNewsCsv = async (lang: string): Promise<NewsItem[]> => {
    const filePath = `https://raedaldweik.github.io/AIRadar/ai_news${lang === 'ar' ? '_ar' : ''}.csv`;
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: { data: NewsCsvRow[] }) => {
                try {
                    const newsItems: NewsItem[] = results.data
                        .filter(row => row.title && row.url && row.source) // Essential fields
                        .map((row, index) => {
                            const itemId = `news-${row.source}-${index}`;
                            const title = row.title;
                            const description = (row.description || 'No description provided.').substring(0, 150) + '...';
                            const fullText = title + ' ' + description;
                            
                            const gdrfaSources = ["GDRFA Dubai", "الإدارة العامة للإقامة وشؤون الأجانب - دبي"];
                            const isGdrfaArticle = gdrfaSources.includes(row.source);

                            const redCarpetTitleEn = "Red Carpet: passport-free departure corridor at DXB";
                            const redCarpetTitleAr = "السجادة الحمراء: ممر مغادرة بدون جواز سفر في مطار دبي الدولي";
                            const isRedCarpetArticle = title === redCarpetTitleEn || title === redCarpetTitleAr;
                            
                            const isPinned = isGdrfaArticle || isRedCarpetArticle;
                            let pinPriority: number | undefined = undefined;

                            if (isRedCarpetArticle) {
                                pinPriority = 1;
                            } else if (isGdrfaArticle) {
                                pinPriority = 2;
                            }
                            
                            let imageUrl = categoryImageMap[Category.News];
                            if (isRedCarpetArticle) {
                                imageUrl = 'https://raedaldweik.github.io/AIRadar/red_carpet.jpg';
                            } else if (isGdrfaArticle) {
                                imageUrl = 'https://raedaldweik.github.io/AIRadar/visa.webp';
                            }

                            return {
                                id: itemId,
                                category: Category.News,
                                title: title,
                                description: description,
                                imageUrl: imageUrl,
                                tags: extractTagsFromText(fullText),
                                isPinned: isPinned,
                                pinPriority: pinPriority,
                                details: {
                                    source: row.source,
                                    publishedDate: row.published_at,
                                    articleUrl: row.url,
                                },
                            };
                        });
                    resolve(newsItems);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error: Error) => {
                reject(error);
            },
        });
    });
};

const normalizeCommitment = (commitment: string): 'Full-time' | 'Part-time' | 'Contract' => {
    const lowerCommitment = (commitment || '').toLowerCase();
    if (lowerCommitment.includes('part-time') || lowerCommitment.includes('part time')) {
        return 'Part-time';
    }
    if (lowerCommitment.includes('contract')) {
        return 'Contract';
    }
    // Default to Full-time for "full-time", "full time", or empty/unrecognized strings
    return 'Full-time';
};

export const parseJobsCsv = async (lang: string): Promise<JobItem[]> => {
    const filePath = `https://raedaldweik.github.io/AIRadar/ai_jobs_enriched${lang === 'ar' ? '_ar' : ''}.csv`;
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: { data: JobCsvRow[] }) => {
                try {
                    const jobItems: JobItem[] = results.data
                        .filter(row => row.title && row.company && row.apply_url) // Essential fields
                        .map((row, index) => {
                            const itemId = `job-${row.company.replace(/\s/g, '')}-${index}`;
                            const title = row.title;
                            const description = (row.description || 'No description provided.').substring(0, 150) + '...';
                            const tags = (row.skills || '').split(',').map(s => s.trim()).filter(Boolean);
                            
                            return {
                                id: itemId,
                                category: Category.Jobs,
                                title: title,
                                description: description,
                                imageUrl: categoryImageMap[Category.Jobs],
                                tags: [...tags, 'Career Growth'],
                                details: {
                                    company: row.company,
                                    location: row.location,
                                    applyUrl: row.apply_url,
                                    type: normalizeCommitment(row.commitment),
                                    postedDate: row.posted_at,
                                },
                            };
                        });
                    resolve(jobItems);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error: Error) => {
                reject(error);
            },
        });
    });
};

export const parseStartupsCsv = async (lang: string): Promise<StartupItem[]> => {
  const filePath = `https://raedaldweik.github.io/AIRadar/startups${lang === 'ar' ? '_ar' : ''}.csv`;
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: StartupCsvRow[] }) => {
        try {
          const startupItems: StartupItem[] = results.data
            .filter(row => row.name && row.website && row.one_liner)
            .map((row, index) => {
              const itemId = `startup-${row.name.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;
              const tagsFromTags = (row.tags || '').split(';').map(t => t.trim()).filter(Boolean);
              const tagsFromIndustries = (row.industries || '').split(';').map(t => t.trim()).filter(Boolean);
              const allTags = [...tagsFromTags, ...tagsFromIndustries];
              
              const uniqueTags = [...new Set(allTags)];

              let foundedYear = new Date().getFullYear();
              if (row.batch) {
                  const yearMatch = row.batch.match(/\d{4}/);
                  if (yearMatch) {
                      foundedYear = parseInt(yearMatch[0], 10);
                  }
              }
              
              const featuredStartups = new Set(['Scale AI', 'Cruise', 'Checkr', 'Deepgram', 'Replicate', 'Sift']);
              const isFeatured = featuredStartups.has(row.name);

              return {
                id: itemId,
                category: Category.Startups,
                title: row.name,
                description: row.one_liner,
                imageUrl: categoryImageMap[Category.Startups],
                tags: uniqueTags.slice(0, 5),
                details: {
                  foundedYear: foundedYear,
                  funding: 'Varies',
                  websiteUrl: row.website,
                },
                isFeatured,
              };
            });
          resolve(startupItems);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};

const extractInvestmentDetails = (text: string): { amount: string, round: string, investors: string[] } => {
    let amount = 'Not Disclosed';
    let round = 'Venture';
    const investors: string[] = [];

    const combinedText = text.toLowerCase();

    const amountMatch = combinedText.match(/\$(\d+(\.\d+)?)\s*(m|b|million|billion)/i);
    if (amountMatch) {
        const value = parseFloat(amountMatch[1]);
        const unit = amountMatch[3].toLowerCase();
        if (unit.startsWith('m')) {
            amount = `$${value} Million`;
        } else if (unit.startsWith('b')) {
            amount = `$${value} Billion`;
        }
    }

    const roundMatch = combinedText.match(/\b(seed|series\s+[A-Z])\b/i);
    if (roundMatch) {
        round = roundMatch[0].replace(/\b\w/g, l => l.toUpperCase());
    } else if (/acquires|acquired|acquisition/i.test(combinedText)) {
        round = 'Acquisition';
    }

    const ledByMatch = combinedText.match(/led by ([\w\s,]+?(?=\s(to|and|\.|$)))/i);
    if (ledByMatch) {
        investors.push(...ledByMatch[1].split(/, | and /).map(s => s.trim().replace(/\b\w/g, l => l.toUpperCase())).filter(Boolean));
    }
    
    const backedByMatch = combinedText.match(/backed by ([\w\s,]+?(?=\s(to|and|\.|$)))/i);
    if (backedByMatch) {
       investors.push(...backedByMatch[1].split(/, | and /).map(s => s.trim().replace(/\b\w/g, l => l.toUpperCase())).filter(Boolean));
    }
    
    const vcs = ['Kleiner Perkins', 'Google Ventures', 'Scale Venture Partners', 'Satya Nadella'];
    vcs.forEach(vc => {
        if (new RegExp(vc, 'i').test(combinedText) && !investors.some(inv => inv.includes(vc))) {
            investors.push(vc);
        }
    });

    return {
        amount,
        round,
        investors: investors.length > 0 ? [...new Set(investors)] : ['Varies'],
    };
};


export const parseInvestmentsCsv = async (lang: string): Promise<InvestmentItem[]> => {
  const filePath = `https://raedaldweik.github.io/AIRadar/investments${lang === 'ar' ? '_ar' : ''}.csv`;
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: InvestmentCsvRow[] }) => {
        try {
          const investmentItems: InvestmentItem[] = results.data
            .filter(row => row.title && row.url && row.published)
            .map((row, index) => {
              const itemId = `investment-${index}`;
              const fullText = (row.title || '') + ' ' + (row.summary || '');
              const details = extractInvestmentDetails(fullText);
              const date = new Date(row.published).toISOString().split('T')[0];

              return {
                id: itemId,
                category: Category.Investments,
                title: row.title,
                description: (row.summary || 'No description available.').substring(0, 150),
                imageUrl: categoryImageMap[Category.Investments],
                tags: ['Venture Capital', ...extractTagsFromText(fullText)],
                details: {
                  investors: details.investors,
                  amount: details.amount,
                  round: details.round,
                  date: date,
                  companyUrl: row.url,
                },
              };
            });
          resolve(investmentItems);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};

export const parseTechnologiesCsv = async (lang: string): Promise<TechnologyItem[]> => {
  const filePath = `https://raedaldweik.github.io/AIRadar/technologies${lang === 'ar' ? '_ar' : ''}.csv`;
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: TechnologyCsvRow[] }) => {
        try {
          const techItems: TechnologyItem[] = results.data
            .filter(row => row.id && row.title && row.description)
            .map((row) => {
              return {
                id: row.id,
                category: Category.Technologies,
                title: row.title,
                description: row.description.substring(0, 150) + '...',
                imageUrl: categoryImageMap[Category.Technologies],
                tags: (row.tags || '').split(';').map(t => t.trim()).filter(Boolean),
                details: {
                  impact: row.impact,
                  maturity: row.maturity,
                  websiteUrl: row.websiteUrl,
                },
                isFeatured: row.isFeatured === 'true',
              };
            });
          resolve(techItems);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};

export const parseEmergingTechCsv = async (lang: string): Promise<EmergingTech[]> => {
  const filePath = `https://raedaldweik.github.io/AIRadar/emerging_tech${lang === 'ar' ? '_ar' : ''}.csv`;
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: EmergingTechCsvRow[] }) => {
        try {
          const techItems: EmergingTech[] = results.data
            .filter(row => row.name && row.score)
            .map((row, index) => {
              // Generate some plausible but static data for the trend line chart
              const generateTrendData = (base: number) => {
                const data = [base];
                let current = base;
                for (let i = 1; i < 12; i++) {
                  const change = (Math.random() * 5 - 1.5);
                  current = Math.max(0, Math.min(100, current + change));
                  data.push(current);
                }
                return data;
              };

              return {
                id: `emerging-tech-${row.name.replace(/\s+/g, '-')}-${index}`,
                tags: (row.tags || '').split(';').map(t => t.trim()).filter(Boolean),
                name: row.name,
                score: parseInt(row.score, 10) || 0,
                trend_3m: row.trend_3m,
                trend_12m: row.trend_12m,
                trend_history_data: generateTrendData(parseInt(row.score, 10) * 0.7),
                whats_happening: row.whats_happening,
                why_it_matters: row.why_it_matters,
                key_insight: row.key_insight,
                funding: row.funding,
              };
            });
          resolve(techItems);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};