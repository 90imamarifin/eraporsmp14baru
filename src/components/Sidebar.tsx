import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Printer,
  TableProperties,
  Users2,
  UserCog,
  Settings,
  History,
  UserCircle,
  HelpCircle,
  CheckCircle2,
  Lock,
  School,
  BookOpen,
  ClipboardCheck,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onClose,
}) => {
  const { currentUser, schoolProfile, activeSemester, activeAcademicYear } = useApp();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const menuSections = [
    {
      title: 'UTAMA',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard e-Rapor',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'input-nilai',
          label: 'Input Nilai STS',
          icon: FileSpreadsheet,
          badge: 'Fokus',
          badgeColor: 'bg-emerald-500 text-white',
        },
        {
          id: 'pemantauan-nilai',
          label: 'Pemantauan Nilai',
          icon: Activity,
          badge: 'Monitor',
          badgeColor: 'bg-violet-600 text-white',
        },
        {
          id: 'cetak-rapor',
          label: 'Cetak Rapor STS (PDF)',
          icon: Printer,
          badge: 'Resmi',
          badgeColor: 'bg-blue-600 text-white',
        },
        {
          id: 'presensi-catatan',
          label: 'Presensi & Catatan Wali',
          icon: ClipboardCheck,
          badge: 'Rapor',
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          id: 'leger-nilai',
          label: 'Leger Nilai Semester',
          icon: TableProperties,
          badge: null,
        },
      ],
    },
    {
      title: 'DATA INDUK',
      items: [
        {
          id: 'dapodik-siswa',
          label: 'Data Siswa (Dapodik)',
          icon: Users2,
          badge: 'Sync',
          badgeColor: 'bg-sky-500 text-white',
        },
        {
          id: 'rombel',
          label: 'Rombel (12 Kelas)',
          icon: School,
          badge: '12',
          badgeColor: 'bg-indigo-500 text-white',
        },
        {
          id: 'mata-pelajaran',
          label: 'Mata Pelajaran',
          icon: BookOpen,
          badge: null,
        },
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            title: 'SUPER ADMIN',
            items: [
              {
                id: 'manajemen-guru',
                label: 'Manajemen Akun Guru',
                icon: UserCog,
                badge: 'Admin',
                badgeColor: 'bg-purple-600 text-white',
              },
              {
                id: 'identitas-sekolah',
                label: 'Identitas & Periode',
                icon: Settings,
                badge: null,
              },
            ],
          },
        ]
      : []),
    {
      title: 'KEAMANAN & AKUN',
      items: [
        {
          id: 'audit-log',
          label: 'Histori Perubahan',
          icon: History,
          badge: null,
        },
        {
          id: 'profil',
          label: 'Profil Saya',
          icon: UserCircle,
          badge: null,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden print:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 print:hidden flex flex-col justify-between border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto px-3 py-4 flex-1">
          {/* User mini badge */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 p-3.5 border border-slate-700/60 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      isSuperAdmin ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {isSuperAdmin ? 'Super Administrator' : `Wali Kelas ${currentUser?.classAssigned || '-'}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Data Terenkripsi
              </span>
              <span className="text-slate-400 font-mono text-[10px]">v2.6 Kemdikbud</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {menuSections.map((sec) => (
              <div key={sec.title}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {sec.title}
                </p>
                <ul className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            onSelectView(item.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* School Footer Information */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">NPSN: {schoolProfile.npsn}</span>
            <span className="text-amber-400 font-medium">Kab. Tubaba</span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            Kec. {schoolProfile.subDistrict}, {schoolProfile.province}
          </p>
        </div>
      </aside>
    </>
  );
};
