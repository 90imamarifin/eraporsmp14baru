import { ClassGroup, SchoolProfile, Student, Subject, User, STSGrade, AuditLog } from '../types';

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  name: 'SMP NEGERI 14 TULANG BAWANG BARAT',
  npsn: '69896014',
  address: 'Jl. Poros Marga Kencana, Tiyuh Marga Kencana',
  subDistrict: 'Tulang Bawang Udik',
  district: 'Tulang Bawang Barat',
  province: 'Lampung',
  postalCode: '34591',
  headmasterName: 'Suyanto, S.Pd., M.M.',
  headmasterNip: '19740512 200003 1 004',
  academicYearActive: '2026/2027',
  semesterActive: '1',
  reportDate: '10 Oktober 2026',
  phone: '(0726) 7891234',
  email: 'smpn14tubaba@kemdikbud.go.id',
  website: 'https://smpn14tubaba.sch.id',
};

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'pai', code: 'PAI', name: 'Pendidikan Agama Islam dan Budi Pekerti', category: 'umum', kkm: 75, orderIndex: 1 },
  { id: 'pak', code: 'PAK', name: 'Pendidikan Agama Kristen dan Budi Pekerti', category: 'umum', kkm: 75, orderIndex: 2 },
  { id: 'pkat', code: 'PKAT', name: 'Pendidikan Agama Katolik dan Budi Pekerti', category: 'umum', kkm: 75, orderIndex: 3 },
  { id: 'pah', code: 'PAH', name: 'Pendidikan Agama Hindu dan Budi Pekerti', category: 'umum', kkm: 75, orderIndex: 4 },
  { id: 'pab', code: 'PAB', name: 'Pendidikan Agama Buddha dan Budi Pekerti', category: 'umum', kkm: 75, orderIndex: 5 },
  { id: 'pp', code: 'PP', name: 'Pendidikan Pancasila', category: 'umum', kkm: 75, orderIndex: 6 },
  { id: 'bind', code: 'BIND', name: 'Bahasa Indonesia', category: 'umum', kkm: 75, orderIndex: 7 },
  { id: 'mat', code: 'MAT', name: 'Matematika', category: 'umum', kkm: 72, orderIndex: 8 },
  { id: 'ipa', code: 'IPA', name: 'Ilmu Pengetahuan Alam (IPA)', category: 'umum', kkm: 75, orderIndex: 9 },
  { id: 'ips', code: 'IPS', name: 'Ilmu Pengetahuan Sosial (IPS)', category: 'umum', kkm: 75, orderIndex: 10 },
  { id: 'bing', code: 'BING', name: 'Bahasa Inggris', category: 'umum', kkm: 75, orderIndex: 11 },
  { id: 'pjok', code: 'PJOK', name: 'PJOK', category: 'umum', kkm: 75, orderIndex: 12 },
  { id: 'inf', code: 'INF', name: 'Informatika', category: 'umum', kkm: 75, orderIndex: 13 },
  { id: 'sb', code: 'PRAK', name: 'Prakarya', category: 'pilihan', kkm: 75, orderIndex: 14 },
  { id: 'lampung', code: 'BAL', name: 'Bahasa dan Aksara Lampung', category: 'mulok', kkm: 75, orderIndex: 15 },
  { id: 'tubaba', code: 'PKT', name: 'Pendidikan Karakter Tubaba', category: 'mulok', kkm: 75, orderIndex: 16 },
];

// Exact 12 classes requested: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4
export const INITIAL_CLASSES: ClassGroup[] = [
  { id: '7.1', name: 'Kelas 7.1', gradeLevel: '7', homeroomTeacherId: 'user_wali_7_1', homeroomTeacherName: 'Ahmad Fauzi, S.Pd.', academicYear: '2026/2027' },
  { id: '7.2', name: 'Kelas 7.2', gradeLevel: '7', homeroomTeacherId: 'user_wali_7_2', homeroomTeacherName: 'Siti Aminah, S.Pd.Gr.', academicYear: '2026/2027' },
  { id: '7.3', name: 'Kelas 7.3', gradeLevel: '7', homeroomTeacherId: 'user_wali_7_3', homeroomTeacherName: 'Rian Hidayat, S.Pd.', academicYear: '2026/2027' },
  { id: '7.4', name: 'Kelas 7.4', gradeLevel: '7', homeroomTeacherId: 'user_wali_7_4', homeroomTeacherName: 'Nurhasanah, S.Pd.', academicYear: '2026/2027' },
  { id: '8.1', name: 'Kelas 8.1', gradeLevel: '8', homeroomTeacherId: 'user_wali_8_1', homeroomTeacherName: 'Budi Hartono, M.Pd.', academicYear: '2026/2027' },
  { id: '8.2', name: 'Kelas 8.2', gradeLevel: '8', homeroomTeacherId: 'user_wali_8_2', homeroomTeacherName: 'Dewi Sartika, S.Pd.', academicYear: '2026/2027' },
  { id: '8.3', name: 'Kelas 8.3', gradeLevel: '8', homeroomTeacherId: 'user_wali_8_3', homeroomTeacherName: 'Hendra Gunawan, S.Pd.', academicYear: '2026/2027' },
  { id: '8.4', name: 'Kelas 8.4', gradeLevel: '8', homeroomTeacherId: 'user_wali_8_4', homeroomTeacherName: 'Fitri Handayani, S.Pd.', academicYear: '2026/2027' },
  { id: '9.1', name: 'Kelas 9.1', gradeLevel: '9', homeroomTeacherId: 'user_wali_9_1', homeroomTeacherName: 'Eko Prasetyo, S.Pd.', academicYear: '2026/2027' },
  { id: '9.2', name: 'Kelas 9.2', gradeLevel: '9', homeroomTeacherId: 'user_wali_9_2', homeroomTeacherName: 'Sri Wahyuni, S.Pd.', academicYear: '2026/2027' },
  { id: '9.3', name: 'Kelas 9.3', gradeLevel: '9', homeroomTeacherId: 'user_wali_9_3', homeroomTeacherName: 'Agus Setiawan, S.Pd.', academicYear: '2026/2027' },
  { id: '9.4', name: 'Kelas 9.4', gradeLevel: '9', homeroomTeacherId: 'user_wali_9_4', homeroomTeacherName: 'Tri Wulandari, S.Pd.', academicYear: '2026/2027' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_super_admin',
    email: 'admin@smpn14tubaba.sch.id',
    name: 'Administrator Kurikulum (Super Admin)',
    role: 'super_admin',
    nip: '19820315 200801 1 012',
    phone: '081234567890',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    id: 'user_admin_22rio',
    email: '22riosandi@gmail.com',
    name: 'Rio Sandi, S.Kom. (Super Admin)',
    role: 'super_admin',
    nip: '19910420 201802 1 003',
    phone: '082199887766',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    id: 'user_wali_7_1',
    email: 'walikelas71@smpn14tubaba.sch.id',
    name: 'Ahmad Fauzi, S.Pd.',
    role: 'wali_kelas',
    nip: '19880721 201503 1 005',
    classAssigned: '7.1',
    phone: '081377889900',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'user_wali_7_2',
    email: 'walikelas72@smpn14tubaba.sch.id',
    name: 'Siti Aminah, S.Pd.Gr.',
    role: 'wali_kelas',
    nip: '19900318 201602 2 004',
    classAssigned: '7.2',
    phone: '081388990011',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'user_wali_8_1',
    email: 'walikelas81@smpn14tubaba.sch.id',
    name: 'Budi Hartono, M.Pd.',
    role: 'wali_kelas',
    nip: '19850214 201001 1 011',
    classAssigned: '8.1',
    phone: '085266778899',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-07-10T08:00:00.000Z',
  },
  {
    id: 'user_wali_9_1',
    email: 'walikelas91@smpn14tubaba.sch.id',
    name: 'Eko Prasetyo, S.Pd.',
    role: 'wali_kelas',
    nip: '19871109 201202 1 002',
    classAssigned: '9.1',
    phone: '081922334455',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-07-10T08:00:00.000Z',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std_001',
    nisn: '0112345671',
    nis: '262707001',
    name: 'Aditya Pratama Wijaya',
    gender: 'L',
    classId: '7.1',
    religion: 'Islam',
    birthPlace: 'Tulang Bawang Barat',
    birthDate: '2012-05-14',
    parentName: 'Bambang Wijaya',
    address: 'Tiyuh Marga Kencana RT 03 RW 01',
    status: 'aktif',
    sick: 1,
    permitted: 0,
    absent: 0,
    waliNote: 'Menunjukkan kedisiplinan dan keaktifan yang sangat baik dalam kegiatan pembelajaran.',
  },
  {
    id: 'std_002',
    nisn: '0112345672',
    nis: '262707002',
    name: 'Anisa Rahmawati',
    gender: 'P',
    classId: '7.1',
    religion: 'Islam',
    birthPlace: 'Panaragan Jaya',
    birthDate: '2012-08-22',
    parentName: 'Rahmat Hidayat',
    address: 'Tiyuh Pulung Kencana RT 05 RW 02',
    status: 'aktif',
    sick: 0,
    permitted: 1,
    absent: 0,
    waliNote: 'Sangat rajin dan tekun dalam mengerjakan tugas. Pertahankan prestasimu.',
  },
  {
    id: 'std_003',
    nisn: '0112345673',
    nis: '262707003',
    name: 'Bagas Dwi Saputra',
    gender: 'L',
    classId: '7.1',
    religion: 'Islam',
    birthPlace: 'Kagungan Ratu',
    birthDate: '2012-02-10',
    parentName: 'Joko Saputra',
    address: 'Tiyuh Kagungan Ratu RT 01 RW 01',
    status: 'aktif',
    sick: 2,
    permitted: 0,
    absent: 0,
    waliNote: 'Perlu lebih fokus dalam pelajaran eksakta, terus tingkatkan semangat belajar.',
  },
  {
    id: 'std_004',
    nisn: '0112345674',
    nis: '262707004',
    name: 'Citra Dewi Lestari',
    gender: 'P',
    classId: '7.1',
    religion: 'Islam',
    birthPlace: 'Menggala',
    birthDate: '2012-11-03',
    parentName: 'Supriyadi',
    address: 'Tiyuh Marga Kencana RT 02 RW 01',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Prestasi akademik sangat membanggakan dan aktif dalam kegiatan seni.',
  },
  {
    id: 'std_005',
    nisn: '0112345675',
    nis: '262707005',
    name: 'Siddhartha Tanujaya',
    gender: 'L',
    classId: '7.1',
    religion: 'Buddha',
    birthPlace: 'Tulang Bawang Barat',
    birthDate: '2012-04-18',
    parentName: 'Hendro Tanujaya',
    address: 'Tiyuh Tirta Kencana RT 04 RW 02',
    status: 'aktif',
    sick: 1,
    permitted: 1,
    absent: 0,
    waliNote: 'Bakat kepemimpinan terlihat menonjol. Sangat tekun dalam belajar.',
  },
  {
    id: 'std_006',
    nisn: '0112345676',
    nis: '262707006',
    name: 'Fathir Ahmad Rasyid',
    gender: 'L',
    classId: '7.1',
    religion: 'Islam',
    birthPlace: 'Bandar Lampung',
    birthDate: '2012-01-30',
    parentName: 'Drs. Rasyid Ridho',
    address: 'Tiyuh Marga Kencana Blok B',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Memiliki kemampuan analisis yang kuat terutama pada mata pelajaran IPA dan Matematika.',
  },
  {
    id: 'std_007',
    nisn: '0112345677',
    nis: '262707007',
    name: 'Intan Nur Aini',
    gender: 'P',
    classId: '7.1',
    religion: 'Islam',
    birthPlace: 'Daya Asri',
    birthDate: '2012-09-15',
    parentName: 'H. Sudarsono',
    address: 'Tiyuh Daya Asri RT 02 RW 03',
    status: 'aktif',
    sick: 1,
    permitted: 0,
    absent: 0,
    waliNote: 'Sangat santun dan aktif bekerjasama dalam kelompok diskusi.',
  },
  {
    id: 'std_008',
    nisn: '0112345678',
    nis: '262707008',
    name: 'I Wayan Dharma Putra',
    gender: 'L',
    classId: '7.1',
    religion: 'Hindu',
    birthPlace: 'Marga Kencana',
    birthDate: '2012-07-07',
    parentName: 'I Made Sudharma',
    address: 'Tiyuh Marga Kencana RT 06 RW 02',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Kemampuan atletik dan keolahragaan sangat baik, rajin dan bersahabat.',
  },
  {
    id: 'std_009',
    nisn: '0112345679',
    nis: '262707009',
    name: 'Daniel Christian Situmorang',
    gender: 'L',
    classId: '7.1',
    religion: 'Kristen',
    birthPlace: 'Panaragan',
    birthDate: '2012-03-25',
    parentName: 'Johannes Situmorang',
    address: 'Tiyuh Panaragan Jaya RT 01 RW 01',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Menunjukkan kecakapan bahasa yang sangat baik dan percaya diri tinggi.',
  },
  {
    id: 'std_010',
    nisn: '0112345680',
    nis: '262707010',
    name: 'Maria Fransiska Simanjuntak',
    gender: 'P',
    classId: '7.1',
    religion: 'Katolik',
    birthPlace: 'Tulang Bawang Barat',
    birthDate: '2012-10-12',
    parentName: 'Antonius Simanjuntak',
    address: 'Tiyuh Mulya Kencana RT 03 RW 01',
    status: 'aktif',
    sick: 1,
    permitted: 0,
    absent: 0,
    waliNote: 'Kemampuan praktikum sangat baik, terus jaga motivasi belajarmu.',
  },
  // Sample students for 7.2
  {
    id: 'std_014',
    nisn: '0112345684',
    nis: '262707014',
    name: 'Alya Shafa Marwah',
    gender: 'P',
    classId: '7.2',
    religion: 'Islam',
    birthPlace: 'Tulang Bawang Barat',
    birthDate: '2012-04-05',
    parentName: 'Lukman Hakim',
    address: 'Tiyuh Marga Kencana',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Disiplin dan aktif dalam belajar.',
  },
  {
    id: 'std_015',
    nisn: '0112345685',
    nis: '262707015',
    name: 'Bayu Danuarta',
    gender: 'L',
    classId: '7.2',
    religion: 'Islam',
    birthPlace: 'Panaragan',
    birthDate: '2012-06-18',
    parentName: 'Rudi Hartono',
    address: 'Tiyuh Pulung Kencana',
    status: 'aktif',
    sick: 1,
    permitted: 0,
    absent: 0,
    waliNote: 'Kemampuan numerasi sangat baik.',
  },
  // Sample students for 8.1
  {
    id: 'std_011',
    nisn: '0102345681',
    nis: '252608001',
    name: 'Aldo Febrian',
    gender: 'L',
    classId: '8.1',
    religion: 'Islam',
    birthPlace: 'Tulang Bawang Barat',
    birthDate: '2011-02-14',
    parentName: 'Kuswanto',
    address: 'Tiyuh Karta RT 02 RW 01',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Siswa berprestasi dan aktif dalam OSIS.',
  },
  {
    id: 'std_012',
    nisn: '0102345682',
    nis: '252608002',
    name: 'Bella Safitri',
    gender: 'P',
    classId: '8.1',
    religion: 'Islam',
    birthPlace: 'Menggala',
    birthDate: '2011-06-20',
    parentName: 'Syamsul Bahri',
    address: 'Tiyuh Pulung Kencana RT 01 RW 02',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Sangat rajin dan konsisten dalam belajar.',
  },
  // Sample students for 9.1
  {
    id: 'std_013',
    nisn: '0092345683',
    nis: '242509001',
    name: 'Dafi Al Farizi',
    gender: 'L',
    classId: '9.1',
    religion: 'Islam',
    birthPlace: 'Bandar Lampung',
    birthDate: '2010-04-11',
    parentName: 'Farid Iskandar',
    address: 'Tiyuh Marga Kencana RT 04 RW 02',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: 'Siap menghadapi Asesmen Akhir Jenjang SMP dengan hasil yang mantap.',
  },
];

export function calculatePredikat(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 88) return 'A';
  if (score >= 78) return 'B';
  if (score >= 68) return 'C';
  return 'D';
}

// Helper to determine default STS description without TP (Tujuan Pembelajaran)
export function generateSTSNote(score: number, subjectName: string): string {
  if (score >= 88) {
    return `Menunjukkan penguasaan materi Sumatif Tengah Semester ${subjectName} dengan capaian amat baik dan mampu menyelesaikan soal pemecahan masalah dengan tepat.`;
  } else if (score >= 78) {
    return `Menunjukkan penguasaan materi Sumatif Tengah Semester ${subjectName} dengan capaian baik serta memahami konsep-konsep inti materi dengan memadai.`;
  } else if (score >= 68) {
    return `Menunjukkan penguasaan materi Sumatif Tengah Semester ${subjectName} dengan capaian cukup, disarankan untuk memperbanyak latihan mandiri pada beberapa materi.`;
  } else {
    return `Perlu pendampingan dan bimbingan lebih lanjut dalam memahami materi dasar Sumatif Tengah Semester ${subjectName}.`;
  }
}

/**
 * Detects whether a subject is a religious education subject and returns the religion name.
 * Supported: Islam, Kristen, Katolik, Hindu, Buddha, Konghucu.
 */
export function getSubjectReligion(subject?: { id: string; name: string; code?: string }): string | null {
  if (!subject) return null;
  const id = (subject.id || '').toLowerCase();
  const name = (subject.name || '').toLowerCase();
  const code = (subject.code || '').toLowerCase();

  if (id === 'pak' || code === 'pak' || name.includes('kristen')) return 'Kristen';
  if (id === 'pkat' || code === 'pkat' || name.includes('katolik')) return 'Katolik';
  if (id === 'pah' || code === 'pah' || name.includes('hindu')) return 'Hindu';
  if (id === 'pab' || code === 'pab' || name.includes('budha') || name.includes('buddha')) return 'Buddha';
  if (id === 'pai' || code === 'pai' || name.includes('islam')) return 'Islam';

  return null;
}

/**
 * Checks whether a student's religion matches a target religion name (case-insensitive and resilient)
 */
export function doesStudentMatchSubjectReligion(studentReligion: string | undefined, targetReligion: string): boolean {
  const stdRel = (studentReligion || 'Islam').trim().toLowerCase();
  const target = targetReligion.trim().toLowerCase();

  if (target === 'kristen') {
    return stdRel.includes('kristen') || stdRel.includes('protestan');
  }
  if (target === 'katolik') {
    return stdRel.includes('katolik');
  }
  if (target === 'hindu') {
    return stdRel.includes('hindu');
  }
  if (target === 'buddha') {
    return stdRel.includes('budha') || stdRel.includes('buddha');
  }
  if (target === 'islam') {
    return stdRel.includes('islam');
  }
  return stdRel === target;
}

// Generate sample initial STS grades for student 001 - 010 in 7.1
export function generateInitialGrades(): STSGrade[] {
  const grades: STSGrade[] = [];
  const sampleScores: Record<string, number[]> = {
    std_001: [88, 85, 90, 84, 86, 85, 87, 92, 88, 85, 89],
    std_002: [92, 90, 94, 88, 91, 89, 90, 88, 92, 95, 92],
    std_003: [76, 75, 78, 70, 74, 76, 75, 85, 80, 78, 76],
    std_004: [95, 92, 90, 86, 89, 91, 93, 85, 90, 96, 94],
    std_005: [82, 80, 84, 78, 80, 82, 80, 88, 84, 82, 85],
    std_006: [86, 88, 87, 94, 93, 85, 89, 86, 95, 84, 88],
    std_007: [89, 87, 91, 82, 85, 88, 86, 84, 88, 90, 90],
    std_008: [80, 78, 82, 75, 78, 80, 79, 96, 85, 80, 82],
    std_009: [90, 92, 89, 85, 87, 88, 94, 85, 89, 92, 91],
    std_010: [78, 79, 80, 74, 79, 81, 78, 89, 82, 80, 83],
    std_011: [85, 86, 88, 82, 84, 86, 85, 90, 88, 87, 86],
    std_012: [91, 89, 93, 86, 90, 88, 92, 87, 91, 94, 90],
    std_013: [88, 87, 89, 90, 91, 87, 88, 92, 94, 89, 89],
    std_014: [84, 82, 88, 80, 83, 85, 86, 90, 87, 86, 85],
    std_015: [87, 85, 89, 83, 85, 88, 84, 88, 89, 87, 86],
  };

  INITIAL_STUDENTS.forEach((student) => {
    const scores = sampleScores[student.id] || [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80];
    INITIAL_SUBJECTS.forEach((subject, idx) => {
      const subRel = getSubjectReligion(subject);
      // If religious subject, only create grades for students taking this religion
      if (subRel && !doesStudentMatchSubjectReligion(student.religion, subRel)) {
        return;
      }

      const score = scores[idx] !== undefined ? scores[idx] : 80;
      grades.push({
        id: `grade_${student.id}_${subject.id}`,
        studentId: student.id,
        classId: student.classId,
        subjectId: subject.id,
        academicYear: '2026/2027',
        semester: '1',
        stsScore: score,
        predikat: calculatePredikat(score),
        catatan: generateSTSNote(score, subject.name),
        updatedAt: '2026-10-09T10:00:00.000Z',
        updatedBy: 'Ahmad Fauzi, S.Pd.',
      });
    });
  });

  return grades;
}

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    action: 'INISIALISASI_SISTEM',
    entity: 'Sistem',
    description: 'Sistem e-Rapor SMPN 14 Tulang Bawang Barat berhasil diinisialisasi dengan 12 Rombel (7.1-7.4, 8.1-8.4, 9.1-9.4).',
    performedBy: 'user_super_admin',
    performedByName: 'Administrator Kurikulum',
    timestamp: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'log_002',
    action: 'SINKRONISASI_DAPODIK',
    entity: 'Siswa',
    description: 'Sinkronisasi data 15 siswa dari Dapodik Lokal berhasil.',
    performedBy: 'user_super_admin',
    performedByName: 'Administrator Kurikulum',
    timestamp: '2026-10-02T09:30:00.000Z',
  },
  {
    id: 'log_003',
    action: 'INPUT_NILAI_STS',
    entity: 'Penilaian',
    description: 'Input dan rekap nilai STS Kelas 7.1 selesai diunggah.',
    performedBy: 'user_wali_7_1',
    performedByName: 'Ahmad Fauzi, S.Pd.',
    timestamp: '2026-10-09T10:15:00.000Z',
  },
];
