import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vexta_privacy_acknowledged');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('vexta_privacy_acknowledged', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-2xl bg-[#0e130d] border border-[#22C55E]/40 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] font-sans text-gray-300 transition-all backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#4ADE80] font-bold tracking-wider">
          <i className="fa-solid fa-cookie-bite text-[#39FF14] text-xs"></i>
          <span>NO TRACKING COOKIES</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-[#7E927F] hover:text-white transition-colors cursor-pointer text-xs"
          aria-label="Close notice"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <p className="text-xs text-[#7E927F] leading-relaxed mb-4">
        This website does not use cookies, analytics, or third-party trackers. Only minimal preferences (such as your acknowledgment) are stored locally in your browser.
      </p>
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#1C241B]">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-4 py-1.5 rounded-lg bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#39FF14] border border-[#22C55E]/30 text-xs font-mono font-medium transition-colors cursor-pointer"
        >
          Got it
        </button>
        <Link
          to="/privacy"
          onClick={() => setVisible(false)}
          className="text-xs font-mono text-[#7E927F] hover:text-[#39FF14] underline transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </aside>
  );
}
