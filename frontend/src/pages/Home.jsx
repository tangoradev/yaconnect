import React from 'react';
import { ArrowRight, Leaf, Heart, Users, Globe, Search, ArrowUpRight } from 'lucide-react';
import ThemeCard from '../components/ThemeCard';
import ProjectCard from '../components/ProjectCard';
import EventCard from '../components/EventCard';

const Home = () => {
  const themes = [
    { title: 'Climat', icon: Leaf, color: 'text-green-600', description: 'Actions pour la lutte contre le changement climatique.' },
    { title: 'Biodiversité', icon: Globe, color: 'text-green-500', description: 'Protection de notre environnement naturel.' },
    { title: 'Paix', icon: Heart, color: 'text-red-500', description: 'Promotion de la paix et de la sécurité.' },
    { title: 'Cohésion Sociale', icon: Users, color: 'text-brand-blue', description: 'Renforcer le vivre-ensemble et la solidarité.' },
  ];

  const featuredProjects = [
    { title: 'Reboisement de la ceinture verte', region: 'Bamako', category: 'Climat', votes: 124, comments: 45, status: 'En cours', image: '/vite.svg' },
    { title: 'Formation numérique pour tous', region: 'Ségou', category: 'Cohésion', votes: 89, comments: 23, status: 'Nouveau', image: '/vite.svg' },
    { title: 'Jardin communautaire urbain', region: 'Kayes', category: 'Biodiversité', votes: 210, comments: 67, status: 'Populaire', image: '/vite.svg' },
  ];

  const upcomingEvents = [
    { title: 'Conférence Nationale Jeunesse', date: '15 MAR', location: 'CICB, Bamako', participants: 500, image: '/vite.svg' },
    { title: 'Hackathon Climat 2026', date: '22 APR', location: 'Tech Hub, Bamako', participants: 150, image: '/vite.svg' },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-brand-orange to-brand-blue overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-white mb-12 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Reflect Locally,<br />
              <span className="text-yellow-300">Impact Globally</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-light opacity-90">
              Rejoignez la première plateforme communautaire nationale dédiée à l'engagement des jeunes pour un avenir durable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-brand-orange font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 transform hover:-translate-y-1 flex items-center justify-center">
                Rejoindre la communauté <ArrowRight size={20} className="ml-2" />
              </button>
              <button className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-brand-blue transition duration-300 flex items-center justify-center">
                Soumettre un projet
              </button>
            </div>
          </div>
          <div className="md:w-1/2 relative hidden md:block">
            {/* Abstract visual representation */}
            <div className="relative w-full h-96">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
               <div className="absolute bottom-0 left-10 w-48 h-48 bg-yellow-300 opacity-20 rounded-full blur-2xl"></div>
               <img 
                src="/vite.svg" 
                 alt="Jeunes engagés" 
                 className="relative z-10 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500 border-4 border-white/20"
               />
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-16 md:h-24" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-gray-50"></path>
          </svg>
        </div>
      </section>

      {/* Thematic Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nos Thématiques d'Action</h2>
            <div className="w-24 h-1 bg-brand-orange mx-auto rounded-full"></div>
            <p className="mt-4 text-xl text-gray-600">Choisissez votre domaine d'impact et commencez à agir.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {themes.map((theme, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center group cursor-pointer border-t-4 border-transparent hover:border-brand-orange">
                <div className={`mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${theme.color}`}>
                  <theme.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{theme.title}</h3>
                <p className="text-gray-500 mb-4">{theme.description}</p>
                <span className="text-brand-blue font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explorer <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Projets à Impact</h2>
              <div className="w-16 h-1 bg-brand-blue rounded-full"></div>
            </div>
            <a href="/projects" className="hidden md:flex items-center text-brand-orange font-bold hover:underline">
              Voir tous les projets <ArrowUpRight size={20} className="ml-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
             <button className="btn-secondary w-full">Voir tous les projets</button>
          </div>
        </div>
      </section>

      {/* Leaderboard & Stats */}
      <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-blue opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-orange opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Top Ambassadeurs du Mois</h2>
              <p className="text-gray-400 mb-8">
                Découvrez les leaders communautaires qui font bouger les lignes. Leur engagement inspire le changement.
              </p>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center shadow-lg transform hover:-translate-x-2 transition-transform duration-300 border-l-4 border-brand-orange">
                    <div className="text-2xl font-bold text-gray-500 w-8">0{i}</div>
                    <div className="w-12 h-12 rounded-full bg-gray-600 mr-4 overflow-hidden border-2 border-brand-blue">
                      <img src={`https://randomuser.me/api/portraits/men/${20+i}.jpg`} alt="User" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold">Amadou Koné</h4>
                      <div className="text-xs text-brand-orange">Ambassadeur Climat • Bamako</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">1,240</div>
                      <div className="text-xs text-gray-400">Points</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="mt-8 text-brand-orange hover:text-white transition-colors font-medium flex items-center">
                Voir le classement complet <ArrowRight size={16} className="ml-2" />
              </button>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-gray-800 p-6 rounded-2xl text-center hover:bg-gray-700 transition-colors">
                 <div className="text-4xl font-bold text-brand-blue mb-2">15k+</div>
                 <div className="text-gray-400">Membres Actifs</div>
               </div>
               <div className="bg-gray-800 p-6 rounded-2xl text-center hover:bg-gray-700 transition-colors">
                 <div className="text-4xl font-bold text-brand-orange mb-2">340</div>
                 <div className="text-gray-400">Projets Soumis</div>
               </div>
               <div className="bg-gray-800 p-6 rounded-2xl text-center hover:bg-gray-700 transition-colors">
                 <div className="text-4xl font-bold text-green-500 mb-2">56</div>
                 <div className="text-gray-400">Événements</div>
               </div>
               <div className="bg-gray-800 p-6 rounded-2xl text-center hover:bg-gray-700 transition-colors">
                 <div className="text-4xl font-bold text-purple-500 mb-2">8</div>
                 <div className="text-gray-400">Régions Couvertes</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Prochains Événements</h2>
            <div className="w-24 h-1 bg-brand-orange mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <EventCard key={index} {...event} />
            ))}
          </div>
          
          <div className="text-center mt-10">
            <button className="btn-primary">Voir l'agenda complet</button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-brand-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange opacity-10 transform -skew-x-12"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Restez connecté à l'impact</h2>
          <p className="text-xl mb-8 opacity-90">Recevez chaque semaine les meilleurs projets et les opportunités d'engagement dans votre région.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Votre adresse email" 
              className="px-6 py-4 rounded-full text-gray-900 w-full focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <button className="bg-gray-900 text-white font-bold py-4 px-8 rounded-full hover:bg-gray-800 transition shadow-lg">
              S'inscrire
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
