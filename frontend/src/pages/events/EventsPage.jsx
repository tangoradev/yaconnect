import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import EventCard from '../../components/events/EventCard';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ region_id: '' });

  const fetchRegions = async () => {
    const res = await api.get('/regions/');
    setRegions(res.data || []);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = { skip: 0, limit: 50 };
      if (filters.region_id) params.region_id = Number(filters.region_id);
      const res = await api.get('/events', { params });
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

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Événements</h1>
            <p className="mt-2 text-gray-600">Découvrez et rejoignez les événements de votre région.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/events/create" className="inline-flex items-center px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600">
              <Plus size={18} className="mr-2" />
              Créer un événement
            </Link>
            <button
              type="button"
              onClick={fetchEvents}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw size={18} className="mr-2" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
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
            <div className="md:col-span-2 flex items-end text-sm text-gray-600">
              {filters.region_id ? (
                <div>
                  Région sélectionnée : <span className="font-semibold">{regionNameById.get(Number(filters.region_id))}</span>
                </div>
              ) : (
                <div>Toutes les régions</div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
            Aucun événement pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

