import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  UserCog,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Shield,
  UserCheck,
  Search,
  X,
  Save,
  CheckCircle,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { users, classes, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    nip: string;
    classAssigned: string;
    phone: string;
  }>({
    name: '',
    email: '',
    role: 'wali_kelas',
    nip: '',
    classAssigned: '7.1',
    phone: '',
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nip && u.nip.includes(searchQuery))
  );

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'wali_kelas',
      nip: '',
      classAssigned: '7.1',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      nip: user.nip || '',
      classAssigned: user.classAssigned || '7A',
      phone: user.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    if (editingUser) {
      await updateUser({
        ...editingUser,
        ...formData,
      });
    } else {
      await addUser({
        ...formData,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600">
              <Shield className="h-4 w-4" />
              Super Admin - Akses Manajemen Penuh
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Manajemen Akun Guru & Wali Kelas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola hak akses pengguna, penugasan wali kelas binaan, dan kredensial akun guru di SMPN 14 Tulang Bawang Barat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-xs font-semibold shadow"
            >
              <Plus className="h-4 w-4" />
              Tambah Akun Guru
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama, email, atau NIP guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3 min-w-[200px]">Nama Lengkap Guru</th>
                <th className="px-3 py-3 min-w-[160px]">Email & Kontak</th>
                <th className="px-3 py-3 w-32 text-center">Peran Akun</th>
                <th className="px-3 py-3 w-32 text-center">Kelas Binaan</th>
                <th className="px-3 py-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      NIP. {user.nip || 'Belum diisi'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[11px]">
                    <div className="text-slate-800 font-medium">{user.email}</div>
                    <div className="text-slate-400">{user.phone || '-'}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' : 'Wali Kelas'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-700">
                    {user.role === 'wali_kelas' ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        Kelas {user.classAssigned || '-'}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">Semua Kelas</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50"
                        title="Edit Akun"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus akun ${user.name}?`)) {
                              deleteUser(user.id);
                            }
                          }}
                          className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          title="Hapus Akun"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between bg-purple-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <UserCog className="h-4 w-4" />
                {editingUser ? 'Edit Akun Guru' : 'Tambah Akun Guru Baru'}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  placeholder="contoh: Ahmad Fauzi, S.Pd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi (Untuk Login):</label>
                <input
                  type="email"
                  placeholder="guru@smpn14tubaba.sch.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP Guru:</label>
                  <input
                    type="text"
                    placeholder="19880721..."
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran Akses:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="wali_kelas">Wali Kelas</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {formData.role === 'wali_kelas' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tugaskan Sebagai Wali:</label>
                    <select
                      value={formData.classAssigned}
                      onChange={(e) => setFormData({ ...formData, classAssigned: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-purple-700 hover:bg-purple-800 px-4 py-1.5 text-xs font-semibold text-white shadow"
              >
                Simpan Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
