import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Printer,
  FileDown,
  User,
  Users,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
} from 'lucide-react';
import {
  calculatePredikat,
  generateSTSNote,
  getSubjectReligion,
  doesStudentMatchSubjectReligion,
} from '../data/initialData';
import { generateRaportVerificationCode } from '../utils/security';
import { generateCatatanWaliKelas, generateCatatanPerkembangan } from '../utils/noteGenerator';

export const CetakRaporView: React.FC = () => {
  const {
    schoolProfile,
    classes,
    subjects,
    students,
    grades,
    users,
    activeAcademicYear,
    activeSemester,
    selectedClassId,
    currentUser,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Filters
  const [currentClassId, setCurrentClassId] = useState<string>(
    currentUser?.role === 'wali_kelas' && currentUser.classAssigned
      ? currentUser.classAssigned
      : selectedClassId || '7.1'
  );

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === currentClassId),
    [students, currentClassId]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    classStudents[0]?.id || ''
  );

  // If class changes, ensure selected student is in the class
  React.useEffect(() => {
    if (classStudents.length > 0) {
      if (selectedStudentId !== 'all' && !classStudents.some((s) => s.id === selectedStudentId)) {
        setSelectedStudentId(classStudents[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [classStudents, selectedStudentId]);

  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');

  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentClassId) || classes[0],
    [classes, currentClassId]
  );

  // Directly link homeroom teacher with users database to reflect exact casing and NIP
  const currentWaliTeacher = useMemo(() => {
    return (
      users.find((u) => u.classAssigned === currentClass.id) ||
      users.find((u) => u.id === currentClass.homeroomTeacherId)
    );
  }, [users, currentClass]);

  const homeroomTeacherName = currentWaliTeacher?.name || currentClass.homeroomTeacherName;
  const homeroomTeacherNip = currentWaliTeacher?.nip || currentClass.homeroomTeacherNip || '19880721 201503 1 005';

  const currentStudent = useMemo(
    () => {
      if (selectedStudentId === 'all') return classStudents[0] || null;
      return classStudents.find((s) => s.id === selectedStudentId) || classStudents[0];
    },
    [classStudents, selectedStudentId]
  );

  // Calculate student grades and summary
  const getStudentGradesData = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return { rows: [], total: 0, average: 0, predikat: 'B' };

    const studentGrades = grades.filter(
      (g) =>
        g.studentId === studentId &&
        g.academicYear === activeAcademicYear &&
        g.semester === activeSemester
    );

    let total = 0;
    let count = 0;

    // Filter subjects so only the student's relevant religious education subject is shown, sorted with religion first
    const relevantSubjects = [...subjects]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .filter((sub) => {
        const subRel = getSubjectReligion(sub);
        if (!subRel) return true;
        return doesStudentMatchSubjectReligion(student.religion, subRel);
      });

    const rows = relevantSubjects.map((sub, index) => {
      const found = studentGrades.find((g) => g.subjectId === sub.id);
      const score = found ? found.stsScore : 80;
      total += score;
      count++;
      const pred = calculatePredikat(score);
      const note = found ? found.catatan : generateSTSNote(score, sub.name);

      return {
        no: index + 1,
        code: sub.code,
        name: sub.name,
        kkm: sub.kkm,
        score,
        predikat: pred,
        catatan: note,
      };
    });

    const average = count > 0 ? Number((total / count).toFixed(1)) : 0;
    const overallPredikat = calculatePredikat(average);

    return { rows, total, average, overallPredikat };
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrevStudent = () => {
    if (selectedStudentId === 'all') {
      setSelectedStudentId(classStudents[0]?.id || '');
      setPrintMode('single');
      return;
    }
    const currentIndex = classStudents.findIndex((s) => s.id === selectedStudentId);
    if (currentIndex > 0) {
      setSelectedStudentId(classStudents[currentIndex - 1].id);
      setPrintMode('single');
    }
  };

  const handleNextStudent = () => {
    if (selectedStudentId === 'all') {
      setSelectedStudentId(classStudents[0]?.id || '');
      setPrintMode('single');
      return;
    }
    const currentIndex = classStudents.findIndex((s) => s.id === selectedStudentId);
    if (currentIndex < classStudents.length - 1) {
      setSelectedStudentId(classStudents[currentIndex + 1].id);
      setPrintMode('single');
    }
  };

  const currentStudentData = useMemo(() => {
    if (!currentStudent) return null;
    return getStudentGradesData(currentStudent.id);
  }, [currentStudent, grades, activeAcademicYear, activeSemester, subjects]);

  const studentsToRender = useMemo(() => {
    if (printMode === 'all' || selectedStudentId === 'all') {
      return classStudents;
    }
    return currentStudent ? [currentStudent] : [];
  }, [printMode, selectedStudentId, classStudents, currentStudent]);

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden during Print) */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Printer className="h-4 w-4" />
              Format Resmi Kemdikbudristek (A4 / F4)
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Cetak Rapor Sumatif Tengah Semester (STS)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pratinjau rapor siap cetak lengkap dengan Kop Dinas SMPN 14 Tulang Bawang Barat, identitas, nilai STS, dan tanda tangan digital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
              <button
                onClick={() => {
                  setPrintMode('single');
                  if (selectedStudentId === 'all') {
                    setSelectedStudentId(classStudents[0]?.id || '');
                  }
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  printMode === 'single' && selectedStudentId !== 'all'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cetak Siswa Ini
              </button>
              <button
                onClick={() => {
                  setPrintMode('all');
                  setSelectedStudentId('all');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  printMode === 'all' || selectedStudentId === 'all'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cetak Massal (Satu Kelas)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold shadow transition-all"
            >
              <Printer className="h-4 w-4" />
              Cetak Rapor / Simpan PDF
            </button>
          </div>
        </div>

        {/* Filter Selection */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas:</label>
            <select
              value={currentClassId}
              onChange={(e) => setCurrentClassId(e.target.value)}
              disabled={!isSuperAdmin && currentUser?.role === 'wali_kelas' && !!currentUser.classAssigned}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Wali: {c.homeroomTeacherName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Pilih Siswa ({classStudents.length} siswa):</span>
              {selectedStudentId === 'all' && (
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  Seluruh Siswa
                </span>
              )}
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStudentId(val);
                if (val === 'all') {
                  setPrintMode('all');
                } else {
                  setPrintMode('single');
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="all" className="font-bold text-blue-700 bg-blue-50 py-1">
                ⭐ PILIH SELURUH SISWA (Semua {classStudents.length} Siswa - Cetak Massal)
              </option>
              <optgroup label={`Daftar Per Siswa (${classStudents.length} Siswa):`}>
                {classStudents.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.name} ({s.nisn})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handlePrevStudent}
              disabled={
                selectedStudentId === 'all' ||
                classStudents.findIndex((s) => s.id === selectedStudentId) <= 0
              }
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
            </button>
            <button
              onClick={handleNextStudent}
              disabled={
                selectedStudentId === 'all' ||
                classStudents.findIndex((s) => s.id === selectedStudentId) >= classStudents.length - 1
              }
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1"
            >
              Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Rapor Preview Cards / Print Document */}
      <div className="space-y-8">
        {studentsToRender.map((student, studentIndex) => {
          const reportData = getStudentGradesData(student.id);
          const verificationCode = generateRaportVerificationCode(
            schoolProfile.npsn,
            student.nisn,
            activeSemester,
            activeAcademicYear,
            reportData.average
          );

          return (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-lg border border-slate-300 p-8 sm:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none page-break-after"
            >
              {/* KOP SURAT RESMI SMPN 14 TULANG BAWANG BARAT */}
              <div className="border-b-4 border-double border-slate-900 pb-3 mb-6 text-center relative flex items-center justify-between">
                {/* Logo Kiri: Logo Pemkab Tubaba */}
                <div className="flex h-20 w-20 items-center justify-center shrink-0">
                  {schoolProfile.districtLogo ? (
                    <img
                      src={schoolProfile.districtLogo}
                      alt="Logo Pemda"
                      className="h-18 w-18 object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 text-[9px] font-bold text-center leading-tight p-1">
                      PEMKAB<br />TUBABA
                    </div>
                  )}
                </div>

                {/* Teks Kop Surat Tengah */}
                <div className="flex-1 px-2 sm:px-4">
                  <h4 className="text-xs sm:text-sm font-semibold tracking-wider text-slate-900 uppercase">
                    PEMERINTAH KABUPATEN TULANG BAWANG BARAT
                  </h4>
                  <h4 className="text-xs sm:text-sm font-semibold tracking-wider text-slate-900 uppercase">
                    DINAS PENDIDIKAN DAN KEBUDAYAAN
                  </h4>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-950 uppercase tracking-wide mt-0.5">
                    {schoolProfile.name}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-700 mt-1 leading-snug">
                    {schoolProfile.address}, Kec. {schoolProfile.subDistrict}, Kab. {schoolProfile.district} - {schoolProfile.province} {schoolProfile.postalCode}
                  </p>
                  <p className="text-[9px] sm:text-[11px] text-slate-600 font-mono">
                    NPSN: {schoolProfile.npsn} | Email: {schoolProfile.email} | Telp: {schoolProfile.phone}
                  </p>
                </div>

                {/* Logo Kanan: Logo Sekolah / Tut Wuri Handayani */}
                <div className="flex h-20 w-20 items-center justify-center shrink-0">
                  {schoolProfile.schoolLogo ? (
                    <img
                      src={schoolProfile.schoolLogo}
                      alt="Logo Sekolah"
                      className="h-18 w-18 object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 text-[9px] font-bold text-center leading-tight p-1">
                      TUT WURI<br />HANDAYANI
                    </div>
                  )}
                </div>
              </div>

              {/* JUDUL LAPORAN */}
              <div className="text-center mb-6">
                <h3 className="text-sm sm:text-base font-bold uppercase underline tracking-wide text-slate-900">
                  LAPORAN HASIL ASESMEN SUMATIF TENGAH SEMESTER (STS)
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  TAHUN PELAJARAN {activeAcademicYear} - SEMESTER {activeSemester === '1' ? 'GANJIL' : 'GENAP'}
                </p>
              </div>

              {/* IDENTITAS PESERTA DIDIK */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-900 mb-6 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                <div className="flex">
                  <span className="w-36 font-semibold">Nama Peserta Didik</span>
                  <span className="w-3">:</span>
                  <span className="font-bold text-slate-950 uppercase">{student.name}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold">Kelas</span>
                  <span className="w-3">:</span>
                  <span className="font-bold">{currentClass.name}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-semibold">NISN / NIS</span>
                  <span className="w-3">:</span>
                  <span className="font-mono">{student.nisn} / {student.nis}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold">Fase</span>
                  <span className="w-3">:</span>
                  <span>Fase D (SMP)</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-semibold">Nama Sekolah</span>
                  <span className="w-3">:</span>
                  <span>{schoolProfile.name}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold">Semester</span>
                  <span className="w-3">:</span>
                  <span>{activeSemester === '1' ? '1 (Satu / Ganjil)' : '2 (Dua / Genap)'}</span>
                </div>
                <div className="flex">
                  <span className="w-36 font-semibold">Agama</span>
                  <span className="w-3">:</span>
                  <span className="font-semibold">{student.religion || 'Islam'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-semibold">Alamat Sekolah</span>
                  <span className="w-3">:</span>
                  <span className="truncate">{schoolProfile.district}</span>
                </div>
              </div>

              {/* TABEL PENILAIAN ASESMEN STS */}
              <div className="mb-6">
                <table className="w-full text-xs border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold text-center">
                      <th className="border border-slate-900 p-2 w-10">No</th>
                      <th className="border border-slate-900 p-2 text-left min-w-[180px]">
                        Mata Pelajaran
                      </th>
                      <th className="border border-slate-900 p-2 w-20">Nilai STS</th>
                      <th className="border border-slate-900 p-2 text-left min-w-[280px]">
                        Capaian Kompetensi Tengah Semester
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((row) => (
                      <tr key={row.code} className="align-top">
                        <td className="border border-slate-900 p-2 text-center">{row.no}</td>
                        <td className="border border-slate-900 p-2 font-medium">{row.name}</td>
                        <td className="border border-slate-900 p-2 text-center font-bold text-slate-950 text-sm">
                          {row.score}
                        </td>
                        <td className="border border-slate-900 p-2 text-[11px] leading-relaxed text-slate-800">
                          {row.catatan}
                        </td>
                      </tr>
                    ))}
                    {/* Ringkasan Nilai */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                      <td colSpan={2} className="border border-slate-900 p-2 text-center">
                        JUMLAH NILAI & RATA-RATA STS
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-sm font-black text-blue-950">
                        {reportData.total}
                      </td>
                      <td className="border border-slate-900 p-2 font-bold text-slate-900">
                        Rata-Rata STS: <span className="text-sm font-black text-blue-950">{reportData.average}</span> (Skala 0 - 100)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* KEHADIRAN, CATATAN WALI KELAS & CATATAN PERKEMBANGAN SISWA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs">
                {/* Ketidakhadiran */}
                <div className="border border-slate-900 rounded p-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1 uppercase text-[10px] tracking-wide">
                      Ketidakhadiran Tengah Semester
                    </div>
                    <div className="space-y-1.5 text-slate-800 text-[11px]">
                      <div className="flex justify-between">
                        <span>1. Sakit (S)</span>
                        <span className="font-bold">{student.sick ?? 0} hari</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2. Izin (I)</span>
                        <span className="font-bold">{student.permitted ?? 0} hari</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3. Tanpa Keterangan (A)</span>
                        <span className="font-bold">{student.absent ?? 0} hari</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between font-bold text-slate-900 text-[10px]">
                    <span>Total Ketidakhadiran:</span>
                    <span>{(student.sick ?? 0) + (student.permitted ?? 0) + (student.absent ?? 0)} hari</span>
                  </div>
                </div>

                {/* Catatan Wali Kelas */}
                <div className="border border-slate-900 rounded p-3 flex flex-col">
                  <div className="font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1 uppercase text-[10px] tracking-wide">
                    Catatan Wali Kelas
                  </div>
                  <p className="italic text-slate-800 text-[11px] leading-relaxed flex-1">
                    "{student.waliNote?.trim() ? student.waliNote : generateCatatanWaliKelas(student, { average: reportData.average }, 'holistik')}"
                  </p>
                </div>

                {/* Catatan Perkembangan Siswa / Profil Pelajar Pancasila */}
                <div className="border border-slate-900 rounded p-3 flex flex-col">
                  <div className="font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1 uppercase text-[10px] tracking-wide">
                    Catatan Perkembangan Siswa
                  </div>
                  <p className="italic text-slate-800 text-[11px] leading-relaxed flex-1">
                    "{student.developmentNote?.trim() ? student.developmentNote : generateCatatanPerkembangan(student, { average: reportData.average }, 'karakter')}"
                  </p>
                </div>
              </div>

              {/* TANDA TANGAN RESMI */}
              <div className="mt-8 pt-4 text-xs text-slate-900">
                <div className="grid grid-cols-3 text-center gap-4">
                  <div>
                    <p>Mengetahui,</p>
                    <p>Orang Tua / Wali Siswa</p>
                    <div className="h-20" />
                    <p className="font-bold uppercase tracking-wider underline">
                      ( ......................................... )
                    </p>
                  </div>

                  <div>
                    <p className="text-white">_</p>
                    <p>Mengetahui,</p>
                    <p>Kepala SMPN 14 Tulang Bawang Barat</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-slate-950">{schoolProfile.headmasterName}</p>
                    <p className="text-[11px] text-slate-700">
                      {schoolProfile.headmasterNip ? `NIP. ${schoolProfile.headmasterNip.replace(/^NIP\.\s*/i, '')}` : '-'}
                    </p>
                  </div>

                  <div>
                    <p>Tulang Bawang Barat, {schoolProfile.reportDate}</p>
                    <p>Wali Kelas {currentClass.name}</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-slate-950">{homeroomTeacherName}</p>
                    <p className="text-[11px] text-slate-700">
                      {homeroomTeacherNip ? (homeroomTeacherNip.startsWith('NIP.') ? homeroomTeacherNip : `NIP. ${homeroomTeacherNip}`) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER RESMI CETAK RAPOR (NAMA SISWA / HALAMAN) */}
              <div className="mt-8 pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-900 font-sans">
                <div className="font-bold flex items-center gap-1.5 tracking-wide">
                  <span className="uppercase text-slate-950">{student.name}</span>
                  <span className="text-slate-400 font-normal">/</span>
                  <span className="font-semibold text-slate-800">
                    Halaman {printMode === 'all' || selectedStudentId === 'all' ? studentIndex + 1 : 1}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verifikasi: <strong>{verificationCode}</strong></span>
                  <span>•</span>
                  <span>e-Rapor {schoolProfile.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
