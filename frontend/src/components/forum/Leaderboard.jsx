import React, { useEffect, useState } from 'react';
import { Award, Star } from 'lucide-react';
import api from '../../services/api';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/forum/contributors');
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-48 bg-gray-100 rounded-lg"></div>;
  if (!users.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center space-x-2 mb-4 text-brand-blue">
        <Award size={20} />
        <h3 className="font-bold text-lg">Top Contributeurs</h3>
      </div>
      <div className="space-y-4">
        {users.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold border border-brand-orange/20">
                  {user.first_name ? user.first_name[0] : 'U'}
                </div>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                    <Star size={10} fill="currentColor" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 truncate w-32">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">{user.community_level || 'Explorateur'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-sm font-bold text-brand-orange">{user.score}</span>
              <span className="text-xs text-gray-400">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
