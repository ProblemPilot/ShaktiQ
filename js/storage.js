/**
 * ShaktiQ Storage & Persistence Engine
 * Modular Architecture (Feature 3.2)
 * Manages LocalStorage, IndexedDB v3, Mistake Register, Aspirant Profiles & Test Attempts
 */

const STORAGE_KEY_ATTEMPTS = "shaktiq_test_attempts_v1";
const STORAGE_KEY_MISTAKES = "shaktiq_mistake_register_v1";

function getCurrentAspirant() {
      try {
        const raw = localStorage.getItem('pwa_current_aspirant');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.email || parsed.phone) && parsed.name) {
          if (!parsed.district) parsed.district = 'Patna';
          return parsed;
        }
        return null;
      } catch (e) {
        return null;
      }
    }

    function getAllTestAttempts() {
      try {
        const raw = localStorage.getItem('pwa_test_attempts');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function getAllAspirants() {
      try {
        const raw = localStorage.getItem('pwa_all_aspirants');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

function getTestAttemptsForTest(testIdOrTitle, studentEmail) {
      const allAttempts = getAllTestAttempts();
      const current = getCurrentAspirant();
      const email = (studentEmail || (current ? current.email : '') || '').toLowerCase().trim();
      return allAttempts.filter(a => {
        const matchesEmail = !email || (a.studentEmail || '').toLowerCase().trim() === email;
        const matchesTest = (a.testId && a.testId === testIdOrTitle) || 
                            (a.examTitle && testIdOrTitle && a.examTitle.toLowerCase().trim() === String(testIdOrTitle).toLowerCase().trim());
        return matchesEmail && matchesTest;
      });
    }

function getStudentStoragePrefix() {
      const user = getCurrentAspirant();
      if (user && user.email) {
        return 'shaktiq_usr_' + user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      return 'shaktiq_usr_default';
    }

    function getMistakeRegisterKey() {
      const prefix = getStudentStoragePrefix();
      return prefix + '_mistakes';
    }

    function loadMistakeRegister() {
      const key = getMistakeRegisterKey();
      try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) || {};
        const legacy = localStorage.getItem(STORAGE_KEY_MISTAKES);
        if (legacy) {
          const parsed = JSON.parse(legacy) || {};
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
      } catch (e) {}
      return {};
    }

    function saveMistakeRegister(register) {
      const key = getMistakeRegisterKey();
      try {
        localStorage.setItem(key, JSON.stringify(register));
        localStorage.setItem(STORAGE_KEY_MISTAKES, JSON.stringify(register));
      } catch (e) {}
      if (typeof updateMistakeCountBadge === "function") updateMistakeCountBadge();
    }

    function handlePracticeMistakeRegister(qid, opt) {
      const all = getAllQuestions();
      const q = all.find(item => item.id === qid);
      if (!q) return;

      const reg = loadMistakeRegister();
      const isCorrect = (opt === q.ans);

      if (reg[qid]) {
        if (isCorrect) {
          reg[qid].consecutiveCorrect = (reg[qid].consecutiveCorrect || 0) + 1;
          reg[qid].lastAttempted = Date.now();
          if (reg[qid].consecutiveCorrect >= 2) {
            delete reg[qid];
            saveMistakeRegister(reg);
            showToast("🎉 Mastered! Solved correctly twice in a row - cleared from Mistake Register!", "✨");
          } else {
            saveMistakeRegister(reg);
            showToast("✓ Correct! (1/2 consecutive correct answers to clear from register)", "🎯");
          }
        } else if (opt && opt !== 'E') {
          reg[qid].wrongCount = (reg[qid].wrongCount || 0) + 1;
          reg[qid].consecutiveCorrect = 0;
          reg[qid].lastAttempted = Date.now();
          reg[qid].lastWrongOpt = opt;
          saveMistakeRegister(reg);
          showToast("❌ Incorrect. Mistake streak reset to 0/2.", "⚠");
        }
      } else {
        if (opt && opt !== 'E' && !isCorrect) {
          reg[qid] = {
            id: qid,
            wrongCount: 1,
            consecutiveCorrect: 0,
            lastAttempted: Date.now(),
            lastWrongOpt: opt,
            source: 'practice'
          };
          saveMistakeRegister(reg);
          showToast("Added to My Mistake Register for revision.", "📌");
        }
      }
    }

const PrepBackendEngine = {
      dbName: 'PrepWithAnkit_BackendDB_v2',
      dbVersion: 3,
      db: null,
      isReady: false,

      init: function() {
        return new Promise((resolve) => {
          try {
            if (!window.indexedDB) {
              this.isReady = true;
              resolve(false);
              return;
            }

            const request = window.indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('students')) {
                const sStore = db.createObjectStore('students', { keyPath: 'email' });
                sStore.createIndex('by_lastActive', 'lastActive', { unique: false });
                sStore.createIndex('by_registeredAt', 'registeredAt', { unique: false });
              }
              if (!db.objectStoreNames.contains('test_attempts')) {
                const aStore = db.createObjectStore('test_attempts', { keyPath: 'attemptId' });
                aStore.createIndex('by_studentEmail', 'studentEmail', { unique: false });
                aStore.createIndex('by_examTitle', 'examTitle', { unique: false });
                aStore.createIndex('by_timestamp', 'timestamp', { unique: false });
              }
              if (!db.objectStoreNames.contains('test_drafts')) {
                db.createObjectStore('test_drafts', { keyPath: 'draftKey' });
              }
              if (!db.objectStoreNames.contains('question_bookmarks')) {
                const bStore = db.createObjectStore('question_bookmarks', { keyPath: 'id' });
                bStore.createIndex('by_studentEmail', 'studentEmail', { unique: false });
              }
              if (!db.objectStoreNames.contains('cached_questions')) {
                db.createObjectStore('cached_questions', { keyPath: 'key' });
              }
            };

            request.onsuccess = (event) => {
              this.db = event.target.result;
              this.isReady = true;
              resolve(true);
            };

            request.onerror = () => {
              this.isReady = true;
              resolve(false);
            };
          } catch (e) {
            this.isReady = true;
            resolve(false);
          }
        });
      },

      auth: {
        getCurrentUser: function() {
          return getCurrentAspirant();
        },

        saveUserSession: async function(studentData) {
          if (!studentData || !studentData.email) return null;
          const email = studentData.email.trim().toLowerCase();
          const name = (studentData.name || '').trim();
          const firstName = name.split(' ')[0] || 'Aspirant';

          const record = {
            id: studentData.id || ('asp_' + Date.now()),
            email: email,
            name: name,
            firstName: firstName,
            phone: studentData.phone || '',
            targetExam: studentData.targetExam || '72nd/73rd BPSC CCE',
            district: studentData.district || 'Patna',
            consentAccepted: !!studentData.consentAccepted,
            consentVersion: studentData.consentVersion || 'DPDP-2023-v1',
            consentTimestamp: studentData.consentTimestamp || new Date().toISOString(),
            registeredAt: studentData.registeredAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            lastActive: new Date().toISOString(),
            testsAttempted: studentData.testsAttempted || 0,
            pyqCount: studentData.pyqCount || 0
          };

          // 1. Always save in localStorage (Guaranteed Fallback)
          try {
            localStorage.setItem('pwa_current_aspirant', JSON.stringify(record));
            const all = PrepBackendEngine.auth.getAllLocalAspirants();
            const idx = all.findIndex(a => a.email.toLowerCase() === email);
            if (idx !== -1) {
              all[idx] = Object.assign({}, all[idx], record);
            } else {
              all.unshift(record);
            }
            localStorage.setItem('pwa_all_aspirants', JSON.stringify(all));
          } catch (e) {}

          // 2. Save in IndexedDB
          if (PrepBackendEngine.db) {
            try {
              const tx = PrepBackendEngine.db.transaction('students', 'readwrite');
              tx.objectStore('students').put(record);
            } catch (err) {}
          }

          return record;
        },

        clearUserSession: function() {
          try {
            localStorage.removeItem('pwa_current_aspirant');
          } catch (e) {}
        },

        getAllLocalAspirants: function() {
          try {
            const raw = localStorage.getItem('pwa_all_aspirants');
            return raw ? JSON.parse(raw) : [];
          } catch (e) {
            return [];
          }
        }
      },

      tests: {
        saveAttempt: async function(attemptRecord) {
          if (!attemptRecord) return;
          attemptRecord.attemptId = attemptRecord.attemptId || ('att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
          attemptRecord.timestamp = attemptRecord.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

          try {
            const raw = localStorage.getItem('pwa_test_attempts');
            const attempts = raw ? JSON.parse(raw) : [];
            attempts.unshift(attemptRecord);
            localStorage.setItem('pwa_test_attempts', JSON.stringify(attempts.slice(0, 25)));
          } catch (e) {}

          if (PrepBackendEngine.db) {
            try {
              const tx = PrepBackendEngine.db.transaction('test_attempts', 'readwrite');
              tx.objectStore('test_attempts').put(attemptRecord);
            } catch (e) {}
          }

          if (attemptRecord.examTitle) {
            PrepBackendEngine.drafts.clear(attemptRecord.examTitle);
          }

          return attemptRecord;
        },

        getAttemptsForStudent: async function(email) {
          if (!email) return [];
          const cleanEmail = email.trim().toLowerCase();

          if (PrepBackendEngine.db) {
            try {
              return await new Promise((resolve) => {
                const tx = PrepBackendEngine.db.transaction('test_attempts', 'readonly');
                const store = tx.objectStore('test_attempts');
                const index = store.index('by_studentEmail');
                const req = index.getAll(cleanEmail);
                req.onsuccess = () => {
                  const list = req.result || [];
                  list.sort((a, b) => (b.attemptId > a.attemptId ? 1 : -1));
                  resolve(list);
                };
                req.onerror = () => {
                  resolve(PrepBackendEngine.tests.getLocalAttemptsForStudent(cleanEmail));
                };
              });
            } catch (e) {}
          }
          return PrepBackendEngine.tests.getLocalAttemptsForStudent(cleanEmail);
        },

        getLocalAttemptsForStudent: function(cleanEmail) {
          try {
            const raw = localStorage.getItem('pwa_test_attempts');
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(a => (a.studentEmail || '').toLowerCase() === cleanEmail);
          } catch (e) {
            return [];
          }
        }
      },

      drafts: {
        save: function(examTitle, answers, marked, remainingSecs) {
          if (!examTitle) return;
          const key = 'draft_' + examTitle.replace(/[^a-zA-Z0-9]/g, '_');
          const draft = {
            examTitle: examTitle,
            answers: answers || {},
            marked: marked || {},
            remainingSecs: remainingSecs || 7200,
            savedAt: Date.now()
          };
          try {
            localStorage.setItem(key, JSON.stringify(draft));
          } catch (e) {}
        },
        get: function(examTitle) {
          if (!examTitle) return null;
          const key = 'draft_' + examTitle.replace(/[^a-zA-Z0-9]/g, '_');
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            return null;
          }
        },
        clear: function(examTitle) {
          if (!examTitle) return;
          const key = 'draft_' + examTitle.replace(/[^a-zA-Z0-9]/g, '_');
          try {
            localStorage.removeItem(key);
          } catch (e) {}
        }
      },

      questions: {
        save: function(questionsList) {
          if (!Array.isArray(questionsList) || questionsList.length === 0) return Promise.resolve(false);
          return new Promise((resolve) => {
            try {
              if (PrepBackendEngine.db && PrepBackendEngine.db.objectStoreNames.contains('cached_questions')) {
                const tx = PrepBackendEngine.db.transaction('cached_questions', 'readwrite');
                const store = tx.objectStore('cached_questions');
                store.put({ key: 'bank_v14', data: questionsList, count: questionsList.length, savedAt: Date.now() });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
              } else {
                resolve(false);
              }
            } catch (e) {
              resolve(false);
            }
          });
        },
        load: function() {
          return new Promise((resolve) => {
            try {
              if (PrepBackendEngine.db && PrepBackendEngine.db.objectStoreNames.contains('cached_questions')) {
                const tx = PrepBackendEngine.db.transaction('cached_questions', 'readonly');
                const store = tx.objectStore('cached_questions');
                const req = store.get('bank_v14');
                req.onsuccess = () => {
                  if (req.result && Array.isArray(req.result.data) && req.result.data.length > 0) {
                    resolve(req.result.data);
                  } else {
                    resolve(null);
                  }
                };
                req.onerror = () => resolve(null);
              } else {
                resolve(null);
              }
            } catch (e) {
              resolve(null);
            }
          });
        }
      },

      exportStudentDataJSON: async function() {
        return null;
      }
    };

// Global exports
if (typeof window !== 'undefined') {
  window.getCurrentAspirant = getCurrentAspirant;
  window.getAllAspirants = getAllAspirants;
  window.getAllTestAttempts = getAllTestAttempts;
  window.getTestAttemptsForTest = getTestAttemptsForTest;
  window.getStudentStoragePrefix = getStudentStoragePrefix;
  window.getMistakeRegisterKey = getMistakeRegisterKey;
  window.loadMistakeRegister = loadMistakeRegister;
  window.saveMistakeRegister = saveMistakeRegister;
  window.handlePracticeMistakeRegister = handlePracticeMistakeRegister;
  window.PrepBackendEngine = PrepBackendEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCurrentAspirant,
    getAllAspirants,
    getAllTestAttempts,
    getTestAttemptsForTest,
    getStudentStoragePrefix,
    getMistakeRegisterKey,
    loadMistakeRegister,
    saveMistakeRegister,
    handlePracticeMistakeRegister,
    PrepBackendEngine
  };
}
