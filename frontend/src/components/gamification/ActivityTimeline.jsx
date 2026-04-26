import React from 'react';

const label = (action) => {
  const map = {
    FORUM_POST_CREATE: 'Post publié',
    FORUM_COMMENT_CREATE: 'Commentaire publié',
    FORUM_REACTION_CAST: 'Réaction donnée',
    PROJECT_SUBMIT: 'Projet soumis',
    PROJECT_VOTE_CAST: 'Vote projet',
    PROJECT_VOTE_SUPPORT: 'Soutien projet',
    PROJECT_COMMENT_CREATE: 'Commentaire projet',
    PROJECT_RECOMMENDED: 'Projet recommandé',
    MISSION_COMPLETED: 'Mission complétée',
    AMBASSADOR_ASSIGNED: 'Ambassadeur',
  };
  return map[action] || action;
};

export default function ActivityTimeline({ activity = [] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="text-sm font-semibold text-gray-900 mb-3">Historique</div>
      {activity.length === 0 ? (
        <div className="text-sm text-gray-500">Aucune activité enregistrée.</div>
      ) : (
        <div className="space-y-3">
          {activity.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 border border-gray-100 rounded-lg p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{label(a.action_type)}</div>
                <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <div className={`text-sm font-bold ${a.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {a.points >= 0 ? `+${a.points}` : a.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

