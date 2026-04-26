import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, MapPin, RefreshCw, UploadCloud, Trash2, ExternalLink, Filter, Plus } from 'lucide-react';
import api, { API_ORIGIN } from '../../services/api';

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState(null);
  const [filters, setFilters] = useState({ region_id: '' });
  const fileInputRefs = useRef({});

  const fetchRegions = async () => {
    const res = await api.get('/regions/');
    setRegions(res.data || []);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = { skip: 0, limit: 100 };
      if (filters.region_id) params.region_id = Number(filters.region_id);
      const res = await api.get('/admin/events', { params });
      setEvents(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters.region_id]);

  const regionNameById = useMemo(() => {
    const m = new Map();
    regions.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [regions]);

  const uploadBanner = async (eventId, file) => {
    if (!file) return;
    setMutatingId(eventId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/events/${eventId}/upload-banner`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchEvents();
    } finally {
      setMutatingId(null);
    }
  };

  const deleteBanner = async (eventId) => {
    const ok = window.confirm('Supprimer la bannière ?');
    if (!ok) return;
    setMutatingId(eventId);
    try {
      await api.delete(`/events/${eventId}/banner`);
      await fetchEvents();
    } finally {
      setMutatingId(null);
    }
  };

  const pickFile = (eventId) => {
    if (!fileInputRefs.current[eventId]) return;
    fileInputRefs.current[eventId].click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Événements</h1>
          <p className="text-sm text-gray-600 mt-1">Bannières, publication et suivi des inscriptions.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/events/create"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600"
          >
            <Plus size={18} className="mr-2" />
            Créer
          </a>
          <button
            type="button"
            onClick={fetchEvents}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw size={18} className="mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <Filter size={16} /> Filtres
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Région</label>
            <select
              value={filters.region_id}
              onChange={(e) => setFilters((p) => ({ ...p, region_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"
            >
              <option value="">Toutes</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bannière</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscriptions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Chargement...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Aucun événement</td>
                </tr>
              ) : (
                events.map((e) => {
                  const banner = e.banner_url ? (e.banner_url.startsWith('/static/') ? `${API_ORIGIN}${e.banner_url}` : e.banner_url) : null;
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-28 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          {banner ? (
                            <img src={banner} alt={e.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-sky-500 via-brand-orange to-yellow-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{e.title}</div>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span className="inline-flex items-center gap-1"><Calendar size={14} /> {new Date(e.start_date).toLocaleDateString('fr-FR')}</span>
                            {e.location && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {e.location}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {e.region_id ? regionNameById.get(e.region_id) || `Région ${e.region_id}` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {e.registrations_count || 0}
                        {e.capacity ? ` / ${e.capacity}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={`/events/${e.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-gray-400 hover:text-brand-blue mx-2"
                          title="Voir"
                        >
                          <ExternalLink size={18} />
                        </a>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          ref={(el) => {
                            fileInputRefs.current[e.id] = el;
                          }}
                          className="hidden"
                          onChange={(ev) => uploadBanner(e.id, ev.target.files?.[0])}
                        />
                        <button
                          type="button"
                          onClick={() => pickFile(e.id)}
                          disabled={mutatingId === e.id}
                          className="inline-flex items-center text-gray-400 hover:text-brand-orange mx-2 disabled:opacity-60"
                          title="Uploader bannière"
                        >
                          <UploadCloud size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteBanner(e.id)}
                          disabled={mutatingId === e.id}
                          className="inline-flex items-center text-gray-400 hover:text-red-600 mx-2 disabled:opacity-60"
                          title="Supprimer bannière"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

