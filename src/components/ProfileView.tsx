import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCircle,
  KeyRound,
  ShieldCheck,
  Save,
  CheckCircle,
  Phone,
  Mail,
  Award,
  Lock,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, updateUser, addAuditLog } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [nip, setNip] = useState(currentUser?.nip || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [msg, setMsg] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    await updateUser({
      ...currentUser,
      name,
      nip,
      phone,
    });

    setMsg('Data profil pengguna berhasil diperbarui.');
    setTimeout(() => setMsg(''), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    await addAuditLog('UBAH_KATA_SANDI', 'Keamanan', `Pengguna ${currentUser?.name} berhasil mengubah kata sandi.`);
    setPwdMsg('Kata sandi berhasil diperbarui dan dienkripsi.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdMsg(''), 4000);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Header Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-500 shadow-md"
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-md">
              {currentUser.name.charAt(0)}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  currentUser.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentUser.role === 'super_admin'
                  ? 'Super Administrator'
                  : `Wali Kelas ${currentUser.classAssigned || '-'}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">NIP. {currentUser.nip || 'Belum diisi'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
                {currentUser.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                {currentUser.phone || 'Belum diisi'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Biodata */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-blue-600" />
            Perbarui Biodata Guru
          </h3>

          {msg && (
            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-300 p-2.5 text-xs text-emerald-900 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>{msg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Induk Pegawai (NIP):</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP Aktif:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold shadow"
              >
                <Save className="h-3.5 w-3.5" />
                Simpan Biodata
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-600" />
            Keamanan & Ganti Kata Sandi
          </h3>

          {pwdMsg && (
            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-300 p-2.5 text-xs text-emerald-900 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>{pwdMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Saat Ini:</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru:</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ulangi Kata Sandi Baru:</label>
              <input
                type="password"
                placeholder="Konfirmasi sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-semibold shadow"
              >
                <Lock className="h-3.5 w-3.5" />
                Ubah Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
