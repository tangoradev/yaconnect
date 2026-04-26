import React from 'react';
import { Award } from 'lucide-react';

export default function BadgeGrid({ badges = [] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="text-sm font-semibold text-gray-900 mb-3">Badges</div>
      {badges.length === 0 ? (
        <div className="text-sm text-gray-500">Aucun badge pour l’instant.</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {badges.map((b) => (
            <div key={b.id || b.name} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                <Award size={26} />
              </div>
              <div className="mt-2 text-xs font-semibold text-gray-700 max-w-[90px] truncate">{b.name}</div>
              {b.earned_at && <div className="text-[10px] text-gray-400">{new Date(b.earned_at).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

