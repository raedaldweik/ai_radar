import React, { useEffect, useContext } from 'react';
import type { DirectoryItem, ResearchItem, StartupItem, JobItem, NewsItem, TechnologyItem, InvestmentItem, GithubRepositoryItem } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { CloseIcon } from './icons/CloseIcon';
import { Category } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';

const DetailSection: React.FC<{title: string, content: string}> = ({title, content}) => (
    <div className="mb-4">
        <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</h4>
        <p className="text-slate-200 text-lg">{content}</p>
    </div>
);

const PrimaryButton: React.FC<{href: string, text: string}> = ({href, text}) => (
        <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-white bg-sky-600 hover:bg-sky-700 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
      >
        {text}
        <ExternalLinkIcon className="w-5 h-5" />
      </a>
);

const SummarizeButton: React.FC<{ item: DirectoryItem; onClose: () => void }> = ({ item, onClose }) => {
    const { t } = useContext(LanguageContext);

    const handleSummarize = () => {
        const categoryName = t(`categories.${item.category.replace(' ', '')}`);
        const prompt = t('modal.summarizePrompt', {
            category: categoryName,
            title: item.title,
        });
        const event = new CustomEvent('open-chat-assistant', { detail: { prompt } });
        window.dispatchEvent(event);
        onClose();
    };

    return (
        <button
            onClick={handleSummarize}
            className="inline-flex items-center gap-2 text-sky-400 bg-transparent border border-sky-600 hover:bg-sky-900/50 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
        >
            {t('modal.summarizeWithAssistant')}
        </button>
    );
};

// "Brief my team" — fires a global event that:
//   1) tells App.tsx to navigate to the Intelligence Hub tab
//   2) tells IntelligenceHubPage to auto-launch Memo on Demand with this signal pre-loaded
// We send a snapshot of the item rather than just the id, because the Hub's signal list
// is built from top-scored news only — and the user might be briefing on a startup, job, etc.
const BriefMyTeamButton: React.FC<{ item: DirectoryItem; onClose: () => void }> = ({ item }) => {
    const handleBrief = () => {
        // Build a flat snapshot the agent can reason over without depending on the KB lookup.
        const snapshot = {
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            url:
                (item as any).details?.articleUrl ||
                (item as any).details?.applyUrl ||
                (item as any).details?.companyUrl ||
                (item as any).details?.websiteUrl ||
                (item as any).details?.paperUrl,
            source: (item as any).details?.source,
            publishedDate: (item as any).details?.publishedDate,
        };
        (window as any).__pendingMemoSnapshot = snapshot;
        const event = new CustomEvent('launch-memo-from-signal', { detail: { snapshot } });
        window.dispatchEvent(event);
        // We do NOT call onClose() — the Hub listener handles navigation, which unmounts the modal anyway.
    };

    return (
        <button
            onClick={handleBrief}
            className="inline-flex items-center gap-2 text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-[0_0_20px_-6px_rgba(56,189,248,0.6)]"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
            Brief my team
        </button>
    );
};

// Categories where producing a 1-page memo makes sense.
// Research papers and emerging-tech items skip the memo button — they're better summarized.
const MEMO_ELIGIBLE: Category[] = [
    Category.News,
    Category.Startups,
    Category.Investments,
    Category.Jobs,
];

const ActionButtons: React.FC<{ item: DirectoryItem; onClose: () => void }> = ({ item, onClose }) => (
    <div className="flex flex-wrap items-center gap-3">
        <SummarizeButton item={item} onClose={onClose} />
        {MEMO_ELIGIBLE.includes(item.category) && (
            <BriefMyTeamButton item={item} onClose={onClose} />
        )}
    </div>
);

const renderItemDetails = (item: DirectoryItem, t: (key: string, options?: any) => string, onClose: () => void) => {
  switch (item.category) {
    case Category.Research:
      const research = item as ResearchItem;
      return (
        <>
          <DetailSection title={t('modal.authors')} content={research.details.authors.join(', ')} />
          <DetailSection title={t('modal.published')} content={research.details.publishedDate} />
          <DetailSection title={t('modal.abstract')} content={research.details.abstract} />
          <div className="flex flex-wrap items-center gap-3 mt-6">
              <PrimaryButton href={research.details.paperUrl} text={t('modal.readFullPaper')} />
              <ActionButtons item={item} onClose={onClose} />
          </div>
        </>
      );
    case Category.Startups:
      const startup = item as StartupItem;
      return (
        <>
          <DetailSection title={t('modal.foundedYear')} content={String(startup.details.foundedYear)} />
          <DetailSection title={t('modal.funding')} content={startup.details.funding} />
          <DetailSection title={t('modal.about')} content={startup.details.about} />
          <div className="flex flex-wrap items-center gap-3 mt-6">
              <PrimaryButton href={startup.details.websiteUrl} text={t('modal.visitWebsite')} />
              <ActionButtons item={item} onClose={onClose} />
          </div>
        </>
      );
    case Category.Jobs:
      const job = item as JobItem;
      return (
        <>
            <DetailSection title={t('modal.company')} content={job.details.company} />
            <DetailSection title={t('modal.location')} content={job.details.location} />
            <DetailSection title={t('modal.skills')} content={job.details.requiredSkills.join(', ')} />
            <DetailSection title={t('modal.about')} content={job.details.about} />
            <div className="flex flex-wrap items-center gap-3 mt-6">
                <PrimaryButton href={job.details.applyUrl} text={t('modal.applyForJob')} />
                <ActionButtons item={item} onClose={onClose} />
            </div>
        </>
      );
    case Category.News:
      const news = item as NewsItem;
      return (
        <>
            <DetailSection title={t('modal.source')} content={news.details.source} />
            <DetailSection title={t('modal.published')} content={news.details.publishedDate} />
            <DetailSection title={t('modal.fullArticle')} content={news.details.fullText} />
            <div className="flex flex-wrap items-center gap-3 mt-6">
                <PrimaryButton href={news.details.articleUrl} text={t('modal.readFullArticle')} />
                <ActionButtons item={item} onClose={onClose} />
            </div>
        </>
      );
    case Category.EmergingTechnologies:
        const tech = item as TechnologyItem;
        return (
          <>
              <DetailSection title={t('modal.impact')} content={tech.details.impact} />
              <DetailSection title={t('modal.maturity')} content={tech.details.maturity} />
              <DetailSection title={t('modal.about')} content={tech.details.about} />
              <div className="flex flex-wrap items-center gap-3 mt-6">
                  {tech.details.websiteUrl && <PrimaryButton href={tech.details.websiteUrl} text={t('modal.learnMore')} />}
                  <ActionButtons item={item} onClose={onClose} />
              </div>
          </>
        );
    case Category.Investments:
        const investment = item as InvestmentItem;
        return (
            <>
                <DetailSection title={t('modal.company')} content={investment.details.company} />
                <DetailSection title={t('modal.amount')} content={investment.details.amount} />
                <DetailSection title={t('modal.round')} content={investment.details.round} />
                <DetailSection title={t('modal.about')} content={investment.details.about} />
                <div className="flex flex-wrap items-center gap-3 mt-6">
                    {investment.details.companyUrl && <PrimaryButton href={investment.details.companyUrl} text={t('modal.visitWebsite')} />}
                    <ActionButtons item={item} onClose={onClose} />
                </div>
            </>
        );
    case Category.Github:
      const repo = item as GithubRepositoryItem;
      return (
        <>
            <DetailSection title={t('modal.stars')} content={String(repo.details.stars)} />
            <DetailSection title={t('modal.language')} content={repo.details.language} />
            <DetailSection title={t('modal.about')} content={repo.details.about} />
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <PrimaryButton href={repo.details.repoUrl} text={t('modal.viewOnGithub')} />
              <ActionButtons item={item} onClose={onClose} />
            </div>
        </>
      );
    default:
      return null;
  }
};

interface ToolDetailModalProps {
  item: DirectoryItem | null;
  onClose: () => void;
}

export const DirectoryItemModal: React.FC<ToolDetailModalProps> = ({ item, onClose }) => {
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!item) return null;

 
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-slate-800/95 backdrop-blur-md text-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-slate-400 hover:text-white"
          aria-label={t('common.close')}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover rounded-lg mb-6" />
        )}
        <h2 className="text-3xl font-bold mb-2">{item.title}</h2>
        <p className="text-slate-300 mb-6">{item.description}</p>
        {renderItemDetails(item, t, onClose)}
      </div>
    </div>
  );
};