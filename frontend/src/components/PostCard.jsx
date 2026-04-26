import React from 'react';
import { MessageSquare, Share2, ThumbsUp, MoreHorizontal, Leaf, Award } from 'lucide-react';

const PostCard = ({ author, time, content, tags, likes, comments, isAmbassador }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 mb-4 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src={author.avatar || `https://ui-avatars.com/api/?name=${author.name}&background=random`} alt={author.name} className="w-10 h-10 rounded-full object-cover" />
            {isAmbassador && (
              <div className="absolute -bottom-1 -right-1 bg-brand-orange text-white text-[10px] px-1 rounded-full border border-white">
                Ambassadeur
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{author.name}</h4>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium hover:bg-brand-blue/10 hover:text-brand-blue transition-colors cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex space-x-6">
          <button className="flex items-center space-x-2 text-gray-500 hover:text-brand-orange transition-colors group">
            <ThumbsUp size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm">{likes}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 hover:text-brand-blue transition-colors group">
            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm">{comments}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors group" title="Impact Validé">
            <Leaf size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm">Pertinent</span>
          </button>
        </div>
        <button className="text-gray-400 hover:text-brand-blue transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
