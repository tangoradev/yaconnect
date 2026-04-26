import React, { useEffect, useState } from 'react';
import { Map, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

const RegionsAdmin = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState({ name: '', code: '', country: 'Côte d\'Ivoire' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await api.get('/admin/regions');
      setRegions(response.data);
    } catch (error) {
      console.error("Failed to fetch regions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
      try {
        await api.delete(`/admin/regions/${id}`);
        setRegions(regions.filter(region => region.id !== id));
      } catch (error) {
        console.error("Failed to delete region", error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenModal = (region = null) => {
    if (region) {
      setCurrentRegion(region);
      setIsEditing(true);
    } else {
      setCurrentRegion({ name: '', code: '', country: 'Côte d\'Ivoire' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await api.put(`/admin/regions/${currentRegion.id}`, currentRegion);
        setRegions(regions.map(r => r.id === currentRegion.id ? response.data : r));
      } else {
        const response = await api.post('/admin/regions', currentRegion);
        setRegions([...regions, response.data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save region", error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Régions</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nouvelle Région
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center">Chargement...</td></tr>
            ) : regions.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-4 text-center">Aucune région trouvée</td></tr>
            ) : (
              regions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    <div className="flex items-center">
                      <Map size={18} className="text-gray-400 mr-2" />
                      {region.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenModal(region)}
                      className="text-gray-400 hover:text-brand-blue mx-2"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(region.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Modifier la Région' : 'Créer une Région'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de la Région</label>
                <input
                  type="text"
                  required
                  value={currentRegion.name}
                  onChange={(e) => setCurrentRegion({...currentRegion, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code (Optionnel)</label>
                <input
                  type="text"
                  value={currentRegion.code || ''}
                  onChange={(e) => setCurrentRegion({...currentRegion, code: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pays</label>
                <input
                  type="text"
                  value={currentRegion.country}
                  onChange={(e) => setCurrentRegion({...currentRegion, country: e.target.value})}
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

export default RegionsAdmin;
