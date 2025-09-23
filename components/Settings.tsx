import React from 'react';
import { Icons } from './Icons';

type View = 
  | { name: 'placeholder', title: string };

interface SettingsProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

const SettingsItem = ({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void; }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    {icon}
    <span className="ml-4 text-lg font-medium text-gray-700">{title}</span>
    <Icons.ChevronLeft className="w-6 h-6 text-gray-400 ml-auto transform -rotate-180" />
  </button>
);

export const Settings: React.FC<SettingsProps> = ({ onBack, onNavigate }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <Icons.ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="ml-4 text-2xl font-bold text-gray-800">Paramètres</h1>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <SettingsItem
            title="Informations du professeur"
            icon={<Icons.UserPlus className="w-8 h-8 text-indigo-600" />}
            onClick={() => onNavigate({ name: 'placeholder', title: 'Informations du professeur' })}
          />
          <SettingsItem
            title="Paramètres de l'application"
            icon={<Icons.Settings className="w-8 h-8 text-indigo-600" />}
            onClick={() => onNavigate({ name: 'placeholder', title: "Paramètres de l'application" })}
          />
        </div>
      </main>
    </div>
  );
};