import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';

const EventCard = ({ title, date, location, participants, image }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex hover:shadow-lg transition-shadow duration-300">
      <div className="w-1/3 bg-gray-200 relative">
        <img src={image || "/vite.svg"} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 bg-brand-blue text-white p-2 text-center">
          <span className="block text-xs font-bold uppercase">{date.split(' ')[0]}</span>
          <span className="block text-xl font-bold">{date.split(' ')[1]}</span>
        </div>
      </div>
      <div className="w-2/3 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <MapPin size={14} className="mr-1" />
            {location}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center text-gray-500 text-sm">
            <Users size={14} className="mr-1" />
            {participants} inscrits
          </div>
          <button className="text-brand-orange text-sm font-bold border border-brand-orange px-3 py-1 rounded-full hover:bg-brand-orange hover:text-white transition-colors">
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
