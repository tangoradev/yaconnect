import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Plus, TrendingUp, Trophy } from 'lucide-react';
import api from '../../services/api';
import ProjectCard from '../../components/projects/ProjectCard';
import { useAuth } from '../../hooks/useAuth';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('all');
  const [filters, setFilters] = useState({ region_id: '', status: '', sort: 'recent' });
  const [suggestions, setSuggestions] = useState([]);

  const fetchRegions = async () => {
    const res = await api.get('/regions/');
    setRegions(res.data || []);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      if (mode === 'trending') {
        const res = await api.get('/projects/trending', { params: { limit: 20 } });
        setProjects(res.data || []);
        return;
      }
      if (mode === 'top') {
        const res = await api.get('/projects/top', { params: { limit: 20 } });
        setProjects(res.data || []);
        return;
      }

      const params = {
        skip: 0,
        limit: 20,
        sort: filters.sort,
      };
      if (filters.region_id) params.region_id = Number(filters.region_id);
      if (filters.status) params.status = filters.status;

      const res = await api.get('/projects/', { params });
      setProjects(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [mode, filters.region_id, filters.status, filters.sort]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      try {
        const res = await api.get('/forum/suggestions/projects', { params: { limit: 5 } });
        setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [user]);

  const statusOptions = useMemo(
    () => [
      { value: '', label: 'Tous' },
      { value: 'IN_DISCUSSION', label: 'En discussion' },
      { value: 'COMMUNITY_VALIDATION', label: 'Validation' },
      { value: 'RECOMMENDED', label: 'Recommandés' },
      { value: 'AMBASSADOR_PROJECT', label: 'Ambassadeur' },
      { value: 'ARCHIVED', label: 'Archivés' },
    ],
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Projets communautaires</h1>
          <p className="mt-2 text-gray-600">
            Transformez les idées en actions concrètes pour la Côte d’Ivoire.
          </p>
        </div>
        {user && (
          <Link
            to="/projects/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand-orange text-white font-bold hover:bg-orange-600 shadow-sm"
          >
            <Plus size={18} /> Soumettre un projet
          </Link>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            mode === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setMode('trending')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border inline-flex items-center gap-2 ${
            mode === 'trending' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          <TrendingUp size={16} /> Tendances
        </button>
        <button
          type="button"
          onClick={() => setMode('top')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border inline-flex items-center gap-2 ${
            mode === 'top' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          <Trophy size={16} /> Populaires
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tri</label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"
              disabled={mode !== 'all'}
            >
              <option value="recent">Récents</option>
              <option value="popularity">Popularité</option>
              <option value="trending">Tendance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {user && suggestions.length > 0 && (
          <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Idées du forum à fort potentiel</div>
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.post_id} className="flex items-start justify-between gap-4 border border-gray-100 rounded-lg p-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{s.title || 'Discussion'}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{s.excerpt}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Score {s.score} · {s.reactions} réactions · {s.comments} commentaires
                    </div>
                  </div>
                  {s.already_converted ? (
                    <Link to={`/projects/${s.project_id}`} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">
                      Voir le projet
                    </Link>
                  ) : (
                    <Link to={`/forum/post/${s.post_id}`} className="px-3 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700">
                      Convertir
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-600">
            Aucun projet trouvé.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
