
export enum AttendanceStatus {
  Present = 'P',
  Absent = 'A',
  Sick = 'M',
  Late = 'R',
  Empty = '',
}

export interface Evaluation {
  // Default evaluation
  capaciteSportive: number | '';
  habiliteMotrice: number | '';
  connaissancesConceptuelles: number | '';
  connaissancesComportementales: number | '';

  // Marquage evaluation
  capaciteSportiveIndividuelle: number | '';
  capaciteSportiveCollective: number | '';
  connaissancesConceptuellesMarquage: number | '';
  connaissancesComportementalesMarquage: number | '';

  // Gym evaluation
  capaciteHabiliteMotriceGym: number | '';
  connaissancesConceptuellesGym: number | '';
  connaissancesComportementalesGym: number | '';
}

export interface Student {
  id: string;
  photoUrl: string;
  name: string;
  codeMassar: string;
  dob: string;
  attendance: AttendanceStatus[];
  evaluation: Evaluation;
}

export interface SchoolClass {
  id: string;
  name: string;
  students: Student[];
  sessionDates: (string | null)[];
}

export interface SchoolYear {
  id: string;
  name: string;
  classes: SchoolClass[];
}