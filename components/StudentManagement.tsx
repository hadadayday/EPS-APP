
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SchoolYear, SchoolClass, Student, AttendanceStatus, Evaluation } from '../types';
import { INITIAL_SCHOOL_DATA } from '../constants';
import { StudentTable } from './StudentTable';
import { AddClassModal } from './AddClassModal';
import { AddStudentModal } from './AddStudentModal';
import { Icons } from './Icons';
import { ConfirmationModal } from './ConfirmationModal';

// Make XLSX available from the script loaded in index.html
declare var XLSX: any;

const parseDate = (dateValue: any): string => {
    if (!dateValue) return '';

    let date: Date | null = null;
    
    if (dateValue instanceof Date) {
        date = dateValue;
    } else if (typeof dateValue === 'number') {
        // Excel serial date number. It's UTC-based.
        date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
    } else {
        const dateStr = String(dateValue).trim();
        // Match DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (dmyMatch) {
            const [, day, month, year] = dmyMatch;
            // Create date in UTC to avoid timezone issues
            date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
        } else {
            // For other formats like YYYY-MM-DD or 12-May-2010, Date.parse works well
            const parsed = Date.parse(dateStr);
            if (!isNaN(parsed)) {
                // The parsed date might have a timezone. We need to normalize it to UTC.
                const tempDate = new Date(parsed);
                date = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()));
            }
        }
    }

    if (date && !isNaN(date.getTime())) {
        // Since we created the date in UTC, we can safely format it to YYYY-MM-DD
        return date.toISOString().split('T')[0];
    }

    return ''; // Return empty string for invalid or unparseable dates
};


interface StudentManagementProps {
    title: string;
    onBack: () => void;
    evaluationType: 'marquage' | 'default' | 'gym' | 'athletisme';
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ title, onBack, evaluationType }) => {
  const [allSchoolData, setAllSchoolData] = useState<{ [key: string]: SchoolYear[] }>(() => {
    try {
      const savedData = localStorage.getItem('school-management-data-v2');
      return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      console.error('Could not load school data from local storage', e);
      return {};
    }
  });

  const schoolData = useMemo(() => {
    return allSchoolData[title] || INITIAL_SCHOOL_DATA;
  }, [allSchoolData, title]);

  const [selectedYearId, setSelectedYearId] = useState<string | null>(schoolData[0]?.id || null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  const [isAddClassModalOpen, setAddClassModalOpen] = useState(false);
  const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize data for the current section if it doesn't exist.
    if (!allSchoolData[title]) {
      setAllSchoolData(prev => ({
        ...prev,
        [title]: INITIAL_SCHOOL_DATA,
      }));
    }
  }, [title, allSchoolData]);

  useEffect(() => {
    try {
      localStorage.setItem('school-management-data-v2', JSON.stringify(allSchoolData));
    } catch (e) {
      console.error('Could not save school data to local storage', e);
    }
  }, [allSchoolData]);
  
  useEffect(() => {
    const year = schoolData.find(y => y.id === selectedYearId);
    const currentClassExists = year?.classes.some(c => c.id === selectedClassId);
    if (!currentClassExists) {
        setSelectedClassId(year?.classes[0]?.id || null);
    }
  }, [selectedYearId, schoolData, selectedClassId]);


  const updateCurrentSectionData = (updater: (prevSectionData: SchoolYear[]) => SchoolYear[]) => {
    setAllSchoolData(prevAllData => {
      const currentSectionData = prevAllData[title] || INITIAL_SCHOOL_DATA;
      const updatedSectionData = updater(currentSectionData);
      return {
        ...prevAllData,
        [title]: updatedSectionData,
      };
    });
  };

  const selectedYear = useMemo(() => {
    return schoolData.find(y => y.id === selectedYearId);
  }, [schoolData, selectedYearId]);

  const selectedClass = useMemo(() => {
    if (!selectedYearId || !selectedClassId) return null;
    const year = schoolData.find(y => y.id === selectedYearId);
    return year?.classes.find(c => c.id === selectedClassId) || null;
  }, [schoolData, selectedYearId, selectedClassId]);

  const filteredClass = useMemo(() => {
    if (!selectedClass) return null;
    if (!searchQuery.trim()) return selectedClass;

    const lowercasedQuery = searchQuery.toLowerCase();
    const filteredStudents = selectedClass.students.filter(student =>
      student.name.toLowerCase().includes(lowercasedQuery)
    );
    
    return { ...selectedClass, students: filteredStudents };
  }, [selectedClass, searchQuery]);

  const handleAddClass = (name: string) => {
    if (!selectedYearId) return;
    const newClass: SchoolClass = { id: `class-${Date.now()}`, name, students: [], sessionDates: Array(10).fill(null) };
    updateCurrentSectionData(prevData =>
      prevData.map(year =>
        year.id === selectedYearId
          ? { ...year, classes: [...year.classes, newClass] }
          : year
      )
    );
    setSelectedClassId(newClass.id);
    setAddClassModalOpen(false);
  };

  const handleDeleteClass = (classId: string) => {
     if (!selectedYearId) return;
     const year = schoolData.find(y => y.id === selectedYearId);
     const classObj = year?.classes.find(c => c.id === classId);
     if (classObj) {
         setClassToDelete(classObj);
     }
  };

  const handleConfirmDeleteClass = () => {
    if (!selectedYearId || !classToDelete) return;

    updateCurrentSectionData(prevData =>
        prevData.map(year =>
            year.id === selectedYearId
                ? { ...year, classes: year.classes.filter(c => c.id !== classToDelete.id) }
                : year
        )
    );

    if (selectedClassId === classToDelete.id) {
        const yearData = schoolData.find(y => y.id === selectedYearId);
        const remainingClasses = yearData?.classes.filter(c => c.id !== classToDelete.id);
        setSelectedClassId(remainingClasses?.[0]?.id || null);
    }
    setClassToDelete(null);
  };

  const handleAddStudent = (name: string, codeMassar: string, dob: string, photoUrl: string | null) => {
    if (!selectedYearId || !selectedClassId) return;
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name,
      codeMassar,
      dob,
      photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
      attendance: Array(10).fill(AttendanceStatus.Empty),
      evaluation: {
        capaciteSportive: '',
        habiliteMotrice: '',
        connaissancesConceptuelles: '',
        connaissancesComportementales: '',
        capaciteSportiveIndividuelle: '',
        capaciteSportiveCollective: '',
        connaissancesConceptuellesMarquage: '',
        connaissancesComportementalesMarquage: '',
        capaciteHabiliteMotriceGym: '',
        connaissancesConceptuellesGym: '',
        connaissancesComportementalesGym: '',
      },
    };
    updateCurrentSectionData(prevData =>
      prevData.map(year =>
        year.id === selectedYearId
          ? {
              ...year,
              classes: year.classes.map(c =>
                c.id === selectedClassId
                  ? { ...c, students: [...c.students, newStudent] }
                  : c
              ),
            }
          : year
      )
    );
    setAddStudentModalOpen(false);
  };
  
  const handleDeleteStudent = (studentId: string) => {
    if (!selectedYearId || !selectedClassId) return;
    updateCurrentSectionData(prevData => 
        prevData.map(year => 
            year.id === selectedYearId ? {
                ...year,
                classes: year.classes.map(c => 
                    c.id === selectedClassId ? {
                        ...c,
                        students: c.students.filter(s => s.id !== studentId)
                    } : c
                )
            } : year
        )
    );
  };

  const handleUpdateStudent = (studentId: string, field: string, value: any) => {
    updateCurrentSectionData(prevData =>
      prevData.map(year =>
        year.id === selectedYearId
          ? {
              ...year,
              classes: year.classes.map(c =>
                c.id === selectedClassId
                  ? {
                      ...c,
                      students: c.students.map(s => {
                        if (s.id !== studentId) return s;
                        
                        if (field.startsWith('evaluation.')) {
                            const subField = field.split('.')[1] as keyof Student['evaluation'];
                            const numValue = value === '' ? '' : Number(value);
                            return { ...s, evaluation: { ...s.evaluation, [subField]: numValue } };
                        }
                        if (field.startsWith('attendance.')) {
                            const index = parseInt(field.split('.')[1]);
                            const newAttendance = [...s.attendance];
                            newAttendance[index] = value;
                            return { ...s, attendance: newAttendance };
                        }
                        // This case is not used in the current app but good to have
                        const studentField = field as keyof Student;
                        return { ...s, [studentField]: value };
                      }),
                    }
                  : c
              ),
            }
          : year
      )
    );
  };

  const handleUpdateSessionDate = (sessionIndex: number, date: string) => {
    if (!selectedYearId || !selectedClassId) return;

    updateCurrentSectionData(prevData =>
        prevData.map(year =>
            year.id === selectedYearId
            ? {
                ...year,
                classes: year.classes.map(c => {
                    if (c.id !== selectedClassId) return c;
                    
                    const newSessionDates = [...c.sessionDates];
                    newSessionDates[sessionIndex] = date;
                    return { ...c, sessionDates: newSessionDates };
                }),
                }
            : year
        )
    );
  };

  const handleExportCSV = () => {
    if (!selectedClass) return;

    const escapeCSV = (value: any): string => {
        const stringValue = String(value === null || value === undefined ? '' : value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };
    
    let headers: string[] = [];
    let studentRows: string[] = [];
    const baseHeaders = ['N°', 'Noms & Prénoms', 'Code Massar', 'Date de Naissance', ...selectedClass.sessionDates.map((_, i) => `S${i + 1}`)];

    if (evaluationType === 'gym') {
        // Fix: Explicitly type the accumulator 'sum' as a number to resolve ambiguity in type inference for the reduce function.
        const getNoteFinaleGym = (evaluation: Evaluation) => [
            evaluation.capaciteHabiliteMotriceGym,
            evaluation.connaissancesConceptuellesGym,
            evaluation.connaissancesComportementalesGym,
        ].reduce((sum: number, v) => sum + Number(v || 0), 0);

        headers = [...baseHeaders, 'Capacité sportive et habileté motrice', 'Connaissances Conceptuelles', 'Connaissances Comportementales', 'Note Finale'];
        studentRows = selectedClass.students.map((s, i) => [
            i + 1, s.name, s.codeMassar, s.dob, ...s.attendance,
            s.evaluation.capaciteHabiliteMotriceGym, s.evaluation.connaissancesConceptuellesGym, s.evaluation.connaissancesComportementalesGym, getNoteFinaleGym(s.evaluation)
        ].map(escapeCSV).join(','));

    } else if (evaluationType === 'marquage') {
        // Fix: Explicitly type the accumulator 'sum' as a number to resolve ambiguity in type inference for the reduce function.
        const getNoteFinaleMarquage = (evaluation: Evaluation) => [
            evaluation.capaciteSportiveIndividuelle, evaluation.capaciteSportiveCollective, evaluation.connaissancesConceptuellesMarquage, evaluation.connaissancesComportementalesMarquage
        ].reduce((sum: number, v) => sum + Number(v || 0), 0);
        
        headers = [...baseHeaders, 'Capacité Sportive (Individuelle)', 'Capacité Sportive (Collective)', 'Connaissances Conceptuelles', 'Connaissances Comportementales', 'Note Finale'];
        studentRows = selectedClass.students.map((s, i) => [
            i + 1, s.name, s.codeMassar, s.dob, ...s.attendance,
            s.evaluation.capaciteSportiveIndividuelle, s.evaluation.capaciteSportiveCollective, s.evaluation.connaissancesConceptuellesMarquage, s.evaluation.connaissancesComportementalesMarquage, getNoteFinaleMarquage(s.evaluation)
        ].map(escapeCSV).join(','));
    
    } else if (evaluationType === 'athletisme') {
        // Fix: Explicitly type the accumulator 'sum' as a number to resolve ambiguity in type inference for the reduce function.
        const getNoteFinaleAthletisme = (evaluation: Evaluation) => [
            evaluation.capaciteSportive,
            evaluation.habiliteMotrice,
            evaluation.connaissancesConceptuelles,
            evaluation.connaissancesComportementales
        ].reduce((sum: number, v) => sum + Number(v || 0), 0);

        headers = [...baseHeaders, 'Capacité sportive', 'Habilité motrice', 'Connaissances conceptuelles', 'Connaissances comportementales', 'Note Finale'];
        studentRows = selectedClass.students.map((s, i) => [
            i + 1, s.name, s.codeMassar, s.dob, ...s.attendance,
            s.evaluation.capaciteSportive, s.evaluation.habiliteMotrice, s.evaluation.connaissancesConceptuelles, s.evaluation.connaissancesComportementales, getNoteFinaleAthletisme(s.evaluation)
        ].map(escapeCSV).join(','));

    } else { // default
        // Fix: Explicitly type the accumulator 'sum' as a number to resolve ambiguity in type inference for the reduce function.
        const getNoteFinaleDefault = (evaluation: Evaluation) => [
            evaluation.capaciteSportive, evaluation.habiliteMotrice, evaluation.connaissancesConceptuelles, evaluation.connaissancesComportementales
        ].reduce((sum: number, v) => sum + Number(v || 0), 0);

        headers = [...baseHeaders, 'Capacité sportive', 'Habilité motrice', 'Connaissances conceptuelles', 'Connaissances comportementales', 'Note Finale'];
        studentRows = selectedClass.students.map((s, i) => [
            i + 1, s.name, s.codeMassar, s.dob, ...s.attendance,
            s.evaluation.capaciteSportive, s.evaluation.habiliteMotrice, s.evaluation.connaissancesConceptuelles, s.evaluation.connaissancesComportementales, getNoteFinaleDefault(s.evaluation)
        ].map(escapeCSV).join(','));
    }

    const csvContent = [headers.join(','), ...studentRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `export_${title.replace(/\s+/g, '_')}_${selectedClass.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const resetInput = () => {
      if (event.target) event.target.value = '';
    };

    if (!file || !selectedYearId || !selectedClassId || !selectedClass) {
      resetInput();
      return;
    }

    const processStudents = (newStudentsData: { name: string, codeMassar: string, dob: string, rowIndex: number }[]) => {
      const validNewStudents: Student[] = [];
      const errors: string[] = [];
      const existingCodeMassars = new Set(selectedClass.students.map(s => s.codeMassar).filter(Boolean));
      const fileCodeMassars = new Set<string>();

      for (const studentData of newStudentsData) {
          const { name, codeMassar, dob, rowIndex } = studentData;
          let rowHasError = false;

          if (!name) {
              errors.push(`Ligne ${rowIndex}: Le nom de l'élève est manquant.`);
              rowHasError = true;
          }
          if (!dob) {
              errors.push(`Ligne ${rowIndex}: La date de naissance est manquante ou invalide.`);
              rowHasError = true;
          }
          if (codeMassar) {
              if (existingCodeMassars.has(codeMassar) || fileCodeMassars.has(codeMassar)) {
                  errors.push(`Ligne ${rowIndex}: Le Code Massar '${codeMassar}' est dupliqué.`);
                  rowHasError = true;
              } else {
                 fileCodeMassars.add(codeMassar);
              }
          }
          
          if (!rowHasError) {
              validNewStudents.push({
                  id: `student-${Date.now()}-${rowIndex}`,
                  name,
                  codeMassar,
                  dob,
                  photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
                  attendance: Array(10).fill(AttendanceStatus.Empty),
                  evaluation: {
                      capaciteSportive: '', habiliteMotrice: '', connaissancesConceptuelles: '', connaissancesComportementales: '',
                      capaciteSportiveIndividuelle: '', capaciteSportiveCollective: '', connaissancesConceptuellesMarquage: '', connaissancesComportementalesMarquage: '',
                      capaciteHabiliteMotriceGym: '', connaissancesConceptuellesGym: '', connaissancesComportementalesGym: '',
                  },
              });
          }
      }

      if (errors.length > 0) {
        alert(`L'importation a échoué avec les erreurs suivantes :\n\n- ${errors.join('\n- ')}\n\nVeuillez corriger le fichier et réessayer.`);
        return;
      }

      if (validNewStudents.length > 0) {
        updateCurrentSectionData(prevData =>
            prevData.map(year =>
            year.id === selectedYearId
                ? {
                    ...year,
                    classes: year.classes.map(c =>
                        c.id === selectedClassId
                        ? { ...c, students: [...c.students, ...validNewStudents] }
                        : c
                    ),
                    }
                : year
            )
        );
      } else if (newStudentsData.length > 0) {
        alert("Aucun élève valide n'a été trouvé dans le fichier. Veuillez vérifier les données.");
      }
    };

    const reader = new FileReader();

    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.onload = (e) => {
            try {
                const csvContent = e.target?.result as string;
                const rows = csvContent.split(/\r?\n/).filter(row => row.trim() !== '');
                if (rows.length < 2) {
                    alert("Le fichier CSV est vide ou ne contient que les en-têtes.");
                    return;
                }

                const headerRow = rows[0].split(',').map(h => h.trim());
                const dataRows = rows.slice(1);
                
                const requiredHeaders = ['Code Massar', 'Nom & Prénom', 'Date de Naissance'];
                const headerIndices: { [key: string]: number } = {};
                requiredHeaders.forEach(h => {
                    const index = headerRow.findIndex(headerCell => headerCell.toLowerCase() === h.toLowerCase());
                    if(index !== -1) headerIndices[h] = index;
                });

                if (Object.keys(headerIndices).length !== requiredHeaders.length) {
                    alert(`Format de fichier CSV incorrect. Les en-têtes requis sont : ${requiredHeaders.join(', ')}.`);
                    return;
                }
                
                const newStudentsData = dataRows.map((row, i) => {
                    const cells = row.split(',').map(cell => cell.trim());
                    return {
                        codeMassar: cells[headerIndices['Code Massar']] || '',
                        name: cells[headerIndices['Nom & Prénom']] || '',
                        dob: parseDate(cells[headerIndices['Date de Naissance']] || ''),
                        rowIndex: i + 2,
                    };
                });
                
                processStudents(newStudentsData);

            } catch (error) {
                console.error("Erreur lors de la lecture du fichier CSV :", error);
                alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous qu'il est au bon format.");
            } finally {
                resetInput();
            }
        };
        reader.readAsText(file);
    } else { // Handle Excel files
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
                
                if (!json || json.length < 2) {
                    alert("Le fichier est vide ou ne contient que les en-têtes.");
                    return;
                }
                
                const headerRow = json[0].map(h => String(h).trim());
                const dataRows = json.slice(1);

                const requiredHeaders = ['Code Massar', 'Nom & Prénom', 'Date de Naissance'];
                const headerIndices: { [key: string]: number } = {};

                requiredHeaders.forEach(h => {
                    const index = headerRow.findIndex(headerCell => headerCell.toLowerCase() === h.toLowerCase());
                    if (index !== -1) headerIndices[h] = index;
                });

                if (Object.keys(headerIndices).length !== requiredHeaders.length) {
                    alert(`Format de fichier Excel incorrect. Les en-têtes requis sont : ${requiredHeaders.join(', ')}.`);
                    return;
                }

                const newStudentsData = dataRows.filter(row => row && row.length > 0 && !row.every(c => !c))
                .map((row, i) => ({
                    codeMassar: String(row[headerIndices['Code Massar']] || '').trim(),
                    name: String(row[headerIndices['Nom & Prénom']] || '').trim(),
                    dob: parseDate(row[headerIndices['Date de Naissance']]),
                    rowIndex: i + 2,
                }));
                
                processStudents(newStudentsData);

            } catch (error) {
                console.error("Erreur lors de la lecture du fichier Excel :", error);
                alert("Une erreur est survenue lors de la lecture du fichier. Assurez-vous qu'il est au bon format.");
            } finally {
                resetInput();
            }
        };
        reader.readAsBinaryString(file);
    }

    reader.onerror = (error) => {
        console.error("Erreur du FileReader :", error);
        alert("Erreur lors de la lecture du fichier.");
        resetInput();
    };
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isAddClassModalOpen && (
        <AddClassModal
          onAdd={handleAddClass}
          onClose={() => setAddClassModalOpen(false)}
        />
      )}
      {isAddStudentModalOpen && (
        <AddStudentModal
          onAdd={handleAddStudent}
          onClose={() => setAddStudentModalOpen(false)}
        />
      )}
      {classToDelete && (
          <ConfirmationModal
            title="Confirmer la suppression"
            message={`Êtes-vous sûr de vouloir supprimer la classe "${classToDelete.name}" ? Tous les élèves de cette classe seront également supprimés. Cette action est irréversible.`}
            onConfirm={handleConfirmDeleteClass}
            onCancel={() => setClassToDelete(null)}
            confirmButtonText="Supprimer"
            confirmButtonVariant="danger"
          />
      )}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
           <div className="flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <Icons.ChevronLeft className="w-6 h-6 text-gray-600"/>
                </button>
                <h1 className="ml-4 text-2xl font-bold text-gray-800">{title}</h1>
           </div>
           <div className="flex items-center space-x-2">
                <button onClick={handleExportCSV} disabled={!selectedClass || selectedClass.students.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <Icons.Export className="w-5 h-5"/>
                    <span>Exporter</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    className="hidden"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
                <button onClick={() => fileInputRef.current?.click()} disabled={!selectedClass} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <Icons.Import className="w-5 h-5"/>
                    <span>Importer</span>
                </button>
           </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <select value={selectedYearId || ''} onChange={e => setSelectedYearId(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    {schoolData.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
                </select>
                 <div className="flex items-center gap-1">
                    {schoolData.find(y => y.id === selectedYearId)?.classes.map(c => (
                        <div key={c.id} className="relative group">
                            <button
                                onClick={() => setSelectedClassId(c.id)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedClassId === c.id ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                            >
                                {c.name}
                            </button>
                            <button onClick={() => handleDeleteClass(c.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                                <Icons.X className="w-3 h-3"/>
                            </button>
                        </div>
                    ))}
                 </div>
                <button onClick={() => setAddClassModalOpen(true)} className="flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors">
                    <Icons.PlusCircle className="w-6 h-6"/>
                </button>
              </div>
              <div className="flex-1 max-w-sm">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Icons.Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                       type="text"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                       placeholder="Rechercher un élève..."
                    />
                 </div>
              </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-4">
        {filteredClass ? (
          <div className="h-full flex flex-col">
            <div className="mb-4 flex justify-end">
              <button onClick={() => setAddStudentModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Icons.UserPlus className="w-5 h-5 mr-2" />
                Ajouter un élève
              </button>
            </div>
            <StudentTable
              schoolClass={filteredClass}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onUpdateSessionDate={handleUpdateSessionDate}
              evaluationType={evaluationType}
              selectedYearName={selectedYear?.name}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Icons.Select className="w-24 h-24 text-gray-300" />
            <h3 className="mt-4 text-xl font-medium">Aucune classe sélectionnée</h3>
            <p className="mt-1 text-sm">Veuillez sélectionner une année et une classe, ou en ajouter une nouvelle pour commencer.</p>
          </div>
        )}
      </main>
    </div>
  );
};
