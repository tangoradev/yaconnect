import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PostCard from '../../components/forum/PostCard';
import CreatePostModal from '../../components/forum/CreatePostModal';
import api from '../../services/api';

const ForumPage = () => {
  const { topicId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [topicId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = topicId ? `/forum/posts?topic_id=${topicId}` : '/forum/posts';
      const response = await api.get(url);
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
           {topicId ? 'Discussions du thème' : 'Fil d\'actualité'}
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nouvelle Discussion
        </button>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPostCreated={fetchPosts}
        defaultTopicId={topicId}
      />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Plus size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900">Aucune discussion trouvée</h3>
          <p className="mt-2 text-gray-500 mb-6">Soyez le premier à lancer la conversation !</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-brand-orange font-medium hover:underline"
          >
            Créer une discussion
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumPage;
