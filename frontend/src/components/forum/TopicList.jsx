import React, { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, Hash } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';

const TopicList = () => {
  const [topics, setTopics] = useState([]);
  const { topicId } = useParams();

  const fetchTopics = useCallback(async () => {
    try {
      const response = await api.get('/forum/topics');
      setTopics(response.data);
    } catch (error) {
      console.error("Failed to fetch topics", error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchTopics, 0);
    return () => clearTimeout(timeout);
  }, [fetchTopics]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-lg">Thèmes</h3>
        <button 
          onClick={() => { /* Logic to open topic creation modal */ }}
          className="p-1 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-2">
        <Link
          to="/forum"
          className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            !topicId 
              ? 'bg-brand-blue/10 text-brand-blue' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Hash size={18} className="mr-3 text-current opacity-70" />
          Tous les sujets
        </Link>

        {topics.map((topic) => (
          <Link
            key={topic.id}
            to={`/forum/topic/${topic.id}`}
            className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              topicId === topic.id
                ? 'bg-brand-blue/10 text-brand-blue'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Tag size={18} className="mr-3 text-current opacity-70" />
            <span className="truncate">{topic.title}</span>
            {topic.post_count > 0 && (
              <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                {topic.post_count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TopicList;
