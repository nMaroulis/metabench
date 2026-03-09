import { Link, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { ThemeContext } from '../App';
import { Sun, Moon, Menu, X, Brain, Search } from 'lucide-react';

export default function Navbar() {
    const { darkMode, setDarkMode } = useContext(ThemeContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const links = [
        { to: '/', label: 'Home' },
        { to: '/leaderboard', label: 'Leaderboard' },
        { to: '/compare', label: 'Compare' },
        { to: '/submit', label: 'Submit' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:shadow-brand-500/40 transition-shadow">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-display font-bold tracking-tight">
                            Meta<span className="gradient-text">Bench</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(({ to, label }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(to)
                                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-surface-800'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden animate-slide-down border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="px-4 py-3 space-y-1">
                        {links.map(({ to, label }) => (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive(to)
                                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
