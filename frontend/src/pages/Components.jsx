import React from 'react';
import { Leaf, Heart, Users } from 'lucide-react';
import ThemeCard from '../components/ThemeCard';
import ProjectCard from '../components/ProjectCard';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

const Components = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Bibliothèque de Composants GRIN17</h1>

        {/* Colors */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Couleurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="h-24 rounded-lg bg-brand-orange flex items-center justify-center text-white font-bold shadow-md">Orange #F26522</div>
            <div className="h-24 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold shadow-md">Bleu #2C8FC1</div>
            <div className="h-24 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold shadow-md">Vert #4CAF50</div>
            <div className="h-24 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold shadow-md">Noir #1A1A1A</div>
            <div className="h-24 rounded-lg bg-white flex items-center justify-center text-gray-900 font-bold border border-gray-200 shadow-md">Blanc #FFFFFF</div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Boutons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Bouton Primaire</button>
            <button className="btn-secondary">Bouton Secondaire</button>
            <button className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 font-medium">Bouton Tertiaire</button>
            <button className="bg-transparent text-brand-orange hover:underline font-bold">Lien Texte</button>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cartes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ThemeCard title="Climat" icon={Leaf} color="text-green-600" description="Actions pour le climat." />
            <ProjectCard 
              title="Exemple de Projet" 
              region="Bamako" 
              category="Climat" 
              votes={120} 
              comments={10} 
              status="En cours" 
            />
            <EventCard 
              title="Exemple d'Événement" 
              date="15 MAR" 
              location="Bamako" 
              participants={50} 
            />
          </div>
        </section>
        
        {/* Forum Post */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Post Forum</h2>
          <div className="max-w-2xl">
            <PostCard 
              author={{ name: 'Utilisateur Test', avatar: '' }} 
              time="il y a 1h" 
              content="Ceci est un exemple de post sur le forum." 
              tags={['Test', 'UI']} 
              likes={5} 
              comments={2} 
              isAmbassador={true} 
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Components;
