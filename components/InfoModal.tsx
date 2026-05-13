import React, { useEffect, useContext } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { LanguageContext } from '../i18n/LanguageContext';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, description, actionText, onAction, secondaryActionText, onSecondaryAction }) => {
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  const hasActions = (actionText && onAction) || (secondaryActionText && onSecondaryAction);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div
        className="bg-white/5 backdrop-blur-lg text-white rounded-xl shadow-2xl w-11/12 max-w-md relative border border-white/10 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-slate-400 hover:text-white transition-colors"
          aria-label={t('modal.close')}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 id="info-modal-title" className="text-2xl font-bold mb-4 text-sky-400">
          {title}
        </h2>
        <p className="text-slate-300 whitespace-pre-wrap">{description}</p>
        
        {hasActions && (
          <div className="mt-6 flex justify-end items-center gap-4">
            {secondaryActionText && onSecondaryAction && (
                <button
                onClick={() => {
                  onSecondaryAction();
                  onClose();
                }}
                className="inline-flex items-center gap-2 text-sky-400 bg-transparent border border-sky-600 hover:bg-sky-900/50 font-semibold py-2 px-4 rounded-lg transition-all"
              >
                {secondaryActionText}
              </button>
            )}
            {actionText && onAction && (
              <button
                onClick={() => {
                  onAction();
                  onClose();
                }}
                className="inline-flex items-center gap-2 text-white bg-sky-600 hover:bg-sky-700 font-semibold py-2 px-4 rounded-lg transition-all"
              >
                {actionText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};