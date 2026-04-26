import React from 'react';
import { Star, Trophy, MapPin } from 'lucide-react';

export default function ScoreDisplay({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Score</div>
          <div className="text-3xl font-extrabold text-gray-900">{summary.score} pts</div>
          <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold bg-blue-50 text-brand-blue px-3 py-1 rounded-full">
            <Star size={16} /> Niveau {summary.level}
          </div>
        </div>
        <div className="text-right text-sm text-gray-600 space-y-2">
          <div className="inline-flex items-center gap-2">
            <Trophy size={16} className="text-brand-orange" />
            <span>Rang global: {summary.rank_global ?? '—'}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-gray-500" />
            <span>Rang régional: {summary.rank_region ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

