import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TableProperties,
  Download,
  Printer,
  Trophy,
  Users,
  Search,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { exportLegerToExcel } from '../utils/excelHelper';

export const LegerNilaiView: React.FC = () => {
  const {
    schoolProfile,
    classes,
    subjects,
    getLegerData,
    activeAcademicYear,
    activeSemester,
    selectedClassId,
    currentUser,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [currentClassId, setCurrentClassId] = useState<string>(
    currentUser?.role === 'wali_kelas' && currentUser.classAssigned
      ? currentUser.classAssigned
      : selectedClassId || '7.1'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'nisn'>('rank');

  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentClassId) || classes[0],
    [classes, currentClassId]
  );

  const rawLegerRows = useMemo(
    () => getLegerData(currentClassId),
    [getLegerData, currentClassId]
  );

  const sortedLegerRows = useMemo(() => {
    let rows = [...rawLegerRows];
    if (searchQuery) {
      rows = rows.filter(
        (r) =>
          r.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.student.nisn.includes(searchQuery) ||
          r.student.nis.includes(searchQuery)
      );
    }

    if (sortBy === 'name') {
      rows.sort((a, b) => a.student.name.localeCompare(b.student.name));
    } else if (sortBy === 'nisn') {
      rows.sort((a, b) => a.student.nisn.localeCompare(b.student.nisn));
    } else {
      rows.sort((a, b) => a.rank - b.rank);
    }

    return rows;
  }, [rawLegerRows, searchQuery, sortBy]);

  const sortedSubjects = useMemo(
    () => [...subjects].sort((a, b) => a.orderIndex - b.orderIndex),
    [subjects]
  );

  // Statistics per subject
  const subjectStats = useMemo(() => {
    return sortedSubjects.map((sub) => {
      const scores = rawLegerRows
        .map((r) => r.grades[sub.id])
        .filter((s): s is number => s !== undefined);

      if (scores.length === 0) return { subId: sub.id, avg: 0, max: 0, min: 0 };

      const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
      const max = Math.max(...scores);
      const min = Math.min(...scores);

      return { subId: sub.id, avg, max, min };
    });
  }, [sortedSubjects, rawLegerRows]);

  const handleExportExcel = () => {
    exportLegerToExcel(
      schoolProfile,
      currentClass,
      sortedSubjects,
      rawLegerRows,
      activeAcademicYear,
      activeSemester
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <TableProperties className="h-4 w-4" />
              Rekapitulasi Nilai & Peringkat Siswa
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Leger Nilai Sumatif Tengah Semester (STS)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriks perolehan nilai seluruh mata pelajaran, peringkat kelas, dan rekapitulasi statistik capaian belajar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              Unduh Leger Excel (.xlsx)
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold shadow"
            >
              <Printer className="h-4 w-4" />
              Cetak Leger
            </button>
          </div>
        </div>

        {/* Filter Bar */}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Urutkan Berdasarkan:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="rank">Peringkat Kelas (Nilai Tertinggi)</option>
              <option value="name">Nama Siswa (A - Z)</option>
              <option value="nisn">NISN Siswa</option>
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
        </div>
      </div>

      {/* Leger Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Leger {currentClass.name} - TP {activeAcademicYear} Semester{' '}
              {activeSemester === '1' ? 'Ganjil' : 'Genap'}
            </h3>
            <p className="text-xs text-slate-500">
              Wali Kelas: <strong>{currentClass.homeroomTeacherName}</strong> | Total Siswa:{' '}
              {rawLegerRows.length}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Trophy className="h-3.5 w-3.5" /> Ranking 1: {rawLegerRows[0]?.student.name || '-'} (Rata-rata: {rawLegerRows[0]?.averageScore || 0})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="px-2 py-2.5 text-center w-8 border-r border-slate-200">No</th>
                <th className="px-2.5 py-2.5 w-24 border-r border-slate-200">NISN</th>
                <th className="px-3 py-2.5 min-w-[170px] border-r border-slate-200">Nama Siswa</th>
                <th className="px-1.5 py-2.5 text-center w-8 border-r border-slate-200">JK</th>
                {sortedSubjects.map((sub) => (
                  <th
                    key={sub.id}
                    className="px-2 py-2.5 text-center w-12 border-r border-slate-200"
                    title={`${sub.name} (KKM: ${sub.kkm})`}
                  >
                    {sub.code}
                  </th>
                ))}
                <th className="px-2.5 py-2.5 text-center w-16 bg-blue-50 text-blue-900 border-r border-slate-200 font-bold">
                  Total
                </th>
                <th className="px-2.5 py-2.5 text-center w-16 bg-blue-100/70 text-blue-950 font-black border-r border-slate-200">
                  Rata²
                </th>
                <th className="px-3 py-2.5 text-center w-20 bg-amber-100 text-amber-950 font-black uppercase tracking-wider border-r border-slate-200">
                  RANK
                </th>
                {/* KOLOM PRESENSI KEHADIRAN SISWA */}
                <th className="px-1.5 py-2.5 text-center w-10 bg-amber-50 text-amber-900 font-bold border-r border-slate-200" title="Sakit">
                  S
                </th>
                <th className="px-1.5 py-2.5 text-center w-10 bg-blue-50 text-blue-900 font-bold border-r border-slate-200" title="Izin">
                  I
                </th>
                <th className="px-1.5 py-2.5 text-center w-10 bg-rose-50 text-rose-900 font-bold border-r border-slate-200" title="Alpha / Tanpa Keterangan">
                  A
                </th>
                <th className="px-2 py-2.5 text-center w-12 bg-slate-200 text-slate-900 font-black" title="Total Ketidakhadiran">
                  Absen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {sortedLegerRows.map((row, idx) => (
                <tr
                  key={row.student.id}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    row.rank <= 3 ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="px-2 py-2 text-center text-slate-500 border-r border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="px-2.5 py-2 text-slate-600 border-r border-slate-200 font-mono">
                    {row.student.nisn}
                  </td>
                  <td className="px-3 py-2 font-sans font-bold text-slate-900 border-r border-slate-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="truncate max-w-[160px]">{row.student.name}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-semibold border ${
                          (row.student.religion || 'Islam').toLowerCase() === 'islam'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                        title={`Agama: ${row.student.religion || 'Islam'}`}
                      >
                        {row.student.religion || 'Islam'}
                      </span>
                    </div>
                  </td>
                  <td className="px-1.5 py-2 text-center font-bold text-slate-600 border-r border-slate-200">
                    {row.student.gender}
                  </td>
                  {sortedSubjects.map((sub) => {
                    const score = row.grades[sub.id];
                    const isBelow = score !== undefined && score < sub.kkm;
                    return (
                      <td
                        key={sub.id}
                        className={`px-2 py-2 text-center border-r border-slate-200 ${
                          isBelow ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-800'
                        }`}
                      >
                        {score !== undefined ? score : '-'}
                      </td>
                    );
                  })}
                  <td className="px-2.5 py-2 text-center font-bold text-blue-900 bg-blue-50/50 border-r border-slate-200">
                    {row.totalScore}
                  </td>
                  <td className="px-2.5 py-2 text-center font-black text-blue-950 bg-blue-100/50 border-r border-slate-200">
                    {row.averageScore}
                  </td>
                  {/* KOLOM RANK / PERINGKAT */}
                  <td className="px-3 py-2 text-center font-black bg-amber-50/90 text-slate-900 border-r border-slate-200">
                    {row.rank === 1 ? (
                      <span className="inline-flex items-center gap-1 justify-center px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm">
                        <Trophy className="h-3 w-3 text-amber-900" /> Rank 1
                      </span>
                    ) : row.rank === 2 ? (
                      <span className="inline-flex items-center gap-1 justify-center px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-black text-[11px] shadow-sm">
                        Rank 2
                      </span>
                    ) : row.rank === 3 ? (
                      <span className="inline-flex items-center gap-1 justify-center px-2 py-0.5 rounded-full bg-amber-700 text-white font-black text-[11px] shadow-sm">
                        Rank 3
                      </span>
                    ) : (
                      <span className="text-slate-800 font-extrabold text-xs">Rank {row.rank}</span>
                    )}
                  </td>

                  {/* NILAI PRESENSI SISWA */}
                  <td className="px-1.5 py-2 text-center border-r border-slate-200 text-amber-800 font-bold">
                    {row.sick ?? 0}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-200 text-blue-800 font-bold">
                    {row.permitted ?? 0}
                  </td>
                  <td className="px-1.5 py-2 text-center border-r border-slate-200 text-rose-800 font-bold">
                    {row.absent ?? 0}
                  </td>
                  <td className="px-2 py-2 text-center font-black bg-slate-100 text-slate-900">
                    {row.totalAbsent ?? 0}
                  </td>
                </tr>
              ))}

              {/* STATISTIK KELAS ROW */}
              <tr className="bg-slate-100 font-bold text-slate-900 text-[10px] uppercase border-t-2 border-slate-300">
                <td colSpan={4} className="px-3 py-2 text-right border-r border-slate-200">
                  RATA-RATA KELAS:
                </td>
                {sortedSubjects.map((sub) => {
                  const st = subjectStats.find((s) => s.subId === sub.id);
                  return (
                    <td key={sub.id} className="px-2 py-2 text-center border-r border-slate-200">
                      {st?.avg || '-'}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center border-r border-slate-200">-</td>
                <td className="px-2 py-2 text-center text-blue-900 font-black border-r border-slate-200">
                  {rawLegerRows.length > 0
                    ? (rawLegerRows.reduce((a, b) => a + b.averageScore, 0) / rawLegerRows.length).toFixed(1)
                    : '-'}
                </td>
                <td className="px-2 py-2 text-center bg-amber-50/50 text-slate-400 font-mono border-r border-slate-200">-</td>
                {/* RATA-RATA ABSENSI */}
                <td className="px-1.5 py-2 text-center border-r border-slate-200 text-amber-900">
                  {rawLegerRows.length > 0
                    ? (rawLegerRows.reduce((a, b) => a + (b.sick || 0), 0) / rawLegerRows.length).toFixed(1)
                    : '0'}
                </td>
                <td className="px-1.5 py-2 text-center border-r border-slate-200 text-blue-900">
                  {rawLegerRows.length > 0
                    ? (rawLegerRows.reduce((a, b) => a + (b.permitted || 0), 0) / rawLegerRows.length).toFixed(1)
                    : '0'}
                </td>
                <td className="px-1.5 py-2 text-center border-r border-slate-200 text-rose-900">
                  {rawLegerRows.length > 0
                    ? (rawLegerRows.reduce((a, b) => a + (b.absent || 0), 0) / rawLegerRows.length).toFixed(1)
                    : '0'}
                </td>
                <td className="px-2 py-2 text-center bg-slate-200 text-slate-900 font-black">
                  {rawLegerRows.length > 0
                    ? (rawLegerRows.reduce((a, b) => a + (b.totalAbsent || 0), 0) / rawLegerRows.length).toFixed(1)
                    : '0'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
