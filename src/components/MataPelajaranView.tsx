import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Subject } from '../types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  X,
  Save,
  ArrowUpDown,
  GraduationCap,
} from 'lucide-react';

export const MataPelajaranView: React.FC = () => {
  const { subjects, currentUser, addSubject, updateSubject, deleteSubject } = useApp();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [formData, setFormData] = useState<Omit<Subject, 'id'>>({
    code: '',
    name: '',
    category: 'umum',
    kkm: 75,
    orderIndex: subjects.length + 1,
  });

  const filteredSubjects = subjects
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      category: 'umum',
      kkm: 75,
      orderIndex: subjects.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData({
      code: sub.code,
      name: sub.name,
      category: sub.category,
      kkm: sub.kkm,
      orderIndex: sub.orderIndex,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Kode dan Nama Mata Pelajaran wajib diisi.');
      return;
    }

    if (editingSubject) {
      await updateSubject({
        ...editingSubject,
        ...formData,
      });
    } else {
      await addSubject(formData);
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
              <BookOpen className="h-4 w-4" />
              Kurikulum Merdeka SMP
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Data Mata Pelajaran (Tambah & Ubah)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar mata pelajaran, KKM/KKTP standar, kode singkatan, dan urutan tampilan pada e-Rapor & Leger Nilai.
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold shadow"
            >
              <Plus className="h-4 w-4" />
              Tambah Mata Pelajaran
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau kode mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-12 text-center">Urutan</th>
                <th className="px-3 py-3 w-28">Kode Mapel</th>
                <th className="px-4 py-3 min-w-[240px]">Nama Lengkap Mata Pelajaran</th>
                <th className="px-3 py-3 w-36 text-center">Kelompok / Kategori</th>
                <th className="px-3 py-3 w-24 text-center">Standar KKM</th>
                {isSuperAdmin && <th className="px-3 py-3 w-24 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSubjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-center font-bold text-slate-500">{sub.orderIndex}</td>
                  <td className="px-3 py-3 font-mono font-bold text-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                      {sub.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 text-xs sm:text-sm">
                    {sub.name}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sub.category === 'umum'
                          ? 'bg-blue-100 text-blue-800'
                          : sub.category === 'mulok'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sub.category === 'mulok'
                        ? 'Muatan Lokal'
                        : sub.category === 'pilihan'
                        ? 'Mata Pelajaran Pilihan'
                        : 'Mata Pelajaran Umum'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-blue-900 text-sm">
                    {sub.kkm}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          title="Ubah Mata Pelajaran"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus mata pelajaran ${sub.name}?`)) {
                              deleteSubject(sub.id);
                            }
                          }}
                          className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          title="Hapus Mata Pelajaran"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between bg-blue-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <BookOpen className="h-4 w-4" />
                {editingSubject ? `Edit Mapel: ${editingSubject.name}` : 'Tambah Mata Pelajaran Baru'}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Singkatan:</label>
                  <input
                    type="text"
                    placeholder="contoh: MAT, IPA, BIND"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Urut Rapor:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Mata Pelajaran:</label>
                <input
                  type="text"
                  placeholder="contoh: Pendidikan Pancasila, Bahasa Inggris"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelompok Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                  >
                    <option value="umum">Mata Pelajaran Umum</option>
                    <option value="pilihan">Mata Pelajaran Pilihan</option>
                    <option value="mulok">Muatan Lokal Daerah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Standar KKM / KKTP:</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.kkm}
                    onChange={(e) => setFormData({ ...formData, kkm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-bold text-center text-blue-900"
                    required
                  />
                </div>
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
                  Simpan Mata Pelajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
