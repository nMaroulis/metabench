import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import SEO from '../components/SEO';

export default function SubmitPage() {
    const [form, setForm] = useState({
        model_name: '',
        benchmark_name: '',
        score: '',
        language: 'en',
        submitter: '',
        evidence_url: '',
        notes: '',
    });
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);

        try {
            const data = {
                ...form,
                score: parseFloat(form.score),
            };
            await api.submitCommunityScore(data);
            setStatus('success');
            setMessage('Your evaluation has been submitted for review. Thank you for contributing!');
            setForm({
                model_name: '',
                benchmark_name: '',
                score: '',
                language: 'en',
                submitter: '',
                evidence_url: '',
                notes: '',
            });
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const benchmarkOptions = [
        'MMLU', 'MMLU-Pro', 'GSM8K', 'MATH', 'HumanEval', 'MBPP',
        'BigBench-Hard', 'ARC-Challenge', 'HellaSwag', 'TruthfulQA', 'GPQA', 'IFEval', 'Other',
    ];

    return (
        <div className="page-container max-w-2xl">
            <SEO
                title="Submit Evaluation"
                description="Contribute your own LLM benchmark results to MetaBench. Help build the most comprehensive intelligence index for AI models."
            />
            <div className="mb-8">
                <h1 className="section-title flex items-center gap-3">
                    <Send className="w-8 h-8 text-brand-500" />
                    Submit Evaluation
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Contribute community benchmark scores to MetaBench
                </p>
            </div>

            {/* Status message */}
            {status && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-slide-down ${status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                    {status === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <p className="text-sm">{message}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-card p-8">
                <div className="space-y-6">
                    {/* Model name */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Model Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="model_name"
                            value={form.model_name}
                            onChange={handleChange}
                            placeholder="e.g., GPT-4o, Claude 3.5 Sonnet"
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Benchmark */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Benchmark <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="benchmark_name"
                            value={form.benchmark_name}
                            onChange={handleChange}
                            className="input-field appearance-none cursor-pointer"
                            required
                        >
                            <option value="">Select a benchmark...</option>
                            {benchmarkOptions.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* Score */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Score <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="score"
                            value={form.score}
                            onChange={handleChange}
                            placeholder="0-100"
                            step="0.1"
                            min="0"
                            max="100"
                            className="input-field"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">Normalized score on 0-100 scale</p>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Language</label>
                        <select
                            name="language"
                            value={form.language}
                            onChange={handleChange}
                            className="input-field appearance-none cursor-pointer"
                        >
                            {['en', 'zh', 'fr', 'de', 'es', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi', 'multi'].map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    {/* Submitter */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Your Name / Handle</label>
                        <input
                            type="text"
                            name="submitter"
                            value={form.submitter}
                            onChange={handleChange}
                            placeholder="anonymous"
                            className="input-field"
                        />
                    </div>

                    {/* Evidence URL */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Evidence URL</label>
                        <input
                            type="url"
                            name="evidence_url"
                            value={form.evidence_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="input-field"
                        />
                        <p className="text-xs text-gray-400 mt-1">Link to evaluation code, paper, or reproducible results</p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Any additional context about the evaluation..."
                            rows={4}
                            className="input-field resize-y"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Submitting...
                            </span>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit Evaluation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
