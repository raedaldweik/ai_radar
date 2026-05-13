import React, { useContext } from 'react';
import { LearningItem, DirectoryItem } from '../../types';
import { LanguageContext } from '../../i18n/LanguageContext';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

interface RecommendedCoursesProps {
  items: LearningItem[];
  onSelect: (item: DirectoryItem) => void;
  onViewAll: () => void;
}

const platformStyles: Record<string, { bg: string; text: string; ring: string }> = {
  Coursera:   { bg: 'bg-blue-500/15',    text: 'text-blue-300',    ring: 'ring-blue-500/30'    },
  Udemy:      { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-300', ring: 'ring-fuchsia-500/30' },
  edX:        { bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  ring: 'ring-indigo-500/30'  },
  Other:      { bg: 'bg-slate-500/15',   text: 'text-slate-300',   ring: 'ring-slate-500/30'   },
};

const levelDotColor: Record<string, string> = {
  Beginner: 'bg-emerald-400',
  Intermediate: 'bg-amber-400',
  Advanced: 'bg-rose-400',
};

const CERT_MARKERS = [
  'certificate', 'specialization', 'professional certificate',
  'ibm', 'google', 'aws', 'microsoft', 'meta',
];

const isCertification = (item: LearningItem): boolean => {
  const haystack = `${item.title} ${item.details.instructor}`.toLowerCase();
  return CERT_MARKERS.some(m => haystack.includes(m));
};

export const RecommendedCourses: React.FC<RecommendedCoursesProps> = ({
  items,
  onSelect,
  onViewAll,
}) => {
  const { t } = useContext(LanguageContext);

  if (items.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="courses-heading">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </span>
          <h2 id="courses-heading" className="font-bold text-slate-100 text-base">
            {t('dashboardV2.coursesTitle')}
          </h2>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-700/40 border border-slate-600/40 rounded-full px-2 py-0.5 tabular-nums">
            {items.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-[11px] text-sky-400 font-semibold hover:text-sky-300 transition-colors inline-flex items-center gap-1 group"
        >
          {t('dashboardV2.viewAll')}
          <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.slice(0, 4).map(course => {
          const platform = platformStyles[course.details.platform] || platformStyles.Other;
          const cert = isCertification(course);
          const lvlDot = levelDotColor[course.details.level] || levelDotColor.Beginner;
          return (
            <article
              key={course.id}
              onClick={() => onSelect(course)}
              className="group relative bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-lg p-3.5 cursor-pointer transition-all duration-200 hover:border-sky-400/40 hover:bg-white/[0.06] hover:-translate-y-0.5"
              role="button"
              aria-label={`Course: ${course.title}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ring-1 ${platform.bg} ${platform.text} ${platform.ring}`}
                >
                  {course.details.platform}
                </span>
                {cert && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1l2.4 6.9H22l-6.2 4.5 2.4 7.1L12 15.6 5.8 19.5l2.4-7.1L2 7.9h7.6L12 1z" />
                    </svg>
                    {t('dashboardV2.certBadge')}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
                {course.title}
              </h3>

              <p className="text-[11px] text-slate-400 mb-3 truncate" title={course.details.instructor}>
                {course.details.instructor}
              </p>

              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                  {course.details.rating.toFixed(1)}
                </span>
                <span className="text-slate-500 truncate">{course.details.duration}</span>
                <span className="inline-flex items-center gap-1 text-slate-300 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${lvlDot}`}></span>
                  {course.details.level}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
