import React from 'react';

export interface Skill {
    text: string;
    value: number;
    description: string;
}

interface SkillsCloudProps {
    data: Skill[];
    onSkillClick: (skill: Skill) => void;
}

const skillCategories = [
    {
        name: 'Programming & AI',
        skills: ['Python', 'PyTorch', 'TensorFlow', 'Transformers'],
    },
    {
        name: 'Cloud & Deployment',
        skills: ['AWS', 'Docker', 'Kubernetes', 'MLOps'],
    },
    {
        name: 'Domains',
        skills: ['NLP', 'LLMs', 'Computer Vision'],
    },
];

const getCategorizedSkills = (data: Skill[]): { name: string; skills: Skill[]; }[] => {
    const dataMap = new Map(data.map(s => [s.text, s]));

    return skillCategories.map(category => {
        const skills = category.skills
            .map(skillName => dataMap.get(skillName))
            .filter((skill): skill is Skill => !!skill);
        
        return { ...category, skills };
    }).filter(category => category.skills.length > 0);
};

export const SkillsCloud: React.FC<SkillsCloudProps> = ({ data, onSkillClick }) => {
    const categorizedSkills = getCategorizedSkills(data);

    return (
        <div className="flex flex-col justify-center h-full space-y-6">
            {categorizedSkills.map(({ name, skills }) => (
                <div key={name}>
                    <h4 className="text-base font-bold text-slate-300 mb-4 px-1">{name}</h4>
                    <div className="flex flex-wrap gap-3">
                        {skills.map(skill => (
                            <button 
                                key={skill.text}
                                onClick={() => onSkillClick(skill)}
                                className="text-slate-200 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/20 shadow-lg"
                                aria-label={`Learn more about ${skill.text}`}
                            >
                                {skill.text}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};