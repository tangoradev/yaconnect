import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import Logo from './common/Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="inline-flex items-center mb-4 rounded-xl bg-white/90 px-3 py-2">
              <Logo sizeClassName="h-10 sm:h-10" loading="lazy" className="hover:scale-105 transition-transform" />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Plateforme communautaire nationale pour l'engagement des jeunes.
              Reflect locally, impact globally.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-brand-orange transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-orange transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-orange transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-orange transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-brand-blue transition-colors">Accueil</a></li>
              <li><a href="/forum" className="text-gray-400 hover:text-brand-blue transition-colors">Forum</a></li>
              <li><a href="/projects" className="text-gray-400 hover:text-brand-blue transition-colors">Projets</a></li>
              <li><a href="/events" className="text-gray-400 hover:text-brand-blue transition-colors">Événements</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-brand-blue transition-colors">Mon Espace</a></li>
              <li><a href="/components" className="text-gray-400 hover:text-brand-blue transition-colors">Composants</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin size={18} className="mt-1 text-brand-orange" />
                <span>Angle Avenue Marchand,<br />Rue Gourgas<br />Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone size={18} className="text-brand-orange" />
                <span>+225 27 20 31 74 00</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail size={18} className="text-brand-orange" />
                <span>registry.ci@undp.org</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Restez informé des dernières initiatives et événements.
            </p>
            <form className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="Votre email" 
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-brand-orange"
              />
              <button className="bg-brand-orange hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                S'abonner
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} GRIN17. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
