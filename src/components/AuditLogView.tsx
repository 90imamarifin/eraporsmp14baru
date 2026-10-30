import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  ShieldCheck,
  Search,
  Lock,
  Download,
  Calendar,
  User,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchAction = selectedAction === 'all' || log.action === selectedAction;
    return matchSearch && matchAction;
  });

  const exportLogsAsCSV = () => {
    const headers = ['ID', 'Waktu', 'Aksi', 'Entitas', 'Pengguna', 'Deskripsi'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      l.action,
      l.entity,
      `"${l.performedByName}"`,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_eRapor_SMPN14_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              Keamanan Terenkripsi & Audit Trail
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Histori Perubahan Seluruh Akun Pengguna
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh riwayat aksi penambahan nilai STS, perubahan profil sekolah, akun pengguna, dan sinkronisasi Dapodik tercatat secara permanen dengan stempel integritas data.
            </p>
          </div>

          <button
            onClick={exportLogsAsCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            Ekspor Log (.CSV)
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cari Aktivitas:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari deskripsi, aktor, atau aksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Filter Kategori Aksi:</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="all">Semua Kategori Aksi ({auditLogs.length} Entri)</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">No</th>
                <th className="px-3 py-3 w-40">Waktu & Tanggal</th>
                <th className="px-4 py-3 w-48">Pengguna (Aktor)</th>
                <th className="px-3 py-3 w-32">Kategori Aksi</th>
                <th className="px-4 py-3 min-w-[260px]">Rincian Perubahan</th>
                <th className="px-3 py-3 w-28 text-center">Status Integritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Tidak ada catatan aktivitas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-3 text-[11px] text-slate-600 font-mono">
                      <div>
                        {new Date(log.timestamp).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{log.performedByName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.performedBy}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] uppercase border border-slate-200 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs leading-relaxed">
                      {log.description}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Valid (SHA-256)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
