
import React, { useState, useEffect, useContext } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CloseIcon } from '../icons/CloseIcon';
import { LanguageContext } from '../../i18n/LanguageContext';
import { parseMarkdown } from '../../utils/markdown';

interface SkillInfoModalProps {
  skillName: string | null;
  onClose: () => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
    </div>
);


export const SkillInfoModal: React.FC<SkillInfoModalProps> = ({ skillName, onClose }) => {
  const { t } = useContext(LanguageContext);
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDescription = async () => {
        if (!skillName) return;

        setIsLoading(true);
        setError(null);
        setDescription('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Describe what "${skillName}" is and explain its use and importance in the AI industry. Keep the explanation concise, clear, and easy to understand for someone new to the field. Use markdown for formatting, like bolding key terms.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setDescription(response.text);

        } catch (err) {
            console.error("Error fetching skill description from Gemini:", err);
            setError("Sorry, I couldn't fetch a description for this skill right now. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchDescription();
  }, [skillName]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (skillName) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [skillName, onClose]);

  if (!skillName) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex justify-center items-center z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-modal-title"
    >
      <div
        className="bg-slate-800 text-white rounded-xl shadow-2xl w-11/12 max-w-lg relative border border-slate-700 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-slate-400 hover:text-white transition-colors"
          aria-label={t('modal.close')}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 id="skill-modal-title" className="text-3xl font-bold mb-6 text-sky-400">
          {skillName}
        </h2>
        
        <div className="text-slate-300 space-y-4">
            {isLoading && <LoadingSkeleton />}
            {error && <p className="text-red-400">{error}</p>}
            {description && !isLoading && <div>{parseMarkdown(description)}</div>}
        </div>
      </div>
    </div>
  );
};
