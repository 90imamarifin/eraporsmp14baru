import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import {
  generateCatatanWaliKelas,
  generateCatatanPerkembangan,
  generateStudentNotes,
  NoteStyle,
} from '../utils/noteGenerator';
import {
  ClipboardCheck,
  Save,
  Search,
  CheckCircle,
  Sparkles,
  HeartHandshake,
  BookOpen,
  AlertCircle,
  Filter,
  Wand2,
  RefreshCw,
  ChevronDown,
  Layers,
  Award,
  Clock,
  Settings2,
  Check,
  X,
} from 'lucide-react';

export const PresensiCatatanView: React.FC = () => {
  const {
    students,
    classes,
    selectedClassId,
    currentUser,
    activeAcademicYear,
    activeSemester,
    updateBatchStudents,
    getLegerData,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [currentClassId, setCurrentClassId] = useState<string>(
    currentUser?.role === 'wali_kelas' && currentUser.classAssigned
      ? currentUser.classAssigned
      : selectedClassId || '7.1'
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [genNotification, setGenNotification] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modal dialog for batch generation
  const [showGenModal, setShowGenModal] = useState<boolean>(false);
  const [genTargetScope, setGenTargetScope] = useState<'all' | 'empty_only'>('all');
  const [genTargetType, setGenTargetType] = useState<'both' | 'wali_only' | 'dev_only'>('both');
  const [genStyle, setGenStyle] = useState<NoteStyle>('holistik');

  // Active student stats from Leger
  const legerRows = useMemo(() => {
    try {
      return getLegerData(currentClassId);
    } catch (e) {
      return [];
    }
  }, [getLegerData, currentClassId, students]);

  const studentStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { average: number; rank: number; totalStudents: number; sick: number; permitted: number; absent: number }
    >();
    const total = legerRows.length;
    legerRows.forEach((row) => {
      map.set(row.student.id, {
        average: row.averageScore,
        rank: row.rank,
        totalStudents: total,
        sick: row.sick,
        permitted: row.permitted,
        absent: row.absent,
      });
    });
    return map;
  }, [legerRows]);

  // Local state for batch editing students in this class
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === currentClassId),
    [students, currentClassId]
  );

  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentClassId) || classes[0],
    [classes, currentClassId]
  );

  // Editable student state
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  // Keep track of modified IDs to highlight recently updated rows
  const [recentlyGeneratedIds, setRecentlyGeneratedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalStudents(classStudents);
    setRecentlyGeneratedIds(new Set());
  }, [classStudents, currentClassId]);

  const filteredStudents = useMemo(() => {
    return localStudents.filter((s) =>
      searchQuery
        ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.nisn.includes(searchQuery) ||
          s.nis.includes(searchQuery)
        : true
    );
  }, [localStudents, searchQuery]);

  // Update single student field
  const handleUpdateField = (studentId: string, field: keyof Student, value: any) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, [field]: value } : s))
    );
  };

  /**
   * Single student auto-generate (Catatan Wali Kelas Saja)
   */
  const handleGenerateSingleWaliNote = (student: Student, seed: number = 0) => {
    const stats = studentStatsMap.get(student.id) || {
      average: 80,
      rank: 1,
      totalStudents: localStudents.length,
      sick: student.sick || 0,
      permitted: student.permitted || 0,
      absent: student.absent || 0,
    };
    const note = generateCatatanWaliKelas(student, stats, genStyle, seed + Math.floor(Math.random() * 5));
    handleUpdateField(student.id, 'waliNote', note);
    setRecentlyGeneratedIds((prev) => new Set(prev).add(student.id));
  };

  /**
   * Single student auto-generate (Catatan Perkembangan Siswa Saja)
   */
  const handleGenerateSingleDevNote = (student: Student, seed: number = 0) => {
    const stats = studentStatsMap.get(student.id) || {
      average: 80,
      rank: 1,
      totalStudents: localStudents.length,
      sick: student.sick || 0,
      permitted: student.permitted || 0,
      absent: student.absent || 0,
    };
    const note = generateCatatanPerkembangan(student, stats, genStyle, seed + Math.floor(Math.random() * 5));
    handleUpdateField(student.id, 'developmentNote', note);
    setRecentlyGeneratedIds((prev) => new Set(prev).add(student.id));
  };

  /**
   * Single student auto-generate (Keduanya)
   */
  const handleGenerateSingleBoth = (student: Student, seed: number = 0) => {
    const stats = studentStatsMap.get(student.id) || {
      average: 80,
      rank: 1,
      totalStudents: localStudents.length,
      sick: student.sick || 0,
      permitted: student.permitted || 0,
      absent: student.absent || 0,
    };
    const { waliNote, developmentNote } = generateStudentNotes(student, stats, genStyle, seed);
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, waliNote, developmentNote } : s))
    );
    setRecentlyGeneratedIds((prev) => new Set(prev).add(student.id));
  };

  /**
   * Execute Batch Auto-Generation
   */
  const handleExecuteBatchGeneration = () => {
    let affectedCount = 0;
    const updatedIds = new Set<string>();

    setLocalStudents((prev) =>
      prev.map((student, idx) => {
        const stats = studentStatsMap.get(student.id) || {
          average: 80,
          rank: idx + 1,
          totalStudents: prev.length,
          sick: student.sick || 0,
          permitted: student.permitted || 0,
          absent: student.absent || 0,
        };

        const isWaliEmpty = !student.waliNote || student.waliNote.trim() === '';
        const isDevEmpty = !student.developmentNote || student.developmentNote.trim() === '';

        let nextWali = student.waliNote;
        let nextDev = student.developmentNote;

        const shouldGenerateWali =
          (genTargetType === 'both' || genTargetType === 'wali_only') &&
          (genTargetScope === 'all' || isWaliEmpty);

        const shouldGenerateDev =
          (genTargetType === 'both' || genTargetType === 'dev_only') &&
          (genTargetScope === 'all' || isDevEmpty);

        if (shouldGenerateWali) {
          nextWali = generateCatatanWaliKelas(student, stats, genStyle, idx);
        }
        if (shouldGenerateDev) {
          nextDev = generateCatatanPerkembangan(student, stats, genStyle, idx);
        }

        if (shouldGenerateWali || shouldGenerateDev) {
          affectedCount++;
          updatedIds.add(student.id);
          return {
            ...student,
            waliNote: nextWali,
            developmentNote: nextDev,
          };
        }

        return student;
      })
    );

    setRecentlyGeneratedIds(updatedIds);
    setShowGenModal(false);
    setGenNotification(
      `✨ Berhasil membuat catatan otomatis untuk ${affectedCount} siswa (${currentClass.name}) berdasarkan capaian STS dan presensi! Pastikan menekan tombol "Simpan Presensi & Catatan".`
    );
    setTimeout(() => setGenNotification(''), 6000);
  };

  // Save changes to AppContext and Firestore
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      await updateBatchStudents(localStudents);
      setSaveSuccessMsg(`Berhasil menyimpan presensi dan catatan untuk ${localStudents.length} siswa!`);
      setRecentlyGeneratedIds(new Set());
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err?.message || 'Terjadi kesalahan sistem.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Class attendance statistics
  const totalSakit = localStudents.reduce((acc, s) => acc + (s.sick || 0), 0);
  const totalIzin = localStudents.reduce((acc, s) => acc + (s.permitted || 0), 0);
  const totalAlpha = localStudents.reduce((acc, s) => acc + (s.absent || 0), 0);
  const totalAbsenAll = totalSakit + totalIzin + totalAlpha;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
              <ClipboardCheck className="h-4 w-4" />
              Kelengkapan Rapor Kurikulum Merdeka
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Presensi, Catatan Wali Kelas & Catatan Perkembangan Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
              Input data rekapitulasi ketidakhadiran (S/I/A), Catatan Wali Kelas, dan Catatan Perkembangan Karakter Profil Pelajar Pancasila yang akan dicetak pada lembar rapor STS dan rekap leger nilai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Generate Otomatis Trigger */}
            <button
              onClick={() => setShowGenModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Generate otomatis catatan wali kelas & perkembangan berdasarkan nilai STS dan kehadiran"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              Generate Otomatis Catatan
            </button>

            {/* Simpan Button */}
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow transition-all disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Presensi & Catatan'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {genNotification && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-3.5 text-xs text-indigo-950 flex items-start justify-between gap-2 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{genNotification}</span>
            </div>
            <button
              onClick={() => setGenNotification('')}
              className="text-indigo-400 hover:text-indigo-700 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {/* Filters and Stats Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas:</label>
            <select
              value={currentClassId}
              onChange={(e) => setCurrentClassId(e.target.value)}
              disabled={!isSuperAdmin && currentUser?.role === 'wali_kelas' && !!currentUser.classAssigned}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Wali: {cls.homeroomTeacherName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cari Siswa:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Nama / NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Mini Attendance Summary Card */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-around text-center">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Sakit</div>
              <div className="text-sm font-bold text-amber-700 font-mono">{totalSakit}</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Izin</div>
              <div className="text-sm font-bold text-blue-700 font-mono">{totalIzin}</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Alpha</div>
              <div className="text-sm font-bold text-rose-700 font-mono">{totalAlpha}</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Absen</div>
              <div className="text-sm font-black text-slate-900 font-mono">{totalAbsenAll}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table for Presensi & Catatan */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Presensi & Catatan Rapor - {currentClass.name}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                Fitur Generate Aktif ✨
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Wali Kelas: <strong>{currentClass.homeroomTeacherName}</strong> | Semester:{' '}
              <strong>{activeSemester === '1' ? 'Ganjil' : 'Genap'}</strong> ({activeAcademicYear})
            </p>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>{localStudents.length} Siswa</span>
            </span>
            <button
              onClick={() => handleExecuteBatchGeneration()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
              title="Generate cepat semua siswa dengan gaya standar"
            >
              <RefreshCw className="h-3 w-3" />
              Generate Cepat Semua
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="px-2 py-3 w-8 text-center border-r border-slate-200">No</th>
                <th className="px-3 py-3 w-52 border-r border-slate-200">Peserta Didik & Nilai</th>
                <th className="px-2 py-3 w-16 text-center border-r border-slate-200 bg-amber-50 text-amber-950">
                  Sakit (S)
                </th>
                <th className="px-2 py-3 w-16 text-center border-r border-slate-200 bg-blue-50 text-blue-950">
                  Izin (I)
                </th>
                <th className="px-2 py-3 w-16 text-center border-r border-slate-200 bg-rose-50 text-rose-950">
                  Alpha (A)
                </th>
                <th className="px-2 py-3 w-14 text-center border-r border-slate-200 bg-slate-200/70 font-black">
                  Total
                </th>
                <th className="px-4 py-3 min-w-[320px] border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-blue-900">
                      <HeartHandshake className="h-3.5 w-3.5 text-blue-600" />
                      Catatan Wali Kelas
                    </span>
                    <span className="text-[9px] font-normal text-slate-500 lowercase">
                      (asesmen, rank & motivasi)
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[340px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-900">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                      Catatan Perkembangan Siswa
                    </span>
                    <span className="text-[9px] font-normal text-slate-500 lowercase">
                      (profil pelajar pancasila)
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada siswa ditemukan pada kelas ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  const s = std.sick ?? 0;
                  const i = std.permitted ?? 0;
                  const a = std.absent ?? 0;
                  const tot = s + i + a;
                  const stats = studentStatsMap.get(std.id);
                  const isRecentlyGen = recentlyGeneratedIds.has(std.id);

                  return (
                    <tr
                      key={std.id}
                      className={`transition-colors ${
                        isRecentlyGen ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-2 py-3 text-center text-slate-400 font-medium border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Info Siswa & Capaian STS */}
                      <td className="px-3 py-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{std.name}</span>
                          {stats && stats.rank <= 3 && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300"
                              title={`Peringkat ${stats.rank}`}
                            >
                              #{stats.rank}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          NISN: {std.nisn} | {std.religion || 'Islam'}
                        </div>

                        {/* Indikator Rata-Rata STS & Rank */}
                        <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                            STS: {stats ? stats.average.toFixed(1) : '-'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
                            Rank {stats?.rank || idx + 1}/{localStudents.length}
                          </span>
                        </div>

                        {/* Tombol Cepat Generate Kedua Catatan */}
                        <button
                          onClick={() => handleGenerateSingleBoth(std, idx)}
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                          title="Generate otomatis kedua catatan untuk siswa ini"
                        >
                          <Wand2 className="h-3 w-3 text-indigo-600" />
                          Generate Catatan Siswa Ini
                        </button>
                      </td>

                      {/* Presensi Sakit */}
                      <td className="px-2 py-2 text-center border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={s}
                          onChange={(e) =>
                            handleUpdateField(std.id, 'sick', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-12 text-center font-bold text-amber-900 rounded border border-amber-300 bg-white py-1 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>

                      {/* Presensi Izin */}
                      <td className="px-2 py-2 text-center border-r border-slate-200 bg-blue-50/30">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={i}
                          onChange={(e) =>
                            handleUpdateField(std.id, 'permitted', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-12 text-center font-bold text-blue-900 rounded border border-blue-300 bg-white py-1 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Presensi Alpha */}
                      <td className="px-2 py-2 text-center border-r border-slate-200 bg-rose-50/30">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={a}
                          onChange={(e) =>
                            handleUpdateField(std.id, 'absent', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-12 text-center font-bold text-rose-900 rounded border border-rose-300 bg-white py-1 focus:ring-1 focus:ring-rose-500"
                        />
                      </td>

                      {/* Total Ketidakhadiran */}
                      <td className="px-2 py-3 text-center border-r border-slate-200 font-bold bg-slate-100 font-mono">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            tot > 5
                              ? 'bg-rose-100 text-rose-800'
                              : tot > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {tot}
                        </span>
                      </td>

                      {/* Catatan Wali Kelas */}
                      <td className="px-3 py-2 border-r border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-500">
                            Bimbingan & Hasil Belajar
                          </span>
                          <button
                            onClick={() => handleGenerateSingleWaliNote(std, idx)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                            title="Generate ulang catatan wali kelas siswa ini"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Auto Generate
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={std.waliNote || ''}
                          onChange={(e) => handleUpdateField(std.id, 'waliNote', e.target.value)}
                          placeholder="Masukkan catatan bimbingan wali kelas..."
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                        />
                      </td>

                      {/* Catatan Perkembangan Siswa */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-500">
                            Sikap & Profil Pelajar Pancasila
                          </span>
                          <button
                            onClick={() => handleGenerateSingleDevNote(std, idx)}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline"
                            title="Generate ulang catatan perkembangan siswa ini"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Auto Generate
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={std.developmentNote || ''}
                          onChange={(e) =>
                            handleUpdateField(std.id, 'developmentNote', e.target.value)
                          }
                          placeholder="Masukkan catatan perkembangan sikap & karakter..."
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Catatan Wali Kelas dan Perkembangan Siswa otomatis terhubung ke lembar <strong>Cetak Rapor STS (PDF)</strong> dan rekapitulasi <strong>Leger Nilai</strong>.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Opsi Generate Otomatis
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow transition-all disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Presensi & Catatan'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog: Opsi Generate Otomatis Catatan */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
                    <Sparkles className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Generate Otomatis Catatan Rapor</h3>
                    <p className="text-xs text-indigo-100">
                      Rombel: {currentClass.name} ({classStudents.length} Siswa Terdaftar)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenModal(false)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-indigo-950 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Fitur ini secara otomatis menganalisis <strong>rata-rata nilai STS</strong>, <strong>peringkat kelas</strong>, dan <strong>rekapitulasi presensi (S/I/A)</strong> untuk menyusun narasi deskriptif yang mendidik sesuai standar Kurikulum Merdeka SMP.
                </p>
              </div>

              {/* 1. Target Catatan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  1. Pilih Catatan yang Ingin Digenerate:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenTargetType('both')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      genTargetType === 'both'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px]">Keduanya</span>
                      {genTargetType === 'both' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] font-normal text-slate-500">
                      Wali Kelas & Perkembangan
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenTargetType('wali_only')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      genTargetType === 'wali_only'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px]">Wali Kelas</span>
                      {genTargetType === 'wali_only' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] font-normal text-slate-500">
                      Fokus Asesmen & Motivasi
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenTargetType('dev_only')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      genTargetType === 'dev_only'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px]">Perkembangan</span>
                      {genTargetType === 'dev_only' && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] font-normal text-slate-500">
                      Profil Pelajar Pancasila
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Target Siswa */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  2. Cakupan Siswa:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={genTargetScope === 'all'}
                      onChange={() => setGenTargetScope('all')}
                      className="text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800">
                      Semua Siswa di Rombel ({classStudents.length} siswa)
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      (Timpa catatan lama)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={genTargetScope === 'empty_only'}
                      onChange={() => setGenTargetScope('empty_only')}
                      className="text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800">
                      Hanya Siswa yang Catatannya Masih Kosong
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      (Aman, tidak timpa catatan lama)
                    </span>
                  </label>
                </div>
              </div>

              {/* 3. Gaya Bahasa / Penekanan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  3. Gaya Bahasa & Penekanan:
                </label>
                <select
                  value={genStyle}
                  onChange={(e) => setGenStyle(e.target.value as NoteStyle)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="holistik">
                    Kurikulum Merdeka Holistik (Kombinasi Nilai STS, Peringkat & Presensi)
                  </option>
                  <option value="karakter">
                    Fokus Karakter & Penguatan Profil Pelajar Pancasila
                  </option>
                  <option value="akademik">
                    Fokus Peningkatan Akademis & Kedisiplinan Belajar
                  </option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGenModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchGeneration}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 text-xs font-bold shadow-md shadow-indigo-100 transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                Mulai Generate Otomatis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
