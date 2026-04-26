import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PostCard from '../../components/forum/PostCard';
import CommentSection from '../../components/forum/CommentSection';
import api from '../../services/api';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  const fetchPostAndComments = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/forum/posts/${postId}`),
        api.get(`/forum/posts/${postId}/comments`)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error("Failed to fetch post", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments([...comments, newComment]);
  };

  const handleConvert = async () => {
    if (!user) return;
    setConverting(true);
    try {
      const res = await api.post(`/projects/convert-from-post/${postId}`);
      navigate(`/projects/${res.data.id}`);
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl"></div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/forum" className="flex items-center text-gray-500 hover:text-brand-orange mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Retour au forum
      </Link>

      {user && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleConvert}
            disabled={converting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            Convertir en projet
          </button>
        </div>
      )}
      
      <PostCard post={post} />
      
      <CommentSection 
        post={post} 
        comments={comments} 
        onCommentAdded={handleCommentAdded} 
      />
    </div>
  );
};

export default PostPage;
