import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ComparePage from './pages/ComparePage';
import ModelDetailPage from './pages/ModelDetailPage';
import SubmitPage from './pages/SubmitPage';

export const ThemeContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('benchindex-dark-mode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('benchindex-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/model/:modelName" element={<ModelDetailPage />} />
              <Route path="/submit" element={<SubmitPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
