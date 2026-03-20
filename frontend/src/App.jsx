import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, createContext } from 'react';
import ReactGA from "react-ga4";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import LandingPage from './pages/LandingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ComparePage from './pages/ComparePage';
import ModelDetailPage from './pages/ModelDetailPage';
import SubmitPage from './pages/SubmitPage';
import BenchmarksPage from './pages/BenchmarksPage';
import AdminPage from './pages/AdminPage';

export const ThemeContext = createContext();

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Returns true when we need to show the GDPR banner:
 *  - GA is configured (env var exists)
 *  - We are NOT on localhost
 */
function shouldShowGdpr() {
  if (!GA_MEASUREMENT_ID) return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return true;
}

/** Initialise GA4 (called only once after user consent). */
function initGA() {
  if (GA_MEASUREMENT_ID && !window.__GA_INITIALIZED__) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    window.__GA_INITIALIZED__ = true;
  }
}

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (window.__GA_INITIALIZED__) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  return null;
}

const CONSENT_KEY = 'metabench-cookie-consent';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('metabench-dark-mode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Cookie consent state: 'pending' | 'accepted' | 'declined'
  const [consent, setConsent] = useState(() => {
    if (!shouldShowGdpr()) return 'no-gdpr'; // No banner needed
    return localStorage.getItem(CONSENT_KEY) || 'pending';
  });

  const gaInitRef = useRef(false);

  // If user previously accepted, init GA immediately
  useEffect(() => {
    if (consent === 'accepted' && !gaInitRef.current) {
      initGA();
      gaInitRef.current = true;
    }
  }, [consent]);

  useEffect(() => {
    localStorage.setItem('metabench-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAccept = () => {
    setConsent('accepted');
    initGA();
    gaInitRef.current = true;
  };

  const handleDecline = () => {
    setConsent('declined');
  };

  const showBanner = consent === 'pending';

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <Router>
        <AnalyticsTracker />
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/benchmarks" element={<BenchmarksPage />} />
              <Route path="/model/:modelName" element={<ModelDetailPage />} />
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
        </div>

        {/* GDPR Cookie Consent */}
        {showBanner && (
          <CookieConsent onAccept={handleAccept} onDecline={handleDecline} />
        )}
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
