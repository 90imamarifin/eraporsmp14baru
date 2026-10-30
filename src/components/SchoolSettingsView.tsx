import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SchoolProfile } from '../types';
import {
  School,
  Save,
  CheckCircle,
  Calendar,
  Building,
  UserCheck,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export const SchoolSettingsView: React.FC = () => {
  const {
    schoolProfile,
    activeAcademicYear,
    activeSemester,
    updateSchoolProfile,
    setAcademicPeriod,
    resetToInitialData,
  } = useApp();

  const [form, setForm] = useState<SchoolProfile>({ ...schoolProfile });
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSchoolProfile(form);
    setAcademicPeriod(form.academicYearActive, form.semesterActive);
    setSuccessMsg('Pengaturan identitas sekolah & periode akademik berhasil disimpan.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
          <Building className="h-4 w-4" />
          Konfigurasi Satuan Pendidikan
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Identitas SMPN 14 Tulang Bawang Barat & Periode Rapor
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Data ini menjadi rujukan otomatis pada Kop Surat Rapor, Tanda Tangan Kepala Sekolah, dan Periode Penilaian Aktif.
        </p>

        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
          {/* Periode Aktif */}
          <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-200 space-y-3">
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-700" />
              Periode Penilaian Rapor Aktif
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran Aktif:</label>
                <input
                  type="text"
                  value={form.academicYearActive}
                  onChange={(e) => setForm({ ...form, academicYearActive: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Semester Aktif:</label>
                <select
                  value={form.semesterActive}
                  onChange={(e) => setForm({ ...form, semesterActive: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 font-bold"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pembagian Rapor:</label>
                <input
                  type="text"
                  value={form.reportDate}
                  onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                  placeholder="10 Oktober 2026"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2"
                  required
                />
              </div>
            </div>
          </div>

          {/* Upload Logo Sekolah & Logo Pemda */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <School className="h-4 w-4 text-blue-700" />
                Upload Logo Sekolah & Logo Pemda (Untuk Kop Surat Rapor)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Logo ini akan otomatis dicetak pada Kop Surat Rapor Resmi (Logo Pemda di sebelah kiri, Logo Sekolah di sebelah kanan).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Pemda */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    1. Logo Pemerintah Daerah (Pemkab Tubaba):
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {form.districtLogo ? (
                        <img
                          src={form.districtLogo}
                          alt="Logo Pemda"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-1 text-[9px] text-slate-400 font-bold leading-tight">
                          LOGO PEMKAB TUBABA
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200">
                        <span>Pilih File Logo Pemda</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setForm((prev) => ({
                                  ...prev,
                                  districtLogo: ev.target?.result as string,
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {form.districtLogo && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, districtLogo: undefined }))}
                          className="block text-[11px] text-rose-600 hover:underline"
                        >
                          Hapus / Reset
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">Format: PNG, JPG, atau WebP</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Sekolah */}
              <div className="rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    2. Logo Sekolah / Tut Wuri Handayani:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {form.schoolLogo ? (
                        <img
                          src={form.schoolLogo}
                          alt="Logo Sekolah"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-1 text-[9px] text-slate-400 font-bold leading-tight">
                          LOGO SMPN 14
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200">
                        <span>Pilih File Logo Sekolah</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setForm((prev) => ({
                                  ...prev,
                                  schoolLogo: ev.target?.result as string,
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {form.schoolLogo && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, schoolLogo: undefined }))}
                          className="block text-[11px] text-rose-600 hover:underline"
                        >
                          Hapus / Reset
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">Format: PNG, JPG, atau WebP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profil Lembaga */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-1">
              Data Satuan Pendidikan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Satuan Pendidikan:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NPSN Sekolah:</label>
                <input
                  type="text"
                  value={form.npsn}
                  onChange={(e) => setForm({ ...form, npsn: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Jalan / Tiyuh:</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kecamatan:</label>
                <input
                  type="text"
                  value={form.subDistrict}
                  onChange={(e) => setForm({ ...form, subDistrict: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kabupaten:</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Provinsi:</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Pos:</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Kepala Sekolah */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b pb-1">
              Data Kepala Sekolah (Penanda Tangan Rapor)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar:</label>
                <input
                  type="text"
                  value={form.headmasterName}
                  onChange={(e) => setForm({ ...form, headmasterName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah:</label>
                <input
                  type="text"
                  value={form.headmasterNip}
                  onChange={(e) => setForm({ ...form, headmasterNip: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 text-xs font-bold shadow"
            >
              <Save className="h-4 w-4" />
              Simpan Identitas & Periode Rapor
            </button>
          </div>
        </form>
      </div>

      {/* Dangerous Zone / Reset initial data for demo testing */}
      <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200">
        <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4" />
          Pengaturan Pemeliharaan & Reset Simulasi
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Kembalikan seluruh data e-Rapor, akun guru, dan nilai STS ke kondisi awal SMPN 14 Tulang Bawang Barat.
        </p>
        <button
          onClick={() => {
            if (confirm('Atur ulang seluruh data simulasi ke data awal SMPN 14 Tulang Bawang Barat?')) {
              resetToInitialData();
              alert('Data berhasil direset.');
            }
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 px-3.5 py-1.5 text-xs font-semibold shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset ke Data Awal Pabrik
        </button>
      </div>
    </div>
  );
};
