import { Brain, Github, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-surface-800/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-display font-bold">MetaBench</span>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            The definitive aggregator of LLM benchmark scores. Compare models, explore leaderboards, and make informed decisions.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Navigate</h4>
                        <ul className="space-y-2">
                            {[
                                { to: '/leaderboard', label: 'Leaderboard' },
                                { to: '/compare', label: 'Compare Models' },
                                { to: '/submit', label: 'Submit Scores' },
                            ].map(({ to, label }) => (
                                <li key={to}>
                                    <Link to={to} className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 transition-colors">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Benchmarks */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Benchmarks</h4>
                        <ul className="space-y-2">
                            {['MMLU', 'HumanEval', 'GSM8K', 'GPQA', 'BigBench-Hard'].map(name => (
                                <li key={name}>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 transition-colors inline-flex items-center gap-1">
                                    API Docs <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 transition-colors inline-flex items-center gap-1">
                                    GitHub <Github className="w-3 h-3" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © 2026 MetaBench. Metacritic for LLMs. All benchmark data sourced from publicly available evaluations.
                    </p>
                    <div className="flex gap-4">
                        <span className="text-xs text-gray-400 dark:text-gray-500">Built with FastAPI + React</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
