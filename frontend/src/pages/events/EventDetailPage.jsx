import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ShieldCheck, Calendar, MapPin } from 'lucide-react';
import api from '../../services/api';
import EventBanner from '../../components/events/EventBanner';
import { useAuth } from '../../hooks/useAuth';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canRegister = useMemo(() => {
    return event?.status === 'PUBLISHED';
  }, [event?.status]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const e = await api.get(`/events/${eventId}`);
      setEvent(e.data);
      if (user) {
        const r = await api.get(`/events/${eventId}/registration`);
        setRegistration(r.data);
      } else {
        setRegistration(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [eventId, user?.id]);

  const register = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/events/${eventId}/register`);
      setRegistration(res.data);
      await fetchAll();
    } finally {
      setActionLoading(false);
    }
  };

  const cancel = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/events/${eventId}/cancel`);
      setRegistration(res.data);
      await fetchAll();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-gray-50 min-h-[calc(100vh-64px)]" />;
  }
  if (!event) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
            Événement introuvable.
          </div>
        </div>
      </div>
    );
  }

  const remaining = event.remaining_capacity;
  const isRegistered = registration?.status === 'REGISTERED';

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <EventBanner event={event} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="text-sm font-semibold text-gray-900 mb-2">À propos</div>
              <div className="text-gray-700 whitespace-pre-line">
                {event.description || 'Aucune description.'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="text-sm font-semibold text-gray-900 mb-4">Infos</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{new Date(event.start_date).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{new Date(event.end_date).toLocaleString('fr-FR')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="text-sm font-semibold text-gray-900 mb-3">Inscription</div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2"><Users size={16} className="text-gray-400" /> Inscrits</span>
                  <span className="font-semibold">{event.registrations_count || 0}</span>
                </div>
                {event.capacity !== null && event.capacity !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-gray-400" /> Places restantes</span>
                    <span className="font-semibold">{remaining ?? 0}</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {!user ? (
                  <Link to="/login" className="w-full inline-flex justify-center px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-700">
                    Se connecter pour s’inscrire
                  </Link>
                ) : !canRegister ? (
                  <button type="button" disabled className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-500 font-semibold">
                    Inscriptions fermées
                  </button>
                ) : isRegistered ? (
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-60"
                  >
                    Annuler mon inscription
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={register}
                    disabled={actionLoading || (remaining !== null && remaining !== undefined && remaining <= 0)}
                    className="w-full px-4 py-2 rounded-lg bg-brand-orange text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
                  >
                    Je m’inscris
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="text-sm font-semibold text-gray-900 mb-2">Statut</div>
              <div className="text-sm text-gray-700">{event.status}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

