import React, { useEffect, useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import api from '../../services/api';

const BadgeDisplay = () => {
  const [badges, setBadges] = useState([]);

  const fetchBadges = useCallback(async () => {
    try {
      const response = await api.get('/forum/badges/me');
      setBadges(response.data);
    } catch (error) {
      console.error("Failed to fetch badges", error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchBadges, 0);
    return () => clearTimeout(timeout);
  }, [fetchBadges]);

  if (badges.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Shield size={18} className="text-brand-orange" />
        Mes Badges
      </h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((userBadge) => (
          <div 
            key={userBadge.id} 
            className="group relative flex items-center justify-center p-2 bg-orange-50 rounded-lg text-brand-orange hover:bg-brand-orange hover:text-white transition-colors cursor-help"
            title={userBadge.badge.description}
          >
            <Shield size={20} />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {userBadge.badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeDisplay;
