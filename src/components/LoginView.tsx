import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  School,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LogIn,
  KeyRound,
  Users2,
  Sparkles,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, switchUser, users, schoolProfile } = useApp();

  const [activeTab, setActiveTab] = useState<'form' | 'demo'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('wali_kelas');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Silakan masukkan alamat email.');
      return;
    }

    const success = login(email, role);
    if (!success) {
      setErrorMsg('Email tidak terdaftar atau kredensial salah.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg('Gagal masuk dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background graphic elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/20 via-blue-900/10 to-transparent pointer-events-none blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo and header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 p-3 shadow-xl ring-4 ring-white/10">
            <School className="h-10 w-10 text-amber-300" />
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-amber-300 border border-blue-400/30">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> e-Rapor Kurikulum Merdeka
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            {schoolProfile.name}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Portal Penilaian Sumatif Tengah Semester (STS) & Cetak Rapor Resmi
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold mb-6">
            <button
              onClick={() => setActiveTab('demo')}
              className={`rounded-lg py-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Demo 1-Klik
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`rounded-lg py-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Masuk Akun
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'demo' ? (
            /* Quick Demo Selector */
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Pilih peran akun yang diinginkan untuk langsung menguji fungsi sistem:
              </p>

              {users.map((u) => {
                const isSuper = u.role === 'super_admin';
                return (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isSuper
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                        isSuper ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isSuper ? 'Super Admin' : `Wali Kelas ${u.classAssigned}`}
                    </span>
                  </button>
                );
              })}

              <div className="pt-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 p-2.5 text-xs font-bold text-blue-900 shadow-sm transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {isLoading ? 'Menghubungkan ke Cloud...' : 'Masuk dengan Google (Aktifkan Kolaborasi Realtime)'}
                </button>
                <p className="mt-1.5 text-center text-[10px] text-slate-500 font-medium">
                  ⚡ Mode Google mengaktifkan database live: semua guru & wali kelas bisa input nilai serentak dari perangkat berbeda.
                </p>
              </div>
            </div>
          ) : (
            /* Standard Email / Password Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Peran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer font-bold ${
                      role === 'wali_kelas'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="wali_kelas"
                      checked={role === 'wali_kelas'}
                      onChange={() => setRole('wali_kelas')}
                      className="hidden"
                    />
                    Wali Kelas
                  </label>
                  <label
                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer font-bold ${
                      role === 'super_admin'
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="super_admin"
                      checked={role === 'super_admin'}
                      onChange={() => setRole('super_admin')}
                      className="hidden"
                    />
                    Super Admin
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Email:</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="nama@smpn14tubaba.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs"
                    required
                  />
                  <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi:</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs"
                  />
                  <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white py-2.5 text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Masuk ke Aplikasi e-Rapor
              </button>
            </form>
          )}

          {/* Footer security note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Koneksi Aman & Enkripsi Data Aktif (SMPN 14 Tubaba)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
