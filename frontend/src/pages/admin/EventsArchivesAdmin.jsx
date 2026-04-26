import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Gift, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function EventsArchivesAdmin() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regStatus, setRegStatus] = useState('');
  const [mutating, setMutating] = useState(null);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/admin/events', { params: { skip: 0, limit: 200 } });
      setEvents(res.data || []);
      if (!selectedEventId && (res.data || []).length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedEventId) return;
    setLoadingRegs(true);
    try {
      const params = {};
      if (regStatus) params.status = regStatus;
      const res = await api.get(`/admin/events/${selectedEventId}/registrations`, { params });
      setRegistrations(res.data || []);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedEventId, regStatus]);

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) || null, [events, selectedEventId]);

  const markAttendance = async (userId) => {
    if (!selectedEventId) return;
    setMutating(userId);
    try {
      await api.post(`/admin/events/${selectedEventId}/attendance/${userId}`);
      await fetchRegistrations();
    } finally {
      setMutating(null);
    }
  };

  const grantReward = async (userId) => {
    if (!selectedEventId) return;
    setMutating(userId);
    try {
      await api.post(`/admin/events/${selectedEventId}/reward/${userId}`);
      await fetchRegistrations();
    } finally {
      setMutating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archives événements</h1>
          <p className="text-sm text-gray-600 mt-1">Inscriptions, présences et récompenses.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchEvents();
            fetchRegistrations();
          }}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw size={18} className="mr-2" />
          Actualiser
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Événement</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"
              disabled={loadingEvents}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Statut inscription</label>
            <select
              value={regStatus}
              onChange={(e) => setRegStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"
            >
              <option value="">Tous</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="ATTENDED">ATTENDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="flex items-end text-sm text-gray-600">
            {selectedEvent ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="font-semibold">{new Date(selectedEvent.start_date).toLocaleString('fr-FR')}</span>
                </div>
                <div className="text-xs text-gray-500">Statut événement: {selectedEvent.status}</div>
              </div>
            ) : (
              <div>—</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscrit le</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Présence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Récompense</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingRegs ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Chargement...</td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Aucune inscription</td>
                </tr>
              ) : (
                registrations.map((r) => {
                  const name = `${r.user_first_name || ''} ${r.user_last_name || ''}`.trim() || r.user_id;
                  return (
                    <tr key={r.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500">{r.user_email || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.status}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(r.registered_at).toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.attended_at ? new Date(r.attended_at).toLocaleString('fr-FR') : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.reward_granted_at ? new Date(r.reward_granted_at).toLocaleString('fr-FR') : '—'}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => markAttendance(r.user_id)}
                          disabled={mutating === r.user_id || r.status === 'ATTENDED' || r.status === 'CANCELLED'}
                          className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} className="mr-2" />
                          Présent
                        </button>
                        <button
                          type="button"
                          onClick={() => grantReward(r.user_id)}
                          disabled={mutating === r.user_id || r.status !== 'ATTENDED' || Boolean(r.reward_granted_at)}
                          className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-orange text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
                        >
                          <Gift size={16} className="mr-2" />
                          Récompenser
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

