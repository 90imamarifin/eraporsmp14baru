export type UserRole = 'super_admin' | 'wali_kelas';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  nip?: string;
  classAssigned?: string; // e.g. "7A", "8B", "9A"
  phone?: string;
  avatar?: string;
  passwordHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  classId: string; // e.g. "7A"
  religion: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  parentName: string;
  address: string;
  phone?: string;
  status: 'aktif' | 'mutasi' | 'lulus';
  // Mid-semester attendance (Sakit, Izin, Alpha)
  sick?: number;
  permitted?: number;
  absent?: number;
  // Catatan perkembangan tengah semester
  waliNote?: string;
  developmentNote?: string; // Catatan perkembangan karakter / Profil Pelajar Pancasila
  updatedAt?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'umum' | 'pilihan' | 'mulok';
  kkm: number; // Kriteria Ketercapaian Tujuan / Standar Kelulusan STS (umumnya 75)
  orderIndex: number;
}

export interface ClassGroup {
  id: string; // e.g. "7.1"
  name: string; // "Kelas 7.1"
  gradeLevel: '7' | '8' | '9';
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  homeroomTeacherNip?: string;
  academicYear: string;
}

export interface STSGrade {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
  semester: '1' | '2';
  stsScore: number; // 0 - 100
  predikat?: 'A' | 'B' | 'C' | 'D';
  catatan: string; // Deskripsi capaian nilai STS tanpa TP
  updatedAt: string;
  updatedBy: string;
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  subDistrict: string; // Kecamatan
  district: string; // Kabupaten
  province: string;
  postalCode: string;
  headmasterName: string;
  headmasterNip: string;
  academicYearActive: string; // e.g. "2024/2025" or "2026/2027"
  semesterActive: '1' | '2'; // 1 = Ganjil, 2 = Genap
  reportDate: string; // e.g. "Tulang Bawang Barat, 10 Oktober 2026"
  phone: string;
  email: string;
  website: string;
  schoolLogo?: string; // Base64 or URL
  districtLogo?: string; // Base64 or URL (Logo Pemkab Tubaba)
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  description: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export interface LegerRow {
  student: Student;
  grades: Record<string, number>; // subjectId -> stsScore
  totalScore: number;
  averageScore: number;
  rank: number;
  sick: number;
  permitted: number;
  absent: number;
  totalAbsent: number;
}
