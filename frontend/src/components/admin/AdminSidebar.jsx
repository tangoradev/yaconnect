import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Map, 
  Tags, 
  FolderKanban,
  Trophy,
  Calendar,
  FileClock,
  BarChart2, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';

const AdminSidebar = () => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Tableau de bord', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Utilisateurs', path: '/admin/users', icon: Users },
    { name: 'Rôles', path: '/admin/roles', icon: Shield },
    { name: 'Régions', path: '/admin/regions', icon: Map },
    { name: 'Intérêts', path: '/admin/interests', icon: Tags },
    { name: 'Projets', path: '/admin/projects', icon: FolderKanban },
    { name: 'Événements', path: '/admin/events', icon: Calendar },
    { name: 'Archives événements', path: '/admin/events-archives', icon: FileClock },
    { name: 'CMS', path: '/admin/cms', icon: FileText },
    { name: 'Gamification', path: '/admin/gamification', icon: Trophy },
    { name: 'Statistiques', path: '/admin/stats', icon: BarChart2 },
    { name: 'Logs Système', path: '/admin/logs', icon: FileText },
    { name: 'Paramètres', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-30">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Logo sizeClassName="h-9" className="hover:scale-105 transition-transform" />
        <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">ADMIN</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-brand-orange'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={20} className="mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
