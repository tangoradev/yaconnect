import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Upload, Video, MapPin, DollarSign } from 'lucide-react';
import api from '../../services/api';

const steps = [
  { id: 1, label: 'Infos' },
  { id: 2, label: 'Impact' },
  { id: 3, label: 'Médias' },
  { id: 4, label: 'Validation' },
];

export default function ProjectWizard({ onCreated }) {
  const [step, setStep] = useState(1);
  const [regions, setRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    objectives: '',
    region_id: '',
    budget_estimate: '',
    partners_needed: '',
    video_url: '',
  });

  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      try {
        const res = await api.get('/regions/');
        setRegions(res.data || []);
      } finally {
        setLoadingRegions(false);
      }
    };
    fetchRegions();
  }, []);

  const progressPct = useMemo(() => ((step - 1) / (steps.length - 1)) * 100, [step]);

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const onChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const addImageFiles = (newFiles) => {
    const filtered = Array.from(newFiles).filter((f) => {
      if (!f.type.startsWith('image/')) return false;
      return f.size <= 10 * 1024 * 1024;
    });
    setFiles((p) => [...p, ...filtered]);
  };

  const addDocFiles = (newFiles) => {
    const filtered = Array.from(newFiles).filter((f) => f.size <= 20 * 1024 * 1024);
    setDocFiles((p) => [...p, ...filtered]);
  };

  const removeFile = (idx) => setFiles((p) => p.filter((_, i) => i !== idx));
  const removeDocFile = (idx) => setDocFiles((p) => p.filter((_, i) => i !== idx));

  const submit = async (status) => {
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        problem_statement: formData.problem_statement,
        objectives: formData.objectives,
        region_id: formData.region_id ? Number(formData.region_id) : null,
        budget_estimate: formData.budget_estimate ? Number(formData.budget_estimate) : null,
        partners_needed: formData.partners_needed || null,
        video_url: formData.video_url || null,
        status,
      };

      const created = await api.post('/projects/', payload);
      const projectId = created.data.id;

      for (const f of files) {
        const fd = new FormData();
        fd.append('media_type', 'image');
        fd.append('file', f);
        await api.post(`/projects/${projectId}/media`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      for (const f of docFiles) {
        const fd = new FormData();
        fd.append('media_type', 'document');
        fd.append('file', f);
        await api.post(`/projects/${projectId}/media`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      onCreated?.(created.data);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDraft = () => submit('DRAFT');
  const submitFinal = () => submit('IN_DISCUSSION');

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-brand-orange -translate-y-1/2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
          <div className="flex justify-between relative">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                  step >= s.id ? 'bg-brand-orange shadow-md' : 'bg-gray-300'
                }`}
              >
                {step > s.id ? <CheckCircle size={20} /> : s.id}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {steps.map((s) => (
              <span key={s.id}>{s.label}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            {step === 1 && 'Présentez votre projet'}
            {step === 2 && 'Impact et détails'}
            {step === 3 && 'Ajoutez des médias'}
            {step === 4 && 'Récapitulatif'}
          </h2>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="Ex: Recyclage plastique en pavés à Abidjan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <select
                      name="region_id"
                      value={formData.region_id}
                      onChange={onChange}
                      disabled={loadingRegions}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
                    >
                      <option value="">Sélectionner...</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget estimatif (FCFA)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      name="budget_estimate"
                      value={formData.budget_estimate}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description courte</label>
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="Résumé simple et engageant..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Problème à résoudre</label>
                <textarea
                  rows={4}
                  name="problem_statement"
                  value={formData.problem_statement}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Décrivez le problème dans votre communauté..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objectifs</label>
                <textarea
                  rows={4}
                  name="objectives"
                  value={formData.objectives}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Quels résultats concrets et mesurables ?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partenaires recherchés</label>
                <textarea
                  rows={3}
                  name="partners_needed"
                  value={formData.partners_needed}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Collectivités, ONG, entreprises, écoles..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Images (max 10 Mo)</div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                  <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                  <div className="text-gray-700 font-medium mb-1">Ajoutez des images</div>
                  <div className="text-sm text-gray-500 mb-4">JPEG, PNG, GIF, WEBP…</div>
                  <input type="file" accept="image/*" multiple onChange={(e) => addImageFiles(e.target.files)} />
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg p-2">
                        <span className="truncate">{f.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-brand-orange font-semibold">
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Documents (max 20 Mo)</div>
                <input type="file" multiple onChange={(e) => addDocFiles(e.target.files)} />
                {docFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {docFiles.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg p-2">
                        <span className="truncate">{f.name}</span>
                        <button type="button" onClick={() => removeDocFile(idx)} className="text-brand-orange font-semibold">
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lien vidéo (optionnel)</label>
                <div className="relative">
                  <Video size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Titre</div>
                    <div className="font-semibold">{formData.title || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Région</div>
                    <div className="font-semibold">
                      {regions.find((r) => String(r.id) === String(formData.region_id))?.name || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Budget</div>
                    <div className="font-semibold">{formData.budget_estimate ? `${formData.budget_estimate} FCFA` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Médias</div>
                    <div className="font-semibold">{files.length + docFiles.length} fichiers</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
                En publiant, votre projet passe en discussion et peut être validé par la communauté via les votes.
              </div>
            </div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center text-gray-600 hover:text-gray-900 font-medium px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" /> Retour
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center bg-brand-orange text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-md"
              >
                Suivant <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitDraft}
                  className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-60"
                >
                  Enregistrer brouillon
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitFinal}
                  className="flex items-center bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md disabled:opacity-60"
                >
                  Publier <CheckCircle size={18} className="ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
