
export enum Category {
  All = 'All',
  Research = 'Research',
  Startups = 'Startups',
  Jobs = 'Jobs',
  News = 'News',
  Technologies = 'Emerging Tech',
  Investments = 'Investments',
  GithubRepository = 'Github Repository',
  Learning = 'Learning',
}

interface BaseItem {
  id: string;
  category: Category;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  isFeatured?: boolean;
  isPinned?: boolean;
  pinPriority?: number;
}

export interface ResearchItem extends BaseItem {
  category: Category.Research;
  details: {
    authors: string[];
    publishedDate: string;
    abstract: string;
    paperUrl: string;
  };
}

export interface StartupItem extends BaseItem {
  category: Category.Startups;
  details: {
    foundedYear: number;
    funding: string;
    websiteUrl: string;
  };
}

export interface JobItem extends BaseItem {
  category: Category.Jobs;
  details: {
    company: string;
    location: string;
    applyUrl: string;
    type: 'Full-time' | 'Part-time' | 'Contract';
    postedDate?: string;
  };
}

export interface NewsItem extends BaseItem {
  category: Category.News;
  details: {
    source: string;
    publishedDate: string;
    articleUrl: string;
  };
}

export interface TechnologyItem extends BaseItem {
    category: Category.Technologies;
    details: {
        impact: string;
        maturity: 'Nascent' | 'Growing' | 'Mature';
        websiteUrl: string;
    };
}

export interface InvestmentItem extends BaseItem {
    category: Category.Investments;
    details: {
        investors: string[];
        amount: string;
        round: string;
        date: string;
        companyUrl: string;
    };
}

export interface GithubRepositoryItem extends BaseItem {
    category: Category.GithubRepository;
    details: {
        stars: number;
        forks: number;
        language: string;
        repoUrl: string;
        lastUpdate?: string;
    };
}


export interface LearningItem extends BaseItem {
    category: Category.Learning;
    details: {
        instructor: string;
        platform: 'Coursera' | 'Udemy' | 'edX' | 'Other';
        rating: number;
        duration: string;
        level: 'Beginner' | 'Intermediate' | 'Advanced';
        courseUrl: string;
    };
}


export type DirectoryItem = ResearchItem | StartupItem | JobItem | NewsItem | TechnologyItem | InvestmentItem | GithubRepositoryItem | LearningItem;

export type IconName = 'ChipIcon' | 'CodeIcon' | 'LightBulbIcon';

export interface TechItem {
    name: string;
    icon: IconName;
    description: string;
    tags: string[];
}

export interface JobRole {
    role: string;
    openings: number;
    salary: string;
    growth: string;
    description: string;
}

export interface EmergingTech {
  id: string;
  tags: string[];
  name: string;
  score: number;
  trend_3m: string;
  trend_12m: string;
  trend_history_data: number[];
  whats_happening: string;
  why_it_matters: string;
  key_insight: string;
  funding: string;
}

export interface Profile {
  name: string;
  interests: string[];
}

export interface ItemScore {
  id: string;
  gdrfaRelevance: number;
  lenses: {
    identity_biometrics: number;
    border_control: number;
    customer_happiness: number;
    residency_visa: number;
    ai_sovereignty: number;
    cybersecurity: number;
  };
  suggestedAction: 'pilot_candidate' | 'monitor' | 'policy_watch' | 'ignore';
  whyItMatters: string;
}

export type ScoresMap = Record<string, ItemScore>;

// === Agent system types ===

export type AgentName =
  | 'morning_brief'
  | 'memo_on_demand'
  | 'opportunity_scout'
  | 'peer_benchmark'
  | 'policy_watch'
  | 'custom_task';

export type AgentStreamEvent =
  | { type: 'step_start'; step: string }
  | { type: 'step_done'; step: string }
  | { type: 'content_delta'; text: string }
  | { type: 'sources'; sources: { uri: string; title: string }[] }
  | { type: 'done'; markdown: string }
  | { type: 'error'; message: string };

export interface AgentArtifact {
  id: string;
  agentName: AgentName;
  title: string;
  profileName: string;
  createdAt: string;
  markdown: string;
  sources?: { uri: string; title: string }[];
}