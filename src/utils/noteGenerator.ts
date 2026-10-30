import { Student } from '../types';

export interface StudentStatsForNotes {
  average: number;
  rank?: number;
  totalStudents?: number;
  sick?: number;
  permitted?: number;
  absent?: number;
}

export type NoteStyle = 'holistik' | 'karakter' | 'akademik';

/**
 * Generate Catatan Wali Kelas yang kontekstual, pedagogis, dan terarah
 * berdasarkan rata-rata nilai, peringkat kelas, serta rekapitulasi kehadiran siswa.
 */
export function generateCatatanWaliKelas(
  student: Student,
  stats: StudentStatsForNotes,
  style: NoteStyle = 'holistik',
  seedIndex: number = 0
): string {
  const firstName = student.name.split(' ')[0] || student.name;
  const avg = stats.average || 80;
  const rank = stats.rank || 1;
  const totalStudents = stats.totalStudents || 30;
  const absent = stats.absent ?? (student.absent || 0);
  const sick = stats.sick ?? (student.sick || 0);
  const permitted = stats.permitted ?? (student.permitted || 0);
  const totalAbsent = absent + sick + permitted;

  // Variasi template berdasarkan capaian akademik
  let baseNote = '';

  if (avg >= 85 || (rank <= 5 && totalStudents >= 10)) {
    // Prestasi Sangat Baik / Bintang Kelas
    const templates = [
      `Prestasi belajar Ananda ${firstName} sangat membanggakan di peringkat ${rank} dari ${totalStudents} siswa. Pertahankan ketekunan, tingkatkan rasa ingin tahu, dan tetaplah menjadi teladan positif bagi teman sekelas.`,
      `Alhamdulillah, capaian Asesmen Tengah Semester yang diraih Ananda sangat istimewa. Terus jaga konsistensi belajar, kembangkan potensi bakatmu, dan senantiasa rendah hati.`,
      `Pencapaian akademik yang gemilang dan sangat memuaskan (Peringkat ${rank}). Pertahankan kedisiplinan belajar dan teruslah berinovasi untuk meraih prestasi yang lebih tinggi lagi.`,
      `Selamat atas hasil belajar yang sangat baik. Kemampuan memahami materi dan daya analisis Ananda luar biasa, pertahankan motivasi belajar ini menuju akhir semester.`,
    ];
    baseNote = templates[(seedIndex + student.name.length) % templates.length];
  } else if (avg >= 75) {
    // Capaian Baik / Memenuhi Kriteria
    const templates = [
      `Pencapaian hasil belajar Ananda ${firstName} sudah baik dan melampaui kriteria ketuntasan. Tingkatkan ketelitian, fokus dalam memahami konsep, serta optimalkan waktu belajar mandiri di rumah.`,
      `Hasil Asesmen Tengah Semester cukup memuaskan. Pertahankan semangat belajar dan terus asah kemampuan pada mata pelajaran yang masih memerlukan pendalaman materi.`,
      `Menunjukkan ketekunan yang baik dalam mengikuti pembelajaran. Terus tingkatkan keaktifan bertanya di kelas dan rajin berlatih menyelesaikan soal-soal tantangan.`,
      `Kemampuan akademik sudah berkembang dengan baik (Peringkat ${rank}). Dengan sedikit tambahan fokus dan konsentrasi, Ananda diyakini mampu melompat ke jajaran peringkat atas.`,
    ];
    baseNote = templates[(seedIndex + student.name.length) % templates.length];
  } else {
    // Perlu Peningkatan & Bimbingan
    const templates = [
      `Hasil Asesmen Tengah Semester masih perlu ditingkatkan lagi. Ananda ${firstName} diharapkan lebih disiplin membagi waktu belajar, aktif bertanya kepada bapak/ibu guru, dan rutin mengulang pelajaran.`,
      `Perlu meningkatkan konsentrasi dan motivasi belajar secara berkelanjutan. Manfaatkan waktu bimbingan guru dan belajar kelompok bersama rekan kelas agar capaian kompetensi lebih optimal.`,
      `Potensi belajar yang dimiliki Ananda sebenarnya sangat baik. Terus tingkatkan kesungguhan, hindari menunda tugas, dan rajinlah membaca materi pembelajaran. Yakin kamu bisa!`,
      `Tingkatkan fokus dan kesungguhan dalam belajar. Jangan ragu berdiskusi dengan guru mengenai materi yang belum dipahami agar hasil penilaian akhir semester dapat meningkat pesat.`,
    ];
    baseNote = templates[(seedIndex + student.name.length) % templates.length];
  }

  // Tambahan catatan kehadiran (Presensi)
  if (absent > 0) {
    baseNote += ` Perhatikan pula kedisiplinan kehadiran di sekolah dan kurangi ketidakhadiran tanpa keterangan (Alpha).`;
  } else if (totalAbsent > 5) {
    baseNote += ` Jagalah kondisi kesehatan dan kebugaran tubuh agar dapat mengikuti seluruh rangkaian pembelajaran secara berkesinambungan.`;
  } else if (totalAbsent === 0) {
    baseNote += ` Disiplin kehadiran yang sempurna (tanpa absen) sangat mendukung keberhasilan belajarmu.`;
  }

  return baseNote;
}

/**
 * Generate Catatan Perkembangan Siswa yang mencerminkan
 * 6 Dimensi Profil Pelajar Pancasila (Kurikulum Merdeka).
 */
export function generateCatatanPerkembangan(
  student: Student,
  stats: StudentStatsForNotes,
  style: NoteStyle = 'karakter',
  seedIndex: number = 0
): string {
  const firstName = student.name.split(' ')[0] || student.name;
  const avg = stats.average || 80;

  // Bank kalimat Profil Pelajar Pancasila
  const pppTemplates = [
    // 1. Beriman, bertakwa, berakhlak mulia + Bernalar Kritis
    `Ananda ${firstName} menunjukkan karakter beriman, bertakwa, dan berakhlak mulia dalam pergaulan sekolah. Memiliki kemampuan bernalar kritis yang baik dalam mengemukakan argumentasi dan tanggap terhadap persoalan pembelajaran.`,
    // 2. Gotong Royong & Kepedulian Sosial
    `Menunjukkan sikap gotong royong yang tinggi, ramah, santun, serta sangat aktif dan kooperatif saat bekerja sama menyelesaikan proyek kelompok bersama teman-teman sekelas.`,
    // 3. Kemandirian & Tanggung Jawab
    `Menunjukkan kemandirian belajar yang konsisten, berinisiatif tinggi dalam menuntaskan tugas-tugas terstruktur, serta memiliki rasa tanggung jawab yang kuat terhadap amanah yang diberikan.`,
    // 4. Kreativitas & Inovasi
    `Memiliki daya kreasi dan imajinasi yang positif dalam menghasilkan karya-karya belajar. Mampu menemukan alternatif pemecahan masalah dengan ide-ide kreatif dan berpikiran terbuka.`,
    // 5. Akhlak Mulia, Sopan Santun & Toleransi
    `Menunjukkan budi pekerti yang luhur, sopan santun kepada bapak/ibu guru, serta senantiasa menghargai perbedaan pendapat dan keberagaman latar belakang sesama rekan didik.`,
    // 6. Reflektif, Tangguh & Kolaboratif
    `Mampu merefleksikan hasil belajarnya dengan jujur, pantang menyerah saat menghadapi tantangan akademis, serta senantiasa menjaga kerukunan dan keharmonisan di lingkungan kelas.`,
    // 7. Disiplin & Kepemimpinan
    `Memperlihatkan jiwa kepemimpinan yang santun, tertib dalam menaati tata tertib madrasah/sekolah, serta aktif berkontribusi positif dalam kegiatan pembelajaran tatap muka.`,
  ];

  const chosen = pppTemplates[(seedIndex * 2 + student.name.length) % pppTemplates.length];
  return chosen;
}

/**
 * Generate kedua catatan sekaligus untuk seorang siswa
 */
export function generateStudentNotes(
  student: Student,
  stats: StudentStatsForNotes,
  style: NoteStyle = 'holistik',
  seedIndex: number = 0
): { waliNote: string; developmentNote: string } {
  return {
    waliNote: generateCatatanWaliKelas(student, stats, style, seedIndex),
    developmentNote: generateCatatanPerkembangan(student, stats, style, seedIndex),
  };
}
