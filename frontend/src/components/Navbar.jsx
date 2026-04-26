import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from './common/Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Actualités', path: '/news' },
    { name: 'Forum', path: '/forum' },
    { name: 'Projets', path: '/projects' },
    { name: 'Classements', path: '/leaderboards' },
    { name: 'Événements', path: '/events' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Logo
              sizeClassName="h-16 sm:h-16 md:h-16 lg:h-16"
              className="flex-shrink-0 gap-x-3 hover:scale-105 transition-transform"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-brand-orange bg-orange-50'
                    : 'text-gray-700 hover:text-brand-orange hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            <button className="p-2 text-gray-400 hover:text-brand-blue transition-colors">
              <Search size={20} />
            </button>
            
            {user ? (
              <>
                <button className="p-2 text-gray-400 hover:text-brand-blue transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                <Link to="/dashboard" className="flex items-center space-x-2 text-gray-700 hover:text-brand-orange transition-colors">
                  <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold border border-brand-blue/20">
                    {user.first_name ? user.first_name[0] : 'U'}
                  </div>
                </Link>
                <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Déconnexion">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-gray-700 hover:text-brand-orange px-3 py-2 text-sm font-medium">
                  Se connecter
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-1.5">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-brand-orange hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-brand-orange bg-orange-50'
                    : 'text-gray-700 hover:text-brand-orange hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2 pt-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-orange hover:bg-gray-50"
                  >
                    Mon Tableau de Bord
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-orange hover:bg-gray-50"
                >
                  Se connecter
                </Link>
                  <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-brand-orange bg-orange-50 hover:bg-orange-100"
                >
                  S'inscrire
                </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
