import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_ORIGIN } from '../../services/api';

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export default function EventCard({ event }) {
  const banner = event?.banner_url ? (event.banner_url.startsWith('/static/') ? `${API_ORIGIN}${event.banner_url}` : event.banner_url) : null;

  return (
    <Link to={`/events/${event.id}`} className="group block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-gray-100">
        {banner ? (
          <img src={banner} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-500 via-brand-orange to-yellow-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white font-extrabold text-lg leading-tight line-clamp-2">{event.title}</div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={16} className="text-gray-400" />
          <span className="font-semibold">{formatDate(event.start_date)}</span>
          {event.end_date && <span className="text-gray-400">→</span>}
          {event.end_date && <span className="font-semibold">{formatDate(event.end_date)}</span>}
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin size={16} className="text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users size={14} />
            <span>{event.registrations_count || 0} inscrits</span>
          </div>
          <div className="text-brand-blue text-sm font-semibold group-hover:underline">Voir</div>
        </div>
      </div>
    </Link>
  );
}
