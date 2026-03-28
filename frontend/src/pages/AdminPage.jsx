import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import SEO from '../components/SEO';

const AVAILABLE_SECTIONS = [
  'Core Model Identity', 'Model Size',
  'Transformer Architecture', 'Attention Architecture', 'Positional Encoding', 'Feed Forward Network Details',
  'Context Window', 'Tokenization', 'Inference Characteristics',
  'Training Dataset', 'Training Process', 'Post-Training',
  'Quantization Support', 'Hardware Requirements', 'System / Infrastructure', 'Safety / Alignment'
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem('metabench_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!adminKey);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [formData, setFormData] = useState(null);
  const [editMode, setEditMode] = useState('form');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotFileName, setSnapshotFileName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadModels();
    }
  }, [isAuthenticated]);

  const loadModels = async () => {
    try {
      const data = await api.getModels({ limit: 500 });
      setModels(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load models list.' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminKey.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await api.verifyAdminKey(adminKey.trim());
      sessionStorage.setItem('metabench_admin_key', adminKey.trim());
      setIsAuthenticated(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Wrong code. Please try again in 3 seconds.' });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        setLoading(false);
      }, 3000);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('metabench_admin_key');
    setAdminKey('');
    setIsAuthenticated(false);
    setSelectedModel(null);
    setFormData(null);
    setJsonText('');
    setEditMode('form');
    setJsonError('');
    setSnapshotBusy(false);
    setSnapshotFileName('');
  };

  const downloadAdminSnapshot = async () => {
    setSnapshotBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const snapshot = await api.exportAdminSnapshot(adminKey);
      const exportedAt = snapshot.exported_at ? new Date(snapshot.exported_at) : new Date();
      const safeDate = exportedAt.toISOString().replace(/[:.]/g, '-');
      const fileName = `metabench_snapshot_${safeDate}.json`;

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Snapshot downloaded.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to download snapshot.' });
    } finally {
      setSnapshotBusy(false);
    }
  };

  const handleSnapshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSnapshotFileName(file.name);
    setSnapshotBusy(true);
    setMessage({ type: '', text: '' });

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await api.importAdminSnapshot(parsed, adminKey);
      setMessage({ type: 'success', text: `Snapshot imported. ${result?.result ? 'Done.' : ''}` });
      await loadModels();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to import snapshot.' });
    } finally {
      setSnapshotBusy(false);
      e.target.value = '';
    }
  };

  const handleSelectModel = async (e) => {
    const modelName = e.target.value;
    if (!modelName) {
      setSelectedModel(null);
      setFormData(null);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const modelDetail = await api.getModelDetail(modelName);
      setSelectedModel(modelDetail);
      
        // Flatten technical details into flat array of specs
        const initialTechSpecs = [];
        if (modelDetail.technical_details) {
          modelDetail.technical_details.forEach(sec => {
            if (sec.facts) {
              sec.facts.forEach(fact => {
                initialTechSpecs.push({
                  section: sec.title,
                  label: fact.label || '',
                  value: fact.value || ''
                });
              });
            }
          });
        }

        const newFormData = {
          name: modelDetail.name || '',
          slug: modelDetail.slug || '',
          provider: modelDetail.provider || '',
          model_creator_slug: modelDetail.model_creator_slug || '',
          description: modelDetail.description || '',
          parameters: modelDetail.parameters || '',
          architecture: modelDetail.architecture || '',
          license_type: modelDetail.license_type || '',
          release_date: modelDetail.release_date || '',
          pricing: {
            cost_per_1m_input_tokens: modelDetail.pricing?.cost_per_1m_input_tokens ?? '',
            cost_per_1m_output_tokens: modelDetail.pricing?.cost_per_1m_output_tokens ?? '',
            cost_per_1m_blended: modelDetail.pricing?.cost_per_1m_blended ?? ''
          },
          performance: {
            median_output_tokens_per_second: modelDetail.performance?.median_output_tokens_per_second ?? '',
            median_ttft_seconds: modelDetail.performance?.median_ttft_seconds ?? '',
            median_ttfa_seconds: modelDetail.performance?.median_ttfa_seconds ?? '',
            avg_latency_ms: modelDetail.performance?.avg_latency_ms ?? '',
            context_window: modelDetail.performance?.context_window ?? ''
          },
          technical_specs: initialTechSpecs,
          benchmark_scores: modelDetail.scores ? modelDetail.scores.map(s => ({
            benchmark_id: s.benchmark_id,
            benchmark_name: s.benchmark_name,
            raw_score: s.raw_score ?? '',
            normalized_score: s.normalized_score ?? ''
          })) : []
        };
        
        setFormData(newFormData);
        setJsonText(JSON.stringify(newFormData, null, 2));
        setEditMode('form');
        setJsonError('');

    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load model details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;
    const finalValue = value === '' ? null : value;
    
    setFormData(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [name]: finalValue !== null ? Number(finalValue) : null
          }
        };
      }
      return { ...prev, [name]: finalValue };
    });
  };

  const handleModeToggle = (mode) => {
    if (mode === 'form' && editMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText);
        setFormData(parsed);
        setJsonError('');
        setEditMode('form');
      } catch (err) {
        setJsonError('Invalid JSON format. Please fix errors before switching back to form view.');
        return;
      }
    } else if (mode === 'json' && editMode === 'form') {
      setJsonText(JSON.stringify(formData, null, 2));
      setEditMode('json');
      setJsonError('');
    }
  };

  const handleTechSpecChange = (index, field, value) => {
    setFormData(prev => {
      const newSpecs = [...prev.technical_specs];
      newSpecs[index] = { ...newSpecs[index], [field]: value };
      return { ...prev, technical_specs: newSpecs };
    });
  };

  const handleBenchmarkScoreChange = (index, field, value) => {
    setFormData(prev => {
      const newScores = [...prev.benchmark_scores];
      newScores[index] = { ...newScores[index], [field]: value !== '' ? Number(value) : null };
      return { ...prev, benchmark_scores: newScores };
    });
  };

  const addTechSpec = () => {
    setFormData(prev => ({
      ...prev,
      technical_specs: [...prev.technical_specs, { section: '', label: '', value: '' }]
    }));
  };

  const removeTechSpec = (index) => {
    setFormData(prev => {
      const newSpecs = [...prev.technical_specs];
      newSpecs.splice(index, 1);
      return { ...prev, technical_specs: newSpecs };
    });
  };

  const handleDeleteModel = async () => {
    if (!selectedModel) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedModel.name}"? This action cannot be undone and will remove all associated scores and metadata.`);
    if (!confirmDelete) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.deleteModel(selectedModel.id, adminKey);
      setMessage({ type: 'success', text: `Model "${selectedModel.name}" deleted successfully.` });
      setSelectedModel(null);
      setFormData(null);
      await loadModels();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete model.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModel) return;

    let currentData = formData;

    if (editMode === 'json') {
      try {
        currentData = JSON.parse(jsonText);
        setFormData(currentData);
        setJsonError('');
      } catch (err) {
        setJsonError('Invalid JSON format. Cannot save changes.');
        return;
      }
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    // Clean up empty strings to nulls
    const cleanData = JSON.parse(JSON.stringify(currentData));
    ['pricing', 'performance'].forEach(section => {
      if (cleanData[section]) {
        Object.keys(cleanData[section]).forEach(key => {
          if (cleanData[section][key] === '') {
            cleanData[section][key] = null;
          }
        });
      }
    });

    if (cleanData.technical_specs) {
      cleanData.technical_specs = cleanData.technical_specs.filter(
        spec => spec.section.trim() !== '' && spec.label.trim() !== '' && spec.value.trim() !== ''
      );
    }

    if (cleanData.benchmark_scores) {
      cleanData.benchmark_scores = cleanData.benchmark_scores.map(score => ({
        benchmark_id: score.benchmark_id,
        raw_score: score.raw_score !== '' && score.raw_score !== null ? Number(score.raw_score) : null,
        normalized_score: score.normalized_score !== '' && score.normalized_score !== null ? Number(score.normalized_score) : null
      }));
    }

    try {
      await api.updateModel(selectedModel.id, cleanData, adminKey);
      setMessage({ type: 'success', text: 'Model updated successfully!' });
      // Refresh model detail
      const updatedMockEvent = { target: { value: selectedModel.name } };
      await handleSelectModel(updatedMockEvent);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update model.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <SEO title="Admin Login | MetaBench" />
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Admin Access</h2>
        <form onSubmit={handleLogin}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Admin Secret Key
          </label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 mb-4 disabled:opacity-50"
            placeholder="Enter key to access updates"
            required
          />
          {message.text && message.type === 'error' && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm">
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-10 p-6">
      <SEO title="Admin Console | MetaBench" />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Console</h1>
        <button 
          onClick={handleLogout}
          className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-1 px-3 rounded"
        >
          Logout
        </button>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={downloadAdminSnapshot}
              disabled={snapshotBusy || loading}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {snapshotBusy ? 'Working...' : 'Download Snapshot JSON'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700 disabled:opacity-50">
              Upload Snapshot JSON
              <input
                type="file"
                accept="application/json"
                onChange={handleSnapshotUpload}
                disabled={snapshotBusy || loading}
                className="hidden"
              />
            </label>
            {snapshotFileName && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[260px]" title={snapshotFileName}>
                {snapshotFileName}
              </div>
            )}
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Model to Update
        </label>
        <select
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          value={selectedModel?.name || ''}
          onChange={handleSelectModel}
        >
          <option value="">-- Choose a Model --</option>
          {models.map(m => (
            <option key={m.id} value={m.name}>{m.name} ({m.provider})</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-center py-10 dark:text-gray-300">Loading...</div>}

      {!loading && formData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => handleModeToggle('form')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${editMode === 'form' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                Form Editor
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('json')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${editMode === 'json' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                Raw JSON
              </button>
            </div>
          </div>

          {jsonError && (
            <div className="p-3 mb-6 text-sm text-red-600 bg-red-100 border border-red-200 rounded-lg">
              {jsonError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {editMode === 'form' ? (
              <>
                {/* Basic Info */}
                <section>
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Name</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Provider</label>
                <input type="text" name="provider" value={formData.provider || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Parameters (e.g. 70B)</label>
                <input type="text" name="parameters" value={formData.parameters || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Architecture</label>
                <input type="text" name="architecture" value={formData.architecture || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white h-24" />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Pricing (per 1M tokens)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Input Tokens ($)</label>
                <input type="number" step="0.0001" name="cost_per_1m_input_tokens" value={formData.pricing.cost_per_1m_input_tokens ?? ''} onChange={e => handleInputChange(e, 'pricing')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Output Tokens ($)</label>
                <input type="number" step="0.0001" name="cost_per_1m_output_tokens" value={formData.pricing.cost_per_1m_output_tokens ?? ''} onChange={e => handleInputChange(e, 'pricing')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Blended ($)</label>
                <input type="number" step="0.0001" name="cost_per_1m_blended" value={formData.pricing.cost_per_1m_blended ?? ''} onChange={e => handleInputChange(e, 'pricing')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
            </div>
          </section>

          {/* Performance */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Output tokens parsing (sec)</label>
                <input type="number" step="0.01" name="median_output_tokens_per_second" value={formData.performance.median_output_tokens_per_second ?? ''} onChange={e => handleInputChange(e, 'performance')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Context Window</label>
                <input type="number" step="1" name="context_window" value={formData.performance.context_window ?? ''} onChange={e => handleInputChange(e, 'performance')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Median TTFT (sec)</label>
                <input type="number" step="0.01" name="median_ttft_seconds" value={formData.performance.median_ttft_seconds ?? ''} onChange={e => handleInputChange(e, 'performance')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Latency (ms)</label>
                <input type="number" step="1" name="avg_latency_ms" value={formData.performance.avg_latency_ms ?? ''} onChange={e => handleInputChange(e, 'performance')} className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
              </div>
            </div>
          </section>

          {/* Technical Specs */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Technical Specifications</h2>
              <button 
                type="button" 
                onClick={addTechSpec} 
                className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60 px-3 py-1.5 rounded transition-colors font-medium flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span> Add Spec
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.technical_specs?.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  No technical specifications yet. Click "Add Spec" to add one.
                </div>
              ) : (
                formData.technical_specs?.map((spec, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-start bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700/50">
                    <div className="w-full md:w-1/3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Section</label>
                      <select 
                        value={spec.section} 
                        onChange={(e) => handleTechSpecChange(idx, 'section', e.target.value)}
                        className="w-full px-3 py-2 text-sm border bg-white rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      >
                        <option value="">-- Select Section --</option>
                        {AVAILABLE_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    
                    <div className="w-full md:w-1/3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Total Parameters" 
                        value={spec.label} 
                        onChange={(e) => handleTechSpecChange(idx, 'label', e.target.value)} 
                        className="w-full px-3 py-2 text-sm border bg-white rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" 
                      />
                    </div>
                    
                    <div className="w-full md:w-1/3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Value</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 70B" 
                        value={spec.value} 
                        onChange={(e) => handleTechSpecChange(idx, 'value', e.target.value)} 
                        className="w-full px-3 py-2 text-sm border bg-white rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white" 
                      />
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => removeTechSpec(idx)} 
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 mt-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded self-start md:self-auto"
                      title="Remove Spec"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Benchmark Scores */}
          {formData.benchmark_scores && formData.benchmark_scores.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Benchmark Scores</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.benchmark_scores.map((score, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700/50 flex flex-col justify-between">
                    <h3 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200 line-clamp-2" title={score.benchmark_name}>
                      {score.benchmark_name}
                    </h3>
                    <div className="flex gap-3">
                      <div className="w-1/2">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Raw</label>
                        <input 
                          type="number" 
                          step="any"
                          value={score.raw_score ?? ''} 
                          onChange={(e) => handleBenchmarkScoreChange(idx, 'raw_score', e.target.value)} 
                          className="w-full px-2 py-1.5 text-sm border bg-white rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Norm (0-100)</label>
                        <input 
                          type="number" 
                          step="any"
                          value={score.normalized_score ?? ''} 
                          onChange={(e) => handleBenchmarkScoreChange(idx, 'normalized_score', e.target.value)} 
                          className="w-full px-2 py-1.5 text-sm border bg-white rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
              </>
            ) : (
              <section className="mt-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Edit the model's raw JSON payload directly.
                </label>
                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setJsonError('');
                  }}
                  className="w-full h-[600px] p-4 font-mono text-sm border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500"
                  spellCheck="false"
                />
              </section>
            )}

            <div className="pt-4 border-t dark:border-gray-700 flex justify-between items-center">
              <button
                type="button"
                onClick={handleDeleteModel}
                disabled={loading}
                className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                Delete Model
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
