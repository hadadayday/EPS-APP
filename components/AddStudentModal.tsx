import React, { useState } from 'react';
import { Icons } from './Icons';
import { DatePickerPopover } from './DatePickerPopover';

interface AddStudentModalProps {
  onAdd: (name: string, codeMassar: string, dob: string, photoUrl: string | null) => void;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [codeMassar, setCodeMassar] = useState('');
  const [dob, setDob] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const isFormValid = name.trim() !== '' && dob.trim() !== '';

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onAdd(name.trim(), codeMassar.trim(), dob.trim(), photoPreview);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md m-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ajouter un nouvel élève</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
             <span className="sr-only">Fermer</span>
            <Icons.X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-6">
            <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
            />
            <label htmlFor="photo-upload" className="relative group w-28 h-28 rounded-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden hover:border-indigo-500 transition-all">
                {photoPreview ? (
                    <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-gray-500">
                        <Icons.Camera className="w-10 h-10 mx-auto" />
                        <span className="text-xs mt-1 font-medium block">Photo</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <Icons.Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </label>
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="studentName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-800 text-white border-2 border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm placeholder-gray-400"
                placeholder="Ex: Marie Curie"
                required
                autoFocus
              />
            </div>
             <div>
              <label htmlFor="codeMassar" className="block text-sm font-medium text-gray-700 mb-2">
                Code Massar
              </label>
              <input
                type="text"
                id="codeMassar"
                value={codeMassar}
                onChange={(e) => setCodeMassar(e.target.value.toUpperCase())}
                className="block w-full px-4 py-3 bg-slate-800 text-white border-2 border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm placeholder-slate-400"
                placeholder="Ex: D170109402"
              />
            </div>
            <div>
              <label htmlFor="studentDob" className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <div className="relative">
                 <button
                    type="button"
                    id="studentDob"
                    onClick={() => setDatePickerOpen(!isDatePickerOpen)}
                    className={`block w-full text-left px-4 py-3 bg-gray-800 border-2 border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm ${dob ? 'text-white' : 'text-gray-400'}`}
                    aria-haspopup="true"
                    aria-expanded={isDatePickerOpen}
                  >
                    {dob ? new Date(dob + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "jj/mm/aaaa"}
                  </button>
                {isDatePickerOpen && (
                  <DatePickerPopover
                    currentDate={dob}
                    onSelectDate={(newDate) => {
                      setDob(newDate);
                      setDatePickerOpen(false);
                    }}
                    onClose={() => setDatePickerOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid}
              className="inline-flex justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:opacity-75 disabled:cursor-not-allowed transition-all"
            >
              Ajouter l'élève
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};