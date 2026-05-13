import React, { useState, useRef, useEffect, useContext } from 'react';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';
import { MaximizeIcon } from './icons/MaximizeIcon';
import { MinimizeIcon } from './icons/MinimizeIcon';
import { parseMarkdown } from '../utils/markdown';
import { LanguageContext } from '../i18n/LanguageContext';
import { KnowledgeBaseContext } from '../context/KnowledgeBaseContext';

interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: { uri: string; title: string }[];
}

interface ChatAssistantProps {
  userInterests: string[];
}

// Sends a chat turn to /api/chat and returns the assistant reply + any web sources.
async function callChatAPI(payload: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
  userInterests: string[];
  lang: 'en' | 'ar';
}): Promise<{ content: string; sources?: { uri: string; title: string }[] }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Chat API error: ${response.status}`);
  }
  return response.json();
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ userInterests }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useContext(LanguageContext);
  const { isReady, search, formatContext, getRecommendedItems } = useContext(KnowledgeBaseContext);
  const [promptToSend, setPromptToSend] = useState<string | null>(null);

  // Initialize the welcome message when chat opens. Claude is stateless, so no chat session to create.
  useEffect(() => {
    if (isOpen && isReady && messages.length === 0) {
      setMessages([{ role: 'model', content: t('chat.welcome') }]);
      setError(null);
    }
  }, [isOpen, isReady, lang, t, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading || !isReady) return;

    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const lowerMessage = message.toLowerCase();
      const isRecommendationQuery =
        ((lowerMessage.includes('recommend') || lowerMessage.includes('featured')) &&
          (lowerMessage.includes('summary') ||
            lowerMessage.includes('summarize') ||
            lowerMessage.includes('tell me about') ||
            lowerMessage.includes('what are') ||
            lowerMessage.includes('list'))) ||
        lowerMessage.includes('recommended for me') ||
        (lowerMessage.includes('directory') && lowerMessage.includes('recommend'));

      // Retrieve KB context from the frontend so we don't send the whole knowledge base over the wire.
      let context = '';
      if (isRecommendationQuery) {
        const items = getRecommendedItems(userInterests, 3);
        context = formatContext(items);
      } else {
        const items = search(message);
        context = formatContext(items);
      }

      // Trim the welcome greeting from the API payload — it's a UI artifact, not a real turn.
      const firstUserIdx = newMessages.findIndex((m) => m.role === 'user');
      const apiMessages =
        firstUserIdx >= 0
          ? newMessages.slice(firstUserIdx).map((m) => ({
              role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
              content: m.content,
            }))
          : [];

      const response = await callChatAPI({
        messages: apiMessages,
        context,
        userInterests,
        lang,
      });

      const modelMessage: Message = {
        role: 'model',
        content: response.content,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        role: 'model',
        content: t('chat.sendError'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<{ prompt: string }>) => {
      setIsOpen(true);
      setPromptToSend(event.detail.prompt);
    };
    window.addEventListener('open-chat-assistant', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open-chat-assistant', handleOpenChat as EventListener);
    };
  }, []);

  useEffect(() => {
    // Send the queued prompt once the welcome message has been initialized.
    if (promptToSend && isReady && !isLoading && messages.length > 0) {
      handleSendMessage(promptToSend);
      setPromptToSend(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptToSend, isReady, isLoading, messages.length]);

  const containerClasses = isMaximized
    ? 'fixed inset-0 w-full h-full rounded-none'
    : 'fixed bottom-6 end-6 w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] sm:w-96 sm:h-[600px] rounded-xl';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 end-6 bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 z-40 animate-pulse-glow"
        aria-label={t('chat.open')}
      >
        <ChatIcon className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className={`${containerClasses} bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-50`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
            <h3 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-500">{t('chat.title')}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="text-slate-400 hover:text-white"
                aria-label={isMaximized ? t('chat.minimize') : t('chat.maximize')}
              >
                {isMaximized ? <MinimizeIcon className="w-6 h-6" /> : <MaximizeIcon className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label={t('chat.close')}
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {!isReady && (
              <div className="text-center text-slate-400 p-3 rounded-lg flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                <span>{t('chat.loadingKnowledge')}</span>
              </div>
            )}
            {isReady && error && <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
            {isReady && messages.map((msg, index) => (
              <div key={index} className={`flex flex-col items-start ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs md:max-w-lg xl:max-w-3xl rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-sky-600 text-white self-end' : 'bg-slate-700 text-slate-200 self-start'}`}>
                  <div>{parseMarkdown(msg.content)}</div>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 max-w-xs md:max-w-lg xl:max-w-3xl w-full">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('chat.sources')}</h4>
                    <ul className="space-y-1">
                      {msg.sources.map((source, idx) => (
                        <li key={idx}>
                        <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-400 hover:text-sky-300 hover:underline truncate block"
                            title={source.title}
                          >
                            {`[${idx + 1}] ${source.title}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="p-4 border-t border-slate-700/50">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="w-full bg-slate-700/80 border border-slate-600 rounded-full ps-4 pe-12 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-white"
                aria-label={t('chat.placeholder')}
                disabled={isLoading || !!error || !isReady}
              />
              <button
                type="submit"
                className="absolute end-2 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-300 disabled:text-slate-500"
                aria-label={t('chat.send')}
                disabled={isLoading || !input.trim() || !!error || !isReady}
              >
                <SendIcon className="w-7 h-7" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
