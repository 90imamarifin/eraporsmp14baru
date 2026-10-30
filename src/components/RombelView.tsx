import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassGroup } from '../types';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users2,
  Search,
  CheckCircle,
  X,
  Save,
  School,
  Sparkles,
} from 'lucide-react';

export const RombelView: React.FC = () => {
  const { classes, students, users, currentUser, addClass, updateClass, deleteClass } = useApp();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [filterLevel, setFilterLevel] = useState<'all' | '7' | '8' | '9'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  const [formData, setFormData] = useState<ClassGroup>({
    id: '',
    name: '',
    gradeLevel: '7',
    homeroomTeacherId: '',
    homeroomTeacherName: '',
    academicYear: '2026/2027',
  });

  const filteredClasses = classes.filter((cls) => {
    const matchLevel = filterLevel === 'all' || cls.gradeLevel === filterLevel;
    const matchSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.homeroomTeacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      id: '',
      name: '',
      gradeLevel: '7',
      homeroomTeacherId: users.find(u => u.role === 'wali_kelas')?.id || '',
      homeroomTeacherName: users.find(u => u.role === 'wali_kelas')?.name || 'Ahmad Fauzi, S.Pd.',
      academicYear: '2026/2027',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassGroup) => {
    setEditingClass(cls);
    setFormData({ ...cls });
    setIsModalOpen(true);
  };

  const handleTeacherChange = (teacherId: string) => {
    const teacher = users.find((u) => u.id === teacherId);
    setFormData((prev) => ({
      ...prev,
      homeroomTeacherId: teacherId,
      homeroomTeacherName: teacher ? teacher.name : prev.homeroomTeacherName,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) {
      alert('Kode ID Rombel dan Nama Kelas wajib diisi.');
      return;
    }

    if (editingClass) {
      await updateClass(formData);
    } else {
      await addClass(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <School className="h-4 w-4" />
              Data Induk Rombongan Belajar
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Data Rombel SMPN 14 Tulang Bawang Barat (12 Kelas)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar rombel aktif: <strong>Kelas 7.1 - 7.4</strong>, <strong>Kelas 8.1 - 8.4</strong>, dan <strong>Kelas 9.1 - 9.4</strong> beserta penugasan wali kelas.
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold shadow"
            >
              <Plus className="h-4 w-4" />
              Tambah Rombel Kelas
            </button>
          )}
        </div>

        {/* Filter level tabs & Search */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterLevel === 'all'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua (12 Kelas)
            </button>
            <button
              onClick={() => setFilterLevel('7')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterLevel === '7'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat 7 (4 Kelas)
            </button>
            <button
              onClick={() => setFilterLevel('8')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterLevel === '8'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat 8 (4 Kelas)
            </button>
            <button
              onClick={() => setFilterLevel('9')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterLevel === '9'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat 9 (4 Kelas)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari rombel / wali kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Rombel Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => {
          const studentCount = students.filter((s) => s.classId === cls.id).length;
          return (
            <div
              key={cls.id}
              className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-sm border border-blue-200">
                    {cls.id}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Tingkat {cls.gradeLevel}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{cls.name}</h3>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Wali Kelas:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                      {cls.homeroomTeacherName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tahun Ajaran:</span>
                    <span className="font-mono text-slate-700">{cls.academicYear}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Jumlah Siswa:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {studentCount} Siswa
                    </span>
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Ubah
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus rombel ${cls.name}?`)) {
                        deleteClass(cls.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Rombel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between bg-blue-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <School className="h-4 w-4" />
                {editingClass ? `Edit Rombel ${editingClass.name}` : 'Tambah Rombel Baru'}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode / ID Rombel:</label>
                <input
                  type="text"
                  placeholder="contoh: 7.1, 7.2, 8.1, 9.4"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingClass}
                  className="w-full rounded-lg border border-slate-300 p-2 font-bold uppercase disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Rombel Lengkap:</label>
                <input
                  type="text"
                  placeholder="contoh: Kelas 7.1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas:</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-bold"
                  >
                    <option value="7">Tingkat 7</option>
                    <option value="8">Tingkat 8</option>
                    <option value="9">Tingkat 9</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran:</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wali Kelas Penanggung Jawab:</label>
                <select
                  value={formData.homeroomTeacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'super_admin' ? 'Super Admin' : `Guru/Wali ${u.classAssigned || ''}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-1.5 text-xs font-semibold text-white shadow"
                >
                  Simpan Rombel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
