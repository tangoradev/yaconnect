import React, { useEffect, useState } from 'react';
import { Award, Star, Activity, Briefcase, Calendar, Edit2, Settings, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProjectCard from '../components/ProjectCard';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchSummary = async () => {
      try {
        const res = await api.get('/gamification/me');
        setSummary(res.data);
      } catch {
        setSummary(null);
      }
    };
    fetchSummary();
  }, [user]);

  if (!user) return <div>Loading...</div>;

  const userDisplay = {
    name: `${user.first_name} ${user.last_name}`,
    role: user.role ? user.role.name : "Membre", // Assuming backend returns role object or name
    level: summary?.level || user.community_level || "Explorer",
    score: summary?.score ?? user.score ?? 0,
    nextLevel: summary?.next_level_min_score ?? null,
    region: user.region ? user.region.name : "Non défini",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg" // Placeholder avatar
  };

  const userProjects = [
    { title: 'Reboisement de la ceinture verte', region: 'Bamako', category: 'Climat', votes: 124, comments: 45, status: 'En cours', image: '/vite.svg' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Profile */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-brand-orange to-brand-blue">
              <img src={userDisplay.avatar} alt={userDisplay.name} className="w-full h-full object-cover rounded-full border-4 border-white" />
            </div>
            <div className="absolute bottom-0 right-0 bg-brand-blue text-white p-2 rounded-full border-2 border-white shadow-lg">
              <Award size={20} />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userDisplay.name}</h1>
            <div className="flex flex-col md:flex-row gap-4 items-center text-gray-500 mb-4">
              <span className="flex items-center gap-1 bg-blue-50 text-brand-blue px-3 py-1 rounded-full text-sm font-medium">
                <Star size={16} /> Niveau {userDisplay.level}
              </span>
              <span>{userDisplay.region}</span>
              <span>Membre depuis {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Score d'influence: {userDisplay.score} pts</span>
                <span className="text-gray-400">
                  {userDisplay.nextLevel ? `Prochain niveau: ${userDisplay.nextLevel} pts` : 'Niveau max atteint'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-brand-orange to-yellow-400 h-2.5 rounded-full"
                  style={{ width: `${Math.round((summary?.progress_to_next_level || 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="btn-primary flex items-center justify-center gap-2">
              <Edit2 size={18} /> Éditer Profil
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 bg-gray-100 !text-gray-700 hover:bg-gray-200">
              <Settings size={18} /> Paramètres
            </button>
            <Link to="/dashboard/gamification" className="btn-secondary flex items-center justify-center gap-2 bg-blue-50 !text-brand-blue hover:bg-blue-100">
              <Star size={18} /> Gamification
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Badges */}
          <div className="space-y-8">
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-brand-orange" /> Activité
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-xs text-gray-500">Projets Soutenus</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-brand-blue">5</div>
                  <div className="text-xs text-gray-500">Événements</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-brand-orange">148</div>
                  <div className="text-xs text-gray-500">Contributions</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">3</div>
                  <div className="text-xs text-gray-500">Badges</div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-yellow-500" /> Mes Badges
              </h3>
              <div className="flex flex-wrap gap-4">
                {(summary?.badges || []).slice(0, 6).map((badge) => (
                  <div key={badge.id || badge.name} className="flex flex-col items-center group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-2 group-hover:scale-110 transition-transform">
                      <Award size={32} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{badge.name}</span>
                  </div>
                ))}
                {(summary?.badges || []).length === 0 && (
                  <div className="text-sm text-gray-500">Aucun badge pour l’instant.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Projects & Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Briefcase size={20} className="text-brand-blue" /> Mes Projets
                </h3>
                <button className="text-brand-orange text-sm font-medium hover:underline">Voir tout</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProjects.map((project, idx) => (
                  <ProjectCard key={idx} {...project} />
                ))}
                
                {/* Add Project Card */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-brand-orange hover:text-brand-orange hover:bg-orange-50 transition-all cursor-pointer h-full min-h-[300px]">
                  <div className="bg-gray-100 p-4 rounded-full mb-4 group-hover:bg-white transition-colors">
                    <Briefcase size={32} />
                  </div>
                  <span className="font-medium">Soumettre un nouveau projet</span>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-purple-500" /> Événements à venir
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="bg-white rounded-lg p-2 text-center shadow-sm min-w-[60px] mr-4">
                    <div className="text-xs font-bold text-red-500 uppercase">MAR</div>
                    <div className="text-xl font-bold text-gray-900">15</div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-900">Conférence Nationale Jeunesse</h4>
                    <p className="text-sm text-gray-500">CICB, Bamako • 09:00 - 17:00</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
