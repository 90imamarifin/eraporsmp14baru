import React from 'react';
import { useApp } from '../context/AppContext';
import {
  School,
  Wifi,
  WifiOff,
  UserCheck,
  LogOut,
  Calendar,
  Layers,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const {
    currentUser,
    schoolProfile,
    activeAcademicYear,
    activeSemester,
    isOnline,
    isSyncing,
    users,
    switchUser,
    logout,
    loginWithGoogle,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [showSwitchDropdown, setShowSwitchDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#0f3b70] text-white shadow-md print:hidden">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Kemdikbud / School Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 p-2 shadow-inner backdrop-blur-sm border border-white/20">
            {/* Tut Wuri Handayani icon abstraction */}
            <School className="h-7 w-7 text-amber-300" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                e-Rapor SMP Kemdikbudristek
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-blue-900/80 px-1.5 py-0.5 text-[10px] font-medium text-blue-200 border border-blue-400/30">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Kurikulum Merdeka
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold leading-tight tracking-wide text-white">
              {schoolProfile.name}
            </h1>
          </div>
        </div>

        {/* Right: Semester Badge, Firebase Live status, & User Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Active Period Badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg bg-blue-950/60 px-3 py-1.5 text-xs border border-blue-400/20">
            <Calendar className="h-3.5 w-3.5 text-blue-300" />
            <span className="text-blue-200 font-medium">TP {activeAcademicYear}</span>
            <span className="text-white/40">|</span>
            <span className="font-semibold text-amber-300">
              Semester {activeSemester === '1' ? 'Ganjil' : 'Genap'}
            </span>
          </div>

          {/* Firebase Realtime Connection Indicator */}
          <button
            onClick={() => {
              if (!isOnline && !isSyncing) {
                loginWithGoogle();
              }
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border transition-colors ${
              isOnline
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/30 text-rose-200 hover:bg-rose-900/60 cursor-pointer'
            }`}
            title={
              isOnline
                ? 'Terhubung dengan Firebase Cloud Realtime (Kolaborasi Aktif Antar-Client)'
                : 'Mode Lokal — Klik untuk Masuk Google & Aktifkan Kolaborasi Realtime'
            }
          >
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
            ) : isOnline ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
            )}
            <span className="text-[11px] font-semibold hidden sm:inline">
              {isSyncing ? 'Sinkron...' : isOnline ? 'Realtime Aktif' : 'Aktifkan Realtime'}
            </span>
          </button>

          {/* Quick Switch Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSwitchDropdown(!showSwitchDropdown);
                setShowUserDropdown(false);
              }}
              className="flex items-center gap-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs px-2.5 py-1.5 font-medium border border-amber-400/30 transition-colors"
              title="Ganti Peran Akun Pengguna Cepat"
            >
              <Layers className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden lg:inline">Ganti Peran</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {showSwitchDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-50 overflow-hidden py-1">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Simulasi Akses Peran Akun
                  </p>
                  <p className="text-xs text-slate-600">Klik untuk berganti akses instan:</p>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowSwitchDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                        currentUser?.id === u.id ? 'bg-blue-100/60 font-semibold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.role === 'super_admin'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.role === 'super_admin' ? 'Super Admin' : `Wali ${u.classAssigned || ''}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowSwitchDropdown(false);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-900/60 hover:bg-blue-900 px-2 sm:px-3 py-1.5 transition-colors border border-blue-400/20"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-white/50"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold ring-1 ring-white/40">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold leading-tight max-w-[130px] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-amber-300 font-medium">
                    {currentUser.role === 'super_admin'
                      ? 'Super Admin'
                      : `Wali Kelas ${currentUser.classAssigned || '-'}`}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/70" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-50 overflow-hidden py-1">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                    <p className="text-xs text-blue-200">Sedang Masuk Sebagai:</p>
                    <p className="font-bold text-sm truncate">{currentUser.name}</p>
                    <p className="text-xs text-blue-200 truncate">{currentUser.email}</p>
                    <div className="mt-2 inline-block rounded bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                      {currentUser.role === 'super_admin' ? 'Super Admin (Akses Penuh)' : `Wali Kelas ${currentUser.classAssigned}`}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('profil');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Profil Pengguna & Keamanan
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 font-semibold"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      Keluar dari Aplikasi
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
