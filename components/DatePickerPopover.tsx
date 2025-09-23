import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface DatePickerPopoverProps {
  currentDate: string | null;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const useOnClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({ currentDate, onSelectDate, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(popoverRef, onClose);

  const initialDate = currentDate ? new Date(currentDate + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  
  const daysOfWeek = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  const monthNames = [ "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7; // Monday is 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const selected = new Date(year, month, day);
    onSelectDate(selected.toISOString().split('T')[0]);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  };

  const isSelected = (day: number) => {
    if (!currentDate) return false;
    const selectedDate = new Date(currentDate + 'T00:00:00');
    return year === selectedDate.getFullYear() && month === selectedDate.getMonth() && day === selectedDate.getDate();
  };

  return (
    <div ref={popoverRef} className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-2xl p-4 z-60 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-100">
          <Icons.ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{`${monthNames[month]} ${year}`}</span>
        <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <Icons.ChevronLeft className="w-5 h-5 text-gray-600 transform rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const todayClass = isToday(day) ? 'border-indigo-500' : 'border-transparent';
          const selectedClass = isSelected(day) ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-gray-100 text-gray-700';
          
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors border ${todayClass} ${selectedClass}`}
            >
              {day}
            </button>
          );
        })}
      </div>
       <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};