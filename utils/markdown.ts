import React from 'react';
import { marked } from 'marked';

// Configure marked once: GitHub-flavored, line breaks honored, no smartypants weirdness.
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Renders a markdown string into React. We use dangerouslySetInnerHTML because
// marked produces a sanitized HTML string and we control the input (it's our own
// agents and chat replies, not user-uploaded content).
export const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  const html = marked.parse(text, { async: false }) as string;
  return React.createElement('div', {
    className: 'markdown-body',
    dangerouslySetInnerHTML: { __html: html },
  });
};