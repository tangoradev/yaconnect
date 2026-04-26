import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, MessageSquare } from 'lucide-react';
import ProjectStatusBadge from './ProjectStatusBadge';

export default function ProjectCard({ project }) {
  const approval = Math.round(project.approval_percentage || 0);
  const votes = project.total_votes || 0;
  const comments = project.comment_count || 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">{project.title}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{project.description}</p>
          )}
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1">
          <MapPin size={16} />
          <span>Région {project.region_id ?? '—'}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp size={16} />
          <span>{votes} votes</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare size={16} />
          <span>{comments} commentaires</span>
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Approbation</span>
          <span>{approval}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-brand-orange" style={{ width: `${approval}%` }} />
        </div>
      </div>
    </Link>
  );
}

