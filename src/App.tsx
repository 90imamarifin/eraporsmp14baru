/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { InputNilaiSTSView } from './components/InputNilaiSTSView';
import { CetakRaporView } from './components/CetakRaporView';
import { PresensiCatatanView } from './components/PresensiCatatanView';
import { LegerNilaiView } from './components/LegerNilaiView';
import { PemantauanNilaiView } from './components/PemantauanNilaiView';
import { DapodikView } from './components/DapodikView';
import { RombelView } from './components/RombelView';
import { MataPelajaranView } from './components/MataPelajaranView';
import { UserManagementView } from './components/UserManagementView';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { AuditLogView } from './components/AuditLogView';
import { ProfileView } from './components/ProfileView';
import { Menu, ChevronRight, School, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, schoolProfile, activeAcademicYear, activeSemester } = useApp();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // If not logged in, show Login View
  if (!currentUser) {
    return <LoginView />;
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard e-Rapor';
      case 'input-nilai':
        return 'Input Nilai Asesmen STS (Tanpa TP)';
      case 'pemantauan-nilai':
        return 'Pemantauan Nilai Siswa (Guru & Wali Kelas)';
      case 'cetak-rapor':
        return 'Cetak Rapor STS (PDF Resmi)';
      case 'presensi-catatan':
        return 'Presensi, Catatan Wali & Perkembangan Siswa';
      case 'leger-nilai':
        return 'Leger Nilai Semester & Ranking';
      case 'dapodik-siswa':
        return 'Data Siswa & Sinkronisasi Dapodik';
      case 'rombel':
        return 'Data Rombel (12 Kelas: 7.1-7.4, 8.1-8.4, 9.1-9.4)';
      case 'mata-pelajaran':
        return 'Data Mata Pelajaran Kurikulum Merdeka';
      case 'manajemen-guru':
        return 'Manajemen Akun Guru & Wali Kelas';
      case 'identitas-sekolah':
        return 'Identitas Sekolah & Periode Rapor';
      case 'audit-log':
        return 'Histori Perubahan & Log Aktivitas';
      case 'profil':
        return 'Profil Saya & Pengaturan Keamanan';
      default:
        return 'e-Rapor SMP';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            {/* Top Bar Navigation Breadcrumbs (hidden in print) */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                  aria-label="Buka Menu Sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span
                    onClick={() => setCurrentView('dashboard')}
                    className="cursor-pointer hover:text-blue-700 flex items-center gap-1"
                  >
                    <School className="h-3.5 w-3.5 text-blue-600" />
                    e-Rapor SMP
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">{getViewTitle()}</span>
                </nav>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="rounded bg-slate-200/80 px-2 py-0.5 text-slate-700 font-semibold">
                  NPSN {schoolProfile.npsn}
                </span>
                <span>•</span>
                <span>TP {activeAcademicYear} ({activeSemester === '1' ? 'Ganjil' : 'Genap'})</span>
              </div>
            </div>

            {/* Dynamic View Router */}
            <div>
              {currentView === 'dashboard' && <DashboardView onNavigate={(v) => setCurrentView(v)} />}
              {currentView === 'input-nilai' && <InputNilaiSTSView />}
              {currentView === 'pemantauan-nilai' && <PemantauanNilaiView onNavigate={(v) => setCurrentView(v)} />}
              {currentView === 'cetak-rapor' && <CetakRaporView />}
              {currentView === 'presensi-catatan' && <PresensiCatatanView />}
              {currentView === 'leger-nilai' && <LegerNilaiView />}
              {currentView === 'dapodik-siswa' && <DapodikView />}
              {currentView === 'rombel' && <RombelView />}
              {currentView === 'mata-pelajaran' && <MataPelajaranView />}
              {currentView === 'manajemen-guru' && <UserManagementView />}
              {currentView === 'identitas-sekolah' && <SchoolSettingsView />}
              {currentView === 'audit-log' && <AuditLogView />}
              {currentView === 'profil' && <ProfileView />}
            </div>
          </div>

          {/* Footer (hidden in print) */}
          <footer className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 print:hidden flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                e-Rapor Kurikulum Merdeka - <strong>{schoolProfile.name}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Kecamatan {schoolProfile.subDistrict}, Kabupaten {schoolProfile.district}, Lampung
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
