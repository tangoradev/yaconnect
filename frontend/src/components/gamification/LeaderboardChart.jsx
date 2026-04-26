import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

export default function LeaderboardChart({ type = 'contributors', period = 'weekly', title }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leaderboards', { params: { type, period, limit: 10 } });
        const items = res.data.items || [];
        const normalized = items.map((it) => ({
          name: it.first_name ? `${it.first_name} ${it.last_name || ''}`.trim() : it.region_name || it.title || it.project_id || it.user_id,
          value: it.points ?? it.votes ?? it.score ?? 0,
        }));
        setData(normalized);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, period]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="text-sm font-semibold text-gray-900 mb-4">{title || 'Leaderboard'}</div>
      {loading ? (
        <div className="h-52 bg-gray-50 rounded-lg animate-pulse" />
      ) : data.length === 0 ? (
        <div className="text-sm text-gray-500">Aucune donnée.</div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

