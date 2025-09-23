
import React from 'react';
import { Icons } from './Icons';

interface PlaceholderProps {
    title: string;
    onBack: () => void;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ title, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <Icons.Whistle className="w-24 h-24 mx-auto text-indigo-400" />
            <h2 className="mt-6 text-3xl font-bold text-gray-800">{title}</h2>
            <p className="mt-2 text-lg text-gray-600">Cette fonctionnalité sera bientôt disponible !</p>
            <p className="mt-1 text-gray-500">Nous travaillons dur pour vous apporter de nouveaux outils extraordinaires.</p>
            <button
                onClick={onBack}
                className="mt-8 flex items-center bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <Icons.ChevronLeft className="w-5 h-5 mr-2" />
                Retour au tableau de bord
            </button>
        </div>
    );
};
