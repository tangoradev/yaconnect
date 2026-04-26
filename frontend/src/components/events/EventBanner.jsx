import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { API_ORIGIN } from '../../services/api';

const formatDateRange = (start, end) => {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts = { day: '2-digit', month: 'long', year: 'numeric' };
    const startStr = s.toLocaleDateString('fr-FR', opts);
    const endStr = e.toLocaleDateString('fr-FR', opts);
    if (startStr === endStr) return startStr;
    return `${startStr} → ${endStr}`;
  } catch {
    return '';
  }
};

export default function EventBanner({ event }) {
  const banner = event?.banner_url ? (event.banner_url.startsWith('/static/') ? `${API_ORIGIN}${event.banner_url}` : event.banner_url) : null;
  const bgStyle = banner
    ? { backgroundImage: `url(${banner})` }
    : { backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #f97316 55%, #facc15 100%)' };

  return (
    <section className="relative w-full overflow-hidden">
      <div className="h-[320px] md:h-[420px] w-full bg-center bg-cover" style={bgStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
          <div className="max-w-3xl">
            <div className="text-white/80 text-sm font-semibold mb-2">Événement</div>
            <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight">
              {event?.title || '—'}
            </h1>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 text-white/90">
              <div className="inline-flex items-center gap-2">
                <Calendar size={18} />
                <span className="text-sm font-semibold">{formatDateRange(event?.start_date, event?.end_date)}</span>
              </div>
              {event?.location && (
                <div className="inline-flex items-center gap-2">
                  <MapPin size={18} />
                  <span className="text-sm font-semibold">{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
