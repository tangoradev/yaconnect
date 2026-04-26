import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, RefreshCw, ExternalLink, Archive, Star, Crown } from 'lucide-react';
import api from '../../services/api';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';

const statusOptions = [
  { value: '', label: 'Tous' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'IN_DISCUSSION', label: 'En discussion' },
  { value: 'COMMUNITY_VALIDATION', label: 'Validation' },
  { value: 'RECOMMENDED', label: 'Recommandé' },
  { value: 'AMBASSADOR_PROJECT', label: 'Projet Ambassadeur' },
  { value: 'ARCHIVED', label: 'Archivé' },
];

const sortOptions = [
  { value: 'recent', label: 'Récents' },
  { value: 'popularity', label: 'Popularité' },
  { value: 'trending', label: 'Tendance' },
];

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ region_id: '', status_filter: '', sort: 'recent' });

  const fetchRegions = async () => {
    const res = await api.get('/regions/');
    setRegions(res.data || []);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        skip: 0,
        limit: 100,
        sort: filters.sort,
      };
      if (filters.region_id) params.region_id = Number(filters.region_id);
      if (filters.status_filter) params.status_filter = filters.status_filter;
      const res = await api.get('/admin/projects', { params });
      setProjects(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [filters.region_id, filters.status_filter, filters.sort]);

  const regionNameById = useMemo(() => {
    const m = new Map();
    regions.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [regions]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const prob = (p.problem_statement || '').toLowerCase();
      return title.includes(term) || desc.includes(term) || prob.includes(term);
    });
  }, [projects, searchTerm]);

  const setStatus = async (projectId, status) => {
    setMutatingId(projectId);
    try {
      await api.put(`/admin/projects/${projectId}/status`, { status });
      await fetchProjects();
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Projets</h1>
          <p className="text-sm text-gray-600 mt-1">Validez, recommandez et archivez les projets issus du forum.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={fetchProjects}
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Statut</label>
            <select
              value={filters.status_filter}
              onChange={(e) => setFilters((p) => ({ ...p, status_filter: e.target.value }))}
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
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approbation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commentaires</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Chargement...</td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Aucun projet trouvé</td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{p.description || p.problem_statement}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {p.region_id ? regionNameById.get(p.region_id) || `Région ${p.region_id}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProjectStatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.total_votes || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {Math.round(p.approval_percentage || 0)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.comment_count || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/projects/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-gray-400 hover:text-brand-blue mx-2"
                        title="Voir"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, 'RECOMMENDED')}
                        disabled={mutatingId === p.id}
                        className="inline-flex items-center text-gray-400 hover:text-green-600 mx-2 disabled:opacity-60"
                        title="Recommander"
                      >
                        <Star size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, 'AMBASSADOR_PROJECT')}
                        disabled={mutatingId === p.id}
                        className="inline-flex items-center text-gray-400 hover:text-brand-orange mx-2 disabled:opacity-60"
                        title="Promouvoir Ambassadeur"
                      >
                        <Crown size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, 'ARCHIVED')}
                        disabled={mutatingId === p.id}
                        className="inline-flex items-center text-gray-400 hover:text-red-600 mx-2 disabled:opacity-60"
                        title="Archiver"
                      >
                        <Archive size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

