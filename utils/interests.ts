// A mapping from user-selectable interests to more specific tags used in the data.
const interestTagMap: Record<string, string[]> = {
    'Generative AI': ['Generative AI', 'LLMs', 'NLP', 'Content Generation', 'Creative AI'],
    'Machine Learning': ['Machine Learning', 'ML', 'Deep Learning', 'Reinforcement Learning', 'RL'],
    'Venture Capital': ['Venture Capital', 'VC', 'Investments', 'Funding', 'Startups'],
    'AI Ethics': ['AI Ethics', 'Ethics', 'AI Safety', 'Responsible AI', 'Policy'],
    'Robotics': ['Robotics', 'Autonomous Systems', 'Automation', 'Hardware'],
    'NLP': ['NLP', 'LLMs', 'Translation', 'Generative AI'],
    'Healthcare': ['Healthcare AI', 'Healthcare', 'Biotech', 'AI Drug Discovery', 'Medical'],
    'Career Growth': ['Career Growth', 'Jobs', 'ML Engineer', 'Data Scientist'],
    'Computer Vision': ['Computer Vision', 'Image Processing', 'Vision', 'Image Generation'],
    'Developer Tools': ['Developer Tools', 'Code Generation', 'DevOps', 'API'],
    'Finance': ['Finance', 'Fintech', 'Trading', 'Banking'],
    'E-commerce': ['E-commerce', 'Retail', 'Retail Tech'],
    'Public Sector': ['Public Sector', 'GovTech', 'Government'],
    'Legal': ['Legal', 'LegalTech'],
    'Insurance': ['Insurance', 'Insurtech'],
};

/**
 * Converts a list of user interests into a Set of specific tags for filtering content.
 * @param interests - An array of strings representing user interests.
 * @returns A Set of strings containing all relevant tags.
 */
export const getInterestTags = (interests: string[]): Set<string> => {
    const tags = new Set<string>();
    for (const interest of interests) {
        // If it's a predefined interest, use the mapping
        if (interestTagMap[interest]) {
            interestTagMap[interest].forEach(tag => tags.add(tag));
        } else { // Otherwise, it's a custom interest
            // Add the interest itself for an exact match chance
            tags.add(interest);
            // Also add individual words for broader matching.
            if (interest.includes(' ')) {
                interest.split(/\s+/).forEach(word => {
                    if (word.length > 2) { // Avoid short, common words.
                        tags.add(word);
                    }
                });
            }
        }
    }
    return tags;
};