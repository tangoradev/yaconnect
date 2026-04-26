import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import api from '../../services/api';

export default function ProjectVote({ project, onVoted }) {
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType) => {
    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/vote`, { vote_type: voteType });
      onVoted?.();
    } finally {
      setLoading(false);
    }
  };

  const approval = Math.round(project.approval_percentage || 0);
  const support = project.support_votes || 0;
  const oppose = project.oppose_votes || 0;
  const total = project.total_votes || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Validation communautaire</div>
        <div className="text-xs text-gray-500">{total} votes</div>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden mb-3">
        <div className="h-full bg-green-500" style={{ width: `${approval}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <span>Approbation: {approval}%</span>
        <span>Soutiens: {support} · Oppositions: {oppose}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleVote('support')}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-60"
        >
          <ThumbsUp size={18} />
          Soutenir
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleVote('oppose')}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
        >
          <ThumbsDown size={18} />
          S'opposer
        </button>
      </div>
    </div>
  );
}

