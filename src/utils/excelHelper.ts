import * as XLSX from 'xlsx';
import { Student, Subject, LegerRow, SchoolProfile, ClassGroup, STSGrade } from '../types';
import {
  calculatePredikat,
  generateSTSNote,
  getSubjectReligion,
  doesStudentMatchSubjectReligion,
} from '../data/initialData';

/**
 * Generates and downloads an official STS Excel template for a class and subject
 */
export function downloadGradeTemplateExcel(
  schoolName: string,
  className: string,
  classId: string,
  subject: Subject,
  academicYear: string,
  semester: string,
  students: Student[]
) {
  const targetRel = getSubjectReligion(subject);
  const classStudents = students
    .filter(s => s.classId === classId)
    .filter(s => targetRel ? doesStudentMatchSubjectReligion(s.religion, targetRel) : true);

  const rows = classStudents.map((std, index) => ({
    No: index + 1,
    NISN: std.nisn,
    NIS: std.nis,
    'Nama Siswa': std.name,
    'Jenis Kelamin': std.gender,
    'Nilai STS (0-100)': '',
    'Catatan / Rekomendasi (Opsional)': '',
  }));

  const worksheet = XLSX.utils.aoa_to_sheet([
    [`FORMAT PENGISIAN NILAI SUMATIF TENGAH SEMESTER (STS) - ${schoolName}`],
    [`Mata Pelajaran: ${subject.name} (${subject.code}) | Kelas: ${className}`],
    [`Tahun Pelajaran: ${academicYear} | Semester: ${semester === '1' ? 'Ganjil' : 'Genap'}`],
    ['PETUNJUK: Masukkan nilai angka bulat (0 - 100) pada kolom "Nilai STS (0-100)". Jangan mengubah kolom NISN & NIS.'],
  ]);

  XLSX.utils.sheet_add_json(worksheet, rows, { origin: 'A5' });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 30 }, // Nama Siswa
    { wch: 14 }, // JK
    { wch: 18 }, // Nilai STS
    { wch: 45 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Nilai STS');

  const fileName = `Template_Nilai_STS_${className.replace(/\s+/g, '_')}_${subject.code}_${academicYear.replace('/', '-')}_Sem${semester}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export interface ParseResult {
  success: boolean;
  message: string;
  matchedCount: number;
  totalParsed: number;
  unmatchedStudents: string[];
  grades: {
    studentId: string;
    studentName: string;
    nisn: string;
    score: number;
    predikat: 'A' | 'B' | 'C' | 'D';
    catatan: string;
  }[];
}

/**
 * Parses uploaded Excel or CSV file containing STS grades
 */
export async function parseGradeExcel(
  file: File,
  students: Student[],
  classId: string,
  subject: Subject
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse sheet to array of rows
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row that contains NISN or Nilai
        let headerRowIndex = -1;
        let colNISN = -1;
        let colNIS = -1;
        let colName = -1;
        let colScore = -1;
        let colNote = -1;

        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const row = rawJson[i];
          if (!Array.isArray(row)) continue;

          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').trim().toLowerCase();
            if (cell.includes('nisn')) colNISN = j;
            if (cell === 'nis' || (cell.includes('nis') && !cell.includes('nisn'))) colNIS = j;
            if (cell.includes('nama')) colName = j;
            if (cell.includes('nilai') || cell.includes('sts') || cell.includes('skor')) colScore = j;
            if (cell.includes('catatan') || cell.includes('keterangan')) colNote = j;
          }

          if (colScore !== -1 && (colNISN !== -1 || colNIS !== -1 || colName !== -1)) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1 || colScore === -1) {
          return resolve({
            success: false,
            message: 'Format file tidak sesuai. Pastikan file memiliki kolom "Nilai STS" dan "NISN" atau "Nama Siswa".',
            matchedCount: 0,
            totalParsed: 0,
            unmatchedStudents: [],
            grades: [],
          });
        }

        const targetRel = getSubjectReligion(subject);
        const classStudents = students
          .filter(s => s.classId === classId)
          .filter(s => targetRel ? doesStudentMatchSubjectReligion(s.religion, targetRel) : true);
        const parsedGrades: ParseResult['grades'] = [];
        const matchedStudentIds = new Set<string>();

        for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!Array.isArray(row) || row.length === 0) continue;

          const rawNisn = colNISN !== -1 ? String(row[colNISN] || '').trim() : '';
          const rawNis = colNIS !== -1 ? String(row[colNIS] || '').trim() : '';
          const rawName = colName !== -1 ? String(row[colName] || '').trim().toLowerCase() : '';
          const rawScore = row[colScore];
          const customNote = colNote !== -1 ? String(row[colNote] || '').trim() : '';

          if (rawScore === undefined || rawScore === null || rawScore === '') continue;

          const numScore = Number(rawScore);
          if (isNaN(numScore)) continue;

          const clampedScore = Math.min(100, Math.max(0, Math.round(numScore)));

          // Find student in class
          const foundStudent = classStudents.find(s => {
            if (rawNisn && s.nisn === rawNisn) return true;
            if (rawNis && s.nis === rawNis) return true;
            if (rawName && s.name.toLowerCase() === rawName) return true;
            if (rawName && (s.name.toLowerCase().includes(rawName) || rawName.includes(s.name.toLowerCase()))) return true;
            return false;
          });

          if (foundStudent) {
            matchedStudentIds.add(foundStudent.id);
            parsedGrades.push({
              studentId: foundStudent.id,
              studentName: foundStudent.name,
              nisn: foundStudent.nisn,
              score: clampedScore,
              predikat: calculatePredikat(clampedScore),
              catatan: customNote || generateSTSNote(clampedScore, subject.name),
            });
          }
        }

        const unmatched = classStudents
          .filter(s => !matchedStudentIds.has(s.id))
          .map(s => s.name);

        resolve({
          success: parsedGrades.length > 0,
          message: parsedGrades.length > 0
            ? `Berhasil membaca ${parsedGrades.length} nilai siswa.`
            : 'Tidak ada data nilai siswa yang cocok dengan data kelas saat ini.',
          matchedCount: parsedGrades.length,
          totalParsed: rawJson.length - (headerRowIndex + 1),
          unmatchedStudents: unmatched,
          grades: parsedGrades,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to normalize class/rombel input string to standard ID (e.g. '7.1', '8.2', '9.4')
 */
export function normalizeRombel(raw: string, fallback: string = '7.1'): string {
  if (!raw) return fallback;
  const cleaned = raw.trim().toUpperCase();

  // Explicit check for exact match first
  const valid12 = ['7.1', '7.2', '7.3', '7.4', '8.1', '8.2', '8.3', '8.4', '9.1', '9.2', '9.3', '9.4'];
  const exact = valid12.find(r => r === cleaned);
  if (exact) return exact;

  // Patterns like 7.1, 7,1, 7-1, 7_1, 7 1
  const dotPattern = cleaned.match(/([789])[\s\.\-_,]+([1234])/);
  if (dotPattern) {
    return `${dotPattern[1]}.${dotPattern[2]}`;
  }

  // Roman numerals: VII.1 -> 7.1, VIII.2 -> 8.2, IX.3 -> 9.3
  if (cleaned.includes('VII') && !cleaned.includes('VIII')) {
    const num = cleaned.match(/[1234]/);
    if (num) return `7.${num[0]}`;
  }
  if (cleaned.includes('VIII')) {
    const num = cleaned.match(/[1234]/);
    if (num) return `8.${num[0]}`;
  }
  if (cleaned.includes('IX')) {
    const num = cleaned.match(/[1234]/);
    if (num) return `9.${num[0]}`;
  }

  // Patterns like 7A -> 7.1, 7B -> 7.2, 7C -> 7.3, 7D -> 7.4
  const letterPattern = cleaned.match(/([789])[\s\-_]*([A-D])/);
  if (letterPattern) {
    const mapping: Record<string, string> = { A: '1', B: '2', C: '3', D: '4' };
    return `${letterPattern[1]}.${mapping[letterPattern[2]] || '1'}`;
  }

  // Check if string contains any valid rombel
  const contained = valid12.find(r => cleaned.includes(r));
  if (contained) return contained;

  return fallback;
}

/**
 * Generates and downloads an official Master Excel template for importing all students across all 12 rombels
 */
export function downloadStudentTemplateExcel(
  schoolName: string,
  _className?: string,
  _classId?: string
) {
  const sampleRows = [
    {
      No: 1,
      NISN: '0098765431',
      NIS: '24001',
      'Nama Lengkap': 'Ahmad Fauzi Wijaya',
      'Jenis Kelamin (L/P)': 'L',
      'Rombel / Kelas (7.1 s.d 9.4)': '7.1',
      'Tempat Lahir': 'Tulang Bawang Barat',
      'Tanggal Lahir (YYYY-MM-DD)': '2012-04-12',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Bambang Supriyanto',
      'Alamat Lengkap': 'Tiyuh Marga Kencana RT 02 RW 01',
    },
    {
      No: 2,
      NISN: '0098765432',
      NIS: '24002',
      'Nama Lengkap': 'Siti Nur Aisyah',
      'Jenis Kelamin (L/P)': 'P',
      'Rombel / Kelas (7.1 s.d 9.4)': '7.2',
      'Tempat Lahir': 'Panaragan Jaya',
      'Tanggal Lahir (YYYY-MM-DD)': '2012-08-25',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'M. Hidayat',
      'Alamat Lengkap': 'Kel. Panaragan Jaya RT 05 RW 02',
    },
    {
      No: 3,
      NISN: '0098765433',
      NIS: '24003',
      'Nama Lengkap': 'Budi Santoso',
      'Jenis Kelamin (L/P)': 'L',
      'Rombel / Kelas (7.1 s.d 9.4)': '7.3',
      'Tempat Lahir': 'Mulya Asri',
      'Tanggal Lahir (YYYY-MM-DD)': '2012-01-15',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Sukardi',
      'Alamat Lengkap': 'Tiyuh Mulya Asri RT 01 RW 01',
    },
    {
      No: 4,
      NISN: '0098765434',
      NIS: '24004',
      'Nama Lengkap': 'Citra Maharani',
      'Jenis Kelamin (L/P)': 'P',
      'Rombel / Kelas (7.1 s.d 9.4)': '7.4',
      'Tempat Lahir': 'Karta',
      'Tanggal Lahir (YYYY-MM-DD)': '2012-03-20',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Iskandar',
      'Alamat Lengkap': 'Tiyuh Karta RT 03 RW 01',
    },
    {
      No: 5,
      NISN: '0088765435',
      NIS: '23005',
      'Nama Lengkap': 'Deni Pratama',
      'Jenis Kelamin (L/P)': 'L',
      'Rombel / Kelas (7.1 s.d 9.4)': '8.1',
      'Tempat Lahir': 'Tulang Bawang Barat',
      'Tanggal Lahir (YYYY-MM-DD)': '2011-06-18',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Kusuma',
      'Alamat Lengkap': 'Tiyuh Pulung Kencana RT 04 RW 02',
    },
    {
      No: 6,
      NISN: '0088765436',
      NIS: '23006',
      'Nama Lengkap': 'Eka Safitri',
      'Jenis Kelamin (L/P)': 'P',
      'Rombel / Kelas (7.1 s.d 9.4)': '8.2',
      'Tempat Lahir': 'Panaragan',
      'Tanggal Lahir (YYYY-MM-DD)': '2011-10-05',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Hartono',
      'Alamat Lengkap': 'Tiyuh Panaragan RT 02 RW 01',
    },
    {
      No: 7,
      NISN: '0078765437',
      NIS: '22007',
      'Nama Lengkap': 'Fajar Ramadhan',
      'Jenis Kelamin (L/P)': 'L',
      'Rombel / Kelas (7.1 s.d 9.4)': '9.1',
      'Tempat Lahir': 'Bandar Lampung',
      'Tanggal Lahir (YYYY-MM-DD)': '2010-09-12',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Syahril',
      'Alamat Lengkap': 'Tiyuh Marga Kencana RT 01 RW 01',
    },
    {
      No: 8,
      NISN: '0078765438',
      NIS: '22008',
      'Nama Lengkap': 'Gita Larasati',
      'Jenis Kelamin (L/P)': 'P',
      'Rombel / Kelas (7.1 s.d 9.4)': '9.2',
      'Tempat Lahir': 'Tulang Bawang Barat',
      'Tanggal Lahir (YYYY-MM-DD)': '2010-11-28',
      Agama: 'Islam',
      'Nama Orang Tua / Wali': 'Nasirwan',
      'Alamat Lengkap': 'Tiyuh Mulya Kencana RT 05 RW 02',
    },
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([
    [`TEMPLATE MASTER IMPOR DATA SISWA (SEMUA ROMBEL 7.1 - 9.4) - ${schoolName}`],
    ['Daftar Rombel Resmi: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4'],
    ['PETUNJUK: Masukkan semua siswa dari semua rombel sekaligus dalam 1 file ini pada kolom "Rombel / Kelas".'],
    ['Sistem e-Rapor akan otomatis mendistribusikan siswa ke dalam masing-masing rombelnya secara otomatis.'],
  ]);

  XLSX.utils.sheet_add_json(worksheet, sampleRows, { origin: 'A5' });

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 30 }, // Nama Lengkap
    { wch: 18 }, // JK
    { wch: 22 }, // Rombel / Kelas
    { wch: 22 }, // Tempat Lahir
    { wch: 25 }, // Tanggal Lahir
    { wch: 14 }, // Agama
    { wch: 26 }, // Ortu
    { wch: 38 }, // Alamat
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Data Siswa');

  const fileName = `Master_Template_Siswa_Semua_Rombel_SMPN14Tubaba.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export interface StudentParseResult {
  success: boolean;
  message: string;
  totalParsed: number;
  rombelCount: number;
  rombelSummary: Record<string, number>;
  students: {
    nisn: string;
    nis: string;
    name: string;
    gender: 'L' | 'P';
    classId: string;
    birthPlace: string;
    birthDate: string;
    religion: string;
    parentName: string;
    address: string;
  }[];
}

/**
 * Parses uploaded Excel file for student imports with automatic multi-rombel detection
 */
export async function parseStudentExcel(
  file: File,
  defaultClassId: string = '7.1'
): Promise<StudentParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let headerRowIndex = -1;
        let colNISN = -1;
        let colNIS = -1;
        let colName = -1;
        let colGender = -1;
        let colClass = -1;
        let colBirthPlace = -1;
        let colBirthDate = -1;
        let colReligion = -1;
        let colParent = -1;
        let colAddress = -1;

        for (let i = 0; i < Math.min(rawJson.length, 12); i++) {
          const row = rawJson[i];
          if (!Array.isArray(row)) continue;

          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').trim().toLowerCase();
            if (cell.includes('nisn')) colNISN = j;
            else if (cell === 'nis' || (cell.includes('nis') && !cell.includes('nisn'))) colNIS = j;
            else if (cell.includes('nama')) colName = j;
            else if (cell.includes('kelamin') || cell.includes('jk') || cell === 'l/p') colGender = j;
            else if (cell.includes('kelas') || cell.includes('rombel')) colClass = j;
            else if (cell.includes('tempat') || (cell.includes('lahir') && cell.includes('tempat'))) colBirthPlace = j;
            else if (cell.includes('tanggal') || cell.includes('tgl')) colBirthDate = j;
            else if (cell.includes('agama')) colReligion = j;
            else if (cell.includes('orang tua') || cell.includes('ortu') || cell.includes('wali') || cell.includes('ayah')) colParent = j;
            else if (cell.includes('alamat')) colAddress = j;
          }

          if (colNISN !== -1 && colName !== -1) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1 || colNISN === -1 || colName === -1) {
          return resolve({
            success: false,
            message: 'Format file tidak sesuai. Pastikan file memiliki baris judul dengan kolom "NISN" dan "Nama Lengkap".',
            totalParsed: 0,
            rombelCount: 0,
            rombelSummary: {},
            students: [],
          });
        }

        const parsedStudents: StudentParseResult['students'] = [];
        const rombelSummary: Record<string, number> = {};

        for (let i = headerRowIndex + 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!Array.isArray(row) || row.length === 0) continue;

          const rawNisn = String(row[colNISN] || '').trim();
          const rawName = String(row[colName] || '').trim();

          // Skip empty rows
          if (!rawNisn || !rawName) continue;

          const rawNis = colNIS !== -1 && row[colNIS] ? String(row[colNIS]).trim() : '';
          const rawGender = colGender !== -1 && row[colGender]
            ? String(row[colGender]).trim().toUpperCase().startsWith('P') ? 'P' : 'L'
            : 'L';
          
          // Automatic Rombel detection
          const cellClass = colClass !== -1 && row[colClass] ? String(row[colClass]).trim() : '';
          const assignedClass = normalizeRombel(cellClass, defaultClassId);

          const rawBirthPlace = colBirthPlace !== -1 && row[colBirthPlace]
            ? String(row[colBirthPlace]).trim()
            : 'Tulang Bawang Barat';
          const rawBirthDate = colBirthDate !== -1 && row[colBirthDate]
            ? String(row[colBirthDate]).trim()
            : '2012-01-01';
          const rawReligion = colReligion !== -1 && row[colReligion]
            ? String(row[colReligion]).trim()
            : 'Islam';
          const rawParent = colParent !== -1 && row[colParent]
            ? String(row[colParent]).trim()
            : '';
          const rawAddress = colAddress !== -1 && row[colAddress]
            ? String(row[colAddress]).trim()
            : 'Tulang Bawang Barat';

          rombelSummary[assignedClass] = (rombelSummary[assignedClass] || 0) + 1;

          parsedStudents.push({
            nisn: rawNisn,
            nis: rawNis || rawNisn.slice(-5),
            name: rawName,
            gender: rawGender as 'L' | 'P',
            classId: assignedClass,
            birthPlace: rawBirthPlace,
            birthDate: rawBirthDate,
            religion: rawReligion,
            parentName: rawParent,
            address: rawAddress,
          });
        }

        const uniqueRombelCount = Object.keys(rombelSummary).length;

        resolve({
          success: parsedStudents.length > 0,
          message: parsedStudents.length > 0
            ? `Berhasil membaca ${parsedStudents.length} siswa untuk ${uniqueRombelCount} rombel kelas.`
            : 'Tidak ada baris siswa yang valid dalam file Excel.',
          totalParsed: parsedStudents.length,
          rombelCount: uniqueRombelCount,
          rombelSummary,
          students: parsedStudents,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export full class Leger Nilai to Excel including Attendance and Ranking
 */
export function exportLegerToExcel(
  schoolProfile: SchoolProfile,
  classGroup: ClassGroup,
  subjects: Subject[],
  legerRows: LegerRow[],
  academicYear: string,
  semester: string
) {
  const sortedSubjects = [...subjects].sort((a, b) => a.orderIndex - b.orderIndex);

  // Build header row with Attendance columns
  const headers = ['No', 'NISN', 'NIS', 'Nama Siswa', 'L/P'];
  sortedSubjects.forEach(s => headers.push(s.code));
  headers.push('Jumlah', 'Rata-rata', 'Rank', 'Sakit (S)', 'Izin (I)', 'Alpha (A)', 'Total Absen');

  const rows: any[][] = [];

  legerRows.forEach((row, idx) => {
    const item: any[] = [
      idx + 1,
      row.student.nisn,
      row.student.nis,
      row.student.name,
      row.student.gender,
    ];

    sortedSubjects.forEach(s => {
      const val = row.grades[s.id];
      item.push(val !== undefined ? val : '-');
    });

    item.push(
      row.totalScore,
      row.averageScore,
      row.rank,
      row.sick,
      row.permitted,
      row.absent,
      row.totalAbsent
    );
    rows.push(item);
  });

  // Calculate statistics (Rata-rata kelas, Tertinggi, Terendah)
  const avgRow: any[] = ['', '', '', 'RATA-RATA KELAS', ''];
  const maxRow: any[] = ['', '', '', 'NILAI TERTINGGI', ''];
  const minRow: any[] = ['', '', '', 'NILAI TERENDAH', ''];

  sortedSubjects.forEach(s => {
    const scores = legerRows.map(r => r.grades[s.id]).filter(v => v !== undefined);
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      avgRow.push(Number(avg.toFixed(1)));
      maxRow.push(max);
      minRow.push(min);
    } else {
      avgRow.push('-');
      maxRow.push('-');
      minRow.push('-');
    }
  });

  const overallAvg = legerRows.length > 0
    ? (legerRows.reduce((a, b) => a + b.averageScore, 0) / legerRows.length).toFixed(1)
    : 0;
  
  // Total absensi rata-rata
  const avgSick = legerRows.length > 0
    ? (legerRows.reduce((a, b) => a + (b.sick || 0), 0) / legerRows.length).toFixed(1)
    : '0';
  const avgPermit = legerRows.length > 0
    ? (legerRows.reduce((a, b) => a + (b.permitted || 0), 0) / legerRows.length).toFixed(1)
    : '0';
  const avgAbsent = legerRows.length > 0
    ? (legerRows.reduce((a, b) => a + (b.absent || 0), 0) / legerRows.length).toFixed(1)
    : '0';
  const avgTotalAbs = legerRows.length > 0
    ? (legerRows.reduce((a, b) => a + (b.totalAbsent || 0), 0) / legerRows.length).toFixed(1)
    : '0';

  avgRow.push('-', overallAvg, '-', avgSick, avgPermit, avgAbsent, avgTotalAbs);
  maxRow.push('-', '-', '-', '-', '-', '-', '-');
  minRow.push('-', '-', '-', '-', '-', '-', '-');

  rows.push(avgRow);
  rows.push(maxRow);
  rows.push(minRow);

  const worksheet = XLSX.utils.aoa_to_sheet([
    [`LEGER NILAI SUMATIF TENGAH SEMESTER (STS) - ${schoolProfile.name}`],
    [`Kelas: ${classGroup.name} | Wali Kelas: ${classGroup.homeroomTeacherName}`],
    [`Tahun Pelajaran: ${academicYear} | Semester: ${semester === '1' ? 'Ganjil' : 'Genap'}`],
    [],
    headers,
    ...rows,
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Leger ${classGroup.id}`);

  const fileName = `Leger_STS_${classGroup.name.replace(/\s+/g, '_')}_${academicYear.replace('/', '-')}_Sem${semester}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

