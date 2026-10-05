// Grade progression helpers for the re-enrollment cycle.

export const GRADES_BY_LEVEL = {
  'Kindergarten': ['Kinder'],
  'Elementary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  'Junior High School': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  'Senior High School': ['Grade 11', 'Grade 12'],
};

const ORDER = ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

// All admittable grades (Kinder is handled face-to-face, so it's excluded here).
export const ALL_GRADES = ORDER.filter((g) => g !== 'Kinder');

// The next grade up, or null if there's none (i.e. the student graduates).
export function nextGrade(grade) {
  const i = ORDER.indexOf(grade);
  return (i < 0 || i === ORDER.length - 1) ? null : ORDER[i + 1];
}

// Which level a specific grade belongs to.
export function levelOfGrade(grade) {
  if (grade === 'Kinder') return 'Kindergarten';
  const n = parseInt(String(grade).replace(/\D/g, ''), 10);
  if (n >= 1 && n <= 6) return 'Elementary';
  if (n >= 7 && n <= 10) return 'Junior High School';
  if (n >= 11 && n <= 12) return 'Senior High School';
  return '';
}

// Senior High grades require a strand.
export const SHS_STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'];
export const isSHSGrade = (grade) => levelOfGrade(grade) === 'Senior High School';

// "2026-2027" -> "2027-2028".
export function nextSchoolYear(sy) {
  const m = String(sy || '').match(/(\d{4})-(\d{4})/);
  return m ? `${+m[1] + 1}-${+m[2] + 1}` : sy;
}
