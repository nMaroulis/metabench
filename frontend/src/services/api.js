const API_BASE = (import.meta.env.VITE_BACKEND_ADDRESS || 'http://localhost:8080') + '/api';

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export const api = {
    // Models
    getModels: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchJSON(`${API_BASE}/models${query ? '?' + query : ''}`);
    },

    getModelDetail: (modelName) =>
        fetchJSON(`${API_BASE}/models/${encodeURIComponent(modelName)}`),

    updateModel: async (modelId, data, adminKey) => {
        const response = await fetch(`${API_BASE}/admin/update-model/${modelId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminKey}`
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Update error: ${response.status}`);
        }
        return response.json();
    },

    // Benchmarks
    getBenchmarks: (modelName = null) => {
        const query = modelName ? `?model=${encodeURIComponent(modelName)}` : '';
        return fetchJSON(`${API_BASE}/benchmarks${query}`);
    },

    // Compare
    compareModels: (modelNames) =>
        fetchJSON(`${API_BASE}/compare?models=${modelNames.map(encodeURIComponent).join(',')}`),

    // Leaderboard
    getLeaderboard: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchJSON(`${API_BASE}/leaderboard${query ? '?' + query : ''}`);
    },

    // Export
    exportData: (format = 'json') =>
        fetchJSON(`${API_BASE}/export?format=${format}`),

    exportCSV: () =>
        fetch(`${API_BASE}/export?format=csv`).then(r => r.text()),

    // Community
    submitCommunityScore: async (data) => {
        const response = await fetch(`${API_BASE}/community/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Submit error: ${response.status}`);
        return response.json();
    },

    getCommunitySubmissions: (status = null) => {
        const query = status ? `?status=${status}` : '';
        return fetchJSON(`${API_BASE}/community/submissions${query}`);
    },

    // Stats
    getStats: () => fetchJSON(`${API_BASE}/stats`),
};

export default api;
