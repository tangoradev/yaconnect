import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Image as ImageIcon, CalendarPlus } from 'lucide-react';
import api from '../../services/api';
import ProjectStatusBadge from './ProjectStatusBadge';
import ProjectVote from './ProjectVote';
import ProjectComments from './ProjectComments';

export default function ProjectDetail({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const backendOrigin = api.defaults.baseURL?.replace('/api/v1', '') || '';

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-40 bg-gray-100 rounded mb-6 animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => navigate(-1)} className="text-brand-orange font-semibold">
          Retour
        </button>
        <div className="mt-6 bg-white border border-gray-100 rounded-xl p-6">Projet introuvable.</div>
      </div>
    );
  }

  const images = (project.media || []).filter((m) => m.type === 'image');
  const documents = (project.media || []).filter((m) => m.type === 'document');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={18} /> Tous les projets
      </Link>

      <div className="mt-5 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{project.title}</h1>
            {project.description && <p className="mt-2 text-gray-600">{project.description}</p>}
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Problème</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.problem_statement}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Objectifs</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.objectives}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Médias</h2>

            {images.length === 0 && documents.length === 0 && !project.video_url ? (
              <div className="text-sm text-gray-500">Aucun média pour l’instant.</div>
            ) : (
              <div className="space-y-4">
                {images.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <ImageIcon size={16} /> Images
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {images.map((img) => (
                        <a
                          key={img.id}
                          href={`${backendOrigin}${img.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg overflow-hidden border border-gray-100"
                        >
                          <img
                            src={`${backendOrigin}${img.file_url}`}
                            alt="Project"
                            className="h-28 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {documents.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FileText size={16} /> Documents
                    </div>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={`${backendOrigin}${doc.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between text-sm border border-gray-100 rounded-lg p-3 hover:bg-gray-50"
                        >
                          <span className="truncate">{doc.file_url.split('/').pop()}</span>
                          <ExternalLink size={16} className="text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {project.video_url && (
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">Vidéo</div>
                    <a
                      href={project.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-brand-orange font-semibold"
                    >
                      Ouvrir la vidéo <ExternalLink size={16} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <ProjectComments projectId={project.id} comments={project.comments || []} onCommented={fetchProject} />
        </div>

        <div className="space-y-6">
          <ProjectVote project={project} onVoted={fetchProject} />

          <Link
            to={`/events/create?project_id=${project.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand-orange text-white font-semibold hover:bg-orange-600"
          >
            <CalendarPlus size={18} className="mr-2" />
            Créer un événement
          </Link>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">Statistiques</div>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span>Votes</span>
                <span className="font-semibold">{project.total_votes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Commentaires</span>
                <span className="font-semibold">{project.comment_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Budget</span>
                <span className="font-semibold">
                  {project.budget_estimate ? `${project.budget_estimate} FCFA` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Région</span>
                <span className="font-semibold">{project.region_id ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
