import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import BannerUploader from '../../components/events/BannerUploader';

export default function EventCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [regions, setRegions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectLabel, setProjectLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    region_id: '',
    location: '',
    project_id: '',
    start_date: '',
    end_date: '',
    capacity: '',
    status: 'PUBLISHED',
  });

  useEffect(() => {
    const fetchRegions = async () => {
      const res = await api.get('/regions/');
      setRegions(res.data || []);
    };
    const fetchProjects = async () => {
      const res = await api.get('/projects', { params: { skip: 0, limit: 100, sort: 'recent' } });
      setProjects(res.data || []);
    };
    fetchRegions();
    fetchProjects();
  }, []);

  useEffect(() => {
    const pid = searchParams.get('project_id');
    if (!pid) return;
    setForm((p) => ({ ...p, project_id: pid }));
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${pid}`);
        const pr = res.data;
        setProjectLabel(pr?.title || '');
        setForm((p) => ({
          ...p,
          project_id: pid,
          region_id: p.region_id || (pr?.region_id ? String(pr.region_id) : ''),
        }));
      } catch {
        setProjectLabel('');
      }
    };
    fetchProject();
  }, [searchParams]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 3 &&
      form.start_date &&
      form.end_date
    );
  }, [form.title, form.start_date, form.end_date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        region_id: form.region_id ? Number(form.region_id) : null,
        project_id: form.project_id ? form.project_id : null,
        location: form.location.trim() || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status || 'DRAFT',
      };
      const created = await api.post('/events', payload);
      const eventId = created.data.id;

      if (bannerFile) {
        const fd = new FormData();
        fd.append('file', bannerFile);
        await api.post(`/events/${eventId}/upload-banner`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate(`/events/${eventId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Créer un événement</h1>
          <p className="mt-2 text-gray-600">Ajoutez une bannière pour maximiser l’engagement.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-900 mb-4">Bannière</div>
            <BannerUploader value={bannerFile} onChange={setBannerFile} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Projet associé (optionnel)</label>
              <select
                value={form.project_id}
                onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="">{projectLabel ? `Projet sélectionné: ${projectLabel}` : 'Aucun'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {projectLabel && <div className="mt-1 text-xs text-gray-500">Pré-rempli depuis le projet.</div>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Titre</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Ex: Hackathon Climat Côte d’Ivoire"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Décrivez l’objectif, le public et le programme."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Région</label>
                <select
                  value={form.region_id}
                  onChange={(e) => setForm((p) => ({ ...p, region_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">Sélectionner</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lieu</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="Ex: Abidjan, Plateau"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Début</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fin</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Capacité (optionnel)</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  placeholder="Ex: 150"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="DRAFT">Brouillon</option>
                  <option value="PUBLISHED">Publié</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="px-4 py-2 rounded-lg bg-brand-orange text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
              >
                Créer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
