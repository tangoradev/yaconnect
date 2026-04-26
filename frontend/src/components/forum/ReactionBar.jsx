import React, { useState } from 'react';
import { ThumbsUp, Lightbulb, Leaf, Heart, Star } from 'lucide-react';
import api from '../../services/api';

const REACTION_TYPES = {
  PERTINENT: { icon: ThumbsUp, label: 'Pertinent', color: 'text-blue-500', bg: 'bg-blue-50' },
  INNOVATIVE: { icon: Lightbulb, label: 'Innovant', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ENVIRONMENTAL_IMPACT: { icon: Leaf, label: 'Impact', color: 'text-green-500', bg: 'bg-green-50' },
  SOLIDARITY: { icon: Heart, label: 'Solidaire', color: 'text-red-500', bg: 'bg-red-50' },
  INSPIRING: { icon: Star, label: 'Inspirant', color: 'text-purple-500', bg: 'bg-purple-50' },
};

const ReactionBar = ({ post, onReactionChange }) => {
  const [loading, setLoading] = useState(false);

  const handleReaction = async (type) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.post('/forum/reactions', {
        post_id: post.id,
        reaction_type: type
      });
      if (onReactionChange) onReactionChange(response.data);
    } catch (error) {
      console.error("Failed to react", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to count reactions locally (simplified)
  // ideally this data comes from backend aggregation
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(REACTION_TYPES).map(([type, config]) => {
        const Icon = config.icon;
        const isSelected = post.user_reaction === type;
        
        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              isSelected ? `${config.color} ${config.bg} border border-current` : 'text-gray-500 hover:bg-gray-100 border border-transparent'
            }`}
            disabled={loading}
          >
            <Icon size={14} />
            <span>{config.label}</span>
            {/* <span>{post.reaction_counts?.[type] || 0}</span> */}
          </button>
        );
      })}
    </div>
  );
};

export default ReactionBar;
