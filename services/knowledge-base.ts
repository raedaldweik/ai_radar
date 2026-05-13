import { DirectoryItem, EmergingTech, Category, ResearchItem, StartupItem, JobItem, NewsItem, InvestmentItem, GithubRepositoryItem, TechnologyItem, LearningItem } from '../types';
import { learningItems } from '../data/learningItems';
import { 
    parseArxivCsv, 
    parseGithubCsv, 
    parseNewsCsv, 
    parseJobsCsv, 
    parseStartupsCsv, 
    parseInvestmentsCsv, 
    parseTechnologiesCsv,
    parseEmergingTechCsv
} from './csv-parser';
import { getInterestTags } from '../utils/interests';
import { INTEREST_KEYWORDS } from '../utils/recommendation-keywords';

type KnowledgeItem = DirectoryItem | EmergingTech;

class KnowledgeBase {
    private allItems: KnowledgeItem[] = [];
    private isInitialized = false;
    private lang: string = 'en';

    async initialize(lang: string): Promise<void> {
        // Avoid re-initializing if language is the same and already loaded.
        if (this.isInitialized && this.lang === lang) {
            return;
        }

        this.lang = lang;
        console.log(`Initializing knowledge base for language: ${lang}`);

        try {
            const dataSources = [
                parseArxivCsv(lang),
                parseGithubCsv(lang),
                parseNewsCsv(lang),
                parseJobsCsv(lang),
                parseStartupsCsv(lang),
                parseInvestmentsCsv(lang),
                parseTechnologiesCsv(lang),
                parseEmergingTechCsv(lang),
            ];
            
            const results = await Promise.all(dataSources);
            this.allItems = [...results.flat(), ...learningItems];
            this.isInitialized = true;
            console.log(`Knowledge base initialized with ${this.allItems.length} items.`);
        } catch (error) {
            console.error("Failed to initialize Knowledge Base:", error);
            this.isInitialized = false;
        }
    }
    
    private getItemAsSearchableText(item: KnowledgeItem): string {
        let textParts: (string | number | undefined)[] = [];
        if ('category' in item) { // DirectoryItem
            textParts = [
                item.title,
                item.description,
                item.category,
                ...(item.tags || [])
            ];
            // Add details from each type
            if (item.category === Category.Research) {
                const details = (item as ResearchItem).details;
                textParts.push(...details.authors, details.abstract);
            } else if (item.category === Category.Startups) {
                const details = (item as StartupItem).details;
                textParts.push(details.foundedYear, details.funding);
            } else if (item.category === Category.Jobs) {
                const details = (item as JobItem).details;
                textParts.push(details.company, details.location, details.type);
            } else if (item.category === Category.News) {
                const details = (item as NewsItem).details;
                textParts.push(details.source);
            } else if (item.category === Category.Investments) {
                const details = (item as InvestmentItem).details;
                textParts.push(details.amount, details.round, ...details.investors);
            } else if (item.category === Category.GithubRepository) {
                const details = (item as GithubRepositoryItem).details;
                textParts.push(details.language, details.stars, details.forks);
            } else if (item.category === Category.Technologies) {
                 const details = (item as TechnologyItem).details;
                textParts.push(details.impact, details.maturity);
            } else if (item.category === Category.Learning) {
                const details = (item as LearningItem).details;
                textParts.push(details.instructor, details.platform, details.level, details.duration);
            }
        } else { // EmergingTech
            const techItem = item as EmergingTech;
            textParts = [
                techItem.name,
                ...techItem.tags,
                techItem.whats_happening,
                techItem.why_it_matters,
                techItem.key_insight,
                techItem.funding,
                techItem.score, // include numeric values
                techItem.trend_3m,
                techItem.trend_12m,
                "score", "funding", "trend", "emerging", "technology" // add keywords
            ];
        }
        return textParts.filter(Boolean).join(' ').toLowerCase();
    }


    public search(query: string, maxResults = 5): KnowledgeItem[] {
        if (!this.isInitialized) {
            console.warn("Knowledge base not initialized.");
            return [];
        }

        const lowerQuery = query.toLowerCase();

        // Intent detection for ranking queries on Emerging Technologies by score
        if ((lowerQuery.includes('emerging tech') || lowerQuery.includes('emerging technology')) && 
            (lowerQuery.includes('highest score') || lowerQuery.includes('top score'))) {
            
            const emergingTechItems = this.allItems.filter(
                (item): item is EmergingTech => !('category' in item)
            );
            
            if (emergingTechItems.length > 0) {
                emergingTechItems.sort((a, b) => b.score - a.score);
                return emergingTechItems.slice(0, maxResults);
            }
        }

        // Fallback to original keyword search for all other queries
        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        if (queryTerms.length === 0) return [];
        
        const scoredItems = this.allItems.map(item => {
            const searchableText = this.getItemAsSearchableText(item);
            let score = 0;

            for (const term of queryTerms) {
                if (searchableText.includes(term)) {
                    score += 1; 
                }
            }
            
            const title = ('title' in item ? item.title : item.name).toLowerCase();
            for (const term of queryTerms) {
                if (title.includes(term)) {
                    score += 2; // Extra points for title match
                }
            }
            
            return { item, score };
        });

        return scoredItems
            .filter(scored => scored.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(scored => scored.item);
    }

    public getDirectoryItems(): DirectoryItem[] {
        if (!this.isInitialized) {
            return [];
        }
        return this.allItems.filter((item): item is DirectoryItem => 'category' in item);
    }

    public getRecommendedItems(userInterests: string[], count: number = 20, category?: Category): DirectoryItem[] {
        if (!this.isInitialized) {
            return [];
        }
        // Filter to only include items of the specified category, or default to News for the dashboard
        const targetCategory = category || Category.News;
        const directoryItems = this.getDirectoryItems().filter(item => item.category === targetCategory);
        let recommendedItems: DirectoryItem[];

        if (!userInterests || userInterests.length === 0) {
            recommendedItems = directoryItems.filter(item => item.isFeatured).slice(0, count);
        } else {
            // Collect all keywords from selected interests
            const keywords = new Set<string>();
            userInterests.forEach(interest => {
                const interestKeywords = INTEREST_KEYWORDS[interest];
                if (interestKeywords) {
                    interestKeywords.forEach(k => keywords.add(k.toLowerCase()));
                } else {
                    // If no specific keywords, use the interest itself
                    keywords.add(interest.toLowerCase());
                }
            });

            const scoredItems = directoryItems.map(item => {
                let score = 0;
                const searchableText = this.getItemAsSearchableText(item);
                
                keywords.forEach(keyword => {
                    if (searchableText.includes(keyword)) {
                        score += 1;
                    }
                });

                // Boost featured items slightly
                const featuredBoost = item.isFeatured ? 0.5 : 0;
                return { ...item, score: score + featuredBoost };
            });

            scoredItems.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.id.localeCompare(b.id);
            });
            
            const recommended = scoredItems.filter(item => item.score > 0);
            
            if (recommended.length < count) {
                const originalFeatured = directoryItems.filter(item => item.isFeatured);
                const recommendedIds = new Set(recommended.map(i => i.id));
                const fallback = originalFeatured.filter(item => !recommendedIds.has(item.id));
                recommendedItems = [...recommended, ...fallback].slice(0, count);
            } else {
                 recommendedItems = recommended.slice(0, count);
            }
        }

        const redCarpetTitleEn = "Red Carpet: passport-free departure corridor at DXB";
        const redCarpetTitleAr = "السجادة الحمراء: ممر مغادرة بدون جواز سفر في مطار دبي الدولي";
        
        const redCarpetArticle = directoryItems.find(item => 
            item.category === Category.News && (item.title === redCarpetTitleEn || item.title === redCarpetTitleAr)
        );

        if (redCarpetArticle) {
            const isAlreadyRecommended = recommendedItems.some(item => item.id === redCarpetArticle.id);
            if (!isAlreadyRecommended) {
                if (recommendedItems.length >= count) {
                    recommendedItems.pop();
                }
                recommendedItems.unshift(redCarpetArticle);
            }
        }
        
        return recommendedItems;
    }
    
    public formatContext(items: KnowledgeItem[]): string {
        if (items.length === 0) {
            return "No relevant information found in the database.";
        }

        return items.map(item => {
            let itemString = '';
            if ('category' in item) { // It's a DirectoryItem
                const dirItem = item as DirectoryItem;
                itemString += `Type: ${dirItem.category}\n`;
                itemString += `Title: ${dirItem.title}\n`;
                itemString += `Description: ${dirItem.description}\n`;
                switch(dirItem.category) {
                    case Category.Research: 
                        itemString += `Authors: ${(dirItem as ResearchItem).details.authors.join(', ')}\nPublished: ${(dirItem as ResearchItem).details.publishedDate}\nAbstract: ${(dirItem as ResearchItem).details.abstract}`; 
                        break;
                    case Category.Startups: 
                        itemString += `Founded: ${(dirItem as StartupItem).details.foundedYear}\nWebsite: ${(dirItem as StartupItem).details.websiteUrl}`;
                        break;
                    case Category.Jobs: 
                        itemString += `Company: ${(dirItem as JobItem).details.company}\nLocation: ${(dirItem as JobItem).details.location}`;
                        break;
                    case Category.News:
                        itemString += `Source: ${(dirItem as NewsItem).details.source}\nPublished: ${(dirItem as NewsItem).details.publishedDate}`;
                        break;
                    case Category.Investments:
                        itemString += `Amount: ${(dirItem as InvestmentItem).details.amount}\nRound: ${(dirItem as InvestmentItem).details.round}`;
                        break;
                    case Category.GithubRepository:
                        itemString += `Language: ${(dirItem as GithubRepositoryItem).details.language}\nStars: ${(dirItem as GithubRepositoryItem).details.stars}`;
                        break;
                    case Category.Technologies:
                        itemString += `Impact: ${(dirItem as TechnologyItem).details.impact}\nMaturity: ${(dirItem as TechnologyItem).details.maturity}`;
                        break;
                    case Category.Learning:
                        itemString += `Instructor: ${(dirItem as LearningItem).details.instructor}\nPlatform: ${(dirItem as LearningItem).details.platform}\nRating: ${(dirItem as LearningItem).details.rating}`;
                        break;
                }
            } else { // It's an EmergingTech item
                 const techItem = item as EmergingTech;
                 itemString += `Type: Emerging Technology Trend\n`;
                 itemString += `Name: ${techItem.name}\n`;
                 itemString += `Score: ${techItem.score}\n`;
                 itemString += `3-Month Trend: ${techItem.trend_3m}\n`;
                 itemString += `12-Month Trend: ${techItem.trend_12m}\n`;
                 itemString += `Funding: ${techItem.funding}\n`;
                 itemString += `What's Happening: ${techItem.whats_happening}\n`;
                 itemString += `Why it matters: ${techItem.why_it_matters}\n`;
                 itemString += `Key Insight: ${techItem.key_insight}`;
            }
            return itemString.trim();
        }).join('\n\n---\n\n');
    }
}

// Singleton instance
export const knowledgeBase = new KnowledgeBase();