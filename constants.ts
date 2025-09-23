
import { SchoolYear, AttendanceStatus } from './types';

export const INITIAL_SCHOOL_DATA: SchoolYear[] = [
  {
    id: 'year-1',
    name: '1ére année',
    classes: [
      {
        id: 'class-1a',
        name: 'Classe 1A',
        sessionDates: Array(10).fill(null),
        students: [
          {
            id: 'student-1',
            name: 'Jean Dupont',
            codeMassar: '',
            dob: '2010-05-15',
            photoUrl: 'https://picsum.photos/seed/student1/100/100',
            attendance: Array(10).fill(AttendanceStatus.Empty) as AttendanceStatus[],
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
          },
        ],
      },
    ],
  },
  {
    id: 'year-2',
    name: '2éme année',
    classes: [],
  },
  {
    id: 'year-3',
    name: '3éme année',
    classes: [],
  },
];