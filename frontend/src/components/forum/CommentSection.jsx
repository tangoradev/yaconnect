import React, { useState } from 'react';
import { Send, Reply } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const CommentSection = ({ post, comments, onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/forum/comments', {
        post_id: post.id,
        content: newComment
      });
      onCommentAdded(response.data);
      setNewComment('');
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Commentaires ({comments.length})
      </h3>

      <div className="mb-6">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all resize-none h-24"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="self-end px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
            <span>Envoyer</span>
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-sm">
                {comment.author?.first_name ? comment.author.first_name[0] : 'U'}
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-gray-900">
                    {comment.author?.first_name} {comment.author?.last_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
              </div>
              <div className="flex items-center gap-4 mt-1 ml-4 text-xs text-gray-500">
                <button className="hover:text-brand-blue flex items-center gap-1 transition-colors">
                  <Reply size={14} />
                  Répondre
                </button>
                {/* Add more actions like Like/Report if needed */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
