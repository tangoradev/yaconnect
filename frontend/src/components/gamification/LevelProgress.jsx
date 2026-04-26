import React from 'react';

export default function LevelProgress({ summary }) {
  if (!summary) return null;
  const pct = Math.round((summary.progress_to_next_level || 0) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="font-semibold text-gray-900">Progression</div>
        {summary.next_level ? (
          <div className="text-gray-600">
            Prochain niveau: <span className="font-semibold">{summary.next_level}</span> ({summary.next_level_min_score} pts)
          </div>
        ) : (
          <div className="text-gray-600">Niveau max atteint</div>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-orange to-yellow-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-gray-500">{pct}% vers le prochain niveau</div>
    </div>
  );
}

