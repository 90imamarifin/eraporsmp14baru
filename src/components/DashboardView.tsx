import React from 'react';
import { useApp } from '../context/AppContext';
import {
  School,
  GraduationCap,
  Users2,
  FileSpreadsheet,
  Printer,
  TableProperties,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Activity,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    currentUser,
    schoolProfile,
    students,
    classes,
    subjects,
    grades,
    activeAcademicYear,
    activeSemester,
    auditLogs,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Calculate overall grade completion
  const totalSlots = students.length * subjects.length;
  const filledSlots = grades.filter(
    (g) => g.academicYear === activeAcademicYear && g.semester === activeSemester
  ).length;
  const completionPercentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  // School average score
  const activeGrades = grades.filter(
    (g) => g.academicYear === activeAcademicYear && g.semester === activeSemester
  );
  const avgSchoolScore =
    activeGrades.length > 0
      ? (activeGrades.reduce((a, b) => a + b.stsScore, 0) / activeGrades.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c3768] via-[#104b8d] to-[#1d63b8] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm border border-white/20">
              <School className="h-3.5 w-3.5" />
              Sistem Penilaian Kurikulum Merdeka SMP
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Datang, {currentUser?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Aplikasi resmi pengolahan nilai Asesmen Sumatif Tengah Semester (STS) tanpa TP dan pencetakan rapor PDF untuk {schoolProfile.name}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-left border border-white/15 backdrop-blur-sm">
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Tahun Pelajaran</div>
              <div className="text-sm font-bold text-white">{activeAcademicYear}</div>
              <div className="text-[11px] font-semibold text-amber-300">
                Semester {activeSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'}
              </div>
            </div>

            <button
              onClick={() => onNavigate('input-nilai')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2.5 text-xs font-bold shadow-md transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Input Nilai STS Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Total Siswa Dapodik</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{students.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            Terbagi dalam {classes.length} Rombel
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Mata Pelajaran STS</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{subjects.length}</div>
          <div className="mt-1 text-[11px] text-emerald-700">Kurikulum Merdeka SMP</div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Rata-Rata STS Sekolah</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{avgSchoolScore}</div>
          <div className="mt-1 text-[11px] text-slate-400">Skala Penilaian 0 - 100</div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Progress Input STS</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{completionPercentage}%</div>
          <div className="mt-1 text-[11px] text-indigo-700">
            {filledSlots} dari {totalSlots} nilai
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('input-nilai')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-blue-700">
            Input Nilai STS Siswa
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Input langsung di tabel interaktif atau unggah format nilai melalui file Excel tanpa TP secara praktis.
          </p>
        </div>

        <div
          onClick={() => onNavigate('pemantauan-nilai')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Activity className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-violet-700">
            Pemantauan Nilai Siswa
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Monitoring kelengkapan entri nilai guru mapel, capaian KKM, dan kesiapan rapor per rombel.
          </p>
        </div>

        <div
          onClick={() => onNavigate('cetak-rapor')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Printer className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-emerald-700">
            Cetak Rapor STS (PDF)
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Format resmi rapor lengkap dengan Kop SMPN 14 Tulang Bawang Barat, identitas, predikat, dan tanda tangan digital.
          </p>
        </div>

        <div
          onClick={() => onNavigate('leger-nilai')}
          className="group cursor-pointer rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <TableProperties className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-purple-700">
            Leger Nilai & Ranking
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Rekap matriks seluruh nilai siswa per kelas, perhitungan peringkat otomatis, dan ekspor instan ke Excel (.xlsx).
          </p>
        </div>
      </div>

      {/* Class Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Progress */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Status Keterisian Nilai STS Per Rombel
              </h3>
              <p className="text-xs text-slate-500">
                Progress penginputan nilai tengah semester di setiap kelas
              </p>
            </div>
            <button
              onClick={() => onNavigate('pemantauan-nilai')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Lihat Rinci
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {classes.map((cls) => {
              const studentsInCls = students.filter((s) => s.classId === cls.id);
              const maxGrades = studentsInCls.length * subjects.length;
              const filledInCls = grades.filter(
                (g) =>
                  g.classId === cls.id &&
                  g.academicYear === activeAcademicYear &&
                  g.semester === activeSemester
              ).length;
              const pct = maxGrades > 0 ? Math.round((filledInCls / maxGrades) * 100) : 0;

              return (
                <div key={cls.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cls.name}</span>
                      <span className="text-[11px] text-slate-400">
                        ({cls.homeroomTeacherName})
                      </span>
                    </div>
                    <span className="font-bold text-blue-700">{pct}% Terisi</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 90
                          ? 'bg-emerald-500'
                          : pct >= 50
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Histori Aktivitas</h3>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Terenkripsi
            </span>
          </div>

          <div className="mt-3 space-y-3 max-h-72 overflow-y-auto">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs space-y-0.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{log.performedByName}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug">{log.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('audit-log')}
            className="mt-4 w-full rounded-lg bg-slate-50 hover:bg-slate-100 py-2 text-center text-xs font-semibold text-slate-700 transition-colors"
          >
            Lihat Semua Histori Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
