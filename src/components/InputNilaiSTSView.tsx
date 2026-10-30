import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  Upload,
  Save,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
  RotateCcw,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import {
  downloadGradeTemplateExcel,
  parseGradeExcel,
  ParseResult,
} from '../utils/excelHelper';
import {
  calculatePredikat,
  generateSTSNote,
  getSubjectReligion,
  doesStudentMatchSubjectReligion,
} from '../data/initialData';

export const InputNilaiSTSView: React.FC = () => {
  const {
    currentUser,
    schoolProfile,
    classes,
    subjects,
    students,
    grades,
    activeAcademicYear,
    activeSemester,
    saveBatchGrades,
    selectedClassId,
    setSelectedClassId,
    updateSubject,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Filter states
  const [currentClassId, setCurrentClassId] = useState<string>(
    currentUser?.role === 'wali_kelas' && currentUser.classAssigned
      ? currentUser.classAssigned
      : selectedClassId || '7.1'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('pai');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kkmInputValue, setKkmInputValue] = useState<number>(75);

  // Editable local grade table state: Record<studentId, { score: number; note: string; touched: boolean }>
  const [localGrades, setLocalGrades] = useState<
    Record<string, { score: number | ''; note: string; touched: boolean }>
  >({});
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Excel Upload Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected subject object
  const currentSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  // Selected class object
  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentClassId) || classes[0],
    [classes, currentClassId]
  );

  // Target religion for current subject (null if general non-religious subject)
  const targetReligion = useMemo(
    () => getSubjectReligion(currentSubject),
    [currentSubject]
  );

  // Raw list of students in the current class
  const rawClassStudents = useMemo(
    () => students.filter((s) => s.classId === currentClassId),
    [students, currentClassId]
  );

  // Filter students for current class: if subject is a religious education subject, only show students of that religion
  const classStudents = useMemo(() => {
    let list = rawClassStudents;

    // Filter by religion when a religious subject is selected
    if (targetReligion) {
      list = list.filter((s) => doesStudentMatchSubjectReligion(s.religion, targetReligion));
    }

    if (searchQuery) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.nisn.includes(searchQuery) ||
          s.nis.includes(searchQuery) ||
          (s.religion || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  }, [rawClassStudents, targetReligion, searchQuery]);

  // Sync initial grades when class or subject changes
  React.useEffect(() => {
    const existing = grades.filter(
      (g) =>
        g.classId === currentClassId &&
        g.subjectId === selectedSubjectId &&
        g.academicYear === activeAcademicYear &&
        g.semester === activeSemester
    );

    const initialMap: Record<string, { score: number | ''; note: string; touched: boolean }> = {};
    const studentsInClass = students.filter((s) => s.classId === currentClassId);

    studentsInClass.forEach((s) => {
      const match = existing.find((g) => g.studentId === s.id);
      if (match) {
        initialMap[s.id] = {
          score: match.stsScore,
          note: match.catatan,
          touched: false,
        };
      } else {
        // default empty
        initialMap[s.id] = {
          score: '',
          note: '',
          touched: false,
        };
      }
    });

    setLocalGrades(initialMap);
    setKkmInputValue(currentSubject.kkm);
    setIsSavedSuccess(false);
  }, [currentClassId, selectedSubjectId, activeAcademicYear, activeSemester, grades, students, currentSubject]);

  // Handle score change in table
  const handleScoreChange = (studentId: string, val: string) => {
    if (val === '') {
      setLocalGrades((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          score: '',
          note: '',
          touched: true,
        },
      }));
      return;
    }

    const num = Number(val);
    if (isNaN(num)) return;
    const clamped = Math.min(100, Math.max(0, num));
    const autoNote = generateSTSNote(clamped, currentSubject.name);

    setLocalGrades((prev) => ({
      ...prev,
      [studentId]: {
        score: clamped,
        note: prev[studentId]?.note && prev[studentId]?.note !== generateSTSNote(Number(prev[studentId]?.score || 0), currentSubject.name)
          ? prev[studentId].note
          : autoNote,
        touched: true,
      },
    }));
    setIsSavedSuccess(false);
  };

  // Handle note change
  const handleNoteChange = (studentId: string, noteVal: string) => {
    setLocalGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note: noteVal,
        touched: true,
      },
    }));
    setIsSavedSuccess(false);
  };

  // Quick fill helper (e.g. fill sample 80 for all unrated)
  const handleQuickFill = () => {
    const updated = { ...localGrades };
    classStudents.forEach((s) => {
      if (updated[s.id]?.score === '' || updated[s.id]?.score === undefined) {
        const sampleScore = 80;
        updated[s.id] = {
          score: sampleScore,
          note: generateSTSNote(sampleScore, currentSubject.name),
          touched: true,
        };
      }
    });
    setLocalGrades(updated);
  };

  // Save all modified grades to Context / Firestore
  const handleSaveAll = async () => {
    const toSave: {
      studentId: string;
      classId: string;
      subjectId: string;
      academicYear: string;
      semester: '1' | '2';
      stsScore: number;
      predikat: 'A' | 'B' | 'C' | 'D';
      catatan: string;
    }[] = [];

    // Save grades only for students taking this subject
    classStudents.forEach((s) => {
      const entry = localGrades[s.id];
      if (entry && entry.score !== '' && entry.score !== undefined) {
        const scoreNum = Number(entry.score);
        toSave.push({
          studentId: s.id,
          classId: currentClassId,
          subjectId: selectedSubjectId,
          academicYear: activeAcademicYear,
          semester: activeSemester,
          stsScore: scoreNum,
          predikat: calculatePredikat(scoreNum),
          catatan: entry.note || generateSTSNote(scoreNum, currentSubject.name),
        });
      }
    });

    if (toSave.length === 0) {
      alert('Tidak ada nilai siswa untuk disimpan.');
      return;
    }

    await saveBatchGrades(toSave);
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 4000);
  };

  // Download official Excel template
  const handleDownloadTemplate = () => {
    downloadGradeTemplateExcel(
      schoolProfile.name,
      currentClass.name,
      currentClass.id,
      currentSubject,
      activeAcademicYear,
      activeSemester,
      students
    );
  };

  // Handle Excel File Drop/Select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsParsing(true);
    setParseResult(null);

    try {
      const result = await parseGradeExcel(file, students, currentClassId, currentSubject);
      setParseResult(result);
    } catch (err: any) {
      alert(`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Apply parsed Excel grades into local state
  const handleApplyExcelGrades = () => {
    if (!parseResult || parseResult.grades.length === 0) return;

    setLocalGrades((prev) => {
      const copy = { ...prev };
      parseResult.grades.forEach((item) => {
        copy[item.studentId] = {
          score: item.score,
          note: item.catatan,
          touched: true,
        };
      });
      return copy;
    });

    setIsUploadModalOpen(false);
    setUploadFile(null);
    setParseResult(null);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const targetStudents = classStudents;
    const filledScores = targetStudents
      .map((s) => localGrades[s.id]?.score)
      .filter((sc): sc is number => typeof sc === 'number' && sc >= 0);

    const count = filledScores.length;
    const avg = count > 0 ? (filledScores.reduce((a, b) => a + b, 0) / count).toFixed(1) : '-';
    const max = count > 0 ? Math.max(...filledScores) : '-';
    const min = count > 0 ? Math.min(...filledScores) : '-';

    return {
      totalStudents: targetStudents.length,
      gradedCount: count,
      average: avg,
      max,
      min,
    };
  }, [classStudents, localGrades]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <FileSpreadsheet className="h-4 w-4" />
              Penilaian Kurikulum Merdeka (STS Tanpa TP)
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Input Nilai Sumatif Tengah Semester (STS)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input nilai STS skala 0-100 secara langsung pada tabel atau unggah file Excel per mata pelajaran.
            </p>
          </div>

          {/* Action Buttons: Download Template & Upload Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              title="Unduh Format Template Excel untuk mata pelajaran ini"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              Unduh Format Excel
            </button>

            <button
              onClick={() => {
                setUploadFile(null);
                setParseResult(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Upload className="h-4 w-4 text-white" />
              Unggah File Nilai Excel
            </button>

            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 text-white" />
              Simpan Semua Nilai
            </button>
          </div>
        </div>

        {/* Filter Bar: Select Class, Subject, Adjustable KKM, & Search */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Rombel (Kelas):
            </label>
            <select
              value={currentClassId}
              onChange={(e) => {
                setCurrentClassId(e.target.value);
                setSelectedClassId(e.target.value);
              }}
              disabled={!isSuperAdmin && currentUser?.role === 'wali_kelas' && !!currentUser.classAssigned}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Wali: {cls.homeroomTeacherName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Mata Pelajaran:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[...subjects].sort((a, b) => a.orderIndex - b.orderIndex).map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name} (KKM: {sub.kkm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Sesuaikan KKM:</span>
              <span className="text-[10px] text-blue-600 font-semibold">{currentSubject.code}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="50"
                max="100"
                value={kkmInputValue}
                onChange={(e) => setKkmInputValue(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-blue-900 text-center"
              />
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(100, Math.max(50, Number(kkmInputValue) || 75));
                  updateSubject({ ...currentSubject, kkm: val });
                  alert(`Standar KKM mata pelajaran ${currentSubject.name} berhasil disesuaikan ke ${val}.`);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold transition-colors"
                title="Terapkan penyesuaian KKM untuk mata pelajaran ini"
              >
                Terapkan
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cari Siswa:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Nama / NISN / Agama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Banner Filter Agama Siswa */}
        {targetReligion && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-amber-200/70 p-2 text-amber-800 shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-amber-950 flex items-center gap-2 flex-wrap">
                  <span>Mata Pelajaran Agama: {currentSubject.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                    Khusus Agama {targetReligion}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Menampilkan <strong className="font-extrabold text-amber-950">{classStudents.length} siswa</strong> beragama {targetReligion} dari total {rawClassStudents.length} siswa di {currentClass.name}. Siswa non-{targetReligion} disaring otomatis.
                </div>
              </div>
            </div>
            {classStudents.length === 0 && (
              <div className="text-[11px] bg-white/80 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-300 font-medium">
                Belum ada siswa beragama {targetReligion} di kelas ini. Anda dapat menambahkan atau mengedit data agama di menu <strong>Data Siswa Dapodik</strong>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white p-3.5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Siswa</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
          <div className="text-[11px] text-slate-400">{currentClass.name}</div>
        </div>

        <div className="rounded-xl bg-white p-3.5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Status Pengisian</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {stats.gradedCount} / {stats.totalStudents}
          </div>
          <div className="text-[11px] text-emerald-700">
            {stats.totalStudents > 0
              ? `${Math.round((stats.gradedCount / stats.totalStudents) * 100)}% terisi`
              : '0%'}
          </div>
        </div>

        <div className="rounded-xl bg-white p-3.5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Rata-Rata STS</span>
            <GraduationCap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.average}</div>
          <div className="text-[11px] text-slate-400">Standar KKM: {currentSubject.kkm}</div>
        </div>

        <div className="rounded-xl bg-white p-3.5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tertinggi / Terendah</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-800">
            {stats.max} <span className="text-xs text-slate-400">/ {stats.min}</span>
          </div>
          <div className="text-[11px] text-slate-400">Skor Max & Min</div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {isSavedSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">
              Nilai Sumatif Tengah Semester (STS) berhasil disimpan ke database cloud dan local!
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">Tersinkronisasi</span>
        </div>
      )}

      {/* Quick Tool Helper */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="h-3.5 w-3.5 text-blue-500" />
          <span>
            Nilai STS diinput dengan rentang 0-100 secara kuantitatif sesuai capaian Asesmen Tengah Semester tanpa TP.
          </span>
        </div>

        <button
          onClick={handleQuickFill}
          className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
          title="Isi nilai default 80 untuk siswa yang masih kosong"
        >
          <Sparkles className="h-3 w-3 text-amber-500" />
          Isi Cepat Siswa Kosong (Skor 80)
        </button>
      </div>

      {/* Interactive Grade Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th className="px-3 py-3 w-28">NISN / NIS</th>
                <th className="px-4 py-3 min-w-[180px]">Nama Lengkap Siswa</th>
                <th className="px-3 py-3 w-12 text-center">L/P</th>
                <th className="px-3 py-3 w-36 text-center bg-blue-50/70 text-blue-950 font-bold border-x border-blue-200/50">
                  Nilai STS (0-100)
                </th>
                <th className="px-4 py-3 min-w-[280px]">
                  Capaian Kemajuan STS (Tanpa TP)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {targetReligion ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="font-semibold text-slate-700">
                          Tidak ada siswa yang beragama {targetReligion} di {currentClass.name}.
                        </div>
                        <p className="text-xs text-slate-400">
                          Mata pelajaran <span className="font-bold text-slate-600">{currentSubject.name}</span> hanya diperuntukkan bagi siswa yang beragama {targetReligion}.
                        </p>
                      </div>
                    ) : (
                      `Tidak ada siswa ditemukan di kelas ${currentClass.name}.`
                    )}
                  </td>
                </tr>
              ) : (
                classStudents.map((std, idx) => {
                  const entry = localGrades[std.id] || { score: '', note: '', touched: false };
                  const scoreVal = entry.score;

                  return (
                    <tr
                      key={std.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        entry.touched ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-800">{std.nisn}</div>
                        <div className="text-[10px] text-slate-400">{std.nis}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{std.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                              (std.religion || 'Islam').toLowerCase() === 'islam'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                            title={`Agama: ${std.religion || 'Islam'}`}
                          >
                            {std.religion || 'Islam'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {std.birthPlace}, {std.birthDate}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-600">
                        {std.gender}
                      </td>
                      {/* Input Nilai STS */}
                      <td className="px-3 py-2 text-center bg-blue-50/30 border-x border-blue-200/40">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scoreVal}
                          onChange={(e) => handleScoreChange(std.id, e.target.value)}
                          placeholder="0-100"
                          className="w-24 text-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-bold text-slate-900 shadow-inner focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </td>
                      {/* Deskripsi Catatan */}
                      <td className="px-4 py-2">
                        <textarea
                          rows={2}
                          value={entry.note}
                          onChange={(e) => handleNoteChange(std.id, e.target.value)}
                          placeholder="Deskripsi kemajuan Asesmen STS tanpa TP otomatis terisi..."
                          className="w-full text-[11px] rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border-t border-slate-200 gap-3">
          <div className="text-xs text-slate-500">
            Menampilkan {classStudents.length} siswa di Kelas {currentClass.name}.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // reload
                setSelectedSubjectId((prev) => prev);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              Batal
            </button>
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Simpan Semua Nilai ({stats.gradedCount} Terisi)
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Unggah File Nilai Excel */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-emerald-700 px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold text-base">
                <FileSpreadsheet className="h-5 w-5 text-emerald-200" />
                Unggah Nilai STS via File Excel
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 hover:bg-emerald-800 text-emerald-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-blue-50 p-3.5 text-xs text-blue-900 border border-blue-200">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Info className="h-4 w-4 text-blue-600" /> Target Unggah:
                </div>
                <p className="mt-1">
                  Mata Pelajaran: <strong>{currentSubject.name}</strong> | Kelas:{' '}
                  <strong>{currentClass.name}</strong>
                </p>
                <p className="mt-0.5 text-blue-800">
                  Sistem akan mencocokkan otomatis berdasarkan NISN, NIS, atau Nama Siswa.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center bg-slate-50 hover:bg-emerald-50/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 mb-2">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {uploadFile ? uploadFile.name : 'Klik untuk memilih file Excel (.xlsx / .csv)'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan file yang diunduh dari tombol "Unduh Format Excel" untuk hasil optimal.
                  </p>
                </div>
              </div>

              {isParsing && (
                <div className="text-center py-4 text-xs font-semibold text-slate-600">
                  Sedang membaca dan memvalidasi data Excel...
                </div>
              )}

              {/* Parse Report Preview */}
              {parseResult && (
                <div className="space-y-3">
                  <div
                    className={`rounded-xl p-3.5 text-xs border ${
                      parseResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {parseResult.success ? (
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      {parseResult.message}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        Siswa Cocok:{' '}
                        <strong className="text-emerald-700">{parseResult.matchedCount}</strong>
                      </div>
                      <div>
                        Total Baris Dibaca: <strong>{parseResult.totalParsed}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Preview table */}
                  {parseResult.grades.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-xs divide-y divide-slate-100">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 flex justify-between text-[11px]">
                        <span>Pratinjau Nilai yang Akan Diterapkan:</span>
                        <span>{parseResult.grades.length} Siswa</span>
                      </div>
                      {parseResult.grades.map((item, i) => (
                        <div key={i} className="px-3 py-1.5 flex items-center justify-between">
                          <span className="font-medium text-slate-800 truncate max-w-[240px]">
                            {item.studentName}
                          </span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Skor STS: {item.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseResult.unmatchedStudents.length > 0 && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <strong>Perhatian:</strong> {parseResult.unmatchedStudents.length} siswa di
                      kelas belum memiliki nilai dalam file ini.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleApplyExcelGrades}
                disabled={!parseResult || parseResult.grades.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow"
              >
                Terapkan ke Tabel Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
