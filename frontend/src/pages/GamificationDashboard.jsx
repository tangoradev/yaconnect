import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ScoreDisplay from '../components/gamification/ScoreDisplay';
import LevelProgress from '../components/gamification/LevelProgress';
import BadgeGrid from '../components/gamification/BadgeGrid';
import ActivityTimeline from '../components/gamification/ActivityTimeline';
import LeaderboardChart from '../components/gamification/LeaderboardChart';

export default function GamificationDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/gamification/me');
      setSummary(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Gamification</h1>
            <p className="mt-2 text-gray-600">Suivez votre progression, vos badges et votre impact.</p>
          </div>
          <Link to="/dashboard" className="text-brand-orange font-semibold hover:underline">
            Retour au dashboard
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-28 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
            <div className="h-28 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
            <div className="h-28 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ScoreDisplay summary={summary} />
              <LevelProgress summary={summary} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LeaderboardChart type="contributors" period="weekly" title="Top contributeurs (semaine)" />
                <LeaderboardChart type="projects" period="weekly" title="Top projets (semaine)" />
              </div>
              <ActivityTimeline activity={summary?.activity || []} />
            </div>

            <div className="space-y-6">
              <BadgeGrid badges={summary?.badges || []} />

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="text-sm font-semibold text-gray-900 mb-3">Missions</div>
                {!summary?.missions || summary.missions.length === 0 ? (
                  <div className="text-sm text-gray-500">Aucune mission active.</div>
                ) : (
                  <div className="space-y-3">
                    {summary.missions.map((m) => (
                      <div key={m.mission.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="text-sm font-semibold text-gray-900">{m.mission.title}</div>
                        <div className="text-xs text-gray-500">{m.mission.description}</div>
                        <div className="mt-2 text-xs text-gray-600">
                          Bonus: <span className="font-semibold">{m.mission.reward_points}</span> pts ·{' '}
                          <span className={m.is_completed ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                            {m.is_completed ? 'Complétée' : 'En cours'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <LeaderboardChart type="regions" period="daily" title="Top régions (jour)" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

