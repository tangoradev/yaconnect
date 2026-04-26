import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const NotificationBell = () => {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/count');
      setCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchCount, 0);
    const interval = setInterval(fetchCount, 60000); // Poll every minute
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchCount]);

  return (
    <Link to="/forum/notifications" className="relative p-2 text-gray-400 hover:text-brand-orange transition-colors">
      <Bell size={24} />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
