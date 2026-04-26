import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, MapPin, DollarSign, Video, CheckCircle } from 'lucide-react';

const ProjectSubmit = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    region: '',
    description: '',
    budget: '',
    video: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 transform -translate-y-1/2 rounded-full"></div>
          <div className={`absolute top-1/2 left-0 h-1 bg-brand-orange transform -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          <div className="flex justify-between relative">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 ${step >= i ? 'bg-brand-orange scale-110 shadow-lg' : 'bg-gray-300 scale-100'}`}>
                {step > i ? <CheckCircle size={20} /> : i}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Infos</span>
            <span>Détails</span>
            <span>Médias</span>
            <span>Validation</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-orange to-brand-blue"></div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {step === 1 && "Présentez votre projet"}
            {step === 2 && "Détails et Impact"}
            {step === 3 && "Ajoutez des visuels"}
            {step === 4 && "Récapitulatif"}
          </h2>

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Step 1: General Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre du projet</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all" 
                    placeholder="Ex: Reboisement de la ceinture verte de Bamako" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thématique</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white">
                      <option value="">Sélectionner...</option>
                      <option value="climat">Climat</option>
                      <option value="biodiversite">Biodiversité</option>
                      <option value="paix">Paix</option>
                      <option value="cohesion">Cohésion Sociale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                      <select name="region" value={formData.region} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white">
                        <option value="">Votre région...</option>
                        <option value="bamako">Bamako</option>
                        <option value="kayes">Kayes</option>
                        <option value="koulikoro">Koulikoro</option>
                        {/* ... other regions */}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description du problème</label>
                  <textarea 
                    rows="4" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Quel problème votre projet vise-t-il à résoudre ?"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objectifs</label>
                  <textarea 
                    rows="4" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Quels sont les résultats attendus ?"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Estimatif (FCFA)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="number" 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent" 
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Media */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 hover:border-brand-orange transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">Glissez-déposez vos images ici</p>
                  <p className="text-sm text-gray-400 mt-2">ou cliquez pour parcourir (Max 5Mo)</p>
                </div>
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien Vidéo (YouTube/Vimeo)</label>
                  <div className="relative">
                    <Video size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="url" 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:border-transparent" 
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Récapitulatif</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-500">Titre</span>
                      <span className="font-medium">{formData.title || 'Non renseigné'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Thématique</span>
                      <span className="font-medium capitalize">{formData.category || 'Non renseigné'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500">Région</span>
                      <span className="font-medium capitalize">{formData.region || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                  <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <p>En soumettant ce projet, vous acceptez la charte communautaire GRIN17. Votre projet sera soumis à validation par la communauté.</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="flex items-center text-gray-600 hover:text-gray-900 font-medium px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={18} className="mr-2" /> Retour
                </button>
              ) : <div></div>}
              
              {step < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="flex items-center bg-brand-orange text-white px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  Suivant <ArrowRight size={18} className="ml-2" />
                </button>
              ) : (
                <button 
                  type="submit"
                  className="flex items-center bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  Soumettre le projet <CheckCircle size={18} className="ml-2" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectSubmit;
