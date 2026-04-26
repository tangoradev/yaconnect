import React from 'react';
import { ArrowRight } from 'lucide-react';

const ThemeCard = ({ title, icon: Icon, color, description }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full bg-gray-50 text-gray-700 group-hover:text-white group-hover:${color.replace('border-', 'bg-')} transition-colors duration-300`}>
          {React.createElement(Icon, { size: 28 })}
        </div>
        <ArrowRight size={20} className="text-gray-300 group-hover:text-brand-orange transition-colors" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

export default ThemeCard;
