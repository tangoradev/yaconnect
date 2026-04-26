import React from 'react';
import { MapPin, ThumbsUp, MessageSquare } from 'lucide-react';

const ProjectCard = ({ title, region, category, votes, comments, status, image }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-48 bg-gray-200">
        <img src={image || "/vite.svg"} alt={title} className="w-full h-full object-cover" />
        <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-blue uppercase tracking-wide">
          {status}
        </span>
        <span className="absolute bottom-4 left-4 bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold">
          {category}
        </span>
      </div>
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <MapPin size={14} className="mr-1" />
            {region}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            Un projet innovant visant à renforcer la cohésion sociale à travers des activités culturelles...
          </p>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
          <div className="flex items-center space-x-4 text-gray-500 text-sm">
            <span className="flex items-center hover:text-brand-blue cursor-pointer">
              <ThumbsUp size={16} className="mr-1" /> {votes}
            </span>
            <span className="flex items-center hover:text-brand-blue cursor-pointer">
              <MessageSquare size={16} className="mr-1" /> {comments}
            </span>
          </div>
          <button className="text-brand-orange font-medium text-sm hover:underline">Voir le détail</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
