import React, { useState } from 'react';
import { MessageCircle, Share2, MoreVertical, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactionBar from './ReactionBar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const PostCard = ({ post }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`);
    alert('Lien copié dans le presse-papier !');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold border border-brand-blue/20">
            {post.author?.first_name ? post.author.first_name[0] : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900">
                {post.author?.first_name} {post.author?.last_name}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {post.author?.community_level || 'Explorateur'}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}</span>
              {post.topic && (
                <>
                  <span>•</span>
                  <span className="text-brand-orange font-medium">{post.topic.title}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100 py-1">
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Flag size={16} className="mr-2" />
                Signaler
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {post.title && <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>}
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.media_url && (
          <img 
            src={post.media_url} 
            alt="Post media" 
            className="mt-4 rounded-lg max-h-96 w-full object-cover"
          />
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <ReactionBar post={post} />
          
          <Link 
            to={`/forum/post/${post.id}`}
            className="flex items-center space-x-2 text-gray-500 hover:text-brand-blue transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.comments?.length || 0}</span>
          </Link>
        </div>

        <button 
          onClick={handleShare}
          className="flex items-center space-x-2 text-gray-500 hover:text-brand-blue transition-colors"
        >
          <Share2 size={20} />
          <span className="text-sm font-medium hidden sm:inline">Partager</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
