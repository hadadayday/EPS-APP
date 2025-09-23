
import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { Placeholder } from './components/Placeholder';
import { Settings } from './components/Settings';

type View = 
  | { name: 'dashboard' }
  | { name: 'student_management', title: string, evaluationType: 'marquage' | 'default' | 'gym' | 'athletisme' }
  | { name: 'settings' }
  | { name: 'placeholder', title: string };

function App() {
  const [currentView, setCurrentView] = useState<View>({ name: 'dashboard' });

  const renderView = () => {
    switch (currentView.name) {
      case 'student_management':
        return <StudentManagement title={currentView.title} onBack={() => setCurrentView({ name: 'dashboard' })} evaluationType={currentView.evaluationType} />;
      case 'settings':
        return <Settings onBack={() => setCurrentView({ name: 'dashboard' })} onNavigate={setCurrentView} />;
      case 'placeholder':
        return <Placeholder title={currentView.title} onBack={() => setCurrentView({ name: 'dashboard' })} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen antialiased font-sans">
      {renderView()}
    </div>
  );
}

export default App;
