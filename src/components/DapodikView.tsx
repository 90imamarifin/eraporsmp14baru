import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import {
  Users2,
  RefreshCw,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  Database,
  Download,
  Upload,
  Calendar,
  UserCheck,
  X,
  Save,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import {
  downloadStudentTemplateExcel,
  parseStudentExcel,
  StudentParseResult,
} from '../utils/excelHelper';

export const DapodikView: React.FC = () => {
  const {
    schoolProfile,
    students,
    classes,
    selectedClassId,
    currentUser,
    updateStudent,
    addStudent,
    deleteStudent,
    importDapodikStudents,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [currentClassId, setCurrentClassId] = useState<string>(
    currentUser?.role === 'wali_kelas' && currentUser.classAssigned
      ? currentUser.classAssigned
      : selectedClassId || '7.1'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncingDapodik, setIsSyncingDapodik] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string>('');

  // Import Excel modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<StudentParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit / Add modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState<Partial<Student>>({
    nisn: '',
    nis: '',
    name: '',
    gender: 'L',
    classId: currentClassId === 'all' ? '7.1' : currentClassId,
    religion: 'Islam',
    birthPlace: 'Tulang Bawang Barat',
    birthDate: '2012-01-01',
    parentName: '',
    address: 'Tiyuh Marga Kencana',
    status: 'aktif',
    sick: 0,
    permitted: 0,
    absent: 0,
    waliNote: '',
    developmentNote: '',
  });

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => (currentClassId === 'all' ? true : s.classId === currentClassId))
      .filter((s) =>
        searchQuery
          ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.nisn.includes(searchQuery) ||
            s.nis.includes(searchQuery) ||
            (s.religion || '').toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  }, [students, currentClassId, searchQuery]);

  // Download master template excel for all rombels
  const handleDownloadTemplate = () => {
    downloadStudentTemplateExcel(schoolProfile.name);
  };

  // Handle Excel file selection for student import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setParseResult(null);

    try {
      const defaultCls = currentClassId !== 'all' ? currentClassId : '7.1';
      const result = await parseStudentExcel(file, defaultCls);
      setParseResult(result);
    } catch (err: any) {
      alert(`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`);
    } finally {
      setIsParsingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirm student import into system and distribute to respective rombels
  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.students.length === 0) return;

    const importedStudents: Student[] = parseResult.students.map((ps) => {
      // Find existing to preserve notes/presensi if exists
      const existing = students.find((s) => s.nisn === ps.nisn);
      return {
        id: existing?.id || `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        nisn: ps.nisn,
        nis: ps.nis,
        name: ps.name,
        gender: ps.gender,
        classId: ps.classId,
        birthPlace: ps.birthPlace,
        birthDate: ps.birthDate,
        religion: ps.religion,
        parentName: ps.parentName,
        address: ps.address,
        status: 'aktif',
        sick: existing?.sick ?? 0,
        permitted: existing?.permitted ?? 0,
        absent: existing?.absent ?? 0,
        waliNote: existing?.waliNote || '',
        developmentNote: existing?.developmentNote || '',
      };
    });

    await importDapodikStudents(importedStudents);
    const uniqueRombels = Array.from(new Set(importedStudents.map((s) => s.classId)));
    setIsImportModalOpen(false);
    setParseResult(null);
    setSyncSuccessMsg(
      `Berhasil mengimpor ${importedStudents.length} siswa dan otomatis didistribusikan ke dalam ${uniqueRombels.length} rombel (${uniqueRombels.sort().join(', ')})!`
    );
    setTimeout(() => setSyncSuccessMsg(''), 6000);
  };

  // Simulate pull from Dapodik Web Service
  const handleSyncDapodik = () => {
    setIsSyncingDapodik(true);
    setSyncSuccessMsg('');

    setTimeout(() => {
      setIsSyncingDapodik(false);
      setSyncSuccessMsg('Data siswa berhasil disinkronkan dengan Dapodik Kemdikbud terkini.');
      setTimeout(() => setSyncSuccessMsg(''), 4000);
    }, 1200);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
  };

  const handleSaveStudent = async () => {
    if (!formData.name || !formData.nisn) {
      alert('Nama dan NISN wajib diisi.');
      return;
    }

    if (editingStudent) {
      await updateStudent({ ...editingStudent, ...(formData as Student) });
      setEditingStudent(null);
    } else {
      await addStudent(formData as Omit<Student, 'id'>);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for Excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Header Panel */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Database className="h-4 w-4" />
              Integrasi Data Dapodik & Biodata Peserta Didik
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Data Siswa SMPN 14 Tulang Bawang Barat
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Impor master seluruh siswa dari semua rombel (7.1 s.d 9.4) sekaligus dalam satu file Excel tanpa harus mengimpor per kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Unduh Master Template Excel */}
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold shadow-sm transition-all"
              title="Unduh master template Excel semua rombel"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              Unduh Master Template (.xlsx)
            </button>

            {/* Impor Master Siswa Excel */}
            <button
              onClick={() => {
                setParseResult(null);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-semibold shadow transition-all"
            >
              <Upload className="h-4 w-4" />
              Impor Master Siswa Semua Rombel
            </button>

            <button
              onClick={handleSyncDapodik}
              disabled={isSyncingDapodik}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 text-xs font-semibold shadow transition-all disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingDapodik ? 'animate-spin' : ''}`} />
              {isSyncingDapodik ? 'Menghubungi Dapodik...' : 'Tarik Dapodik'}
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setFormData({
                    nisn: '',
                    nis: '',
                    name: '',
                    gender: 'L',
                    classId: currentClassId === 'all' ? '7.1' : currentClassId,
                    religion: 'Islam',
                    birthPlace: 'Tulang Bawang Barat',
                    birthDate: '2012-05-10',
                    parentName: '',
                    address: 'Tiyuh Marga Kencana',
                    status: 'aktif',
                    sick: 0,
                    permitted: 0,
                    absent: 0,
                    waliNote: '',
                    developmentNote: '',
                  });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 text-xs font-semibold shadow"
              >
                <Plus className="h-4 w-4" />
                Tambah Siswa
              </button>
            )}
          </div>
        </div>


        {/* Sync alert */}
        {syncSuccessMsg && (
          <div className="mt-4 rounded-xl bg-sky-50 border border-sky-300 p-3 text-xs text-sky-900 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-sky-600" />
            <span className="font-semibold">{syncSuccessMsg}</span>
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Filter Kelas:</label>
            <select
              value={currentClassId}
              onChange={(e) => setCurrentClassId(e.target.value)}
              disabled={!isSuperAdmin && currentUser?.role === 'wali_kelas' && !!currentUser.classAssigned}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {isSuperAdmin && <option value="all">Semua Kelas ({students.length} Siswa)</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Wali: {c.homeroomTeacherName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cari Siswa:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Nama / NISN / NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">No</th>
                <th className="px-3 py-3 w-28">NISN / NIS</th>
                <th className="px-4 py-3 min-w-[180px]">Nama Lengkap</th>
                <th className="px-2 py-3 w-10 text-center">JK</th>
                <th className="px-3 py-3 w-16 text-center">Kelas</th>
                <th className="px-3 py-3 min-w-[140px]">TTL / Alamat</th>
                <th className="px-3 py-3 w-28 text-center">Kehadiran (S/I/A)</th>
                <th className="px-3 py-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">
                      <div className="font-bold text-slate-900">{std.nisn}</div>
                      <div className="text-slate-400">{std.nis}</div>
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
                      <div className="text-[10px] text-slate-500">
                        Ortu/Wali: {std.parentName || '-'}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center font-bold text-slate-700">{std.gender}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                        {std.classId}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-slate-600">
                      <div>
                        {std.birthPlace}, {std.birthDate}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {std.address}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                        <span className="text-amber-700 font-bold" title="Sakit">
                          S:{std.sick ?? 0}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-blue-700 font-bold" title="Izin">
                          I:{std.permitted ?? 0}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-rose-700 font-bold" title="Alpha">
                          A:{std.absent ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(std)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          title="Edit Biodata & Catatan Wali"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data siswa ${std.name}?`)) {
                                deleteStudent(std.id);
                              }
                            }}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {(editingStudent || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between bg-blue-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <UserCheck className="h-4 w-4" />
                {editingStudent ? `Edit Siswa: ${editingStudent.name}` : 'Tambah Siswa Baru'}
              </div>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsAddModalOpen(false);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN:</label>
                  <input
                    type="text"
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS:</label>
                  <input
                    type="text"
                    value={formData.nis || ''}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <select
                    value={formData.gender || 'L'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                  <select
                    value={formData.classId || '7.1'}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agama:</label>
                  <select
                    value={formData.religion || 'Islam'}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium bg-white"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat Lahir:</label>
                  <input
                    type="text"
                    value={formData.birthPlace || ''}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir:</label>
                  <input
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali:</label>
                <input
                  type="text"
                  value={formData.parentName || ''}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap:</label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 resize-none"
                />
              </div>

              {/* Attendance Inputs */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="font-bold text-slate-800 mb-2">
                  Ketidakhadiran Tengah Semester (Hari):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600 block">Sakit (S):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sick ?? 0}
                      onChange={(e) => setFormData({ ...formData, sick: Number(e.target.value) })}
                      className="w-full rounded border border-slate-300 p-1.5 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block">Izin (I):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.permitted ?? 0}
                      onChange={(e) => setFormData({ ...formData, permitted: Number(e.target.value) })}
                      className="w-full rounded border border-slate-300 p-1.5 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block">Alpha (A):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.absent ?? 0}
                      onChange={(e) => setFormData({ ...formData, absent: Number(e.target.value) })}
                      className="w-full rounded border border-slate-300 p-1.5 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Khusus Wali Kelas di Rapor:
                </label>
                <textarea
                  rows={2}
                  value={formData.waliNote || ''}
                  onChange={(e) => setFormData({ ...formData, waliNote: e.target.value })}
                  placeholder="Pesan bimbingan atau motivasi untuk siswa..."
                  className="w-full rounded-lg border border-slate-300 p-2 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Perkembangan Siswa / Profil Pelajar Pancasila:
                </label>
                <textarea
                  rows={2}
                  value={formData.developmentNote || ''}
                  onChange={(e) => setFormData({ ...formData, developmentNote: e.target.value })}
                  placeholder="Catatan perkembangan karakter, kemandirian, dan nalar kritis siswa..."
                  className="w-full rounded-lg border border-slate-300 p-2 resize-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsAddModalOpen(false);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveStudent}
                className="rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-1.5 text-xs font-semibold text-white shadow"
              >
                Simpan Data Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impor Excel Siswa */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between bg-emerald-800 px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
                Impor Master Siswa Semua Rombel (12 Kelas: 7.1 s.d 9.4)
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParseResult(null);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Petunjuk & Download Template */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900 text-xs">
                    Format Master Sekali Impor untuk Semua Rombel:
                  </p>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Unggah 1 file Excel berisi semua siswa sekolah. Sistem membaca kolom <strong>Rombel / Kelas</strong> (contoh: <strong>7.1, 7.2, ..., 9.4</strong>) dan otomatis mendistribusikan siswa langsung ke rombelnya masing-masing tanpa harus mengimpor per kelas.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 font-bold shadow-sm text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Unduh Master Template
                </button>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-colors"
              >
                <Upload className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-xs sm:text-sm">
                  {isParsingExcel ? 'Sedang Membaca & Memetakan Seluruh Rombel...' : 'Pilih File Master Siswa (.xlsx / .xls)'}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Bisa mencakup seluruh siswa jenjang Kelas 7, 8, dan 9 sekaligus.
                </p>
              </div>

              {/* Hasil Parse Preview */}
              {parseResult && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    parseResult.success
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      {parseResult.success ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-semibold">{parseResult.message}</span>
                    </div>
                    {parseResult.success && (
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-mono text-[11px] self-start sm:self-auto">
                        Total {parseResult.students.length} Siswa Terbaca
                      </span>
                    )}
                  </div>

                  {/* Rombel Distribution Summary Cards */}
                  {parseResult.success && parseResult.rombelSummary && Object.keys(parseResult.rombelSummary).length > 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                      <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>Distribusi Rombel Terdeteksi:</span>
                        <span className="text-emerald-700 font-bold">{Object.keys(parseResult.rombelSummary).length} Rombel Ditemukan</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(parseResult.rombelSummary)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([rombel, count]) => (
                            <span
                              key={rombel}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium shadow-xs"
                            >
                              <span className="font-black text-blue-700 font-mono">Kelas {rombel}</span>
                              <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                {count} Siswa
                              </span>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {parseResult.success && parseResult.students.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="px-2 py-2 w-8 text-center">No</th>
                            <th className="px-2.5 py-2 w-24">NISN</th>
                            <th className="px-3 py-2">Nama Siswa</th>
                            <th className="px-2 py-2 w-10 text-center">JK</th>
                            <th className="px-2.5 py-2 w-24 text-center bg-blue-100/60 font-black text-blue-900">
                              Tujuan Rombel
                            </th>
                            <th className="px-2 py-2">Alamat / Asal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {parseResult.students.slice(0, 100).map((st, i) => (
                            <tr key={i} className="hover:bg-slate-50 font-sans">
                              <td className="px-2 py-1.5 text-center text-slate-400 font-mono">{i + 1}</td>
                              <td className="px-2.5 py-1.5 font-mono text-slate-800">{st.nisn}</td>
                              <td className="px-3 py-1.5 font-semibold text-slate-900">{st.name}</td>
                              <td className="px-2 py-1.5 text-center font-bold">{st.gender}</td>
                              <td className="px-2.5 py-1.5 text-center">
                                <span className="inline-block px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] font-mono shadow-xs">
                                  {st.classId}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-slate-500 truncate max-w-[150px]">{st.address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParseResult(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
              {parseResult && parseResult.success && parseResult.students.length > 0 && (
                <button
                  onClick={handleConfirmImport}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white shadow"
                >
                  Konfirmasi & Masukkan ke Masing-Masing Rombel ({parseResult.students.length} Siswa)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
