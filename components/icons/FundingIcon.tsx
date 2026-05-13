
import React from 'react';

export const FundingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3L21 7.5m0 0L16.5 12M21 7.5H3" />
  </svg>
);
