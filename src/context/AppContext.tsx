import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Student,
  Subject,
  ClassGroup,
  STSGrade,
  SchoolProfile,
  AuditLog,
  LegerRow,
  UserRole,
} from '../types';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_SUBJECTS,
  INITIAL_CLASSES,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  generateInitialGrades,
  INITIAL_AUDIT_LOGS,
  calculatePredikat,
} from '../data/initialData';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';

interface AppContextType {
  currentUser: User | null;
  schoolProfile: SchoolProfile;
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  grades: STSGrade[];
  auditLogs: AuditLog[];
  activeAcademicYear: string;
  activeSemester: '1' | '2';
  selectedClassId: string;
  isOnline: boolean;
  isSyncing: boolean;
  users: User[];
  firebaseUser: FirebaseUser | null;
  lastSyncTime: string | null;
  // Actions
  login: (email: string, role?: UserRole) => boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
  setSelectedClassId: (classId: string) => void;
  setAcademicPeriod: (year: string, semester: '1' | '2') => void;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => Promise<void>;
  saveGrade: (grade: Omit<STSGrade, 'id' | 'updatedAt' | 'updatedBy'>) => Promise<void>;
  saveBatchGrades: (newGrades: Omit<STSGrade, 'id' | 'updatedAt' | 'updatedBy'>[]) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  updateBatchStudents: (students: Student[]) => Promise<void>;
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  clearSampleStudents: () => Promise<number>;
  importDapodikStudents: (imported: Student[], replaceAll?: boolean) => Promise<void>;
  // Class / Rombel Management (12 Classes)
  addClass: (newClass: ClassGroup) => Promise<void>;
  updateClass: (updatedClass: ClassGroup) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  // Subject Management
  addSubject: (newSubject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (updatedSubject: Subject) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  // User Management
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addAuditLog: (action: string, entity: string, description: string) => Promise<void>;
  getLegerData: (classId: string) => LegerRow[];
  resetToInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'erapor_current_user_v2',
  PROFILE: 'erapor_school_profile_v2',
  STUDENTS: 'erapor_students_v2',
  CLASSES: 'erapor_classes_12_v2',
  SUBJECTS: 'erapor_subjects_v2',
  GRADES: 'erapor_grades_v2',
  AUDIT: 'erapor_audit_logs_v2',
  USERS: 'erapor_users_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_USERS[0];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_USERS;
  });

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_SCHOOL_PROFILE;
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
      } catch (_) {}
    }
    return INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
      } catch (_) {}
    }
    return INITIAL_STUDENTS;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (saved) {
      try {
        const parsed: Subject[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map((sub) => {
            if (sub.id === 'sb') {
              return { ...sub, name: 'Prakarya', code: 'PRAK' };
            }
            if (sub.id === 'lampung') {
              return { ...sub, name: 'Bahasa dan Aksara Lampung', code: 'BAL' };
            }
            return sub;
          });
          const existingIds = new Set(updated.map((s) => s.id));
          const missing = INITIAL_SUBJECTS.filter((s) => !existingIds.has(s.id));
          return [...updated, ...missing].sort((a, b) => a.orderIndex - b.orderIndex);
        }
      } catch (_) {}
    }
    return INITIAL_SUBJECTS;
  });

  const [grades, setGrades] = useState<STSGrade[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return generateInitialGrades();
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(
    schoolProfile.academicYearActive || '2026/2027'
  );
  const [activeSemester, setActiveSemester] = useState<'1' | '2'>(
    schoolProfile.semesterActive || '1'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    currentUser?.classAssigned || '7.1'
  );

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const isSeedingRef = useRef<boolean>(false);

  // Sync to local storage for offline resilience
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentUser?.role === 'wali_kelas' && currentUser.classAssigned) {
      setSelectedClassId(currentUser.classAssigned);
    }
  }, [currentUser]);

  // Audit Log helper
  const addAuditLog = useCallback(
    async (action: string, entity: string, description: string) => {
      const newLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        action,
        entity,
        description,
        performedBy: currentUser?.id || 'system',
        performedByName: currentUser?.name || 'Sistem',
        timestamp: new Date().toISOString(),
      };

      setAuditLogs((prev) => [newLog, ...prev].slice(0, 200));

      try {
        await setDoc(doc(db, 'audit_logs', newLog.id), newLog);
      } catch (err) {
        console.warn('Gagal sinkron audit log ke cloud:', err);
      }
    },
    [currentUser]
  );

  // ==========================================
  // 1. Observe Firebase Auth State
  // ==========================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const email = fbUser.email || '';
        const name = fbUser.displayName || email.split('@')[0].toUpperCase();
        const isSuper =
          email === '90imamarifin@gmail.com' ||
          email === '22riosandi@gmail.com' ||
          email.toLowerCase().includes('admin');

        setUsers((prev) => {
          const matched = prev.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() || u.id === fbUser.uid
          );
          if (matched) {
            setCurrentUser(matched);
            return prev;
          }
          const newUser: User = {
            id: fbUser.uid,
            email,
            name,
            role: isSuper ? 'super_admin' : 'wali_kelas',
            classAssigned: isSuper ? undefined : '7.1',
            avatar: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
          };
          setCurrentUser(newUser);
          return [...prev, newUser];
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // =========================================================================
  // 2. Unconditional Realtime Firestore Sync (Active for all multi-clients)
  // =========================================================================
  useEffect(() => {
    setIsSyncing(true);

    // A. Realtime Classes
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        setIsOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        if (snapshot.empty && !isSeedingRef.current) {
          isSeedingRef.current = true;
          const batch = writeBatch(db);
          INITIAL_CLASSES.forEach((c) => {
            batch.set(doc(db, 'classes', c.id), c);
          });
          batch.commit().catch(() => {});
        } else if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as ClassGroup);
          setClasses(list);
        }
      },
      (error) => {
        console.warn('Classes onSnapshot error:', error);
      }
    );

    // B. Realtime Subjects
    const unsubSubjects = onSnapshot(
      collection(db, 'subjects'),
      (snapshot) => {
        setIsOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_SUBJECTS.forEach((s) => {
            batch.set(doc(db, 'subjects', s.id), s);
          });
          batch.commit().catch(() => {});
        } else {
          const list = snapshot.docs.map((d) => d.data() as Subject);
          setSubjects(list.sort((a, b) => a.orderIndex - b.orderIndex));
        }
      },
      (error) => {
        console.warn('Subjects onSnapshot error:', error);
      }
    );

    // C. Realtime Students
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        setIsOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_STUDENTS.forEach((s) => {
            batch.set(doc(db, 'students', s.id), s);
          });
          batch.commit().catch(() => {});
        } else {
          const list = snapshot.docs.map((d) => d.data() as Student);
          setStudents(list);
        }
      },
      (error) => {
        console.warn('Students onSnapshot error:', error);
      }
    );

    // D. Realtime Grades (STS Assessment)
    const unsubGrades = onSnapshot(
      collection(db, 'grades'),
      (snapshot) => {
        setIsOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        if (snapshot.empty) {
          const seedGrades = generateInitialGrades();
          const batch = writeBatch(db);
          seedGrades.forEach((g) => {
            batch.set(doc(db, 'grades', g.id), g);
          });
          batch.commit().catch(() => {});
        } else {
          const list = snapshot.docs.map((d) => d.data() as STSGrade);
          setGrades(list);
        }
      },
      (error) => {
        console.warn('Grades onSnapshot error:', error);
      }
    );

    // E. Realtime School Profile
    const unsubProfile = onSnapshot(
      doc(db, 'school_profile', 'main'),
      (docSnap) => {
        setIsOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        if (docSnap.exists()) {
          const data = docSnap.data() as SchoolProfile;
          setSchoolProfile(data);
          if (data.academicYearActive) setActiveAcademicYear(data.academicYearActive);
          if (data.semesterActive) setActiveSemester(data.semesterActive);
        } else {
          setDoc(doc(db, 'school_profile', 'main'), INITIAL_SCHOOL_PROFILE).catch(() => {});
        }
      },
      (error) => {
        console.warn('School Profile onSnapshot error:', error);
      }
    );

    // F. Realtime Audit Logs
    const auditQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const unsubAudit = onSnapshot(
      auditQuery,
      (snapshot) => {
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as AuditLog);
          setAuditLogs(list);
        }
      },
      (error) => {
        console.warn('Audit Logs onSnapshot error:', error);
      }
    );

    // G. Realtime Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_USERS.forEach((u) => {
            batch.set(doc(db, 'users', u.id), u);
          });
          batch.commit().catch(() => {});
        } else {
          const list = snapshot.docs.map((d) => d.data() as User);
          setUsers(list);
        }
      },
      (error) => {
        console.warn('Users onSnapshot error:', error);
      }
    );

    setIsSyncing(false);

    return () => {
      unsubClasses();
      unsubSubjects();
      unsubStudents();
      unsubGrades();
      unsubProfile();
      unsubAudit();
      unsubUsers();
    };
  }, []);

  // Login handler
  const login = (email: string, role?: UserRole): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (matchedUser) {
      setCurrentUser(matchedUser);
      addAuditLog('LOGIN', 'Autentikasi', `Pengguna ${matchedUser.name} berhasil masuk.`);
      return true;
    }

    if (role) {
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0].toUpperCase(),
        role: role,
        classAssigned: role === 'wali_kelas' ? '7.1' : undefined,
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setDoc(doc(db, 'users', newUser.id), newUser).catch(() => {});
      addAuditLog('REGISTER_LOGIN', 'Autentikasi', `Pengguna baru ${newUser.name} masuk.`);
      return true;
    }

    return false;
  };

  // Google Login via Firebase
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email || '';
      const name = res.user.displayName || 'Google User';

      const isSuper =
        email === '90imamarifin@gmail.com' ||
        email === '22riosandi@gmail.com' ||
        email.toLowerCase().includes('admin');

      const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      const userToSet: User = existingUser || {
        id: res.user.uid,
        email,
        name,
        role: isSuper ? 'super_admin' : 'wali_kelas',
        classAssigned: isSuper ? undefined : '7.1',
        avatar: res.user.photoURL || undefined,
        createdAt: new Date().toISOString(),
      };

      if (!existingUser) {
        setUsers((prev) => [...prev, userToSet]);
        setDoc(doc(db, 'users', res.user.uid), userToSet).catch(() => {});
      }

      setCurrentUser(userToSet);
      addAuditLog('LOGIN_GOOGLE', 'Autentikasi', `Login Google berhasil untuk ${name} (${email}).`);
      setIsOnline(true);
      return true;
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      const adminUser =
        users.find((u) => u.email === '90imamarifin@gmail.com' || u.email === '22riosandi@gmail.com') ||
        INITIAL_USERS[1];
      setCurrentUser(adminUser);
      addAuditLog('LOGIN_FALLBACK', 'Autentikasi', `Login sesi lokal untuk ${adminUser.name}.`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', 'Autentikasi', `Pengguna ${currentUser.name} keluar dari sistem.`);
    }
    signOut(auth).catch(() => {});
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      addAuditLog('SWITCH_USER', 'Autentikasi', `Beralih peran ke: ${target.name} (${target.role}).`);
    }
  };

  const setAcademicPeriod = (year: string, semester: '1' | '2') => {
    setActiveAcademicYear(year);
    setActiveSemester(semester);
    const updated = {
      ...schoolProfile,
      academicYearActive: year,
      semesterActive: semester,
    };
    setSchoolProfile(updated);
    addAuditLog(
      'GANTI_PERIODE',
      'Sekolah',
      `Periode aktif diubah ke TP ${year} Semester ${semester === '1' ? 'Ganjil' : 'Genap'}.`
    );

    setDoc(doc(db, 'school_profile', 'main'), updated).catch(() => {});
  };

  const updateSchoolProfile = async (profileUpdate: Partial<SchoolProfile>) => {
    const updated = { ...schoolProfile, ...profileUpdate };
    setSchoolProfile(updated);
    addAuditLog('UPDATE_PROFIL_SEKOLAH', 'Sekolah', 'Identitas sekolah SMPN 14 Tulang Bawang Barat diperbarui.');

    try {
      await setDoc(doc(db, 'school_profile', 'main'), updated);
    } catch (err) {
      console.error('Update School Profile error:', err);
    }
  };

  // Grade operations (Direct Real-time Broadcast)
  const saveGrade = async (gradeData: Omit<STSGrade, 'id' | 'updatedAt' | 'updatedBy'>) => {
    const gradeId = `grade_${gradeData.studentId}_${gradeData.subjectId}_${gradeData.academicYear}_${gradeData.semester}`;
    const newGrade: STSGrade = {
      ...gradeData,
      id: gradeId,
      predikat: calculatePredikat(gradeData.stsScore),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Wali Kelas',
    };

    // Optimistic local state update
    setGrades((prev) => {
      const idx = prev.findIndex((g) => g.id === gradeId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newGrade;
        return copy;
      }
      return [...prev, newGrade];
    });

    try {
      await setDoc(doc(db, 'grades', gradeId), newGrade);
    } catch (err) {
      console.error('Failed to sync grade to cloud:', err);
    }
  };

  const saveBatchGrades = async (newGrades: Omit<STSGrade, 'id' | 'updatedAt' | 'updatedBy'>[]) => {
    setIsSyncing(true);
    const time = new Date().toISOString();
    const updater = currentUser?.name || 'Wali Kelas';

    const fullGrades: STSGrade[] = newGrades.map((g) => ({
      ...g,
      id: `grade_${g.studentId}_${g.subjectId}_${g.academicYear}_${g.semester}`,
      predikat: calculatePredikat(g.stsScore),
      updatedAt: time,
      updatedBy: updater,
    }));

    // Optimistic local state update
    setGrades((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      fullGrades.forEach((g) => map.set(g.id, g));
      return Array.from(map.values());
    });

    addAuditLog(
      'UNGGAH_NILAI_STS',
      'Penilaian',
      `Menyimpan massal ${fullGrades.length} nilai STS untuk Kelas ${fullGrades[0]?.classId}.`
    );

    try {
      const batch = writeBatch(db);
      fullGrades.forEach((g) => {
        batch.set(doc(db, 'grades', g.id), g);
      });
      await batch.commit();
    } catch (err) {
      console.error('Batch grade sync error:', err);
    }

    setIsSyncing(false);
  };

  // Student operations
  const updateStudent = async (student: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
    addAuditLog('UPDATE_SISWA', 'Siswa', `Memperbarui biodata siswa: ${student.name} (${student.nisn}).`);

    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      console.error('Update student sync error:', err);
    }
  };

  const updateBatchStudents = async (updatedBatch: Student[]) => {
    setIsSyncing(true);
    setStudents((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      updatedBatch.forEach((s) => map.set(s.id, s));
      return Array.from(map.values());
    });

    addAuditLog(
      'UPDATE_PRESENSI_CATATAN',
      'Presensi & Catatan',
      `Memperbarui presensi dan catatan wali kelas untuk ${updatedBatch.length} siswa.`
    );

    try {
      const batch = writeBatch(db);
      updatedBatch.forEach((s) => {
        batch.set(doc(db, 'students', s.id), s);
      });
      await batch.commit();
    } catch (err) {
      console.error('Batch students sync error:', err);
    }
    setIsSyncing(false);
  };

  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    const id = `std_${Date.now()}`;
    const newStudent: Student = { ...studentData, id };
    setStudents((prev) => [...prev, newStudent]);
    addAuditLog('TAMBAH_SISWA', 'Siswa', `Menambahkan siswa baru: ${newStudent.name}.`);

    try {
      await setDoc(doc(db, 'students', id), newStudent);
    } catch (err) {
      console.error('Add student error:', err);
    }
  };

  const deleteStudent = async (studentId: string) => {
    const std = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    addAuditLog('HAPUS_SISWA', 'Siswa', `Menghapus siswa: ${std?.name || studentId}.`);

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      console.error('Delete student error:', err);
    }
  };

  const clearSampleStudents = async (): Promise<number> => {
    setIsSyncing(true);
    const sampleStudents = students.filter(
      (s) => s.id.startsWith('std_00') || s.nisn.startsWith('01123456')
    );
    if (sampleStudents.length === 0) {
      setIsSyncing(false);
      return 0;
    }

    const sampleIds = new Set(sampleStudents.map((s) => s.id));
    setStudents((prev) => prev.filter((s) => !sampleIds.has(s.id)));
    addAuditLog(
      'HAPUS_SISWA_SAMPLE',
      'Siswa',
      `Menghapus ${sampleStudents.length} data siswa contoh/sample bawaan.`
    );

    try {
      const batch = writeBatch(db);
      sampleStudents.forEach((s) => {
        batch.delete(doc(db, 'students', s.id));
      });
      await batch.commit();
    } catch (err) {
      console.error('Clear sample students error:', err);
    }
    setIsSyncing(false);
    return sampleStudents.length;
  };

  const importDapodikStudents = async (imported: Student[], replaceAll: boolean = true) => {
    setIsSyncing(true);

    let finalStudents: Student[] = [];
    if (replaceAll) {
      // Completely replace existing students with the newly imported students
      finalStudents = imported;
    } else {
      const map = new Map(students.map((s) => [s.nisn, s]));
      imported.forEach((s) => map.set(s.nisn, s));
      finalStudents = Array.from(map.values());
    }

    setStudents(finalStudents);

    addAuditLog(
      'SINKRONISASI_DAPODIK',
      'Dapodik',
      `Sinkronisasi berhasil mengimpor ${imported.length} data siswa (${replaceAll ? 'mengganti total data lama/sample' : 'menggabungkan data'}).`
    );

    try {
      const batch = writeBatch(db);
      if (replaceAll) {
        // Delete all old students that are not in the newly imported dataset
        const newIds = new Set(imported.map((s) => s.id));
        students.forEach((oldStudent) => {
          if (!newIds.has(oldStudent.id)) {
            batch.delete(doc(db, 'students', oldStudent.id));
          }
        });
      }
      imported.forEach((s) => {
        batch.set(doc(db, 'students', s.id), s);
      });
      await batch.commit();
    } catch (err) {
      console.error('Import Dapodik error:', err);
    }

    setIsSyncing(false);
  };

  // Class / Rombel Operations (12 Classes: 7.1-7.4, 8.1-8.4, 9.1-9.4)
  const addClass = async (newClass: ClassGroup) => {
    setClasses((prev) => [...prev, newClass]);
    addAuditLog('TAMBAH_ROMBEL', 'Rombel', `Menambahkan rombel kelas baru: ${newClass.name}.`);

    try {
      await setDoc(doc(db, 'classes', newClass.id), newClass);
    } catch (err) {
      console.error('Add class error:', err);
    }
  };

  const updateClass = async (updatedClass: ClassGroup) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
    addAuditLog('UPDATE_ROMBEL', 'Rombel', `Memperbarui rombel kelas: ${updatedClass.name}.`);

    try {
      await setDoc(doc(db, 'classes', updatedClass.id), updatedClass);
    } catch (err) {
      console.error('Update class error:', err);
    }
  };

  const deleteClass = async (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    addAuditLog('HAPUS_ROMBEL', 'Rombel', `Menghapus rombel kelas: ${cls?.name || classId}.`);

    try {
      await deleteDoc(doc(db, 'classes', classId));
    } catch (err) {
      console.error('Delete class error:', err);
    }
  };

  // Subject / Mata Pelajaran Operations
  const addSubject = async (newSubData: Omit<Subject, 'id'>) => {
    const id = newSubData.code.toLowerCase().replace(/[^a-z0-9]/g, '_') || `sub_${Date.now()}`;
    const newSubject: Subject = { ...newSubData, id };
    setSubjects((prev) => [...prev, newSubject].sort((a, b) => a.orderIndex - b.orderIndex));
    addAuditLog(
      'TAMBAH_MAPEL',
      'Mata Pelajaran',
      `Menambahkan mata pelajaran: ${newSubject.name} (${newSubject.code}).`
    );

    try {
      await setDoc(doc(db, 'subjects', id), newSubject);
    } catch (err) {
      console.error('Add subject error:', err);
    }
  };

  const updateSubject = async (updatedSubject: Subject) => {
    setSubjects((prev) =>
      prev
        .map((s) => (s.id === updatedSubject.id ? updatedSubject : s))
        .sort((a, b) => a.orderIndex - b.orderIndex)
    );
    addAuditLog('UPDATE_MAPEL', 'Mata Pelajaran', `Memperbarui mata pelajaran: ${updatedSubject.name}.`);

    try {
      await setDoc(doc(db, 'subjects', updatedSubject.id), updatedSubject);
    } catch (err) {
      console.error('Update subject error:', err);
    }
  };

  const deleteSubject = async (subjectId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    addAuditLog('HAPUS_MAPEL', 'Mata Pelajaran', `Menghapus mata pelajaran: ${sub?.name || subjectId}.`);

    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
    } catch (err) {
      console.error('Delete subject error:', err);
    }
  };

  // User Management Operations
  const addUser = async (userData: Omit<User, 'id'>) => {
    const id = `user_${Date.now()}`;
    const newUser: User = { ...userData, id, createdAt: new Date().toISOString() };
    setUsers((prev) => [...prev, newUser]);
    if (newUser.classAssigned) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === newUser.classAssigned
            ? { ...c, homeroomTeacherName: newUser.name, homeroomTeacherId: newUser.id }
            : c
        )
      );
    }
    addAuditLog('TAMBAH_AKUN', 'Pengguna', `Menambahkan akun guru/wali: ${newUser.name}.`);

    try {
      await setDoc(doc(db, 'users', id), newUser);
    } catch (err) {
      console.error('Add user error:', err);
    }
  };

  const updateUser = async (user: User) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    if (currentUser?.id === user.id) {
      setCurrentUser(user);
    }
    if (user.classAssigned) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === user.classAssigned
            ? { ...c, homeroomTeacherName: user.name, homeroomTeacherId: user.id }
            : c
        )
      );
    }
    addAuditLog('UPDATE_AKUN', 'Pengguna', `Memperbarui akun pengguna: ${user.name}.`);

    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('HAPUS_AKUN', 'Pengguna', `Menghapus akun: ${target?.name || userId}.`);

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  // Calculate Leger matrix
  const getLegerData = (classId: string): LegerRow[] => {
    const classStudents = students.filter((s) => s.classId === classId);

    const rows: Omit<LegerRow, 'rank'>[] = classStudents.map((std) => {
      const studentGrades = grades.filter(
        (g) =>
          g.studentId === std.id &&
          g.academicYear === activeAcademicYear &&
          g.semester === activeSemester
      );

      const gradeMap: Record<string, number> = {};
      let total = 0;
      let count = 0;

      subjects.forEach((sub) => {
        const found = studentGrades.find((g) => g.subjectId === sub.id);
        if (found) {
          gradeMap[sub.id] = found.stsScore;
          total += found.stsScore;
          count++;
        }
      });

      const avg = count > 0 ? Number((total / count).toFixed(1)) : 0;
      const sick = std.sick || 0;
      const permitted = std.permitted || 0;
      const absent = std.absent || 0;
      const totalAbsent = sick + permitted + absent;

      return {
        student: std,
        grades: gradeMap,
        totalScore: total,
        averageScore: avg,
        sick,
        permitted,
        absent,
        totalAbsent,
      };
    });

    // Sort by average descending to determine rank
    const sorted = [...rows].sort((a, b) => b.averageScore - a.averageScore);
    const withRank: LegerRow[] = sorted.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

    return withRank;
  };

  const resetToInitialData = () => {
    localStorage.clear();
    setSchoolProfile(INITIAL_SCHOOL_PROFILE);
    setStudents(INITIAL_STUDENTS);
    setClasses(INITIAL_CLASSES);
    setSubjects(INITIAL_SUBJECTS);
    setGrades(generateInitialGrades());
    setUsers(INITIAL_USERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCurrentUser(INITIAL_USERS[0]);
    addAuditLog('RESET_DATA', 'Sistem', 'Data e-Rapor berhasil diatur ulang ke data default awal (12 Rombel).');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        schoolProfile,
        students,
        classes,
        subjects,
        grades,
        auditLogs,
        activeAcademicYear,
        activeSemester,
        selectedClassId,
        isOnline,
        isSyncing,
        users,
        firebaseUser,
        lastSyncTime,
        login,
        loginWithGoogle,
        logout,
        switchUser,
        setSelectedClassId,
        setAcademicPeriod,
        updateSchoolProfile,
        saveGrade,
        saveBatchGrades,
        updateStudent,
        updateBatchStudents,
        addStudent,
        deleteStudent,
        clearSampleStudents,
        importDapodikStudents,
        addClass,
        updateClass,
        deleteClass,
        addSubject,
        updateSubject,
        deleteSubject,
        addUser,
        updateUser,
        deleteUser,
        addAuditLog,
        getLegerData,
        resetToInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
