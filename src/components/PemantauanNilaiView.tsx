import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Subject, Student, STSGrade } from '../types';
import {
  calculatePredikat,
  doesStudentMatchSubjectReligion,
  getSubjectReligion,
} from '../data/initialData';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  Search,
  Filter,
  BarChart3,
  UserCheck,
  AlertCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  HeartHandshake,
  School,
  ExternalLink,
  ChevronRight,
  X,
  Eye,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface PemantauanNilaiViewProps {
  onNavigate?: (view: string) => void;
}

export const PemantauanNilaiView: React.FC<PemantauanNilaiViewProps> = ({ onNavigate }) => {
  const {
    students,
    classes,
    subjects,
    grades,
    schoolProfile,
    activeAcademicYear,
    activeSemester,
    selectedClassId,
    setSelectedClassId,
    currentUser,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [currentClassId, setCurrentClassId] = useState<string>(
    currentUser?.role === 'wali_kelas' && currentUser.classAssigned
      ? currentUser.classAssigned
      : selectedClassId || '7.1'
  );

  const [activeTab, setActiveTab] = useState<'mapel' | 'siswa' | 'rombel_summary'>('mapel');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete' | 'below_kkm'>('all');

  // Selected student for detailed drill-down modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Synchronize class selection
  const handleClassChange = (newClassId: string) => {
    setCurrentClassId(newClassId);
    setSelectedClassId(newClassId);
  };

  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentClassId) || classes[0],
    [classes, currentClassId]
  );

  // Students in selected class
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === currentClassId),
    [students, currentClassId]
  );

  // Grades in selected class and active term
  const classGrades = useMemo(
    () =>
      grades.filter(
        (g) =>
          g.classId === currentClassId &&
          g.academicYear === activeAcademicYear &&
          g.semester === activeSemester
      ),
    [grades, currentClassId, activeAcademicYear, activeSemester]
  );

  // Sort subjects: Religious subjects first, then orderIndex
  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [subjects]);

  /**
   * Status input per mata pelajaran untuk kelas yang aktif
   */
  const subjectMonitoringData = useMemo(() => {
    return sortedSubjects.map((sub) => {
      const subReligion = getSubjectReligion(sub);

      // Filter eligible students (e.g. for Islamic religion subject, only Muslim students)
      const eligibleStudents = classStudents.filter((s) => {
        if (!subReligion) return true;
        return doesStudentMatchSubjectReligion(s.religion, subReligion);
      });

      const eligibleCount = eligibleStudents.length;

      // Find grades entered for this subject in this class
      const enteredGrades = classGrades.filter((g) => g.subjectId === sub.id);
      // Valid entered grades matching eligible students
      const validEntered = enteredGrades.filter((g) =>
        eligibleStudents.some((s) => s.id === g.studentId)
      );

      const enteredCount = validEntered.length;
      const progressPercent = eligibleCount > 0 ? Math.round((enteredCount / eligibleCount) * 100) : 100;

      // Stats
      let totalScore = 0;
      let countBelowKkm = 0;
      let highestScore = 0;
      let lowestScore = 100;
      let lastUpdated = '-';
      let lastUpdatedBy = '-';

      if (enteredCount > 0) {
        validEntered.forEach((g) => {
          totalScore += g.stsScore;
          if (g.stsScore < sub.kkm) countBelowKkm++;
          if (g.stsScore > highestScore) highestScore = g.stsScore;
          if (g.stsScore < lowestScore) lowestScore = g.stsScore;
          if (g.updatedAt) lastUpdated = g.updatedAt;
          if (g.updatedBy) lastUpdatedBy = g.updatedBy;
        });
      } else {
        lowestScore = 0;
      }

      const averageScore = enteredCount > 0 ? Number((totalScore / enteredCount).toFixed(1)) : 0;
      const isComplete = eligibleCount > 0 ? enteredCount >= eligibleCount : true;

      return {
        subject: sub,
        eligibleCount,
        enteredCount,
        missingCount: Math.max(0, eligibleCount - enteredCount),
        progressPercent,
        averageScore,
        countBelowKkm,
        highestScore: enteredCount > 0 ? highestScore : 0,
        lowestScore: enteredCount > 0 ? lowestScore : 0,
        lastUpdated,
        lastUpdatedBy: lastUpdatedBy !== '-' ? lastUpdatedBy : currentClass.homeroomTeacherName,
        isComplete,
      };
    });
  }, [sortedSubjects, classStudents, classGrades, currentClass]);

  /**
   * Status input per siswa untuk kelas yang aktif
   */
  const studentMonitoringData = useMemo(() => {
    return classStudents.map((std) => {
      // Find all relevant subjects for this student (filtered by student's religion)
      const relevantSubs = sortedSubjects.filter((sub) => {
        const subRel = getSubjectReligion(sub);
        if (!subRel) return true;
        return doesStudentMatchSubjectReligion(std.religion, subRel);
      });

      const totalRequired = relevantSubs.length;
      const studentGrades = classGrades.filter((g) => g.studentId === std.id);

      const gradesMap = new Map<string, STSGrade>();
      studentGrades.forEach((g) => gradesMap.set(g.subjectId, g));

      let totalScore = 0;
      let enteredCount = 0;
      let belowKkmCount = 0;
      const missingSubjects: Subject[] = [];
      const belowKkmSubjects: { subject: Subject; score: number }[] = [];

      relevantSubs.forEach((sub) => {
        const g = gradesMap.get(sub.id);
        if (g !== undefined) {
          enteredCount++;
          totalScore += g.stsScore;
          if (g.stsScore < sub.kkm) {
            belowKkmCount++;
            belowKkmSubjects.push({ subject: sub, score: g.stsScore });
          }
        } else {
          missingSubjects.push(sub);
        }
      });

      const average = enteredCount > 0 ? Number((totalScore / enteredCount).toFixed(1)) : 0;
      const isAllGradesEntered = enteredCount >= totalRequired;

      const hasWaliNote = !!(std.waliNote && std.waliNote.trim());
      const hasDevNote = !!(std.developmentNote && std.developmentNote.trim());
      const hasPresensi =
        (std.sick !== undefined && std.sick > 0) ||
        (std.permitted !== undefined && std.permitted > 0) ||
        (std.absent !== undefined && std.absent > 0);

      const isFullyReadyForReport = isAllGradesEntered && hasWaliNote && hasDevNote;

      return {
        student: std,
        totalRequired,
        enteredCount,
        missingSubjects,
        belowKkmSubjects,
        belowKkmCount,
        average,
        isAllGradesEntered,
        hasWaliNote,
        hasDevNote,
        hasPresensi,
        isFullyReadyForReport,
        gradesMap,
      };
    });
  }, [classStudents, sortedSubjects, classGrades]);

  // Filtered students based on query and status filter
  const filteredStudents = useMemo(() => {
    return studentMonitoringData.filter((item) => {
      const matchesSearch =
        item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.nisn.includes(searchQuery) ||
        item.student.nis.includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterStatus === 'complete') return item.isFullyReadyForReport;
      if (filterStatus === 'incomplete') return !item.isAllGradesEntered || !item.hasWaliNote || !item.hasDevNote;
      if (filterStatus === 'below_kkm') return item.belowKkmCount > 0;

      return true;
    });
  }, [studentMonitoringData, searchQuery, filterStatus]);

  // Class-wide summary KPI
  const overallKPI = useMemo(() => {
    const totalStudents = classStudents.length;
    const totalSubjectSlots = studentMonitoringData.reduce((acc, s) => acc + s.totalRequired, 0);
    const totalEnteredSlots = studentMonitoringData.reduce((acc, s) => acc + s.enteredCount, 0);
    const overallProgress = totalSubjectSlots > 0 ? Math.round((totalEnteredSlots / totalSubjectSlots) * 100) : 0;

    const studentsWithFullGrades = studentMonitoringData.filter((s) => s.isAllGradesEntered).length;
    const studentsWithWaliNote = studentMonitoringData.filter((s) => s.hasWaliNote).length;
    const studentsWithDevNote = studentMonitoringData.filter((s) => s.hasDevNote).length;
    const studentsReadyForReport = studentMonitoringData.filter((s) => s.isFullyReadyForReport).length;

    const subjects100Percent = subjectMonitoringData.filter((m) => m.isComplete).length;

    return {
      totalStudents,
      totalSubjectSlots,
      totalEnteredSlots,
      overallProgress,
      studentsWithFullGrades,
      studentsWithWaliNote,
      studentsWithDevNote,
      studentsReadyForReport,
      subjects100Percent,
      totalSubjects: sortedSubjects.length,
    };
  }, [classStudents, studentMonitoringData, subjectMonitoringData, sortedSubjects]);

  // Cross-Class Rombel Comparison Data (for Super Admin or Headmaster)
  const allRombelSummary = useMemo(() => {
    return classes.map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id);
      const clsGrades = grades.filter(
        (g) =>
          g.classId === cls.id &&
          g.academicYear === activeAcademicYear &&
          g.semester === activeSemester
      );

      let totalSlots = 0;
      let filledSlots = 0;

      clsStudents.forEach((std) => {
        sortedSubjects.forEach((sub) => {
          const subRel = getSubjectReligion(sub);
          if (subRel && !doesStudentMatchSubjectReligion(std.religion, subRel)) return;
          totalSlots++;
          if (clsGrades.some((g) => g.studentId === std.id && g.subjectId === sub.id)) {
            filledSlots++;
          }
        });
      });

      const percentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
      const notesCompleted = clsStudents.filter((s) => s.waliNote && s.developmentNote).length;

      return {
        classGroup: cls,
        studentCount: clsStudents.length,
        totalSlots,
        filledSlots,
        percentage,
        notesCompleted,
        isFinished: totalSlots > 0 && filledSlots >= totalSlots,
      };
    });
  }, [classes, students, grades, sortedSubjects, activeAcademicYear, activeSemester]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
              <Activity className="h-4 w-4" />
              Monitoring & Pengawasan Nilai Asesmen STS
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Pemantauan Nilai Siswa (Wali Kelas & Guru Mata Pelajaran)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
              Pantau progres entri nilai Asesmen Sumatif Tengah Semester (STS) secara transparan, periksa ketercapaian KKM, serta verifikasi kelengkapan presensi dan catatan rapor sebelum pencetakan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Cetak Laporan Monitoring
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('input-nilai')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Input Nilai STS
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Rombel / Kelas:</label>
            <select
              value={currentClassId}
              onChange={(e) => handleClassChange(e.target.value)}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filter Kelengkapan Siswa:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="all">Semua Siswa ({classStudents.length})</option>
              <option value="complete">Siap Cetak Rapor (100% Lengkap)</option>
              <option value="incomplete">Belum Lengkap (Nilai / Catatan Kosong)</option>
              <option value="below_kkm">Ada Nilai di Bawah KKM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cari Siswa / Mapel:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Nama, NISN, atau Mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Kelengkapan Nilai STS */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Kelengkapan Nilai STS</span>
            <div className="h-8 w-8 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
              {overallKPI.overallProgress}%
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {overallKPI.totalEnteredSlots}
              <span className="text-xs text-slate-400 font-normal ml-1">/ {overallKPI.totalSubjectSlots} nilai</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  overallKPI.overallProgress === 100
                    ? 'bg-emerald-500'
                    : overallKPI.overallProgress > 50
                    ? 'bg-violet-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${overallKPI.overallProgress}%` }}
              />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{currentClass.name}</span>
            <span className="font-semibold text-slate-700">
              {overallKPI.overallProgress === 100 ? 'Sudah 100% Tuntas' : `${100 - overallKPI.overallProgress}% Belum Input`}
            </span>
          </div>
        </div>

        {/* Card 2: Siswa Siap Cetak Rapor */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Siap Cetak Rapor</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {overallKPI.studentsReadyForReport}
              <span className="text-xs text-slate-400 font-normal ml-1">/ {overallKPI.totalStudents} siswa</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Nilai lengkap + Catatan Wali + Catatan Perkembangan
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {overallKPI.totalStudents - overallKPI.studentsReadyForReport} siswa masih dalam proses
            </span>
          </div>
        </div>

        {/* Card 3: Mapel Selesai 100% */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Mapel Tuntas Diinput</span>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-700 font-mono">
              {overallKPI.subjects100Percent}
              <span className="text-xs text-slate-400 font-normal ml-1">/ {overallKPI.totalSubjects} mapel</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Termasuk Mapel Mulok Karakter Tubaba & Aksara Lampung
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 flex justify-between">
            <span>Wali: {currentClass.homeroomTeacherName.split(',')[0]}</span>
            <span className="font-bold text-blue-800">
              {Math.round((overallKPI.subjects100Percent / overallKPI.totalSubjects) * 100)}%
            </span>
          </div>
        </div>

        {/* Card 4: Status Catatan Wali & Karakter */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Catatan Wali & Karakter</span>
            <HeartHandshake className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-700 font-mono">
              {overallKPI.studentsWithWaliNote}
              <span className="text-xs text-slate-400 font-normal ml-1">/ {overallKPI.totalStudents} siswa</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Catatan Perkembangan PPP: <strong>{overallKPI.studentsWithDevNote}</strong> terisi
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-purple-800 font-semibold flex items-center justify-between">
            <span>Tersedia Fitur Auto-Generate</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('presensi-catatan')}
                className="text-purple-700 hover:text-purple-900 underline font-bold"
              >
                Isi Catatan &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 gap-2">
        <button
          onClick={() => setActiveTab('mapel')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'mapel'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Progres per Mata Pelajaran & Guru Pengampu
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {sortedSubjects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('siswa')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'siswa'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Daftar Kelengkapan Siswa & Status Rapor
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {filteredStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rombel_summary')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'rombel_summary'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="h-4 w-4" />
          Rekap 12 Rombel (Evaluasi Seluruh Sekolah)
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
            12 Kelas
          </span>
        </button>
      </div>

      {/* TAB 1: PROGRES PER MATA PELAJARAN */}
      {activeTab === 'mapel' && (
        <div className="overflow-hidden rounded-b-2xl bg-white shadow-sm border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Status Entri Nilai Mata Pelajaran - {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Pendidikan Agama diposisikan di urutan paling atas sesuai regulasi kurikulum kemdikbud.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Wali Kelas Penanggung Jawab: <strong>{currentClass.homeroomTeacherName}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
                <tr>
                  <th className="px-2 py-3 w-8 text-center border-r border-slate-200">No</th>
                  <th className="px-3 py-3 w-64 border-r border-slate-200">Mata Pelajaran</th>
                  <th className="px-2 py-3 w-16 text-center border-r border-slate-200">KKM</th>
                  <th className="px-3 py-3 w-40 border-r border-slate-200">Guru / Penginput</th>
                  <th className="px-3 py-3 w-44 border-r border-slate-200 text-center">
                    Progres Kelengkapan
                  </th>
                  <th className="px-2 py-3 w-20 text-center border-r border-slate-200 bg-slate-50">
                    Rata-Rata
                  </th>
                  <th className="px-2 py-3 w-20 text-center border-r border-slate-200">Min / Max</th>
                  <th className="px-2 py-3 w-24 text-center border-r border-slate-200">Di Bawah KKM</th>
                  <th className="px-3 py-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjectMonitoringData.map((item, idx) => {
                  const subRel = getSubjectReligion(item.subject);
                  const isComplete = item.isComplete;

                  return (
                    <tr
                      key={item.subject.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        subRel ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-2 py-3 text-center text-slate-400 font-medium border-r border-slate-200">
                        {idx + 1}
                      </td>

                      <td className="px-3 py-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.subject.name}</span>
                          {subRel && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Agama {subRel}
                            </span>
                          )}
                          {item.subject.id === 'tubaba' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Mulok Tubaba
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Kode: {item.subject.code} | Kategori: {item.subject.category.toUpperCase()}
                        </div>
                      </td>

                      <td className="px-2 py-3 text-center font-bold font-mono border-r border-slate-200 text-slate-800">
                        {item.subject.kkm}
                      </td>

                      <td className="px-3 py-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-800 truncate">
                          {item.lastUpdatedBy}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.lastUpdated !== '-' ? item.lastUpdated.substring(0, 10) : 'Belum pernah update'}
                        </div>
                      </td>

                      <td className="px-3 py-3 border-r border-slate-200">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono font-bold text-slate-800">
                            {item.enteredCount}/{item.eligibleCount} siswa
                          </span>
                          <span
                            className={`font-bold ${
                              isComplete
                                ? 'text-emerald-700'
                                : item.progressPercent > 0
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {item.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isComplete
                                ? 'bg-emerald-600'
                                : item.progressPercent > 0
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-2 py-3 text-center border-r border-slate-200 bg-slate-50">
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {item.enteredCount > 0 ? item.averageScore.toFixed(1) : '-'}
                        </span>
                      </td>

                      <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-[11px] text-slate-600">
                        {item.enteredCount > 0 ? `${item.lowestScore} / ${item.highestScore}` : '-'}
                      </td>

                      <td className="px-2 py-3 text-center border-r border-slate-200">
                        {item.countBelowKkm > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="h-3 w-3" />
                            {item.countBelowKkm} siswa
                          </span>
                        ) : item.enteredCount > 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-700">Tuntas Semua</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('input-nilai')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-md border border-violet-200 transition-colors"
                          >
                            <span>Input Nilai</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR KELENGKAPAN SISWA */}
      {activeTab === 'siswa' && (
        <div className="overflow-hidden rounded-b-2xl bg-white shadow-sm border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Kelengkapan Nilai Siswa & Kesiapan Cetak Rapor - {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol "Lihat Nilai" untuk melihat detail seluruh capaian nilai STS siswa dan guru penginputnya.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-semibold">
              Menampilkan {filteredStudents.length} dari {classStudents.length} siswa
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
                <tr>
                  <th className="px-2 py-3 w-8 text-center border-r border-slate-200">No</th>
                  <th className="px-3 py-3 w-48 border-r border-slate-200">Peserta Didik</th>
                  <th className="px-3 py-3 w-40 border-r border-slate-200 text-center">
                    Kelengkapan Nilai
                  </th>
                  <th className="px-2 py-3 w-20 text-center border-r border-slate-200 bg-slate-50">
                    Rata-Rata
                  </th>
                  <th className="px-3 py-3 w-36 border-r border-slate-200 text-center">
                    Di Bawah KKM
                  </th>
                  <th className="px-3 py-3 w-32 border-r border-slate-200 text-center">
                    Catatan Wali Kelas
                  </th>
                  <th className="px-3 py-3 w-32 border-r border-slate-200 text-center">
                    Catatan Karakter PPP
                  </th>
                  <th className="px-2 py-3 w-24 text-center border-r border-slate-200">
                    Presensi (S/I/A)
                  </th>
                  <th className="px-3 py-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada siswa yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((item, idx) => {
                    const std = item.student;
                    const totPresensi = (std.sick || 0) + (std.permitted || 0) + (std.absent || 0);

                    return (
                      <tr
                        key={std.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !item.isAllGradesEntered ? 'bg-amber-50/10' : ''
                        }`}
                      >
                        <td className="px-2 py-3 text-center text-slate-400 font-medium border-r border-slate-200">
                          {idx + 1}
                        </td>

                        <td className="px-3 py-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{std.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            NISN: {std.nisn} | {std.religion || 'Islam'}
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-slate-200 text-center">
                          {item.isAllGradesEntered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="h-3 w-3" />
                              {item.enteredCount}/{item.totalRequired} Lengkap
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="h-3 w-3" />
                                {item.enteredCount}/{item.totalRequired} Mapel
                              </span>
                              <div className="text-[9px] text-rose-600 mt-1 truncate max-w-[150px]">
                                Kurang: {item.missingSubjects.map((s) => s.code).join(', ')}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-3 text-center border-r border-slate-200 bg-slate-50">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {item.enteredCount > 0 ? item.average.toFixed(1) : '-'}
                          </span>
                        </td>

                        <td className="px-3 py-3 border-r border-slate-200 text-center">
                          {item.belowKkmCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="h-3 w-3" />
                              {item.belowKkmCount} Mapel (&lt; KKM)
                            </span>
                          ) : item.enteredCount > 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-700">Tuntas</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-3 py-3 border-r border-slate-200 text-center">
                          {item.hasWaliNote ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-[120px]"
                              title={std.waliNote}
                            >
                              <Check className="h-3 w-3" />
                              Sudah Diisi
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Belum Diisi
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 border-r border-slate-200 text-center">
                          {item.hasDevNote ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[120px]"
                              title={std.developmentNote}
                            >
                              <Check className="h-3 w-3" />
                              Sudah Diisi
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Belum Diisi
                            </span>
                          )}
                        </td>

                        <td className="px-2 py-3 text-center border-r border-slate-200 font-mono text-[11px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              totPresensi > 0 ? 'bg-slate-100 text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {std.sick || 0} / {std.permitted || 0} / {std.absent || 0}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setSelectedStudentDetail(std)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-300 transition-colors shadow-xs"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>Lihat Nilai</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REKAP 12 ROMBEL (EVALUASI KEPALA SEKOLAH) */}
      {activeTab === 'rombel_summary' && (
        <div className="overflow-hidden rounded-b-2xl bg-white shadow-sm border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rekap Progres Input Nilai 12 Rombel (Kelas 7.1 s/d 9.4)
              </h3>
              <p className="text-xs text-slate-500">
                Monitoring terpadu kepatuhan penginputan nilai untuk evaluasi Kepala Sekolah dan Tim Kurikulum.
              </p>
            </div>
            <div className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              SMP Negeri 14 Tulang Bawang Barat
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {allRombelSummary.map((item) => (
              <div
                key={item.classGroup.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.classGroup.id === currentClassId
                    ? 'border-violet-500 ring-2 ring-violet-100 bg-violet-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-900 text-sm">{item.classGroup.name}</div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.percentage === 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.percentage > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.percentage}% Tuntas
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 mb-3">
                  Wali Kelas: <strong>{item.classGroup.homeroomTeacherName}</strong>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Siswa:</span>
                    <span className="font-bold font-mono">{item.studentCount} siswa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nilai Terinput:</span>
                    <span className="font-bold font-mono">
                      {item.filledSlots} / {item.totalSlots}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Catatan Wali Lengkap:</span>
                    <span className="font-bold font-mono">
                      {item.notesCompleted} / {item.studentCount} siswa
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      item.percentage === 100
                        ? 'bg-emerald-600'
                        : item.percentage > 50
                        ? 'bg-violet-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      handleClassChange(item.classGroup.id);
                      setActiveTab('siswa');
                    }}
                    className="text-[11px] font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1"
                  >
                    <span>Buka Rombel Ini</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>

                  {item.percentage === 100 ? (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Siap Cetak
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-semibold">
                      Belum Lengkap
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DETAIL NILAI SISWA */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                  Rincian Nilai Asesmen STS Siswa
                </div>
                <h3 className="text-base font-bold mt-0.5">{selectedStudentDetail.name}</h3>
                <p className="text-xs text-slate-300">
                  NISN: {selectedStudentDetail.nisn} | Kelas: {currentClass.name} | Agama:{' '}
                  {selectedStudentDetail.religion || 'Islam'}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-200">Mata Pelajaran</th>
                    <th className="p-2 w-16 text-center border-r border-slate-200">KKM</th>
                    <th className="p-2 w-20 text-center border-r border-slate-200">Nilai STS</th>
                    <th className="p-2 w-24 text-center border-r border-slate-200">Status</th>
                    <th className="p-2 text-left">Penginput / Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedSubjects.map((sub) => {
                    const subRel = getSubjectReligion(sub);
                    if (
                      subRel &&
                      !doesStudentMatchSubjectReligion(selectedStudentDetail.religion, subRel)
                    ) {
                      return null; // Skip non-matching religious subject
                    }

                    const grade = classGrades.find(
                      (g) =>
                        g.studentId === selectedStudentDetail.id && g.subjectId === sub.id
                    );

                    const isEntered = grade !== undefined;
                    const isPassed = isEntered && grade.stsScore >= sub.kkm;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                          {sub.name}
                          {subRel && (
                            <span className="ml-1 text-[9px] text-emerald-700 font-normal">
                              ({subRel})
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-600">
                          {sub.kkm}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200 font-mono font-bold text-sm">
                          {isEntered ? (
                            <span className={isPassed ? 'text-slate-950' : 'text-rose-600'}>
                              {grade.stsScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Kosong</span>
                          )}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {isEntered ? (
                            isPassed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Tuntas
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Di Bawah KKM
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              Belum Diisi
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px]">
                          {grade?.updatedBy || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Catatan Rapor Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <HeartHandshake className="h-4 w-4 text-blue-600" />
                    Catatan Wali Kelas:
                  </div>
                  <p className="italic text-slate-700 text-[11px] leading-relaxed">
                    "{selectedStudentDetail.waliNote || 'Belum diisi oleh wali kelas.'}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Catatan Perkembangan (PPP):
                  </div>
                  <p className="italic text-slate-700 text-[11px] leading-relaxed">
                    "{selectedStudentDetail.developmentNote || 'Belum diisi oleh wali kelas.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
