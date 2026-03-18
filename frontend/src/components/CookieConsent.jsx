import { useState, useEffect } from 'react';
import { Shield, Cookie } from 'lucide-react';

const STORAGE_KEY = 'metabench-cookie-consent';

export default function CookieConsent({ onAccept, onDecline }) {
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    // Small delay so the slide-up animation is visible after page load
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleChoice = (accepted) => {
    setAnimatingOut(true);
    setTimeout(() => {
      if (accepted) {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        onAccept?.();
      } else {
        localStorage.setItem(STORAGE_KEY, 'declined');
        onDecline?.();
      }
    }, 350); // Wait for exit animation
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-all duration-500 ease-out ${
        visible && !animatingOut
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-surface-800/80 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40">
          {/* Gradient accent stripe at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-600" />

          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 dark:from-brand-500/20 dark:to-accent-500/20">
                <Cookie className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-gray-900 dark:text-white">
                  Cookie Consent
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> GDPR Compliant
                </p>
              </div>
            </div>

            {/* Body */}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
              MetaBench is an <span className="font-semibold text-gray-800 dark:text-gray-100">open-source project</span> and
              the only tracking we use is <span className="font-semibold text-gray-800 dark:text-gray-100">Google Analytics</span> to
              understand site usage. No personal data is collected or shared with third parties. You
              can accept or decline — the site works perfectly either way.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="gdpr-accept-btn"
                onClick={() => handleChoice(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/40 hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Accept
              </button>
              <button
                id="gdpr-decline-btn"
                onClick={() => handleChoice(false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-surface-800 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
