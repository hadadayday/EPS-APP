import React from 'react';
import { Icons } from './Icons';

interface DashboardItemProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ title, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`group flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${color}`}
    aria-label={`Accéder à ${title}`}
  >
    <div className="text-gray-800 group-hover:text-white transition-colors duration-300">
        {icon}
    </div>
    <h3 className="mt-4 text-lg font-semibold text-gray-700 group-hover:text-white transition-colors duration-300 text-center">{title}</h3>
  </button>
);


export const Dashboard = ({ onNavigate }) => {
    const menuItems = [
        { title: "Les Cycles", icon: <Icons.Cycles className="w-12 h-12"/>, action: () => onNavigate({name: 'placeholder', title: 'Les Cycles'}), color: 'focus:ring-green-500' },
        { title: "Marquage Démarquage", icon: <Icons.Marquage className="w-12 h-12"/>, action: () => onNavigate({name: 'student_management', title: 'Marquage Démarquage', evaluationType: 'marquage'}), color: 'focus:ring-yellow-500' },
        { title: "Athlétisme", icon: <Icons.Athletisme className="w-12 h-12"/>, action: () => onNavigate({name: 'student_management', title: 'Athlétisme', evaluationType: 'athletisme'}), color: 'focus:ring-red-500' },
        { title: "Gym", icon: <Icons.Gym className="w-12 h-12"/>, action: () => onNavigate({name: 'student_management', title: 'Gym', evaluationType: 'gym'}), color: 'focus:ring-pink-500' },
        { title: "EPS Documents", icon: <Icons.Documents className="w-12 h-12"/>, action: () => onNavigate({name: 'placeholder', title: 'EPS Documents'}), color: 'focus:ring-indigo-500' },
        { title: "Pièces Jointes", icon: <Icons.Attachments className="w-12 h-12"/>, action: () => onNavigate({name: 'placeholder', title: 'Pièces Jointes'}), color: 'focus:ring-teal-500' },
        { title: "Paramètres", icon: <Icons.Settings className="w-12 h-12"/>, action: () => onNavigate({name: 'settings'}), color: 'focus:ring-gray-500' },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 tracking-tight">
                    EPS <span className="text-indigo-600">Zone</span>
                </h1>
                <p className="mt-2 text-lg text-gray-500">Votre assistant personnel pour l'éducation physique et sportive</p>
            </header>
            <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {menuItems.map(item => (
                    <DashboardItem 
                        key={item.title} 
                        title={item.title} 
                        icon={item.icon}
                        onClick={item.action}
                        color={item.color}
                    />
                ))}
            </div>
        </div>
    );
};