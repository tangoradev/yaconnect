import React, { useState } from 'react';
import api from '../../services/api';

export default function ProjectComments({ projectId, comments = [], onCommented }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/comment`, { content });
      setContent('');
      onCommented?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="text-sm font-semibold text-gray-900 mb-3">Commentaires</div>

      <form onSubmit={submit} className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
          placeholder="Partagez vos suggestions, risques, partenaires..."
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
          >
            Publier
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-500">Aucun commentaire pour l’instant.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">
                {c.author_name || 'Membre'} · {new Date(c.created_at).toLocaleString()}
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

