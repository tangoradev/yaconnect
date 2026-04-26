import React, { useEffect, useState } from 'react';
import { TrendingUp, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const TrendingPanel = () => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await api.get('/forum/trending');
      setTrending(response.data);
    } catch (error) {
      console.error("Failed to fetch trending", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-48 bg-gray-100 rounded-lg"></div>;
  if (!trending.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center space-x-2 mb-4 text-brand-orange">
        <TrendingUp size={20} />
        <h3 className="font-bold text-lg">Discussions Tendances</h3>
      </div>
      <div className="space-y-4">
        {trending.map((post) => (
          <Link key={post.id} to={`/forum/post/${post.id}`} className="block group">
            <h4 className="text-sm font-medium text-gray-900 group-hover:text-brand-blue line-clamp-2 transition-colors">
              {post.title || post.content.substring(0, 50) + "..."}
            </h4>
            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
              <span className="flex items-center">
                <MessageCircle size={12} className="mr-1" />
                {post.comments?.length || 0} comm.
              </span>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingPanel;
