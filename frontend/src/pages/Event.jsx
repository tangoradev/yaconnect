import React from 'react';
import { Calendar, MapPin, Clock, Users, QrCode, Share2, CheckCircle } from 'lucide-react';

const Event = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Event Header Image */}
      <div className="h-64 md:h-96 w-full relative">
        <img 
          src="/vite.svg" 
          alt="Conférence" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
            <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block">
              Conférence
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Conférence Nationale Jeunesse</h1>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-white/90">
              <div className="flex items-center gap-2"><Calendar size={20} /> 15 Mars 2026</div>
              <div className="flex items-center gap-2"><Clock size={20} /> 09:00 - 17:00</div>
              <div className="flex items-center gap-2"><MapPin size={20} /> CICB, Bamako</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos de l'événement</h2>
              <div className="prose text-gray-600 max-w-none">
                <p className="mb-4">
                  Rejoignez-nous pour la plus grande conférence dédiée à l'engagement des jeunes au Mali. 
                  Cet événement rassemblera plus de 500 jeunes leaders, activistes et entrepreneurs sociaux 
                  pour discuter des défis actuels et proposer des solutions innovantes.
                </p>
                <p className="mb-4">
                  Au programme :
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>Keynotes inspirants</li>
                  <li>Ateliers pratiques sur le leadership et l'entrepreneuriat</li>
                  <li>Sessions de réseautage</li>
                  <li>Présentation des projets lauréats GRIN17</li>
                </ul>
                <p>
                  Ne manquez pas cette opportunité unique de connecter avec d'autres jeunes engagés et de faire entendre votre voix.
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Intervenants</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 text-center w-32">
                      <img src={`https://randomuser.me/api/portraits/women/${50+i}.jpg`} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-brand-blue" alt="Speaker" />
                      <p className="font-bold text-sm text-gray-900 truncate">Dr. Fatou Sow</p>
                      <p className="text-xs text-gray-500 truncate">Expert Climat</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-brand-orange sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-3xl font-bold text-gray-900">Gratuit</span>
                  <span className="text-gray-500 text-sm block">Entrée libre</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-brand-orange font-bold">
                    <Users size={18} className="mr-1" /> 124
                  </div>
                  <span className="text-xs text-gray-500">Places restantes</span>
                </div>
              </div>
              
              <button className="w-full btn-primary py-3 mb-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                S'inscrire maintenant
              </button>
              
              <p className="text-xs text-center text-gray-500 mb-6">
                Inscription obligatoire pour accéder à l'événement.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-700">Votre Badge QR</p>
                  <p className="text-xs text-gray-500">Disponible après inscription</p>
                </div>
                <QrCode size={32} className="text-gray-300" />
              </div>
              
              <div className="mt-6 flex justify-center gap-4">
                <button className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Event;
