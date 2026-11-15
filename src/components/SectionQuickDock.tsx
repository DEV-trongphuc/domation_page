import React, { useEffect, useState } from 'react';

export const SectionQuickDock: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollY / docHeight) * 100) : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[80] pointer-events-none bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-[#1E40FF] via-[#0284C7] to-[#06B6D4] transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
