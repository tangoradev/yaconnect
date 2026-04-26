import React, { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, defaultTopicId }) => {
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic_id: defaultTopicId || '',
    media_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTopics();
      if (defaultTopicId) {
        setFormData(prev => ({ ...prev, topic_id: defaultTopicId }));
      }
    }
  }, [isOpen, defaultTopicId]);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const response = await api.get('/forum/topics');
      setTopics(response.data);
      if (response.data.length > 0 && !formData.topic_id && !defaultTopicId) {
        setFormData(prev => ({ ...prev, topic_id: response.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch topics", error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 10 Mo.");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('topic_id', formData.topic_id);
      
      if (selectedFile) {
        data.append('file', selectedFile);
      } else if (formData.media_url) {
        data.append('media_url', formData.media_url);
      }

      await api.post('/forum/posts', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      onPostCreated();
      onClose();
      setFormData({ title: '', content: '', topic_id: '', media_url: '' });
      removeFile();
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle Discussion</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Topic Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thème</label>
            <select
              value={formData.topic_id}
              onChange={(e) => setFormData({...formData, topic_id: e.target.value})}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              required
              disabled={loadingTopics}
            >
              <option value="" disabled>Choisir un thème</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.title}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la discussion</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              placeholder="Sujet principal..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full rounded-lg border-gray-300 border p-2 min-h-[150px] focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              placeholder="Partagez votre idée ou question..."
              required
            />
          </div>

          {/* Image Upload */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optionnel)</label>
             
             {!previewUrl ? (
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                 <input
                   type="file"
                   accept="image/*"
                   onChange={handleFileChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="flex flex-col items-center justify-center text-gray-500">
                   <ImageIcon size={24} className="mb-2" />
                   <span className="text-sm">Cliquez pour ajouter une image (Max 10Mo)</span>
                 </div>
               </div>
             ) : (
               <div className="relative rounded-lg overflow-hidden border border-gray-200">
                 <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                 <button
                   type="button"
                   onClick={removeFile}
                   className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                 >
                   <X size={16} />
                 </button>
               </div>
             )}
             
             {/* Fallback URL input if needed */}
             {!selectedFile && (
               <div className="mt-2">
                 <p className="text-xs text-gray-500 mb-1">Ou via un lien :</p>
                 <input
                   type="url"
                   value={formData.media_url}
                   onChange={(e) => setFormData({...formData, media_url: e.target.value})}
                   className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                   placeholder="https://..."
                 />
               </div>
             )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || loadingTopics}
              className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
