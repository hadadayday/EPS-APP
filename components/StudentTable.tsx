import React, { useState, useRef, useEffect } from 'react';
import { SchoolClass, Student, AttendanceStatus } from '../types';
import { Icons } from './Icons';
import { DatePickerPopover } from './DatePickerPopover';
import { ConfirmationModal } from './ConfirmationModal';

interface StudentTableProps {
  schoolClass: SchoolClass;
  onUpdateStudent: (studentId: string, field: string, value: any) => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateSessionDate: (sessionIndex: number, date: string) => void;
  evaluationType: 'marquage' | 'default' | 'gym' | 'athletisme';
  selectedYearName?: string;
}

const isEvaluationValid = (value: number | '') => {
  if (value === '') return true;
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 20;
};

const isEvaluationValidMarquage = (value: number | '', max: number) => {
    if (value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= max;
};

export const StudentTable: React.FC<StudentTableProps> = ({ schoolClass, onUpdateStudent, onDeleteStudent, onUpdateSessionDate, evaluationType, selectedYearName }) => {
  const [openDatePickerIndex, setOpenDatePickerIndex] = useState<number | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const is2emeAnneeAthletisme = evaluationType === 'athletisme' && selectedYearName === '2éme année';
  const is3emeAnneeAthletisme = evaluationType === 'athletisme' && selectedYearName === '3éme année';
  const is2emeAnneeGym = evaluationType === 'gym' && selectedYearName === '2éme année';
  const is3emeAnneeGym = evaluationType === 'gym' && selectedYearName === '3éme année';

  useEffect(() => {
    const tableEl = tableRef.current;
    if (!tableEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }
      
      e.preventDefault();

      const focusableSelector = 'button, input, select';
      const focusables = Array.from(
        tableEl.querySelectorAll(focusableSelector)
      ) as HTMLElement[];
      
      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = focusables.indexOf(activeElement);

      if (currentIndex === -1) return;
      
      const sessionDateButtonsCount = schoolClass.sessionDates.length;
      const numEvalInputs = evaluationType === 'gym' ? 3 : 4;
      const elementsPerStudentRow = sessionDateButtonsCount + numEvalInputs + 1; // +1 for delete button

      let nextIndex = -1;

      switch (e.key) {
        case 'ArrowLeft':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusables.length - 1;
          break;
        case 'ArrowRight':
          nextIndex = currentIndex < focusables.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowDown': {
          if (currentIndex < sessionDateButtonsCount) {
            nextIndex = currentIndex + sessionDateButtonsCount;
          } else {
            nextIndex = currentIndex + elementsPerStudentRow;
          }
          break;
        }
        case 'ArrowUp': {
          if (currentIndex >= sessionDateButtonsCount && currentIndex < sessionDateButtonsCount + elementsPerStudentRow) {
            nextIndex = currentIndex - sessionDateButtonsCount;
          } else {
            nextIndex = currentIndex - elementsPerStudentRow;
          }
          break;
        }
      }

      if (nextIndex >= 0 && nextIndex < focusables.length) {
        focusables[nextIndex].focus();
      }
    };

    tableEl.addEventListener('keydown', handleKeyDown);

    return () => {
      tableEl.removeEventListener('keydown', handleKeyDown);
    };
  }, [schoolClass, evaluationType]);


  const getNoteFinale = (evaluation: Student['evaluation']) => {
    const values = [
        evaluation.capaciteSportive,
        evaluation.habiliteMotrice,
        evaluation.connaissancesConceptuelles,
        evaluation.connaissancesComportementales
    ].map(v => {
      if (isEvaluationValid(v) && v !== '') {
        return Number(v);
      }
      return 0;
    });
    const sum = values.reduce((sum, current) => sum + current, 0);
    return sum;
  };

  const getNoteFinaleMarquage = (evaluation: Student['evaluation']) => {
    const values = [
        evaluation.capaciteSportiveIndividuelle,
        evaluation.capaciteSportiveCollective,
        evaluation.connaissancesConceptuellesMarquage,
        evaluation.connaissancesComportementalesMarquage,
    ].map(v => (v !== '' ? Number(v) : 0));
    return values.reduce((sum, current) => sum + current, 0);
  };
  
  const getNoteFinaleAthletisme = (evaluation: Student['evaluation']) => {
    const values = [
        evaluation.capaciteSportive,
        evaluation.habiliteMotrice,
        evaluation.connaissancesConceptuelles,
        evaluation.connaissancesComportementales,
    ].map(v => (v !== '' ? Number(v) : 0));
    return values.reduce((sum, current) => sum + current, 0);
  };

  const getNoteFinaleGym = (evaluation: Student['evaluation']) => {
    const values = [
        evaluation.capaciteHabiliteMotriceGym,
        evaluation.connaissancesConceptuellesGym,
        evaluation.connaissancesComportementalesGym,
    ].map(v => (v !== '' ? Number(v) : 0));
    return values.reduce((sum, current) => sum + current, 0);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const preventInvalidIntegerChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevents entering decimal points, 'e', plus, or minus signs in number inputs.
    if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
        e.preventDefault();
    }
  };

  const handleEvaluationChange = (studentId: string, field: string, value: string, max: number) => {
    if (value === '') {
      onUpdateStudent(studentId, field, '');
      return;
    }
    let numValue = Number(value);
    
    if (isNaN(numValue)) {
      return; // Do not update state if input is not a valid number
    }

    if (numValue > max) {
      numValue = max;
    }
    if (numValue < 0) {
      numValue = 0;
    }
    onUpdateStudent(studentId, field, numValue);
  };

  const attendanceOptions = [
    { value: AttendanceStatus.Present, label: 'P', color: 'bg-green-100 text-green-800' },
    { value: AttendanceStatus.Absent, label: 'A', color: 'bg-red-100 text-red-800' },
    { value: AttendanceStatus.Sick, label: 'M', color: 'bg-yellow-100 text-yellow-800' },
    { value: AttendanceStatus.Late, label: 'R', color: 'bg-blue-100 text-blue-800' },
    { value: AttendanceStatus.Empty, label: '-', color: 'bg-gray-100 text-gray-800' },
  ];

  const evaluationInputClass = (value: number | '') => {
    const baseClasses = "w-full h-full text-center rounded-md shadow-sm bg-blue-100 text-blue-900";
    if (isEvaluationValid(value)) {
        return `${baseClasses} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
    }
    return `${baseClasses} border-2 border-red-500 focus:ring-red-500 focus:border-red-500`;
  };

  const evaluationInputClassMarquage = (value: number | '', max: number) => {
    const baseClasses = "w-full h-full text-center px-1 rounded-md shadow-sm bg-orange-100 text-orange-900 border-transparent focus:ring-indigo-500 focus:border-indigo-500";
    if (isEvaluationValidMarquage(value, max)) {
        return baseClasses;
    }
    return `${baseClasses} border-2 border-red-500 ring-2 ring-red-500`;
  };
  
  const evaluationInputClassAthletisme = (value: number | '', max: number) => {
    let colorClasses = "bg-red-100 text-red-900"; // Default for 1st year
    if (is2emeAnneeAthletisme) {
      colorClasses = "bg-blue-100 text-blue-900";
    } else if (is3emeAnneeAthletisme) {
      colorClasses = "bg-green-100 text-green-900";
    }

    const baseClasses = `w-full h-full text-center px-1 rounded-md shadow-sm ${colorClasses} border-transparent focus:ring-indigo-500 focus:border-indigo-500`;
    if (isEvaluationValidMarquage(value, max)) {
        return baseClasses;
    }
    return `${baseClasses} border-2 border-red-500 ring-2 ring-red-500`;
  };

  const evaluationInputClassGym = (value: number | '', max: number) => {
    let colorClasses = "bg-pink-100 text-pink-900"; // Default
    if (is2emeAnneeGym || is3emeAnneeGym) {
      colorClasses = "bg-blue-100 text-blue-900";
    }
    const baseClasses = `w-full h-full text-center px-1 rounded-md shadow-sm ${colorClasses} border-transparent focus:ring-indigo-500 focus:border-indigo-500`;
    if (isEvaluationValidMarquage(value, max)) {
        return baseClasses;
    }
    return `${baseClasses} border-2 border-red-500 ring-2 ring-red-500`;
  };

  const evaluationHeadersDefault = [
    { key: 'capaciteSportive', label: 'Capacité Sportive' },
    { key: 'habiliteMotrice', label: 'Habilité Motrice' },
    { key: 'connaissancesConceptuelles', label: 'Connaissances Conceptuelles' },
    { key: 'connaissancesComportementales', label: 'Connaissances Comportementales' },
    { key: 'noteFinale', label: 'Note Finale' },
  ]
  
  const evaluationHeadersAthletisme = [
    { key: 'capaciteSportive', label: 'Capacité Sportive' },
    { key: 'habiliteMotrice', label: 'Habilité Motrice' },
    { key: 'connaissancesConceptuelles', label: 'Connaissances Conceptuelles' },
    { key: 'connaissancesComportementales', label: 'Connaissances Comportementales' },
    { key: 'noteFinale', label: 'Note Finale' },
  ];

  const evaluationHeadersGym = [
    { key: 'capaciteHabiliteMotriceGym', label: 'Capacité sportive et habileté motrice' },
    { key: 'connaissancesConceptuellesGym', label: 'Connaissances Conceptuelles' },
    { key: 'connaissancesComportementalesGym', label: 'Connaissances Comportementales' },
    { key: 'noteFinale', label: 'Note Finale' },
  ];

  const renderDefaultEvaluationHeaders = (headers: {key: string, label: string}[], color: string) => (
     <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 align-bottom">N°</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] align-bottom">Noms & Prénoms</th>
            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 align-bottom">Code Massar</th>
            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 align-bottom">Date de Naissance</th>
            
            {schoolClass.sessionDates.map((date, i) => (
              <th key={i} scope="col" className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom w-12">
                <div className="relative flex flex-col items-center justify-between h-36">
                    <span className="font-semibold">{`S${i + 1}`}</span>
                     <button
                        type="button"
                        onClick={() => setOpenDatePickerIndex(openDatePickerIndex === i ? null : i)}
                        className="relative flex flex-col items-center justify-between bg-gray-800 h-28 w-full rounded-lg cursor-pointer hover:bg-gray-700 transition-colors border-2 border-transparent focus-within:ring-2 focus-within:ring-indigo-500 p-2"
                        aria-label={`Date de la séance ${i + 1}`}
                     >
                        <Icons.Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                            className={`text-sm font-medium tracking-wider whitespace-nowrap transform rotate-180 ${date ? 'text-white' : 'text-gray-400'}`}
                        >
                            {date ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'jj/mm/aaaa'}
                        </span>
                    </button>
                     {openDatePickerIndex === i && (
                        <DatePickerPopover
                            currentDate={date}
                            onSelectDate={(newDate) => {
                                onUpdateSessionDate(i, newDate);
                                setOpenDatePickerIndex(null);
                            }}
                            onClose={() => setOpenDatePickerIndex(null)}
                        />
                     )}
                </div>
              </th>
            ))}

            {headers.map((header, index) => (
              <th key={header.key} scope="col" className={`px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom ${color} ${index === 0 ? 'border-l' : ''} ${index === headers.length - 1 ? 'border-r' : ''} border-gray-200`}>
                <div className="flex items-center justify-center h-36">
                  <div className="flex flex-row-reverse items-center justify-center gap-x-0.5">
                    {header.label.split(' ').map((word, wordIndex) => (
                      <span
                        key={wordIndex}
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                        className="transform rotate-180 whitespace-nowrap"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </th>
            ))}
            
            <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12 align-bottom"></th>
          </tr>
        </thead>
  );

  const renderMarquageEvaluationHeaders = () => (
     <thead className="sticky top-0 z-10 text-xs uppercase tracking-wider">
        <tr className="bg-gray-800 text-white">
            <th rowSpan={3} scope="col" className="px-3 py-3 text-left font-medium w-12 align-bottom bg-gray-50 text-gray-500 border-b">N°</th>
            <th rowSpan={3} scope="col" className="px-4 py-3 text-left font-medium min-w-[200px] align-bottom bg-gray-50 text-gray-500 border-b">Noms & Prénoms</th>
            <th rowSpan={3} scope="col" className="px-2 py-3 text-left font-medium w-32 align-bottom bg-gray-50 text-gray-500 border-b">Code Massar</th>
            <th rowSpan={3} scope="col" className="px-2 py-3 text-left font-medium w-24 align-bottom bg-gray-50 text-gray-500 border-b">Date de Naissance</th>
            
            {schoolClass.sessionDates.map((date, i) => (
              <th key={i} rowSpan={3} scope="col" className="px-1 py-2 text-center font-medium w-12 align-bottom bg-gray-50 text-gray-500 border-b">
                <div className="relative flex flex-col items-center justify-between h-full">
                    <span className="font-semibold">{`S${i + 1}`}</span>
                     <button
                        type="button"
                        onClick={() => setOpenDatePickerIndex(openDatePickerIndex === i ? null : i)}
                        className="relative flex flex-col items-center justify-between bg-gray-800 h-28 w-full rounded-lg cursor-pointer hover:bg-gray-700 transition-colors border-2 border-transparent focus-within:ring-2 focus-within:ring-indigo-500 p-2"
                        aria-label={`Date de la séance ${i + 1}`}
                     >
                        <Icons.Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                            className={`text-sm font-medium tracking-wider whitespace-nowrap transform rotate-180 ${date ? 'text-white' : 'text-gray-400'}`}
                        >
                            {date ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'jj/mm/aaaa'}
                        </span>
                    </button>
                     {openDatePickerIndex === i && (
                        <DatePickerPopover
                            currentDate={date}
                            onSelectDate={(newDate) => {
                                onUpdateSessionDate(i, newDate);
                                setOpenDatePickerIndex(null);
                            }}
                            onClose={() => setOpenDatePickerIndex(null)}
                        />
                     )}
                </div>
              </th>
            ))}
            <th colSpan={5} className="px-1 py-1 text-center text-base font-bold border-b border-gray-600">Fiche d'Évaluation</th>
            <th rowSpan={3} scope="col" className="px-2 py-3 text-center font-medium w-12 align-bottom bg-gray-50 text-gray-500 border-b"></th>
        </tr>
        <tr className="bg-gray-800 text-white">
            <th colSpan={2} className="px-1 py-1 font-medium text-center align-middle border-b border-l border-gray-600">
                Capacité sportive<br/>et habileté motrice
            </th>
            <th rowSpan={2} className="px-1 py-1 font-medium text-center align-middle border-b border-l border-gray-600 w-14">
                <div className="flex items-center justify-center h-16">
                    <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="transform rotate-180 leading-tight">Connaissances<br/>Conceptuelles</span>
                </div>
            </th>
            <th rowSpan={2} className="px-1 py-1 font-medium text-center align-middle border-b border-l border-gray-600 w-14">
                 <div className="flex items-center justify-center h-16">
                    <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="transform rotate-180 leading-tight">Connaissances<br/>Comportementales</span>
                </div>
            </th>
            <th rowSpan={2} className="px-1 py-1 font-medium text-center align-middle border-b border-l border-r border-gray-600 w-14">
                 <div className="flex items-center justify-center h-full">
                    <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="transform rotate-180 text-base leading-tight">Note Finale</span>
                </div>
            </th>
        </tr>
        <tr className="bg-gray-800 text-white">
            <th className="px-1 py-1 font-medium text-center align-middle border-b border-l border-gray-600">Indivi.</th>
            <th className="px-1 py-1 font-medium text-center align-middle border-b border-l border-gray-600">Collec.</th>
        </tr>
    </thead>
  );

  return (
    <div className="flex-1 overflow-auto bg-white rounded-lg shadow">
      {studentToDelete && (
        <ConfirmationModal
          title="Confirmer la suppression"
          message={`Êtes-vous sûr de vouloir supprimer l'élève "${studentToDelete.name}" ? Cette action est irréversible.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setStudentToDelete(null)}
          confirmButtonText="Supprimer"
          confirmButtonVariant="danger"
        />
      )}
      <table ref={tableRef} className="min-w-full divide-y divide-gray-200 border-collapse">
        {evaluationType === 'marquage' ? renderMarquageEvaluationHeaders() : 
         evaluationType === 'gym' ? renderDefaultEvaluationHeaders(evaluationHeadersGym, is2emeAnneeGym || is3emeAnneeGym ? 'bg-blue-50' : 'bg-pink-50') : 
         evaluationType === 'athletisme' ? renderDefaultEvaluationHeaders(evaluationHeadersAthletisme, is3emeAnneeAthletisme ? 'bg-green-50' : is2emeAnneeAthletisme ? 'bg-blue-50' : 'bg-red-50') :
         renderDefaultEvaluationHeaders(evaluationHeadersDefault, 'bg-blue-50')}
        <tbody className="bg-white divide-y divide-gray-200">
          {schoolClass.students.length > 0 ? (
            schoolClass.students.map((student, index) => (
            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-500">{index + 1}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <div className="flex items-center">
                  <img className="h-10 w-10 rounded-full" src={student.photoUrl} alt="" />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{student.codeMassar}</td>
              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{student.dob}</td>
              {student.attendance.map((status, i) => {
                const option = attendanceOptions.find(o => o.value === status) || attendanceOptions[4];
                return (
                    <td key={i} className="px-2 py-2 whitespace-nowrap text-center">
                        <select
                            value={status}
                            onChange={(e) => onUpdateStudent(student.id, `attendance.${i}`, e.target.value)}
                            className={`w-full text-center border-none rounded-md text-sm font-semibold focus:ring-2 focus:ring-indigo-500 ${option.color}`}
                        >
                        {attendanceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </td>
                )
              })}
              
              {evaluationType === 'marquage' ? (
                <>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-orange-50 border-l border-gray-200">
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="6" value={student.evaluation.capaciteSportiveIndividuelle} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.capaciteSportiveIndividuelle', e.target.value, 6)} className={evaluationInputClassMarquage(student.evaluation.capaciteSportiveIndividuelle, 6)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/6</span>
                        </div>
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-orange-50">
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="8" value={student.evaluation.capaciteSportiveCollective} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.capaciteSportiveCollective', e.target.value, 8)} className={evaluationInputClassMarquage(student.evaluation.capaciteSportiveCollective, 8)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/8</span>
                        </div>
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-orange-50">
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="3" value={student.evaluation.connaissancesConceptuellesMarquage} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesConceptuellesMarquage', e.target.value, 3)} className={evaluationInputClassMarquage(student.evaluation.connaissancesConceptuellesMarquage, 3)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/3</span>
                        </div>
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-orange-50">
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="3" value={student.evaluation.connaissancesComportementalesMarquage} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesComportementalesMarquage', e.target.value, 3)} className={evaluationInputClassMarquage(student.evaluation.connaissancesComportementalesMarquage, 3)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/3</span>
                        </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-900 bg-orange-100 border-r border-gray-200">
                        {getNoteFinaleMarquage(student.evaluation)} / 20
                    </td>
                </>
              ) : evaluationType === 'gym' ? (
                <>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is2emeAnneeGym || is3emeAnneeGym ? 'bg-blue-50' : 'bg-pink-50'} border-l border-gray-200`}>
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max={is3emeAnneeGym ? 12 : (is2emeAnneeGym ? 13 : 14)} value={student.evaluation.capaciteHabiliteMotriceGym} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.capaciteHabiliteMotriceGym', e.target.value, is3emeAnneeGym ? 12 : (is2emeAnneeGym ? 13 : 14))} className={evaluationInputClassGym(student.evaluation.capaciteHabiliteMotriceGym, is3emeAnneeGym ? 12 : (is2emeAnneeGym ? 13 : 14))} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/{is3emeAnneeGym ? 12 : (is2emeAnneeGym ? 13 : 14)}</span>
                        </div>
                    </td>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is2emeAnneeGym || is3emeAnneeGym ? 'bg-blue-50' : 'bg-pink-50'}`}>
                         <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="3" value={student.evaluation.connaissancesConceptuellesGym} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesConceptuellesGym', e.target.value, 3)} className={evaluationInputClassGym(student.evaluation.connaissancesConceptuellesGym, 3)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/3</span>
                        </div>
                    </td>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is2emeAnneeGym || is3emeAnneeGym ? 'bg-blue-50' : 'bg-pink-50'}`}>
                         <div className="relative h-full flex items-center">
                            <input type="number" min="0" max={is3emeAnneeGym ? 5 : (is2emeAnneeGym ? 4 : 3)} value={student.evaluation.connaissancesComportementalesGym} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesComportementalesGym', e.target.value, is3emeAnneeGym ? 5 : (is2emeAnneeGym ? 4 : 3))} className={evaluationInputClassGym(student.evaluation.connaissancesComportementalesGym, is3emeAnneeGym ? 5 : (is2emeAnneeGym ? 4 : 3))} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/{is3emeAnneeGym ? 5 : (is2emeAnneeGym ? 4 : 3)}</span>
                        </div>
                    </td>
                    <td className={`px-2 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-900 ${is2emeAnneeGym || is3emeAnneeGym ? 'bg-blue-100' : 'bg-pink-100'} border-r border-gray-200`}>
                        {getNoteFinaleGym(student.evaluation)} / 20
                    </td>
                </>
              ) : evaluationType === 'athletisme' ? (
                <>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is3emeAnneeAthletisme ? 'bg-green-50' : is2emeAnneeAthletisme ? 'bg-blue-50' : 'bg-red-50'} border-l border-gray-200`}>
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="6" onKeyDown={preventInvalidIntegerChars} value={student.evaluation.capaciteSportive} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.capaciteSportive', e.target.value, 6)} className={evaluationInputClassAthletisme(student.evaluation.capaciteSportive, 6)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/6</span>
                        </div>
                    </td>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is3emeAnneeAthletisme ? 'bg-green-50' : is2emeAnneeAthletisme ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max={is3emeAnneeAthletisme ? 6 : (is2emeAnneeAthletisme ? 7 : 8)} onKeyDown={preventInvalidIntegerChars} value={student.evaluation.habiliteMotrice} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.habiliteMotrice', e.target.value, is3emeAnneeAthletisme ? 6 : (is2emeAnneeAthletisme ? 7 : 8))} className={evaluationInputClassAthletisme(student.evaluation.habiliteMotrice, is3emeAnneeAthletisme ? 6 : (is2emeAnneeAthletisme ? 7 : 8))} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/{is3emeAnneeAthletisme ? 6 : (is2emeAnneeAthletisme ? 7 : 8)}</span>
                        </div>
                    </td>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is3emeAnneeAthletisme ? 'bg-green-50' : is2emeAnneeAthletisme ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max="3" onKeyDown={preventInvalidIntegerChars} value={student.evaluation.connaissancesConceptuelles} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesConceptuelles', e.target.value, 3)} className={evaluationInputClassAthletisme(student.evaluation.connaissancesConceptuelles, 3)} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/3</span>
                        </div>
                    </td>
                    <td className={`px-1 py-1 whitespace-nowrap text-sm text-gray-500 ${is3emeAnneeAthletisme ? 'bg-green-50' : is2emeAnneeAthletisme ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <div className="relative h-full flex items-center">
                            <input type="number" min="0" max={is3emeAnneeAthletisme ? 5 : (is2emeAnneeAthletisme ? 4 : 3)} onKeyDown={preventInvalidIntegerChars} value={student.evaluation.connaissancesComportementales} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesComportementales', e.target.value, is3emeAnneeAthletisme ? 5 : (is2emeAnneeAthletisme ? 4 : 3))} className={evaluationInputClassAthletisme(student.evaluation.connaissancesComportementales, is3emeAnneeAthletisme ? 5 : (is2emeAnneeAthletisme ? 4 : 3))} />
                            <span className="absolute right-2 text-gray-500 pointer-events-none">/{is3emeAnneeAthletisme ? 5 : (is2emeAnneeAthletisme ? 4 : 3)}</span>
                        </div>
                    </td>
                    <td className={`px-2 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-900 ${is3emeAnneeAthletisme ? 'bg-green-100' : is2emeAnneeAthletisme ? 'bg-blue-100' : 'bg-red-100'} border-r border-gray-200`}>
                        {getNoteFinaleAthletisme(student.evaluation)} / 20
                    </td>
                </>
              ) : (
                <>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-blue-50 border-l border-gray-200">
                        <input type="number" min="0" max="20" value={student.evaluation.capaciteSportive} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.capaciteSportive', e.target.value, 20)} className={evaluationInputClass(student.evaluation.capaciteSportive)} />
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                        <input type="number" min="0" max="20" value={student.evaluation.habiliteMotrice} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.habiliteMotrice', e.target.value, 20)} className={evaluationInputClass(student.evaluation.habiliteMotrice)} />
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                        <input type="number" min="0" max="20" value={student.evaluation.connaissancesConceptuelles} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesConceptuelles', e.target.value, 20)} className={evaluationInputClass(student.evaluation.connaissancesConceptuelles)} />
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-500 bg-blue-50">
                        <input type="number" min="0" max="20" value={student.evaluation.connaissancesComportementales} onChange={(e) => handleEvaluationChange(student.id, 'evaluation.connaissancesComportementales', e.target.value, 20)} className={evaluationInputClass(student.evaluation.connaissancesComportementales)} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-900 bg-blue-100 border-r border-gray-200">
                        {getNoteFinale(student.evaluation)} / 80
                    </td>
                </>
              )}

              <td className="px-2 py-2 whitespace-nowrap text-center">
                <button onClick={() => setStudentToDelete(student)} className="text-red-500 hover:text-red-700 p-1">
                    <Icons.Trash className="w-5 h-5"/>
                </button>
              </td>
            </tr>
            ))
          ) : (
            <tr>
              <td colSpan={20} className="px-6 py-16 text-center text-gray-500">
                <Icons.Search className="w-12 h-12 mx-auto text-gray-300" />
                <h3 className="mt-2 text-lg font-medium">Aucun élève trouvé</h3>
                <p className="mt-1 text-sm text-gray-400">Essayez de modifier votre recherche ou d'ajouter un nouvel élève.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};