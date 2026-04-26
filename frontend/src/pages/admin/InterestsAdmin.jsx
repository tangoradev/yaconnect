import React, { useEffect, useState } from 'react';
import { Tags, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

const InterestsAdmin = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInterest, setCurrentInterest] = useState({ name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const response = await api.get('/admin/interests');
      setInterests(response.data);
    } catch (error) {
      console.error("Failed to fetch interests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet intérêt ?')) {
      try {
        await api.delete(`/admin/interests/${id}`);
        setInterests(interests.filter(interest => interest.id !== id));
      } catch (error) {
        console.error("Failed to delete interest", error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenModal = (interest = null) => {
    if (interest) {
      setCurrentInterest(interest);
      setIsEditing(true);
    } else {
      setCurrentInterest({ name: '', description: '' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await api.put(`/admin/interests/${currentInterest.id}`, currentInterest);
        setInterests(interests.map(i => i.id === currentInterest.id ? response.data : i));
      } else {
        const response = await api.post('/admin/interests', currentInterest);
        setInterests([...interests, response.data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save interest", error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Intérêts</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nouvel Intérêt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div>Chargement...</div>
        ) : interests.map((interest) => (
          <div key={interest.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Tags size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{interest.name}</h3>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleOpenModal(interest)}
                    className="p-1 text-gray-400 hover:text-brand-blue"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(interest.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-2">{interest.description || 'Aucune description'}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
              <span>ID: {interest.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Modifier l\'Intérêt' : 'Créer un Intérêt'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de l'Intérêt</label>
                <input
                  type="text"
                  required
                  value={currentInterest.name}
                  onChange={(e) => setCurrentInterest({...currentInterest, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="3"
                  value={currentInterest.description}
                  onChange={(e) => setCurrentInterest({...currentInterest, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-orange hover:bg-orange-600"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestsAdmin;
