import React from 'react';

export const NetworkBackground: React.FC = () => (
  <>
    <video
      autoPlay
      loop
      muted
      playsInline
      className="fixed top-0 left-0 w-full h-full object-cover -z-10"
    >
      <source src="https://raedaldweik.github.io/AIRadar/Radar%20Project%2010%20sec.mp4" type="video/mp4" />
    </video>
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/30 via-sky-900/10 to-slate-900/40 -z-[5]"></div>
  </>
);