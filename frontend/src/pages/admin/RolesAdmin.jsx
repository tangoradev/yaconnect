import React, { useEffect, useState } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

const RolesAdmin = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState({ name: '', description: '', permissions: '{}' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        await api.delete(`/admin/roles/${id}`);
        setRoles(roles.filter(role => role.id !== id));
      } catch (error) {
        console.error("Failed to delete role", error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setCurrentRole({ ...role, permissions: JSON.stringify(role.permissions || {}, null, 2) });
      setIsEditing(true);
    } else {
      setCurrentRole({ name: '', description: '', permissions: '{\n  "manage_users": true\n}' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentRole,
        permissions: JSON.parse(currentRole.permissions)
      };

      if (isEditing) {
        const response = await api.put(`/admin/roles/${currentRole.id}`, payload);
        setRoles(roles.map(r => r.id === currentRole.id ? response.data : r));
      } else {
        const response = await api.post('/admin/roles', payload);
        setRoles([...roles, response.data]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save role", error);
      alert('Erreur lors de la sauvegarde (Vérifiez le format JSON des permissions)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nouveau Rôle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div>Chargement...</div>
        ) : roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
                  <Shield size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleOpenModal(role)}
                  className="p-1 text-gray-400 hover:text-brand-blue"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(role.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4 h-10 overflow-hidden">{role.description}</p>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-600 h-24 overflow-y-auto">
              {JSON.stringify(role.permissions, null, 2)}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Modifier le Rôle' : 'Créer un Rôle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom du Rôle</label>
                <input
                  type="text"
                  required
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({...currentRole, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="2"
                  value={currentRole.description}
                  onChange={(e) => setCurrentRole({...currentRole, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions (JSON)</label>
                <textarea
                  rows="5"
                  required
                  value={currentRole.permissions}
                  onChange={(e) => setCurrentRole({...currentRole, permissions: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 font-mono text-sm focus:ring-brand-orange focus:border-brand-orange"
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

export default RolesAdmin;
