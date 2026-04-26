import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminTopbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 ml-64">
      <div className="flex items-center w-96">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-orange focus:border-brand-orange sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500">{user?.role?.name || 'Admin'}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold border border-brand-blue/20">
            {user?.first_name ? user.first_name[0] : <User size={20} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
