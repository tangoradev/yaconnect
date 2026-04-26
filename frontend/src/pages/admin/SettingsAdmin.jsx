import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const SettingsAdmin = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', settings);
      alert('Paramètres mis à jour avec succès');
    } catch (error) {
      console.error("Failed to update settings", error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres de la Plateforme</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom de la Plateforme</label>
            <input
              type="text"
              value={settings?.platform_name || ''}
              onChange={(e) => setSettings({...settings, platform_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Expéditeur</label>
            <input
              type="email"
              value={settings?.email_sender || ''}
              onChange={(e) => setSettings({...settings, email_sender: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings?.maintenance_mode || false}
              onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
              className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Mode Maintenance</label>
          </div>
          <div>
            <button type="submit" className="btn-primary">Enregistrer les modifications</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsAdmin;
