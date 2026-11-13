/**
 * ShaktiQ Mock Test Engine, Virtual OMR Mode & Analytics
 * Modular Architecture (Feature 3.1 & 3.2)
 * Manages test cards, mock execution, OMR bubbling, scoring, cut-off meter, scorecard canvas & solutions review
 */

let currentMockQuestions = [];
    let currentMockIndex = 0;
    let mockUserAnswers = {}; // { qIndex: selectedLetter }
    window.mockUserAnswers = mockUserAnswers;
    let mockMarkedForReview = {}; // { qIndex: true }
    let mockTimerInterval = null;
    let mockTimeRemaining = 7200; // seconds
    let activeMockTest = null;

        // getTestAttemptsForTest loaded from ./js/storage.js


    function renderTestSeriesCards(category = 'ALL') {
      const grid = document.getElementById('testseries-grid');
      if (!grid) return;

      const isDrill = (category === 'SPEED_DRILLS');
      const filtered = isDrill
        ? SPEED_DRILLS_CONFIG
        : CURATED_TESTS.filter(t => category === 'ALL' || t.category === category);

      let cardsHtml = '';
      if (isDrill) {
        cardsHtml += `
          <div class="col-span-full bg-linear-to-r from-[#10402D] to-[#1E5638] text-white p-5 sm:p-6 rounded-3xl shadow-sm space-y-2 mb-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF6D6] text-[#785600] flex items-center gap-1">
                <i data-lucide="zap" class="w-3.5 h-3.5 fill-current"></i> 10-Minute Rapid Drills
              </span>
              <span class="text-xs text-white/80 font-medium">15 Questions • 10 Minutes • Official BPSC Pattern</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-display font-extrabold text-white">Subject-Wise 10-Minute Speed Drills</h2>
            <p class="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              Sharpen your time management and accuracy under pressure. Built 100% strictly from verified BPSC previous year questions with official negative marking (+1.0 correct, -1/3 wrong, 0 safe-skip, -1/3 blank).
            </p>
          </div>
        `;
      } else if (category === 'BSSC') {
        const isHi = (typeof ShaktiQBilingualEngine !== 'undefined' && ShaktiQBilingualEngine.currentLang === 'hi');
        cardsHtml += `
          <div id="bssc-pack-header" class="col-span-full bg-linear-to-r from-[#10402D] to-[#1E5638] text-white p-5 sm:p-6 rounded-3xl shadow-sm space-y-2 mb-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF6D6] text-[#785600] flex items-center gap-1">
                <i data-lucide="layers" class="w-3.5 h-3.5"></i> ${isHi ? 'बीएसएससी सीजीएल 4 • जल्द आ रहा है' : 'BSSC CGL 4 • Coming Soon'}
              </span>
              <span class="text-xs text-white/80 font-medium">${isHi ? 'बीएसएससी सीजीएल एवं इंटर स्तर • +4.0 / -1.0 अंकन • 4 विकल्प (A-D)' : 'BSSC CGL & Inter Level • +4.0 / -1.0 Pattern • 4 Options (A-D)'}</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-display font-extrabold text-white">${isHi ? 'बिहार कर्मचारी चयन आयोग (BSSC CGL 4) • जल्द आ रहा है' : 'Bihar Staff Selection Commission (BSSC CGL 4) • Coming Soon'}</h2>
            <p class="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              ${isHi 
                ? 'मॉड्यूलर परीक्षा पैक संरचना तैयार है। शक्ति-क्यू सख्त शैक्षणिक शुचिता का पालन करता है: कोई भी काल्पनिक प्रश्न नहीं बनाया गया है। आधिकारिक प्रश्न पत्र जोड़ते ही मॉक टेस्ट स्वतः सक्रिय हो जाएंगे।' 
                : 'Clean modular exam pack structure configured and waiting for official question papers. ShaktiQ follows strict academic integrity: zero questions are invented or hallucinated. Drop official question data files into the repository to instantly unlock full timed mock tests.'}
            </p>
          </div>
        `;

        if (filtered.length === 0) {
          cardsHtml += `
            <div id="bssc-placeholder-card" class="col-span-full bg-white border-2 border-dashed border-[#C6DEC0] rounded-3xl p-6 sm:p-8 text-center space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-[#EBF3E6] text-[#10402D] mx-auto flex items-center justify-center font-bold shadow-2xs">
                <i data-lucide="package-plus" class="w-7 h-7"></i>
              </div>
              <div class="max-w-md mx-auto space-y-1.5">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF6D6] text-[#785600] border border-[#F5DF8B]">
                  <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                  <span>${isHi ? 'सामग्री संकलन जारी • जल्द आ रहा है' : 'Material In Preparation • Coming Soon'}</span>
                </div>
                <h3 class="text-lg sm:text-xl font-display font-extrabold text-[#111C15]">
                  ${isHi ? 'बीएसएससी सीजीएल 4 मॉक टेस्ट पैक (जल्द उपलब्ध)' : 'BSSC CGL 4 Mock Test Pack (Coming Soon)'}
                </h3>
                <p class="text-xs sm:text-sm text-[#526056] leading-relaxed">
                  ${isHi 
                    ? 'डेटा संरचना और अंकन प्रणाली (+4 सही, -1 गलत, 4 विकल्प) पूरी तरह से तैयार है। आधिकारिक प्रश्न रिपो में जोड़ते ही या <code class="px-1.5 py-0.5 rounded bg-[#F0F4F1] font-mono text-[11px] text-[#10402D]">SHAKTIQ_EXAM_PACKS.dropInPackData()</code> कॉल करते ही टेस्ट सक्रिय हो जाएंगे।'
                    : 'Data structure and scoring engine (+4 correct, -1 wrong, 4 options) are fully implemented. New packs can be activated seamlessly by calling <code class="px-1.5 py-0.5 rounded bg-[#F0F4F1] font-mono text-[11px] text-[#10402D]">SHAKTIQ_EXAM_PACKS.dropInPackData()</code> or placing official question JSON into the repository.'}
                </p>
              </div>
              
              <div class="inline-grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto py-3 px-4 rounded-2xl bg-[#F8FAF7] border border-[#E5ECE6] text-center text-xs">
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">${isHi ? 'प्रारूप प्रश्न' : 'TARGET QS'}</span>
                  <strong class="text-[#111C15] font-bold">${isHi ? '150 प्रश्न' : '150 Questions'}</strong>
                </div>
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">${isHi ? 'सही उत्तर' : 'CORRECT'}</span>
                  <strong class="text-[#10402D] font-bold">+4.0 Marks</strong>
                </div>
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">${isHi ? 'नेगेटिव' : 'NEGATIVE'}</span>
                  <strong class="text-rose-600 font-bold">-1.0 Mark</strong>
                </div>
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">${isHi ? 'विकल्प' : 'OPTIONS'}</span>
                  <strong class="text-[#111C15] font-bold">${isHi ? '4 विकल्प (A-D)' : '4 Options (A-D)'}</strong>
                </div>
              </div>

              <div class="pt-2">
                <button type="button" disabled class="px-5 py-2.5 rounded-xl bg-[#F0F4F1] text-[#526056] text-xs font-bold border border-[#DCE6DF] cursor-not-allowed inline-flex items-center gap-2">
                  <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                  <span>${isHi ? 'आधिकारिक प्रश्न पत्र जुड़ने तक सुरक्षित लॉक' : 'Pack Locked Until Official Papers Added'}</span>
                </button>
              </div>
            </div>
          `;
        }
      }

      filtered.forEach(test => {
        const attempts = getTestAttemptsForTest(test.id);
        const attemptCount = attempts.length;
        let bestScore = null;
        let latestAttempt = attemptCount > 0 ? attempts[0] : null;
        attempts.forEach(a => {
          const s = parseFloat(a.score);
          if (!isNaN(s) && (bestScore === null || s > bestScore)) bestScore = s;
        });

        cardsHtml += `
          <div class="bg-white border ${test.isSpeedDrill ? 'border-[#C6DEC0] hover:border-[#10402D]' : 'border-[#DCE6DF] hover:border-[#10402D]'} rounded-3xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition-all group">
            <div class="space-y-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                ${attemptCount > 0 ? `
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0] flex items-center gap-1">
                    <i data-lucide="check-circle-2" class="w-3 h-3 text-[#10402D]"></i>
                    Attempted: ${attemptCount} ${attemptCount === 1 ? 'time' : 'times'}
                  </span>
                ` : `
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${test.isSpeedDrill ? 'bg-[#FEF6D6] text-[#785600] border border-[#F5DF8B]' : 'bg-[#F6F7F2] text-[#223127] border border-[#DCE6DF]'} flex items-center gap-1">
                    ${test.isSpeedDrill ? '<i data-lucide="zap" class="w-3 h-3"></i>' : ''}
                    ${escapeHtml(test.statusLabel || (test.isSpeedDrill ? "⚡ 10-Min Speed Drill" : "100% Complete Full Paper"))}
                  </span>
                `}
                <span class="text-xs font-bold text-[#526056] flex items-center gap-1">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-[#10402D]"></i>
                  ${test.timeMins} Mins
                </span>
              </div>

              <div>
                <h3 class="font-display font-extrabold text-lg text-[#111C15] group-hover:text-[#10402D] transition">
                  ${escapeHtml(test.title)}
                </h3>
                <p class="text-xs text-[#526056] mt-1.5 leading-relaxed">
                  ${escapeHtml(test.desc)}
                </p>
              </div>

              <div class="grid grid-cols-3 gap-2 py-3 px-2 rounded-2xl bg-[#F8FAF7] border border-[#E5ECE6] text-center text-xs">
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">QUESTIONS</span>
                  <strong class="text-[#111C15] font-bold">${test.questionsCount}</strong>
                </div>
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">MARKS</span>
                  <strong class="text-[#111C15] font-bold">${test.marks}</strong>
                </div>
                <div>
                  <span class="text-[#526056] block text-[10px] font-semibold">NEGATIVE</span>
                  <strong class="text-rose-600 font-bold">-1/3</strong>
                </div>
              </div>

              ${attemptCount > 0 ? `
                <!-- Past Attempt History Box -->
                <div class="p-3.5 rounded-2xl bg-[#EBF3E6]/60 border border-[#C6DEC0] text-xs space-y-1.5">
                  <div class="flex items-center justify-between font-bold text-[#10402D]">
                    <span>Best Score: <strong>${bestScore !== null ? bestScore.toFixed(2) : '0.00'} / ${test.marks}</strong></span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#10402D] text-white">Latest: ${latestAttempt ? latestAttempt.score : '0.00'}</span>
                  </div>
                  <div class="pt-1.5 border-t border-[#C6DEC0]/50 space-y-1">
                    ${attempts.slice(0, 2).map((att, idx) => `
                      <div class="flex items-center justify-between text-[11px] text-[#223127]">
                        <span>Attempt #${attempts.length - idx}: <strong class="text-[#10402D]">${att.score} Marks</strong> (+${att.correct || 0}/-${att.wrong || 0})</span>
                        <span class="text-[#526056] text-[10px]">${att.timestamp ? att.timestamp.split(',')[0] : ''}</span>
                      </div>
                    `).join('')}
                    ${attempts.length > 2 ? `<div class="text-[10px] text-[#526056] text-right font-medium">+${attempts.length - 2} earlier attempts logged</div>` : ''}
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="pt-5">
              <button type="button" onclick="startMockTest('${escapeHtml(test.id)}')" class="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-display font-bold text-xs sm:text-sm text-white bg-[#10402D] hover:bg-[#17593F] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer">
                <i data-lucide="${attemptCount > 0 ? 'rotate-ccw' : (test.isSpeedDrill ? 'zap' : 'play')}" class="w-4 h-4 fill-current"></i>
                <span>${attemptCount > 0 ? (test.isSpeedDrill ? 'Re-Attempt Speed Drill' : 'Re-Attempt Mock Test') : (test.isSpeedDrill ? 'Start 10-Min Speed Drill' : 'Start Mock Test')}</span>
              </button>
            </div>
          </div>
        `;
      });

      grid.innerHTML = cardsHtml;
      initIcons();
    }

    let currentTestSeriesFilter = 'ALL';
    function filterTestSeries(cat) {
      currentTestSeriesFilter = cat || 'ALL';
      document.querySelectorAll('.ts-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-ts-filter') === cat) {
          btn.className = 'ts-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#10402D] text-white shadow-sm border border-[#10402D] cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5';
        } else {
          btn.className = 'ts-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#223127] hover:bg-[#EBF3E6] border border-[#DCE6DF] cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5';
        }
      });
      renderTestSeriesCards(cat);
    }

    
    // ========================================================================
    // PERSONALIZED STUDENT PREP & ACCURACY ANALYTICS ENGINE
    // Combines Practice PYQ Bank + Full-Length Mock Test Attempts
    // ========================================================================

    function getStudentAnalyticsData() {
      const user = getCurrentAspirant() || {
        name: "Aspirant",
        email: "aspirant@shaktiq.com",
        district: "Patna",
        targetExam: "72nd/73rd BPSC CCE"
      };

      const allQs = getAllQuestions().filter(q => !isMainsDescriptiveQuestion(q));
      const allMap = {};
      allQs.forEach(q => { allMap[q.id] = q; });

      const practiceAttempts = userAttempts || {};
      const studentEmail = (user.email || '').toLowerCase().trim();
      const allMockAttempts = getAllTestAttempts();
      const studentMocks = allMockAttempts.filter(a => !studentEmail || (a.studentEmail || '').toLowerCase().trim() === studentEmail);

      const subjectStats = {};
      SUBJECT_ORDER.forEach(s => {
        subjectStats[s] = {
          subject: s,
          totalBank: 0,
          practiceAttempted: 0,
          practiceCorrect: 0,
          practiceWrong: 0,
          mockAttempted: 0,
          mockCorrect: 0,
          mockWrong: 0,
          uniqueAttemptedQids: new Set(),
          uniqueCorrectQids: new Set()
        };
      });

      allQs.forEach(q => {
        if (subjectStats[q.subject]) {
          subjectStats[q.subject].totalBank += 1;
        }
      });

      // Aggregate practice attempts
      Object.keys(practiceAttempts).forEach(qid => {
        const q = allMap[qid];
        if (!q || !subjectStats[q.subject]) return;
        const choice = practiceAttempts[qid];
        if (choice === 'E' && q.options && q.options[4] && q.options[4].toLowerCase().includes('not attempted')) {
          return;
        }
        subjectStats[q.subject].practiceAttempted += 1;
        subjectStats[q.subject].uniqueAttemptedQids.add(qid);
        if (choice === q.ans) {
          subjectStats[q.subject].practiceCorrect += 1;
          subjectStats[q.subject].uniqueCorrectQids.add(qid);
        } else {
          subjectStats[q.subject].practiceWrong += 1;
        }
      });

      // Aggregate mock test attempts
      studentMocks.forEach(m => {
        if (Array.isArray(m.questionResults) && m.questionResults.length > 0) {
          m.questionResults.forEach(qr => {
            if (!qr.subject || !subjectStats[qr.subject]) return;
            if (!qr.userOpt || qr.userOpt === 'E') return;
            subjectStats[qr.subject].mockAttempted += 1;
            subjectStats[qr.subject].uniqueAttemptedQids.add(qr.id);
            if (qr.isCorrect) {
              subjectStats[qr.subject].mockCorrect += 1;
              subjectStats[qr.subject].uniqueCorrectQids.add(qr.id);
            } else {
              subjectStats[qr.subject].mockWrong += 1;
            }
          });
        }
      });

      // Compute accuracy and progress per subject
      const subjectList = SUBJECT_ORDER.map(s => {
        const stat = subjectStats[s];
        const totalBank = stat.totalBank;
        const attemptedUnique = stat.uniqueAttemptedQids.size;
        const unattempted = Math.max(0, totalBank - attemptedUnique);
        const correctUnique = stat.uniqueCorrectQids.size;
        const accuracy = attemptedUnique > 0 ? Math.round((correctUnique / attemptedUnique) * 100) : 0;
        const completionPct = totalBank > 0 ? Math.round((attemptedUnique / totalBank) * 100) : 0;

        return {
          subject: s,
          totalBank: totalBank,
          attempted: attemptedUnique,
          unattempted: unattempted,
          correct: correctUnique,
          accuracy: accuracy,
          completionPct: completionPct
        };
      });

      const attemptedSubjects = subjectList.filter(s => s.attempted > 0);

      const strongestSubjects = [...attemptedSubjects]
        .sort((a, b) => b.accuracy - a.accuracy || b.attempted - a.attempted)
        .slice(0, 4);

      const weakestSubjects = [...subjectList]
        .sort((a, b) => {
          if (a.attempted > 0 && b.attempted > 0) return a.accuracy - b.accuracy;
          if (a.attempted > 0) return -1;
          if (b.attempted > 0) return 1;
          return b.unattempted - a.unattempted;
        })
        .slice(0, 4);

      const totalAttemptedPYQs = Object.keys(practiceAttempts).length;
      const totalBankQuestions = allQs.length;
      const totalUnattemptedPYQs = Math.max(0, totalBankQuestions - totalAttemptedPYQs);
      const totalMockTestsTaken = studentMocks.length;

      let bestMockScore = null;
      studentMocks.forEach(m => {
        const sc = parseFloat(m.score);
        if (!isNaN(sc) && (bestMockScore === null || sc > bestMockScore)) {
          bestMockScore = sc;
        }
      });

      let allTestedCount = 0;
      let allCorrectCount = 0;
      subjectList.forEach(s => {
        allTestedCount += s.attempted;
        allCorrectCount += s.correct;
      });
      const overallAccuracy = allTestedCount > 0 ? Math.round((allCorrectCount / allTestedCount) * 100) : 0;

      return {
        student: user,
        totalBankQuestions,
        totalAttemptedPYQs,
        totalUnattemptedPYQs,
        totalMockTestsTaken,
        bestMockScore: bestMockScore !== null ? bestMockScore.toFixed(2) : '0.00',
        allTestedCount,
        overallAccuracy,
        subjectList,
        strongestSubjects,
        weakestSubjects,
        studentMocks
      };
    }

    function renderStudentAnalyticsView() {
      const container = document.getElementById('student-analytics-container');
      if (!container) return;

      const data = getStudentAnalyticsData();
      const student = data.student;

      let html = `
        <!-- Personalized Aspirant Header -->
        <div class="bg-white rounded-3xl border border-[#DCE6DF] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0] flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-[#10402D] animate-pulse"></span>
                Personalized Study Profile
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-[#F6F7F2] text-[#223127] border border-[#DCE6DF]">
                📍 ${escapeHtml(student.district || 'Bihar')}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-[#F6F7F2] text-[#223127] border border-[#DCE6DF]">
                🎯 ${escapeHtml(student.targetExam || '72nd/73rd BPSC CCE')}
              </span>
            </div>
            <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-[#111C15]">
              ${escapeHtml(student.name || 'Aspirant')}'s Prep Hub
            </h2>
            <p class="text-xs sm:text-sm text-[#526056] leading-relaxed max-w-2xl">
              Real-time performance analytics combining your <strong>${data.totalAttemptedPYQs.toLocaleString()} practice PYQ attempts</strong> and <strong>${data.totalMockTestsTaken} full-length mock tests</strong>. Stored offline-first and synced to your personal profile.
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0 flex-wrap">
            <button type="button" onclick="openStudentProfileModal()" class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#10402D] bg-[#EBF3E6] hover:bg-[#DCE9D5] border border-[#C6DEC0] transition cursor-pointer">
              <i data-lucide="user" class="w-4 h-4 inline mr-1 text-[#10402D]"></i>
              Edit Profile
            </button>
            <button type="button" onclick="switchStudentAccount()" class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#223127] hover:text-[#10402D] bg-white hover:bg-[#F8FAF7] border border-[#DCE6DF] transition cursor-pointer">
              <i data-lucide="users" class="w-4 h-4 inline mr-1 text-[#526056]"></i>
              Switch Student
            </button>
          </div>
        </div>

        <!-- Overall Prep KPIs (4 Cards) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-[#DCE6DF] p-5 shadow-2xs">
            <span class="text-xs text-[#526056] font-semibold block">PYQs COMPLETED</span>
            <div class="font-display font-extrabold text-2xl sm:text-3xl text-[#10402D] mt-1">
              ${data.totalAttemptedPYQs.toLocaleString()}
              <span class="text-xs font-normal text-[#526056]">/ ${data.totalBankQuestions.toLocaleString()}</span>
            </div>
            <div class="text-[11px] font-bold text-[#785600] mt-1.5 flex items-center gap-1">
              <span>${data.totalUnattemptedPYQs.toLocaleString()} unattempted remaining</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-[#DCE6DF] p-5 shadow-2xs">
            <span class="text-xs text-[#526056] font-semibold block">MOCK TESTS TAKEN</span>
            <div class="font-display font-extrabold text-2xl sm:text-3xl text-[#10402D] mt-1">
              ${data.totalMockTestsTaken}
              <span class="text-xs font-normal text-[#526056]">/ 22 Tests</span>
            </div>
            <div class="text-[11px] font-bold text-[#10402D] mt-1.5">
              Best Score: ${data.bestMockScore} / 150
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-[#DCE6DF] p-5 shadow-2xs">
            <span class="text-xs text-[#526056] font-semibold block">COMBINED QUESTIONS TESTED</span>
            <div class="font-display font-extrabold text-2xl sm:text-3xl text-[#111C15] mt-1">
              ${data.allTestedCount.toLocaleString()}
            </div>
            <div class="text-[11px] text-[#526056] mt-1.5">
              Mock Tests + PYQ Bank Combined
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-[#DCE6DF] p-5 shadow-2xs">
            <span class="text-xs text-[#526056] font-semibold block">OVERALL ACCURACY RATE</span>
            <div class="font-display font-extrabold text-2xl sm:text-3xl ${data.overallAccuracy >= 70 ? 'text-[#10402D]' : (data.overallAccuracy >= 50 ? 'text-[#785600]' : 'text-rose-600')} mt-1">
              ${data.overallAccuracy}%
            </div>
            <div class="text-[11px] text-[#526056] mt-1.5">
              ${data.overallAccuracy >= 70 ? 'Strong accuracy grip' : (data.overallAccuracy > 0 ? 'Target: 75%+ for Prelims cutoff' : 'Start practicing to calculate')}
            </div>
          </div>
        </div>

        <!-- STRONGEST VS WEAKEST SUBJECTS (THE DUAL ENGINE) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- STRONGEST SUBJECTS CARD -->
          <div class="bg-white rounded-3xl border border-[#C6DEC0] p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3.5 border-b border-[#E5ECE6]">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#EBF3E6] flex items-center justify-center text-[#10402D] font-bold">
                  🌟
                </div>
                <div>
                  <h3 class="font-display font-extrabold text-base sm:text-lg text-[#111C15]">Your Strongest Subjects</h3>
                  <p class="text-xs text-[#526056]">Highest accuracy &amp; proven retention across tests</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBF3E6] text-[#10402D]">Scoring Pillars</span>
            </div>

            <div class="mt-4 space-y-3.5">
              ${data.strongestSubjects.length === 0 ? `
                <div class="p-6 text-center text-xs text-[#526056] bg-[#F8FAF7] rounded-2xl border border-[#DCE6DF]">
                  <p>No practice attempts recorded yet.</p>
                  <button type="button" onclick="openSubjectPractice('History')" class="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#10402D] hover:bg-[#17593F] transition cursor-pointer">
                    Start Practicing PYQs
                  </button>
                </div>
              ` : data.strongestSubjects.map(s => `
                <div class="p-4 rounded-2xl bg-[#F8FAF7] border border-[#DCE6DF] hover:border-[#10402D] transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-display font-extrabold text-sm text-[#111C15]">${escapeHtml(s.subject)}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]">
                      ${s.accuracy}% Accuracy
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-[#526056]">
                    <span>${s.attempted} of ${s.totalBank} Attempted (${s.unattempted} to go)</span>
                    <span class="font-semibold text-[#10402D]">${s.completionPct}% Covered</span>
                  </div>
                  <div class="w-full bg-[#E5ECE6] h-1.5 rounded-full overflow-hidden">
                    <div class="bg-[#10402D] h-full rounded-full" style="width: ${s.completionPct}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- WEAKEST SUBJECTS CARD (FOCUS AREAS) -->
          <div class="bg-white rounded-3xl border border-[#F5DF8B] p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3.5 border-b border-[#E5ECE6]">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#FEF6D6] flex items-center justify-center text-[#785600] font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 class="font-display font-extrabold text-base sm:text-lg text-[#111C15]">High-Yield Focus Areas (Weakest)</h3>
                  <p class="text-xs text-[#526056]">Subjects with lowest accuracy or highest unattempted gaps</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF6D6] text-[#785600]">Needs Revision</span>
            </div>

            <div class="mt-4 space-y-3.5">
              ${data.weakestSubjects.length === 0 ? `
                <div class="p-6 text-center text-xs text-[#526056] bg-[#F8FAF7] rounded-2xl border border-[#DCE6DF]">
                  All subjects covered with high accuracy! Keep practicing.
                </div>
              ` : data.weakestSubjects.map(s => `
                <div class="p-4 rounded-2xl bg-[#FFFDF5] border border-[#F5DF8B] hover:border-[#785600] transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-display font-extrabold text-sm text-[#111C15]">${escapeHtml(s.subject)}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold ${s.attempted > 0 ? (s.accuracy < 50 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-[#FEF6D6] text-[#785600] border border-[#F5DF8B]') : 'bg-gray-100 text-gray-700'}">
                      ${s.attempted > 0 ? `${s.accuracy}% Accuracy` : 'Not Started'}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-[#526056]">
                    <span><strong>${s.attempted}</strong> Attempted • <strong class="text-[#785600]">${s.unattempted} Unattempted</strong></span>
                    <span class="font-semibold text-[#111C15]">${s.totalBank} Total</span>
                  </div>
                  <div class="w-full bg-[#E5ECE6] h-1.5 rounded-full overflow-hidden">
                    <div class="bg-[#B45309] h-full rounded-full" style="width: ${s.completionPct}%;"></div>
                  </div>
                  <div class="pt-1 text-right">
                    <button type="button" onclick="openSubjectPractice('${escapeHtml(s.subject)}', 'unattempted')" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-[#10402D] hover:bg-[#17593F] transition cursor-pointer shadow-2xs">
                      <span>Solve ${s.unattempted} Unattempted Qs</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- FULL 11-SUBJECT MASTERY BREAKDOWN MATRIX -->
        <div class="bg-white rounded-3xl border border-[#DCE6DF] p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5ECE6]">
            <div>
              <h3 class="font-display font-extrabold text-lg text-[#111C15]">Complete 11-Subject Syllabus Breakdown</h3>
              <p class="text-xs text-[#526056]">Real-time attempted vs unattempted question distribution</p>
            </div>
            <button type="button" onclick="openSubjectPractice('ALL', 'unattempted')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-[#10402D] bg-[#EBF3E6] hover:bg-[#DCE9D5] border border-[#C6DEC0] transition cursor-pointer shrink-0">
              <span>Practice All Remaining (${data.totalUnattemptedPYQs.toLocaleString()})</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${data.subjectList.map(s => `
              <div class="p-4 rounded-2xl bg-[#F8FAF7] border border-[#DCE6DF] hover:border-[#10402D] transition space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="font-display font-extrabold text-sm text-[#111C15]">${escapeHtml(s.subject)}</span>
                  <span class="text-xs font-bold text-[#10402D]">${s.accuracy > 0 ? s.accuracy + '% Acc' : '—'}</span>
                </div>

                <div class="flex items-center justify-between text-xs text-[#526056]">
                  <span><strong class="text-[#10402D]">${s.attempted}</strong> Attempted</span>
                  <span><strong class="text-[#785600]">${s.unattempted}</strong> Unattempted</span>
                  <span>${s.totalBank} Total</span>
                </div>

                <div class="w-full bg-[#E5ECE6] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#10402D] h-full rounded-full transition-all duration-300" style="width: ${s.completionPct}%;"></div>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <span class="text-[11px] font-semibold text-[#526056]">${s.completionPct}% Completed</span>
                  <button type="button" onclick="openSubjectPractice('${escapeHtml(s.subject)}', 'unattempted')" class="text-xs font-bold text-[#10402D] hover:underline cursor-pointer">
                    Practice Unattempted →
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- MOCK TEST ATTEMPT HISTORY -->
        <div class="bg-white rounded-3xl border border-[#DCE6DF] p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5ECE6]">
            <div>
              <h3 class="font-display font-extrabold text-lg text-[#111C15]">Mock Test History Log</h3>
              <p class="text-xs text-[#526056]">Complete audit record of marks, accuracy &amp; Option E safe skips for every attempt</p>
            </div>
            <button type="button" onclick="openTestSeriesMode()" class="px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#10402D] hover:bg-[#17593F] transition cursor-pointer shrink-0">
              Take a New Mock Test
            </button>
          </div>

          <div class="mt-4 space-y-3">
            ${data.studentMocks.length === 0 ? `
              <div class="p-8 text-center text-xs text-[#526056] bg-[#F8FAF7] rounded-2xl border border-[#DCE6DF]">
                <p class="text-sm font-bold text-[#111C15]">No Mock Tests Taken Yet</p>
                <p class="mt-1">Experience real BPSC exam pressure with negative marking (-1/3) and Option E safe skip.</p>
                <button type="button" onclick="openTestSeriesMode()" class="mt-4 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#10402D] hover:bg-[#17593F] transition cursor-pointer">
                  Browse 22 Full-Length Mock Tests
                </button>
              </div>
            ` : data.studentMocks.map((att, idx) => `
              <div class="p-4 rounded-2xl bg-[#F8FAF7] border border-[#DCE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]">
                      Attempt #${data.studentMocks.length - idx}
                    </span>
                    <span class="font-display font-bold text-sm text-[#111C15]">${escapeHtml(att.examTitle || 'BPSC Mock Test')}</span>
                  </div>
                  <div class="text-[#526056] text-[11px]">
                    📅 ${escapeHtml(att.timestamp || 'Recent')} • <strong>${att.attempted || 0}</strong> Attempted / ${att.totalQ || 150} Questions
                  </div>
                </div>

                <div class="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <div class="text-right">
                    <div class="font-display font-black text-lg text-[#10402D]">${escapeHtml(att.score)} <span class="text-xs font-normal text-[#526056]">/ ${att.totalQ || 150}</span></div>
                    <div class="text-[10px] text-[#526056]">
                      <span class="text-emerald-700 font-bold">+${att.correct || 0} Right</span> • 
                      <span class="text-rose-600 font-bold">-${att.wrong || 0} Wrong</span> • 
                      <span class="text-[#785600] font-bold">${att.safeSkip || 0} Opt E</span>
                    </div>
                  </div>
                  <button type="button" onclick="openTestSeriesMode()" class="px-3.5 py-2 rounded-xl font-bold text-xs text-[#10402D] bg-white hover:bg-[#EBF3E6] border border-[#DCE6DF] transition cursor-pointer">
                    Re-Attempt
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
      initIcons();
    }

    function openSubjectPractice(subject, filterMode = 'all') {
      openPyqBankMode();
      selectedSubject = subject || 'ALL';
      practiceFilterStatus = filterMode; // 'all', 'unattempted', 'attempted'
      displayLimit = 60;
      switchView('bank');
      renderSubjectPills();
      updateSubjectProgressUI();
      renderQuestions();
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }

    function switchStudentAccount() {
      const all = getAllAspirants();
      if (all.length > 1) {
        const names = all.map((a, i) => `${i + 1}. ${a.name} (${a.email})`).join('\n');
        const choice = prompt(`Select student profile (enter 1 to ${all.length}) or enter 'new' to add a new student:\n\n${names}`);
        if (!choice) return;
        if (choice.trim().toLowerCase() === 'new') {
          openAspirantRegModal('Sign in with a new aspirant profile');
          return;
        }
        const idx = parseInt(choice, 10) - 1;
        if (all[idx]) {
          PrepBackendEngine.auth.saveUserSession(all[idx]).then(() => {
            userAttempts = loadStudentPracticeAttempts();
            updateAspirantNavUI();
            renderSubjectPills();
            updateSubjectProgressUI();
            renderQuestions();
            if (typeof renderTestSeriesCards === 'function') renderTestSeriesCards();
            if (activeView === 'analytics') renderStudentAnalyticsView();
            showToast(`Switched to ${all[idx].name}!`, 'success');
          });
          return;
        }
      }
      openAspirantRegModal('Sign in with another student profile');
    }

    function startMockTest(testId) {
      requireAspirant(async () => {
        if (!questionsLoaded) {
          if (typeof showToast === 'function') showToast("Loading test questions...", "info");
          await loadQuestionsData();
        }
        const test = CURATED_TESTS.find(t => t.id === testId) || SPEED_DRILLS_CONFIG.find(t => t.id === testId);
        if (!test) return;

        activeMockTest = test;
        // DATA QUALITY: Strictly exclude descriptive Mains questions (ids q_2620 onward, ans="Mains", empty options)
        const allMcq = getAllQuestions().filter(q => !isMainsDescriptiveQuestion(q));
        let questions = [];

        if (test.customQuestions && Array.isArray(test.customQuestions) && test.customQuestions.length > 0) {
          // Drop-in exam pack questions loaded at runtime
          questions = test.customQuestions;
        } else if (test.isSpeedDrill) {
          // Select questions strictly from existing bank matching this drill's subject(s)
          const subjectPool = allMcq.filter(q => {
            if (Array.isArray(test.subjectFilter)) {
              return test.subjectFilter.includes(q.subject);
            }
            return q.subject === test.subject;
          });

          if (subjectPool.length === 0) {
            showToast("Questions for this drill are loading...", "info");
            return;
          }

          // Deterministic rotation on re-attempts
          const attempts = getTestAttemptsForTest(test.id);
          const offset = (attempts.length * 15) % Math.max(1, subjectPool.length - 15);
          questions = subjectPool.slice(offset, offset + 15);
        } else {
          questions = allMcq.filter(q => q.exam === test.examMatch);

          if (questions.length === 0) {
            questions = allMcq.filter(q => q.exam.toLowerCase().includes(test.examMatch.toLowerCase().split(' ')[0]));
          }

          if (questions.length === 0) {
            showToast("Questions for this test are loading...", "info");
            return;
          }

          if (test.id === 'ts_tre_4_0') {
            // Curate distinct order for TRE 4.0 Mock
            questions = [...questions].reverse();
          }
          questions = questions.slice(0, test.questionsCount);
        }

        currentMockQuestions = questions;
        currentMockIndex = 0;

        // Restore draft if exists for this test, otherwise initialize
        let restoredDraft = null;
        try {
          if (typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.drafts && PrepBackendEngine.drafts.get) {
            restoredDraft = PrepBackendEngine.drafts.get(test.title);
          }
        } catch (e) {}

        if (restoredDraft && restoredDraft.answers && Object.keys(restoredDraft.answers).length > 0) {
          mockUserAnswers = restoredDraft.answers || {};
          window.mockUserAnswers = mockUserAnswers;
          mockMarkedForReview = restoredDraft.marked || {};
          mockTimeRemaining = (typeof restoredDraft.remainingSecs === 'number' && restoredDraft.remainingSecs > 10)
            ? restoredDraft.remainingSecs
            : test.timeMins * 60;
          if (typeof showToast === 'function') {
            showToast("Resumed your in-progress mock draft.", "info");
          }
        } else {
          mockUserAnswers = {};
          window.mockUserAnswers = mockUserAnswers;
          mockMarkedForReview = {};
          mockTimeRemaining = test.timeMins * 60;
        }
        const padInit = (n) => String(n).padStart(2, '0');
        const initH = Math.floor(mockTimeRemaining / 3600);
        const initM = Math.floor((mockTimeRemaining % 3600) / 60);
        const initS = mockTimeRemaining % 60;
        const initTimeStr = `${padInit(initH)}:${padInit(initM)}:${padInit(initS)}`;
        const tEl = document.getElementById('tt-timer');
        if (tEl) tEl.textContent = initTimeStr;
        const mEl = document.getElementById('tt-mobile-timer');
        if (mEl) mEl.textContent = initTimeStr;

        const portalView = document.getElementById('page-portal-view');
        if (portalView) portalView.classList.add('hidden');
        const qbView = document.getElementById('page-bpsc-pyq-view');
        if (qbView) qbView.classList.remove('hidden');
        const qbHeader = document.getElementById('qb-sticky-header');
        if (qbHeader) qbHeader.classList.add('mock-hide-header-mobile');
        document.getElementById('view-testseries').classList.add('hidden');
        document.getElementById('test-taking-workspace').classList.remove('hidden');

        document.getElementById('tt-exam-name').textContent = test.title;
        const liveBadge = document.getElementById('tt-live-mock-badge');
        if (liveBadge) {
          liveBadge.textContent = test.isSpeedDrill ? '10-MIN SPEED DRILL' : 'LIVE MOCK TEST';
        }

        updatePageMeta({
          title: `${test.title} (${test.isSpeedDrill ? '10-Min Live Drill' : 'Live Mock'}) | ShaktiQ`,
          description: `Attempt ${test.title} under official timed exam conditions with real BPSC scoring rules on ShaktiQ.`,
          url: `https://shaktiq.com/#mock-${test.id}`,
          image: "https://shaktiq.com/share-card.png"
        });

        if (mockTimerInterval) clearInterval(mockTimerInterval);
        mockTimerInterval = setInterval(updateMockTimer, 1000);

        currentMockViewMode = 'card';
        const wsEl = document.getElementById('test-taking-workspace');
        if (wsEl) wsEl.classList.remove('mock-view-omr');
        const omrContainer = document.getElementById('tt-omr-container');
        if (omrContainer) omrContainer.classList.add('hidden');
        updateViewToggleButtons();
        renderCurrentQuestion();
        renderQuestionPalette();
        renderVirtualOmrSheet();
        safeScrollToTop();
      }, 'Please sign in with your profile before starting a full-length Mock Test.');
    }

    function updateMockTimer() {
      if (mockTimeRemaining <= 0) {
        clearInterval(mockTimerInterval);
        submitMockTest();
        return;
      }
      mockTimeRemaining -= 1;
      const hours = Math.floor(mockTimeRemaining / 3600);
      const mins = Math.floor((mockTimeRemaining % 3600) / 60);
      const secs = mockTimeRemaining % 60;

      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
      const timerEl = document.getElementById('tt-timer');
      if (timerEl) {
        timerEl.textContent = timeStr;
      }
      const mobileTimerEl = document.getElementById('tt-mobile-timer');
      if (mobileTimerEl) {
        mobileTimerEl.textContent = timeStr;
      }

      // Auto-save test draft to backend engine every 5 seconds (Crash-Recovery)
      if (mockTimeRemaining % 5 === 0 && activeMockTest) {
        PrepBackendEngine.drafts.save(activeMockTest.title, mockUserAnswers, mockMarkedForReview, mockTimeRemaining);
      }
    }

    function renderCurrentQuestion() {
      if (!currentMockQuestions || currentMockQuestions.length === 0) return;
      const item = currentMockQuestions[currentMockIndex];
      const isHindi = (ShaktiQBilingualEngine.currentLang === 'hi');

      // Update question index label
      const indexLabel = document.getElementById('tt-q-index-label');
      if (indexLabel) {
        indexLabel.textContent = isHindi 
          ? `प्रश्न ${currentMockIndex + 1} / ${currentMockQuestions.length}`
          : `Question ${currentMockIndex + 1} of ${currentMockQuestions.length}`;
      }
      const mobileIndexLabel = document.getElementById('tt-mobile-q-index');
      if (mobileIndexLabel) {
        mobileIndexLabel.textContent = `Q: ${currentMockIndex + 1}/${currentMockQuestions.length}`;
      }

      // Update subject badge
      const subjBadge = document.getElementById('tt-q-subject-badge');
      if (subjBadge) {
        subjBadge.textContent = isHindi ? getSubjectInHindi(item.subject) : (item.subject || 'General Studies');
      }

      const qTextEl = document.getElementById('tt-question-text');
      const container = document.getElementById('tt-options-container');
      const chosen = mockUserAnswers[currentMockIndex];

      const renderOptionsHtml = (optsArray, isHi) => {
        let optsHtml = '';
        optsArray.forEach((optItem) => {
          const letter = optItem.letter;
          const optText = optItem.isSafeSkip ? optItem.text : stripOptionPrefix(optItem.text);
          const isSelected = (chosen === letter);

          let borderBgClass = 'border-[#DCE6DF] bg-[#F8FAF7] hover:border-[#10402D] hover:bg-[#EBF3E6]/60 text-[#111C15]';
          let circleClass = 'border-[#95A79A] text-[#3B493F] bg-white';
          let badgeHtml = '';

          if (optItem.isSafeSkip) {
            const skipLabel = isHi ? 'सुरक्षित छोड़ें (0 अंक कटेगा)' : 'Safe Skip (0 Deduction)';
            const skipSelectedLabel = isHi ? 'सुरक्षित छोड़ना चुना (0 अंक कटेगा)' : 'Safe Skip Selected (0 Deduction)';
            if (isSelected) {
              borderBgClass = 'border-[#10402D] bg-[#ECF6E7] text-[#10402D] font-bold shadow-xs';
              circleClass = 'border-[#10402D] bg-[#10402D] text-white font-bold';
              badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10402D] text-white">${skipSelectedLabel}</span>`;
            } else {
              borderBgClass = 'border-[#C6DEC0] bg-[#F4F9F2] hover:border-[#10402D] text-[#223127]';
              circleClass = 'border-[#7AA975] text-[#10402D] bg-white';
              badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]">${skipLabel}</span>`;
            }
          } else if (isSelected) {
            borderBgClass = 'border-[#10402D] bg-[#ECF6E7] text-[#10402D] font-bold shadow-xs';
            circleClass = 'border-[#10402D] bg-[#10402D] text-white font-bold';
          }

          optsHtml += `
            <div onclick="ttSelectOption('${letter}')" class="p-3.5 rounded-2xl border ${borderBgClass} flex items-start gap-3 cursor-pointer transition">
              <span class="w-6 h-6 rounded-full border ${circleClass} flex items-center justify-center font-bold text-xs shrink-0">
                ${letter}
              </span>
              <span class="text-sm leading-relaxed">${escapeHtml(optText)}</span>
              ${badgeHtml}
            </div>
          `;
        });
        return optsHtml;
      };

      const baseOpts = item.options ? [...item.options] : [];

      if (!isHindi) {
        // English rendering
        qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(item.q));
        const displayOptsEn = [
          { letter: 'A', text: baseOpts[0] || '(A)' },
          { letter: 'B', text: baseOpts[1] || '(B)' },
          { letter: 'C', text: baseOpts[2] || '(C)' },
          { letter: 'D', text: baseOpts[3] || '(D)' },
          { letter: 'E', text: 'Option (E) — Not Attempted / अनुत्तरित प्रश्न (Safe Skip • 0 Penalty)', isSafeSkip: true }
        ];
        container.innerHTML = renderOptionsHtml(displayOptsEn, false);
      } else {
        // Hindi rendering - check cache first
        const cacheBundle = ShaktiQBilingualEngine.getCachedQuestion(item.id || item.q);
        if (cacheBundle) {
          qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(cacheBundle.q));
          const displayOptsHi = [
            { letter: 'A', text: cacheBundle.options[0] || baseOpts[0] || '(A)' },
            { letter: 'B', text: cacheBundle.options[1] || baseOpts[1] || '(B)' },
            { letter: 'C', text: cacheBundle.options[2] || baseOpts[2] || '(C)' },
            { letter: 'D', text: cacheBundle.options[3] || baseOpts[3] || '(D)' },
            { letter: 'E', text: 'विकल्प (E) — अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)', isSafeSkip: true }
          ];
          container.innerHTML = renderOptionsHtml(displayOptsHi, true);
        } else {
          // Render English text with Hindi loader badge while fetching translation
          qTextEl.innerHTML = `<span class="opacity-80">${renderFormattedQuestionHtml(cleanQuestionStem(item.q))}</span><span class="block mt-2 text-xs font-semibold text-[#10402D] animate-pulse flex items-center gap-1.5"><i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>अनुवाद लोड हो रहा है (Translating into Hindi)...</span>`;
          const displayOptsPlaceholder = [
            { letter: 'A', text: baseOpts[0] || '(A)' },
            { letter: 'B', text: baseOpts[1] || '(B)' },
            { letter: 'C', text: baseOpts[2] || '(C)' },
            { letter: 'D', text: baseOpts[3] || '(D)' },
            { letter: 'E', text: 'विकल्प (E) — अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)', isSafeSkip: true }
          ];
          container.innerHTML = renderOptionsHtml(displayOptsPlaceholder, true);
          initIcons();

          const currentTargetIdx = currentMockIndex;
          ShaktiQBilingualEngine.translateQuestionBundle(item.id || item.q, item.q, baseOpts, item.exp).then(hiBundle => {
            if (currentMockIndex === currentTargetIdx && ShaktiQBilingualEngine.currentLang === 'hi') {
              qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(hiBundle.q));
              const displayOptsHiLoaded = [
                { letter: 'A', text: hiBundle.options[0] || baseOpts[0] || '(A)' },
                { letter: 'B', text: hiBundle.options[1] || baseOpts[1] || '(B)' },
                { letter: 'C', text: hiBundle.options[2] || baseOpts[2] || '(C)' },
                { letter: 'D', text: hiBundle.options[3] || baseOpts[3] || '(D)' },
                { letter: 'E', text: 'विकल्प (E) — अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)', isSafeSkip: true }
              ];
              container.innerHTML = renderOptionsHtml(displayOptsHiLoaded, true);
            }
          });
        }
      }

      renderQuestionPalette();
      ShaktiQBilingualEngine.updateButtonsUI();

      // Pre-fetch next question in Hindi if Hindi mode is active
      if (isHindi && currentMockIndex < currentMockQuestions.length - 1) {
        const nextItem = currentMockQuestions[currentMockIndex + 1];
        if (nextItem && !ShaktiQBilingualEngine.getCachedQuestion(nextItem.id || nextItem.q)) {
          setTimeout(() => {
            ShaktiQBilingualEngine.translateQuestionBundle(nextItem.id || nextItem.q, nextItem.q, nextItem.options || [], nextItem.exp || '');
          }, 350);
        }
      }
    }

    function openPaletteDrawer() {
      const drawer = document.getElementById('tt-palette-drawer');
      const backdrop = document.getElementById('tt-palette-backdrop');
      const sheet = document.getElementById('tt-palette-sheet');
      if (drawer) drawer.classList.remove('hidden');
      if (backdrop) backdrop.classList.remove('hidden');
      if (sheet) {
        sheet.classList.remove('translate-y-full');
        sheet.classList.add('translate-y-0');
      }
      renderQuestionPalette();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

    function closePaletteDrawer() {
      const drawer = document.getElementById('tt-palette-drawer');
      const backdrop = document.getElementById('tt-palette-backdrop');
      const sheet = document.getElementById('tt-palette-sheet');
      if (sheet) {
        sheet.classList.add('translate-y-full');
        sheet.classList.remove('translate-y-0');
      }
      if (backdrop) backdrop.classList.add('hidden');
      if (drawer) {
        setTimeout(() => {
          if (sheet && sheet.classList.contains('translate-y-full')) {
            drawer.classList.add('hidden');
          }
        }, 300);
      }
    }

    function renderQuestionPalette() {
      const grid = document.getElementById('tt-palette-grid');
      const mobileGrid = document.getElementById('tt-palette-grid-mobile');
      if (!grid && !mobileGrid) return;

      let answered = 0;
      let review = 0;
      let unanswered = 0;
      let unvisited = 0;

      let btnsHtml = '';
      currentMockQuestions.forEach((q, idx) => {
        const isAnswered = !!mockUserAnswers[idx];
        const isReview = !!mockMarkedForReview[idx];
        const isCurrent = (idx === currentMockIndex);

        let colorClass = 'bg-[#F8FAF7] text-[#526056] border-[#DCE6DF]';
        let stateLabel = 'Not visited';
        if (isAnswered) {
          colorClass = 'bg-[#10402D] text-white border-[#10402D] font-bold';
          stateLabel = 'Answered';
          answered += 1;
        } else if (isReview) {
          colorClass = 'bg-[#FCE27B] text-[#111C15] border-[#F5DF8B] font-bold';
          stateLabel = 'Marked for review';
          review += 1;
        } else if (idx <= currentMockIndex) {
          colorClass = 'bg-[#EBF3E6] text-[#223127] border-[#C6DEC0]';
          stateLabel = 'Skipped / Visited';
          unanswered += 1;
        } else {
          unvisited += 1;
        }

        if (isCurrent) {
          colorClass += ' ring-2 ring-[#10402D] ring-offset-2';
        }

        btnsHtml += `
          <button type="button" onclick="ttJumpToQuestion(${idx})" class="w-full aspect-square rounded-xl text-xs border flex items-center justify-center transition cursor-pointer ${colorClass}" aria-label="Question ${idx + 1}: ${stateLabel}">
            ${idx + 1}
          </button>
        `;
      });

      if (grid) grid.innerHTML = btnsHtml;
      if (mobileGrid) mobileGrid.innerHTML = btnsHtml;

      const setLeg = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setLeg('tt-legend-answered', answered);
      setLeg('tt-legend-review', review);
      setLeg('tt-legend-unanswered', unanswered);
      setLeg('tt-legend-unvisited', unvisited);

      setLeg('tt-mobile-legend-answered', answered);
      setLeg('tt-mobile-legend-review', review);
      setLeg('tt-mobile-legend-unanswered', unanswered);
      setLeg('tt-mobile-legend-unvisited', unvisited);
    }

    function ttSelectOption(letter) {
      if (mockUserAnswers[currentMockIndex] === letter) {
        delete mockUserAnswers[currentMockIndex];
      } else {
        mockUserAnswers[currentMockIndex] = letter;
      }
      if (activeMockTest && typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.drafts) {
        PrepBackendEngine.drafts.save(activeMockTest.title, mockUserAnswers, mockMarkedForReview, mockTimeRemaining);
      }
      renderCurrentQuestion();
      if (typeof updateSingleOmrRow === 'function') updateSingleOmrRow(currentMockIndex);
      if (typeof updateOmrStats === 'function') updateOmrStats();
    }

    function ttSaveAndNext() {
      if (currentMockIndex < currentMockQuestions.length - 1) {
        currentMockIndex += 1;
        renderCurrentQuestion();
        if (typeof highlightOmrRow === 'function') highlightOmrRow(currentMockIndex, true);
      } else {
        showToast("You've reached the last question. Click 'Submit Test' when finished.", "info");
      }
    }

    function ttPrevQuestion() {
      if (currentMockIndex > 0) {
        currentMockIndex -= 1;
        renderCurrentQuestion();
        if (typeof highlightOmrRow === 'function') highlightOmrRow(currentMockIndex, true);
      }
    }

    function ttClearResponse() {
      delete mockUserAnswers[currentMockIndex];
      if (activeMockTest && typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.drafts) {
        PrepBackendEngine.drafts.save(activeMockTest.title, mockUserAnswers, mockMarkedForReview, mockTimeRemaining);
      }
      renderCurrentQuestion();
      if (typeof updateSingleOmrRow === 'function') updateSingleOmrRow(currentMockIndex);
      if (typeof updateOmrStats === 'function') updateOmrStats();
    }

    function ttMarkForReview() {
      mockMarkedForReview[currentMockIndex] = !mockMarkedForReview[currentMockIndex];
      if (activeMockTest && typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.drafts) {
        PrepBackendEngine.drafts.save(activeMockTest.title, mockUserAnswers, mockMarkedForReview, mockTimeRemaining);
      }
      if (typeof updateSingleOmrRow === 'function') updateSingleOmrRow(currentMockIndex);
      ttSaveAndNext();
    }

    function ttJumpToQuestion(idx) {
      currentMockIndex = idx;
      renderCurrentQuestion();
      if (typeof highlightOmrRow === 'function') highlightOmrRow(currentMockIndex, true);
      closePaletteDrawer();
    }

    // ==========================================
    // VIRTUAL OMR SHEET MODE (Feature 3.1)
    // ==========================================
    let currentMockViewMode = 'card';
    let currentOmrFilter = 'all';

    function setMockViewMode(mode) {
      currentMockViewMode = (mode === 'omr') ? 'omr' : 'card';
      const ws = document.getElementById('test-taking-workspace');
      const omrContainer = document.getElementById('tt-omr-container');
      if (ws) {
        if (currentMockViewMode === 'omr') {
          ws.classList.add('mock-view-omr');
          if (omrContainer) omrContainer.classList.remove('hidden');
          renderVirtualOmrSheet();
          highlightOmrRow(currentMockIndex, true);
        } else {
          ws.classList.remove('mock-view-omr');
          if (omrContainer) omrContainer.classList.add('hidden');
          renderCurrentQuestion();
          renderQuestionPalette();
        }
      }
      updateViewToggleButtons();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
    window.setMockViewMode = setMockViewMode;

    function updateViewToggleButtons() {
      const isOmr = (currentMockViewMode === 'omr');
      const activeClass = 'bg-[#10402D] text-white shadow-xs';
      const inactiveClass = 'text-[#223127] hover:text-[#10402D] bg-transparent';

      const cardDesktop = document.getElementById('tt-view-btn-card-desktop');
      const omrDesktop = document.getElementById('tt-view-btn-omr-desktop');
      if (cardDesktop && omrDesktop) {
        cardDesktop.className = `px-3 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${!isOmr ? activeClass : inactiveClass}`;
        omrDesktop.className = `px-3 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${isOmr ? activeClass : inactiveClass}`;
        cardDesktop.setAttribute('aria-pressed', String(!isOmr));
        omrDesktop.setAttribute('aria-pressed', String(isOmr));
      }

      const cardMobile = document.getElementById('tt-view-btn-card-mobile');
      const omrMobile = document.getElementById('tt-view-btn-omr-mobile');
      if (cardMobile && omrMobile) {
        cardMobile.className = `px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold flex items-center gap-1 ${!isOmr ? activeClass : inactiveClass}`;
        omrMobile.className = `px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold flex items-center gap-1 ${isOmr ? activeClass : inactiveClass}`;
        cardMobile.setAttribute('aria-pressed', String(!isOmr));
        omrMobile.setAttribute('aria-pressed', String(isOmr));
      }
    }

    function renderVirtualOmrSheet() {
      const container = document.getElementById('tt-omr-rows-container');
      if (!container || !currentMockQuestions || currentMockQuestions.length === 0) return;

      const total = currentMockQuestions.length;
      let html = '';
      for (let idx = 0; idx < total; idx++) {
        html += getOmrRowHtml(idx);
      }
      container.innerHTML = html;
      updateOmrStats();
      applyOmrFilter();
      highlightOmrRow(currentMockIndex, false);
    }
    window.renderVirtualOmrSheet = renderVirtualOmrSheet;

    function getOmrRowHtml(idx) {
      const chosen = mockUserAnswers[idx];
      const isReview = !!mockMarkedForReview[idx];
      const isCurrent = (idx === currentMockIndex);

      let rowBorderBg = 'bg-white border-[#E5ECE6] hover:border-[#C6DEC0] hover:bg-[#F2F6F1]';
      if (isCurrent) {
        rowBorderBg = 'bg-[#ECF6E7] border-[#10402D] shadow-2xs ring-1 ring-[#10402D]/30';
      } else if (chosen) {
        rowBorderBg = 'bg-[#F9FCF8] border-[#DCE6DF]';
      }

      const letters = ['A', 'B', 'C', 'D', 'E'];
      const bubblesHtml = letters.map(letter => {
        const isSelected = (chosen === letter);
        const isSafeSkip = (letter === 'E');

        let bubbleClasses = 'w-8 h-8 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center font-black text-xs transition cursor-pointer select-none active:scale-95';

        if (isSelected) {
          if (isSafeSkip) {
            bubbleClasses += ' border-[#10402D] bg-[#10402D] text-white shadow-inner ring-2 ring-[#7AA975]/60';
          } else {
            bubbleClasses += ' border-[#10402D] bg-[#10402D] text-white shadow-inner';
          }
        } else {
          if (isSafeSkip) {
            bubbleClasses += ' border-[#7AA975] text-[#10402D] bg-[#F4F9F2] hover:border-[#10402D] hover:bg-[#EBF3E6]';
          } else {
            bubbleClasses += ' border-[#526056] text-[#223127] bg-white hover:border-[#10402D] hover:bg-[#EBF3E6]/60';
          }
        }

        const ariaLabel = `Q${idx + 1} ${letter}${isSafeSkip ? ' (Safe Skip)' : ''}`;
        return `<button type="button" onclick="selectOmrOption(${idx}, '${letter}')" class="${bubbleClasses}" aria-label="${ariaLabel}" aria-pressed="${isSelected}">${letter}</button>`;
      }).join('');

      let statusBadge = `<button type="button" onclick="jumpFromOmrToQuestion(${idx})" class="text-[11px] text-[#526056] hover:text-[#10402D] font-bold hover:underline cursor-pointer">View</button>`;
      if (chosen) {
        const badgeColor = (chosen === 'E') 
          ? 'bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]' 
          : 'bg-[#10402D] text-white';
        statusBadge = `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono font-black ${badgeColor}">[ ${chosen} ]</span>`;
      }

      return `
        <div id="omr-row-${idx}" data-q-idx="${idx}" data-answered="${!!chosen}" class="omr-row p-2 sm:p-2.5 rounded-xl border ${rowBorderBg} transition flex items-center justify-between gap-1.5 sm:gap-2">
          <button type="button" onclick="jumpFromOmrToQuestion(${idx})" class="w-12 sm:w-14 text-left font-mono font-bold text-xs sm:text-sm text-[#111C15] hover:text-[#10402D] flex items-center gap-1 cursor-pointer shrink-0" aria-label="Question ${idx + 1}">
            <span>Q.${idx + 1}</span>
            ${isReview ? '<span class="text-amber-500 font-bold text-xs" title="Marked for review">★</span>' : ''}
          </button>
          <div class="flex items-center gap-2 sm:gap-2.5 shrink-0" role="group" aria-label="Question ${idx + 1} options">
            ${bubblesHtml}
          </div>
          <div class="flex items-center justify-end shrink-0 w-12 sm:w-16">
            ${statusBadge}
          </div>
        </div>
      `;
    }

    function updateSingleOmrRow(idx) {
      const rowEl = document.getElementById(`omr-row-${idx}`);
      if (!rowEl) return;
      const temp = document.createElement('div');
      temp.innerHTML = getOmrRowHtml(idx).trim();
      const newRow = temp.firstElementChild;
      if (newRow) {
        rowEl.replaceWith(newRow);
      }
      applyOmrFilter();
    }

    function highlightOmrRow(idx, scrollIntoView = false) {
      document.querySelectorAll('.omr-row').forEach(r => {
        const rIdx = parseInt(r.getAttribute('data-q-idx'), 10);
        if (rIdx === idx) {
          r.classList.add('bg-[#ECF6E7]', 'border-[#10402D]', 'shadow-2xs', 'ring-1', 'ring-[#10402D]/30');
          r.classList.remove('bg-white', 'border-[#E5ECE6]');
          if (scrollIntoView) {
            r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          r.classList.remove('bg-[#ECF6E7]', 'border-[#10402D]', 'shadow-2xs', 'ring-1', 'ring-[#10402D]/30');
          if (r.getAttribute('data-answered') === 'false') {
            r.classList.add('bg-white', 'border-[#E5ECE6]');
          }
        }
      });
    }

    function updateOmrStats() {
      if (!currentMockQuestions) return;
      const total = currentMockQuestions.length;
      let answered = 0;
      let safeSkip = 0;

      for (let i = 0; i < total; i++) {
        const ans = mockUserAnswers[i];
        if (ans) {
          answered++;
          if (ans === 'E') safeSkip++;
        }
      }

      const blank = total - answered;

      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setEl('tt-omr-stat-total', total);
      setEl('tt-omr-stat-answered', answered);
      setEl('tt-omr-stat-safeskip', safeSkip);
      setEl('tt-omr-stat-blank', blank);
    }

    function selectOmrOption(idx, letter) {
      if (mockUserAnswers[idx] === letter) {
        delete mockUserAnswers[idx];
      } else {
        mockUserAnswers[idx] = letter;
      }

      if (activeMockTest && typeof PrepBackendEngine !== 'undefined' && PrepBackendEngine.drafts) {
        PrepBackendEngine.drafts.save(activeMockTest.title, mockUserAnswers, mockMarkedForReview, mockTimeRemaining);
      }

      currentMockIndex = idx;
      renderCurrentQuestion();
      updateSingleOmrRow(idx);
      updateOmrStats();
      renderQuestionPalette();
    }
    window.selectOmrOption = selectOmrOption;

    function jumpFromOmrToQuestion(idx) {
      currentMockIndex = idx;
      renderCurrentQuestion();
      highlightOmrRow(idx, false);
      if (window.innerWidth < 1024) {
        setMockViewMode('card');
      } else {
        const qContainer = document.getElementById('tt-question-container');
        if (qContainer) {
          qContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
    window.jumpFromOmrToQuestion = jumpFromOmrToQuestion;

    function filterOmrRows(filter) {
      currentOmrFilter = filter;
      ['all', 'unanswered', 'answered'].forEach(f => {
        const btn = document.getElementById(`tt-omr-filter-${f}`);
        if (btn) {
          if (f === filter) {
            btn.className = 'omr-filter-btn px-2.5 py-0.5 rounded-md bg-[#10402D] text-white font-bold cursor-pointer';
          } else {
            btn.className = 'omr-filter-btn px-2.5 py-0.5 rounded-md text-[#526056] hover:text-[#10402D] font-bold cursor-pointer';
          }
        }
      });
      applyOmrFilter();
    }
    window.filterOmrRows = filterOmrRows;

    function applyOmrFilter() {
      const rows = document.querySelectorAll('.omr-row');
      rows.forEach(r => {
        const isAnswered = (r.getAttribute('data-answered') === 'true');
        if (currentOmrFilter === 'all') {
          r.style.display = '';
        } else if (currentOmrFilter === 'unanswered') {
          r.style.display = !isAnswered ? '' : 'none';
        } else if (currentOmrFilter === 'answered') {
          r.style.display = isAnswered ? '' : 'none';
        }
      });
    }

    // ==========================================
    // INDICATIVE CUT-OFF THRESHOLDS CONFIG (Feature 2.4)
    // Edit these values to adjust the scorecard indicative bands.
    // NOTE: These are strictly an internal rough study benchmark and NOT official BPSC cut-offs or predictions.
    

    function getCutoffBand(score, totalQ) {
      const cfg = SHAKTIQ_CUTOFF_CONFIG.getThresholdsForTest(totalQ);
      if (score >= cfg.safe) {
        return {
          id: 'safe',
          label: 'Safe Zone',
          labelHi: 'सुरक्षित क्षेत्र',
          badgeClass: 'bg-[#10402D] text-white border-[#10402D]',
          color: '#10402D',
          summary: 'Strong performance relative to past benchmarks. Continue consistent revision.',
          summaryHi: 'विगत मानकों की तुलना में उत्कृष्ट प्रदर्शन। नियमित अभ्यास जारी रखें।'
        };
      } else if (score >= cfg.borderline) {
        return {
          id: 'borderline',
          label: 'Borderline Zone',
          labelHi: 'सीमांत क्षेत्र',
          badgeClass: 'bg-[#FEF6D6] text-[#785600] border-[#F5DF8B]',
          color: '#785600',
          summary: 'Within competitive range. Focus on high-yield accuracy and minimizing negative marking.',
          summaryHi: 'प्रतिस्पर्धी सीमा में। उच्च-अंक विषयों पर सटीकता और नकारात्मक अंक कम करने पर ध्यान दें।'
        };
      } else {
        return {
          id: 'needs_improvement',
          label: 'Needs Improvement',
          labelHi: 'सुधार की आवश्यकता',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          color: '#9F1239',
          summary: 'Strengthen fundamental core subjects and utilize Safe Skip (Option E) to avoid unforced penalties.',
          summaryHi: 'मूल विषयों को मजबूत करें और बिना वजह अंक कटने से बचने के लिए सुरक्षित विकल्प (E) का उपयोग करें।'
        };
      }
    }
    window.getCutoffBand = getCutoffBand;

    function renderCutoffMeter(score, totalQ) {
      const isHi = (ShaktiQBilingualEngine && ShaktiQBilingualEngine.currentLang === 'hi');
      const total = totalQ || 150;
      const cfg = SHAKTIQ_CUTOFF_CONFIG.getThresholdsForTest(total);
      const band = getCutoffBand(score, total);

      // Update Meter Headings & Bilingual Labels
      const headingEl = document.getElementById('cutoff-meter-heading');
      if (headingEl) {
        headingEl.textContent = isHi ? 'संकेतक कट-ऑफ मीटर (अध्ययन गाइड)' : 'Indicative Cut-Off Meter';
      }
      const subHeadingEl = document.getElementById('cutoff-meter-subheading');
      if (subHeadingEl) {
        subHeadingEl.textContent = isHi ? 'केवल स्व-मूल्यांकन हेतु आंतरिक अध्ययन मानक' : 'Rough internal study benchmark for self-evaluation only';
      }
      const gaugeLabel = document.getElementById('cutoff-gauge-label');
      if (gaugeLabel) {
        gaugeLabel.textContent = isHi ? 'प्राप्तांक मानक गेज' : 'Study Benchmark Gauge';
      }

      // Update Score Display
      const scoreDisp = document.getElementById('cutoff-meter-score-display');
      if (scoreDisp) {
        scoreDisp.textContent = isHi 
          ? `आपका प्राप्तांक: ${score} / ${total}` 
          : `Your Score: ${score} / ${total} Marks`;
      }

      // Update Band Threshold Labels & Titles
      const thNeeds = document.getElementById('band-threshold-needs');
      if (thNeeds) thNeeds.textContent = `< ${cfg.borderline}`;
      const titleNeeds = document.getElementById('band-title-needs');
      if (titleNeeds) titleNeeds.textContent = isHi ? 'सुधार की आवश्यकता' : 'Needs Improvement';

      const thBorderline = document.getElementById('band-threshold-borderline');
      if (thBorderline) {
        const topRange = cfg.safe - 0.1 >= cfg.borderline ? Math.floor(cfg.safe - 0.1) : cfg.safe;
        thBorderline.textContent = `${cfg.borderline} – ${topRange}`;
      }
      const titleBorderline = document.getElementById('band-title-borderline');
      if (titleBorderline) titleBorderline.textContent = isHi ? 'सीमांत क्षेत्र' : 'Borderline';

      const thSafe = document.getElementById('band-threshold-safe');
      if (thSafe) thSafe.textContent = `≥ ${cfg.safe}`;
      const titleSafe = document.getElementById('band-title-safe');
      if (titleSafe) titleSafe.textContent = isHi ? 'सुरक्षित क्षेत्र' : 'Safe Zone';

      // Update Active Badge
      const badgeWrap = document.getElementById('cutoff-active-badge-wrap');
      if (badgeWrap) {
        const dotBg = band.id === 'safe' ? 'bg-[#10402D]' : (band.id === 'borderline' ? 'bg-[#785600]' : 'bg-rose-700');
        badgeWrap.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${band.badgeClass} shadow-2xs">
            <span class="w-1.5 h-1.5 rounded-full ${dotBg}"></span>
            <span>${isHi ? band.labelHi : band.label} (${score} M)</span>
          </span>
        `;
      }

      // Position Meter Pointer (clamped between 3% and 97%)
      const pointer = document.getElementById('cutoff-meter-pointer');
      const pointerLabel = document.getElementById('cutoff-meter-pointer-label');
      if (pointer) {
        const rawPct = (Math.max(0, score) / total) * 100;
        const clampedPct = Math.min(97, Math.max(3, rawPct));
        pointer.style.left = `${clampedPct}%`;
      }
      if (pointerLabel) {
        pointerLabel.textContent = isHi ? `प्राप्तांक: ${score}` : `Score: ${score}`;
      }

      // Highlight Active Band Card
      const cards = {
        needs: document.getElementById('band-card-needs'),
        borderline: document.getElementById('band-card-borderline'),
        safe: document.getElementById('band-card-safe')
      };

      if (cards.needs) {
        if (band.id === 'needs_improvement') {
          cards.needs.className = 'p-2.5 rounded-xl border-2 border-rose-500 bg-rose-50 text-[#111C15] font-semibold shadow-xs ring-1 ring-rose-400';
        } else {
          cards.needs.className = 'p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-[#526056] opacity-75';
        }
      }
      if (cards.borderline) {
        if (band.id === 'borderline') {
          cards.borderline.className = 'p-2.5 rounded-xl border-2 border-[#785600] bg-[#FFFBEA] text-[#111C15] font-semibold shadow-xs ring-1 ring-amber-400';
        } else {
          cards.borderline.className = 'p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-[#526056] opacity-75';
        }
      }
      if (cards.safe) {
        if (band.id === 'safe') {
          cards.safe.className = 'p-2.5 rounded-xl border-2 border-[#10402D] bg-[#ECF6E7] text-[#111C15] font-semibold shadow-xs ring-1 ring-emerald-500';
        } else {
          cards.safe.className = 'p-2.5 rounded-xl border border-[#C6DEC0] bg-[#EBF3E6]/40 text-[#526056] opacity-75';
        }
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
    window.renderCutoffMeter = renderCutoffMeter;

    function submitMockTest() {
      if (mockTimerInterval) clearInterval(mockTimerInterval);

      let correct = 0;
      let wrong = 0;
      let safeSkip = 0;
      let blank = 0;
      let attempted = 0;

      const validQuestions = (currentMockQuestions || []).filter(q => !isMainsDescriptiveQuestion(q));

      validQuestions.forEach((q, idx) => {
        const userOpt = mockUserAnswers[idx];
        if (!userOpt) {
          // Left completely blank without bubbling Option E -> -1/3 penalty under BPSC New Rule!
          blank += 1;
        } else if (userOpt === 'E') {
          // Darkened Option E (Not Attempted) -> 0 deduction (Safe Skip)
          safeSkip += 1;
        } else {
          // Attempted options A, B, C, or D
          attempted += 1;
          if (userOpt === q.ans) {
            correct += 1;
          } else {
            wrong += 1;
          }
        }
      });

      // Scoring formula: supports modular marking schemes (BPSC: +1, -1/3, 0 Safe Skip, -1/3 blank; BSSC: +4, -1, 0 Safe Skip, 0 blank)
      const scheme = (activeMockTest && activeMockTest.markingScheme)
        ? activeMockTest.markingScheme
        : { correct: 1.0, wrong: -1/3, safeSkip: 0, blank: -1/3 };

      const netScoreCalc = (correct * scheme.correct) + (wrong * scheme.wrong) + (blank * scheme.blank) + (safeSkip * scheme.safeSkip);
      const netScore = netScoreCalc.toFixed(2);

      const isHindiMode = (ShaktiQBilingualEngine && ShaktiQBilingualEngine.currentLang === 'hi');
      const isSpeed = activeMockTest && activeMockTest.isSpeedDrill;
      const headingEl = document.getElementById('tt-result-heading');
      if (headingEl) {
        headingEl.textContent = isSpeed 
          ? (isHindiMode ? '10-मिनट स्पीड ड्रिल पूर्ण!' : '10-Minute Speed Drill Completed!') 
          : (isHindiMode ? 'परीक्षण पूर्ण हुआ!' : 'Test Completed!');
      }

      document.getElementById('tt-result-exam-title').textContent = activeMockTest ? activeMockTest.title : "BPSC Mock Test";
      document.getElementById('tt-result-attempted').textContent = `${attempted} / ${validQuestions.length}`;
      document.getElementById('tt-result-correct').textContent = `${correct}`;
      document.getElementById('tt-result-wrong').textContent = `${wrong}`;
      const safeSkipEl = document.getElementById('tt-result-safe-skip');
      if (safeSkipEl) safeSkipEl.textContent = `${safeSkip}`;
      const blankEl = document.getElementById('tt-result-blank');
      if (blankEl) blankEl.textContent = `${blank}`;
      document.getElementById('tt-result-score').textContent = netScore;
      const totalLabelEl = document.getElementById('tt-result-total-label');
      if (totalLabelEl) totalLabelEl.textContent = `/ ${validQuestions.length} Marks`;
      renderCutoffMeter(parseFloat(netScore), validQuestions.length);

      // Record Student Test Attempt & Sync to Google Sheets IMMEDIATELY
      const currentStudent = getCurrentAspirant() || { name: "Aspirant", email: "aspirant@shaktiq.com", phone: "", district: "Bihar", targetExam: "71st BPSC CCE Prelims" };
      const attemptLog = {
        attemptId: 'att_' + Date.now(),
        testId: activeMockTest ? activeMockTest.id : '',
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        studentPhone: currentStudent.phone || "",
        studentDistrict: currentStudent.district || "",
        targetExam: currentStudent.targetExam || "71st BPSC",
        examTitle: activeMockTest ? activeMockTest.title : "BPSC Mock Test",
        score: netScore,
        correct: correct,
        wrong: wrong,
        safeSkip: safeSkip,
        blank: blank,
        attempted: attempted,
        totalQ: validQuestions.length,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        questionResults: validQuestions.map((q, idx) => ({
          id: q.id,
          subject: q.subject,
          ans: q.ans,
          userOpt: mockUserAnswers[idx] || null,
          isCorrect: (mockUserAnswers[idx] === q.ans)
        }))
      };
      
      // Record question timestamps for genuine 24-hour daily goal tracking
      try {
        const prefix = getStudentStoragePrefix();
        const tsMap = JSON.parse(localStorage.getItem(prefix + '_timestamps') || '{}');
        const now = Date.now();
        (attemptLog.questionResults || []).forEach(qr => {
          if (qr.userOpt && qr.userOpt !== 'E') {
            tsMap[qr.id] = now;
          }
        });
        localStorage.setItem(prefix + '_timestamps', JSON.stringify(tsMap));
      } catch (e) {}

      // Save mistakes from mock test into Mistake Register
      try {
        const reg = (typeof loadMistakeRegister === 'function') ? loadMistakeRegister() : {};
        (attemptLog.questionResults || []).forEach(qr => {
          if (qr.userOpt && qr.userOpt !== 'E') {
            if (qr.isCorrect) {
              if (reg[qr.id]) {
                reg[qr.id].consecutiveCorrect = (reg[qr.id].consecutiveCorrect || 0) + 1;
                reg[qr.id].lastAttempted = Date.now();
                if (reg[qr.id].consecutiveCorrect >= 2) {
                  delete reg[qr.id];
                }
              }
            } else {
              // Answered wrong
              if (reg[qr.id]) {
                reg[qr.id].wrongCount = (reg[qr.id].wrongCount || 0) + 1;
                reg[qr.id].consecutiveCorrect = 0;
                reg[qr.id].lastAttempted = Date.now();
                reg[qr.id].lastWrongOpt = qr.userOpt;
                reg[qr.id].source = 'mock';
              } else {
                reg[qr.id] = {
                  id: qr.id,
                  wrongCount: 1,
                  consecutiveCorrect: 0,
                  lastAttempted: Date.now(),
                  lastWrongOpt: qr.userOpt,
                  source: 'mock'
                };
              }
            }
          }
        });
        if (typeof saveMistakeRegister === 'function') saveMistakeRegister(reg);
      } catch (e) {}

      // Fire Google Sheets sync immediately
      syncAspirantToGoogleSheets({
        event: 'test_completed',
        attemptId: attemptLog.attemptId,
        name: attemptLog.studentName,
        phone: attemptLog.studentPhone,
        email: attemptLog.studentEmail,
        district: attemptLog.studentDistrict,
        targetExam: attemptLog.targetExam,
        examTitle: attemptLog.examTitle,
        score: attemptLog.score,
        correct: attemptLog.correct,
        wrong: attemptLog.wrong,
        safeSkip: attemptLog.safeSkip,
        blank: attemptLog.blank,
        attempted: attemptLog.attempted,
        totalQ: attemptLog.totalQ,
        timestamp: attemptLog.timestamp,
        userAgent: navigator.userAgent
      });

      saveTestAttemptRecord(attemptLog);

      // Prepare Social Share Links & Canvas Scorecard (Feature 1.7)
      prepareMockShare({
        examTitle: attemptLog.examTitle,
        score: attemptLog.score,
        correct: attemptLog.correct,
        wrong: attemptLog.wrong,
        safeSkip: attemptLog.safeSkip,
        blank: attemptLog.blank,
        totalMarks: attemptLog.totalQ
      });

      // Populate Question-by-Question Explanations List in Result Modal (Feature 2.2)
      renderResultQuestionsList(validQuestions, mockUserAnswers);

      document.getElementById('tt-result-modal').classList.remove('hidden');
    }

    // ==========================================
    // RESULT SHARING & SCORECARD ENGINE (Feature 1.7)
    // ==========================================
    let latestShareData = null;

    function prepareMockShare(resultData) {
      latestShareData = resultData;
      const examTitle = resultData.examTitle || 'BPSC Full-Length Mock Test';
      const score = resultData.score;
      const totalMarks = resultData.totalMarks || 150;
      const correct = resultData.correct;
      const wrong = resultData.wrong;
      const safeSkip = resultData.safeSkip;
      const blank = resultData.blank;

      // STRICT PRIVACY: ZERO personal data (no name, email, phone)
      const shareText = 
`🎯 My BPSC Mock Test Result on ShaktiQ:
📝 Exam: ${examTitle}
🏆 Net Score: ${score} / ${totalMarks}
✅ Correct (+1.0): ${correct}
❌ Wrong (-1/3): ${wrong}
🛡️ Option E Safe-Skip (0): ${safeSkip}
⚠️ Blank Unbubbled (-1/3): ${blank}

Practice 2,800+ Official BPSC PYQs & 22 Full Mocks at https://shaktiq.com`;

      const waBtn = document.getElementById('share-whatsapp-btn');
      if (waBtn) {
        waBtn.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      }

      const tgBtn = document.getElementById('share-telegram-btn');
      if (tgBtn) {
        tgBtn.href = `https://t.me/share/url?url=${encodeURIComponent('https://shaktiq.com')}&text=${encodeURIComponent(shareText)}`;
      }

      drawScorecardCanvas(resultData);
    }

    function copyMockResultText() {
      if (!latestShareData) return;
      const examTitle = latestShareData.examTitle || 'BPSC Full-Length Mock Test';
      const shareText = 
`🎯 My BPSC Mock Test Result on ShaktiQ:
📝 Exam: ${examTitle}
🏆 Net Score: ${latestShareData.score} / ${latestShareData.totalMarks || 150}
✅ Correct (+1.0): ${latestShareData.correct}
❌ Wrong (-1/3): ${latestShareData.wrong}
🛡️ Option E Safe-Skip (0): ${latestShareData.safeSkip}
⚠️ Blank Unbubbled (-1/3): ${latestShareData.blank}

Practice 2,800+ Official BPSC PYQs & 22 Full Mocks at https://shaktiq.com`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          const copyLabel = document.getElementById('copy-btn-label');
          if (copyLabel) {
            const orig = copyLabel.textContent;
            copyLabel.textContent = 'Copied! ✓';
            setTimeout(() => { copyLabel.textContent = orig; }, 2000);
          }
          showToast('Result copied to clipboard! (Zero personal data included)', 'info');
        }).catch(() => {
          fallbackCopyText(shareText);
        });
      } else {
        fallbackCopyText(shareText);
      }
    }

    function fallbackCopyText(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('Result copied to clipboard!', 'info');
      } catch (e) {
        showToast('Unable to copy text automatically.', 'error');
      }
      document.body.removeChild(ta);
    }

    function drawScorecardCanvas(data) {
      const canvas = document.getElementById('scorecard-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#10402D');
      bgGrad.addColorStop(1, '#082217');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Outer border
      ctx.strokeStyle = 'rgba(252, 226, 123, 0.3)';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      // Top header branding
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ShaktiQ', 40, 65);

      ctx.fillStyle = '#FCE27B';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('BPSC PATTERN MOCK SCORECARD', 40, 88);

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('shaktiq.com', w - 40, 65);

      // Exam Title
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const titleText = data.examTitle || 'BPSC Prelims Mock Test';
      ctx.fillText(titleText.length > 38 ? titleText.slice(0, 36) + '...' : titleText, 40, 135);

      // Score Hero Box
      ctx.fillStyle = 'rgba(252, 226, 123, 0.12)';
      ctx.strokeStyle = '#FCE27B';
      ctx.lineWidth = 1.5;
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(40, 160, w - 80, 130, 16);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(40, 160, w - 80, 130);
        ctx.strokeRect(40, 160, w - 80, 130);
      }

      ctx.fillStyle = '#FCE27B';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('OFFICIAL NET SCORE', 60, 195);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(String(data.score || '0.00'), 60, 250);

      ctx.fillStyle = '#DCE6DF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`/ ${data.totalMarks || 150} Marks`, 220, 248);

      // 4 Metric Boxes
      const metrics = [
        { label: 'Correct (+1.0)', val: data.correct || 0, color: '#85E0A3' },
        { label: 'Wrong (-1/3)', val: data.wrong || 0, color: '#FFA8A8' },
        { label: 'Opt E Skip (0)', val: data.safeSkip || 0, color: '#FCE27B' },
        { label: 'Blank (-1/3)', val: data.blank || 0, color: '#E5ECE6' }
      ];

      const boxW = (w - 80 - 36) / 4;
      metrics.forEach((m, idx) => {
        const x = 40 + idx * (boxW + 12);
        const y = 310;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, 100, 12);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(x, y, boxW, 100);
          ctx.strokeRect(x, y, boxW, 100);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(m.label, x + 10, y + 28);

        ctx.fillStyle = m.color;
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(String(m.val), x + 10, y + 72);
      });

      // BPSC Negative Marking Protocol
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(40, 430, w - 80, 75, 12);
        ctx.fill();
      } else {
        ctx.fillRect(40, 430, w - 80, 75);
      }

      ctx.fillStyle = '#FCE27B';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('BPSC Marking Rules Applied:', 55, 455);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('• Option E Safe-Skip: 0 penalty when bubbled.', 55, 475);
      ctx.fillText('• Blank Unbubbled Penalty: -1/3 penalty strictly applied.', 55, 492);

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Attempt-First Active Recall • 2800+ PYQs • https://shaktiq.com', w / 2, 550);
    }

    function shareOrDownloadScorecard() {
      const canvas = document.getElementById('scorecard-canvas');
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'shaktiq-mock-scorecard.png', { type: 'image/png' });
        
        // Check Web Share API
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'My ShaktiQ BPSC Mock Result',
              text: `Scored ${latestShareData?.score || 0} on ${latestShareData?.examTitle || 'BPSC Mock Test'} on ShaktiQ (shaktiq.com)!`,
              files: [file]
            });
            return;
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.warn('Web share failed, falling back to download', err);
            } else {
              return;
            }
          }
        }

        // Fallback: download
        const link = document.createElement('a');
        link.download = 'shaktiq-mock-scorecard.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Scorecard image downloaded!', 'info');
      }, 'image/png');
    }

    function exitMockTest() {
      if (mockTimerInterval) clearInterval(mockTimerInterval);
      const qbHeader = document.getElementById('qb-sticky-header');
      if (qbHeader) qbHeader.classList.remove('mock-hide-header-mobile');
      document.getElementById('test-taking-workspace').classList.add('hidden');
      document.getElementById('view-testseries').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Exited mock test simulation.', 'info');
    }

    function closeTestResultModal() {
      const qbHeader = document.getElementById('qb-sticky-header');
      if (qbHeader) qbHeader.classList.remove('mock-hide-header-mobile');
      document.getElementById('tt-result-modal').classList.add('hidden');
      document.getElementById('test-taking-workspace').classList.add('hidden');
      document.getElementById('view-testseries').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // RESULT QUESTION EXPLANATIONS ENGINE (Feature 2.2)
    // Instant Question-by-Question Explanations & Links
    // ==========================================
    function renderResultQuestionsList(questions, userAnswers) {
      const container = document.getElementById('tt-result-questions-list');
      const titleEl = document.getElementById('tt-result-explanations-title');
      const subtitleEl = document.getElementById('tt-result-explanations-subtitle');
      if (!container) return;

      const isSpeed = activeMockTest && activeMockTest.isSpeedDrill;
      const isHindi = (ShaktiQBilingualEngine && ShaktiQBilingualEngine.currentLang === 'hi');

      if (titleEl) {
        titleEl.textContent = isSpeed 
          ? (isHindi ? '10-मिनट स्पीड ड्रिल: सभी 15 प्रश्नों के उत्तर व विस्तृत व्याख्या' : '10-Min Speed Drill: All 15 Question Explanations') 
          : (isHindi ? 'प्रश्नों के उत्तर व आधिकारिक व्याख्या' : 'Question Explanations & Published Keys');
      }

      let correctCount = 0;
      let wrongCount = 0;
      questions.forEach((q, idx) => {
        const uPick = userAnswers[idx];
        if (uPick && uPick !== 'E') {
          if (uPick === q.ans) correctCount++;
          else wrongCount++;
        }
      });

      if (subtitleEl) {
        subtitleEl.textContent = `${questions.length} Qs (${correctCount} ✓ / ${wrongCount} ✗)`;
      }

      let listHtml = '';
      questions.forEach((q, idx) => {
        const userOpt = userAnswers[idx];
        const isCorrect = (userOpt === q.ans);
        const isSafeSkip = (userOpt === 'E');
        const isBlank = !userOpt;

        let statusPill = '';
        let borderClass = 'border-[#E5ECE6]';
        if (isSafeSkip) {
          statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0]">${isHindi ? 'सुरक्षित छोड़ा (0)' : 'Safe Skip (0)'}</span>`;
        } else if (isBlank) {
          statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">${isHindi ? 'खाली छोड़ा (-1/3)' : 'Blank (-1/3)'}</span>`;
          borderClass = 'border-rose-100';
        } else if (isCorrect) {
          statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECF6E7] text-[#10402D] border border-[#C5DEC0]">✓ ${isHindi ? 'सही (+1.0)' : 'Correct (+1.0)'}</span>`;
        } else {
          statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">✗ ${isHindi ? 'गलत (-1/3)' : 'Wrong (-1/3)'}</span>`;
          borderClass = 'border-rose-100';
        }

        const cleanStem = cleanQuestionStem(q.q || '');
        const previewStem = cleanStem.length > 95 ? cleanStem.substring(0, 92) + '...' : cleanStem;

        listHtml += `
          <div class="p-3 rounded-xl bg-white border ${borderClass} shadow-2xs hover:border-[#10402D] transition space-y-1.5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md bg-[#F4F9F2] text-[#10402D] font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#DCE6DF]">
                  ${idx + 1}
                </span>
                <span class="text-xs font-semibold text-[#111C15]">${escapeHtml(q.subject || 'General Studies')}</span>
              </div>
              ${statusPill}
            </div>
            <p class="text-xs text-[#3B493F] leading-snug font-serif line-clamp-2">${escapeHtml(previewStem)}</p>
            <div class="flex items-center justify-between gap-2 pt-1 border-t border-[#F0F4F1] text-xs">
              <span class="text-[11px] text-[#526056]">
                ${userOpt ? `Chosen: <strong>Opt ${userOpt}</strong>` : '<span class="text-rose-600 font-semibold">Not Attempted</span>'} 
                • Key: <strong class="text-[#10402D]">Opt ${q.ans}</strong>
              </span>
              <button type="button" onclick="ttReviewSpecificSolution(${idx})" class="inline-flex items-center gap-1 text-[11px] font-bold text-[#10402D] hover:underline cursor-pointer">
                <span>Read Explanation</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = listHtml;
      initIcons();
    }

    function ttReviewSpecificSolution(targetIdx) {
      ttReviewSolutions();
      currentReviewIndex = targetIdx;
      buildFilteredReviewIndices();
      renderCurrentSolutionQuestion();
      renderSolutionPalette();
      const targetEl = document.getElementById('sol-question-text');
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function solPracticeInPyqBank() {
      const currentQ = reviewMockQuestions[currentReviewIndex];
      const subj = currentQ ? currentQ.subject : null;
      document.getElementById('test-solution-workspace').classList.add('hidden');
      openPyqBankMode();
      if (subj) {
        setTimeout(() => {
          if (typeof selectSubjectFilter === 'function') {
            selectSubjectFilter(subj);
          } else {
            const pill = document.querySelector(`[data-subject-pill="${subj}"]`);
            if (pill) pill.click();
          }
        }, 150);
      }
    }

    // ==========================================
    // DEDICATED SOLUTION REVIEW ENGINE
    // (Completely independent from PYQ Question Bank)
    // ==========================================
    let reviewMockQuestions = [];
    let reviewUserAnswers = {};
    let reviewFilter = 'all'; // 'all', 'correct', 'wrong', 'unattempted'
    let currentReviewIndex = 0;
    let filteredReviewIndices = [];

    function ttReviewSolutions() {
      // Close Result Modal & Test Taking workspace
      document.getElementById('tt-result-modal').classList.add('hidden');
      document.getElementById('test-taking-workspace').classList.add('hidden');
      
      // Hide test series and ensure PYQ bank is completely hidden
      document.getElementById('view-testseries').classList.add('hidden');
      const viewBank = document.getElementById('view-bank');
      if (viewBank) viewBank.classList.add('hidden');

      // Show dedicated Solutions Workspace
      const solWs = document.getElementById('test-solution-workspace');
      if (solWs) solWs.classList.remove('hidden');

      // Initialize review state from current test
      reviewMockQuestions = currentMockQuestions ? [...currentMockQuestions] : [];
      reviewUserAnswers = mockUserAnswers ? {...mockUserAnswers} : {};
      reviewFilter = 'all';
      currentReviewIndex = 0;

      // Update Header Test Title
      const titleEl = document.getElementById('sol-exam-title');
      if (titleEl) {
        titleEl.textContent = (activeMockTest ? activeMockTest.title : "BPSC Mock Test") + " — Solutions & Analysis";
      }

      // Calculate stats for solution view
      updateSolutionStatsAndCounts();
      buildFilteredReviewIndices();
      renderCurrentSolutionQuestion();
      renderSolutionPalette();

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast("Displaying detailed solutions for this test only.", "success");
    }

    function updateSolutionStatsAndCounts() {
      let correct = 0;
      let wrong = 0;
      let safeSkip = 0;
      let blank = 0;

      reviewMockQuestions.forEach((q, idx) => {
        const uPick = reviewUserAnswers[idx];
        if (!uPick) {
          blank += 1;
        } else if (uPick === 'E') {
          safeSkip += 1;
        } else if (uPick === q.ans) {
          correct += 1;
        } else {
          wrong += 1;
        }
      });

      const total = reviewMockQuestions.length;
      const netScore = ((correct * 3 - wrong - blank) / 3).toFixed(2);
      const attempted = correct + wrong;
      const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : "0";

      const countAll = document.getElementById('sol-count-all');
      const countCor = document.getElementById('sol-count-correct');
      const countWrn = document.getElementById('sol-count-wrong');
      const countUna = document.getElementById('sol-count-unattempted');
      const statScore = document.getElementById('sol-stat-score');
      const statAcc = document.getElementById('sol-stat-accuracy');

      if (countAll) countAll.textContent = total;
      if (countCor) countCor.textContent = correct;
      if (countWrn) countWrn.textContent = wrong;
      if (countUna) countUna.textContent = `${blank} blank (${safeSkip} safe skipped)`;
      if (statScore) statScore.textContent = `${netScore} / ${total}`;
      if (statAcc) statAcc.textContent = `${accuracy}%`;
    }

    function buildFilteredReviewIndices() {
      filteredReviewIndices = [];
      reviewMockQuestions.forEach((q, idx) => {
        const uPick = reviewUserAnswers[idx];
        if (reviewFilter === 'all') {
          filteredReviewIndices.push(idx);
        } else if (reviewFilter === 'correct' && uPick === q.ans) {
          filteredReviewIndices.push(idx);
        } else if (reviewFilter === 'wrong' && uPick && uPick !== q.ans) {
          filteredReviewIndices.push(idx);
        } else if (reviewFilter === 'unattempted' && !uPick) {
          filteredReviewIndices.push(idx);
        }
      });

      if (!filteredReviewIndices.includes(currentReviewIndex)) {
        currentReviewIndex = filteredReviewIndices.length > 0 ? filteredReviewIndices[0] : 0;
      }
    }

    function filterSolutionQuestions(mode) {
      reviewFilter = mode;
      buildFilteredReviewIndices();

      if (mode !== 'all' && filteredReviewIndices.length === 0) {
        const labelMap = { correct: 'correct', wrong: 'incorrect', unattempted: 'unattempted' };
        showToast(`No ${labelMap[mode] || mode} questions in this attempt.`, 'info');
        reviewFilter = 'all';
        buildFilteredReviewIndices();
      }

      // Update button active styling
      document.querySelectorAll('.sol-filter-btn').forEach(btn => {
        btn.classList.remove('bg-[#10402D]', 'text-white', 'shadow-sm');
        btn.classList.add('bg-[#F8FAF7]', 'text-[#223127]');
      });

      const activeBtn = document.getElementById('sol-filter-btn-' + reviewFilter);
      if (activeBtn) {
        activeBtn.classList.remove('bg-[#F8FAF7]', 'text-[#223127]');
        activeBtn.classList.add('bg-[#10402D]', 'text-white', 'shadow-sm');
      }

      renderCurrentSolutionQuestion();
      renderSolutionPalette();
    }

    function renderCurrentSolutionQuestion() {
      if (!reviewMockQuestions || reviewMockQuestions.length === 0) return;
      const q = reviewMockQuestions[currentReviewIndex];
      if (!q) return;

      const isHindi = (ShaktiQBilingualEngine.currentLang === 'hi');
      const userPick = reviewUserAnswers[currentReviewIndex];
      const isOptionE = (userPick === 'E');
      const isBlank = !userPick;
      const isCorrect = (userPick === q.ans && !isOptionE);

      // Index label
      document.getElementById('sol-q-index-label').textContent = isHindi
        ? `प्रश्न ${currentReviewIndex + 1} / ${reviewMockQuestions.length}`
        : `Question ${currentReviewIndex + 1} of ${reviewMockQuestions.length}`;
      document.getElementById('sol-q-subject-badge').textContent = isHindi 
        ? getSubjectInHindi(q.subject) 
        : (q.subject || 'General Studies');

      // Status badge (BPSC New Rule)
      const statusBadge = document.getElementById('sol-q-status-badge');
      if (isCorrect) {
        statusBadge.className = 'px-2.5 py-0.5 rounded-lg font-bold bg-[#ECF6E7] text-[#10402D] border border-[#C5DEC0] text-xs';
        statusBadge.textContent = isHindi ? '✓ सही (+1.00 अंक)' : '✓ Correct (+1.00)';
      } else if (isOptionE) {
        statusBadge.className = 'px-2.5 py-0.5 rounded-lg font-bold bg-[#EBF3E6] text-[#10402D] border border-[#C6DEC0] text-xs';
        statusBadge.textContent = isHindi ? 'विकल्प (E) चुना • सुरक्षित छोड़ा (0 अंक)' : 'Option (E) Marked • Safe Skip (0 Penalty)';
      } else if (isBlank) {
        statusBadge.className = 'px-2.5 py-0.5 rounded-lg font-bold bg-rose-50 text-rose-800 border border-rose-200 text-xs';
        statusBadge.textContent = isHindi ? 'खाली छोड़ा (-1/3 अंक कटा) • विकल्प E नहीं भरा' : 'Blank / Unbubbled (-1/3 Penalty) • Did not mark Option E';
      } else {
        statusBadge.className = 'px-2.5 py-0.5 rounded-lg font-bold bg-rose-50 text-rose-700 border border-rose-200 text-xs';
        statusBadge.textContent = isHindi ? `✗ गलत उत्तर (-1/3 अंक) • आपने चुना विकल्प ${userPick}` : `✗ Incorrect (-1/3) • You picked Option ${userPick}`;
      }

      const qTextEl = document.getElementById('sol-question-text');
      const container = document.getElementById('sol-options-container');
      const baseOpts = q.options ? [...q.options] : [];

      const renderSolutionOpts = (optsArray, isHi) => {
        let optsHtml = '';
        optsArray.forEach((optItem) => {
          const letter = optItem.letter;
          const optText = optItem.isSafeSkip ? optItem.text : stripOptionPrefix(optItem.text);
          const isOfficialAns = (letter === q.ans);
          const isUserChoice = (letter === userPick);

          let borderBgClass = 'border-[#DCE6DF] bg-[#F8FAF7] text-[#111C15]';
          let letterCircleClass = 'border-[#95A79A] text-[#3B493F] bg-white';
          let badgeHtml = '';

          if (optItem.isSafeSkip) {
            if (isUserChoice) {
              borderBgClass = 'border-[#10402D] bg-[#ECF6E7] text-[#10402D] font-bold';
              letterCircleClass = 'border-[#10402D] bg-[#10402D] text-white font-bold';
              badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#10402D] border border-[#C5DEC0]">${isHi ? 'आपका विकल्प (सुरक्षित छोड़ा • 0 अंक)' : 'Your Choice (Safe Skip • 0 Penalty)'}</span>`;
            } else {
              borderBgClass = 'border-[#DCE6DF] bg-[#FAFAF8] text-[#526056]';
              letterCircleClass = 'border-[#95A79A] text-[#526056] bg-white';
              badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF3E6] text-[#10402D]">${isHi ? 'सुरक्षित छोड़ें (0 अंक)' : 'Safe Skip (0 Penalty)'}</span>`;
            }
          } else if (isOfficialAns && isUserChoice) {
            borderBgClass = 'border-[#10402D] bg-[#ECF6E7] text-[#10402D] font-bold';
            letterCircleClass = 'border-[#10402D] bg-[#10402D] text-white font-bold';
            badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#10402D] border border-[#C5DEC0]">${isHi ? '✓ आपका उत्तर (सही +1.0)' : '✓ Your Answer (Correct +1.0)'}</span>`;
          } else if (isOfficialAns) {
            borderBgClass = 'border-[#10402D] bg-[#ECF6E7] text-[#10402D] font-bold';
            letterCircleClass = 'border-[#10402D] bg-[#10402D] text-white font-bold';
            badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#10402D] border border-[#C5DEC0]">${isHi ? '✓ आधिकारिक उत्तर' : '✓ Correct Answer'}</span>`;
          } else if (isUserChoice) {
            borderBgClass = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
            letterCircleClass = 'border-rose-600 bg-rose-600 text-white font-bold';
            badgeHtml = `<span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-700 border border-rose-200">${isHi ? '✗ आपका उत्तर (गलत -1/3)' : '✗ Your Choice (Incorrect -1/3)'}</span>`;
          }

          optsHtml += `
            <div class="p-3.5 rounded-2xl border ${borderBgClass} flex items-center gap-3 transition">
              <span class="w-6 h-6 rounded-full border ${letterCircleClass} flex items-center justify-center font-bold text-xs shrink-0">
                ${letter}
              </span>
              <span class="text-sm leading-relaxed">${escapeHtml(optText)}</span>
              ${badgeHtml}
            </div>
          `;
        });
        return optsHtml;
      };

      const pill = document.getElementById('sol-correct-answer-pill');
      if (pill) pill.textContent = isHindi ? `प्रकाशित उत्तर कुंजी: विकल्प ${q.ans}` : `Published Key: Option ${q.ans}`;
      const expEl = document.getElementById('sol-explanation-text');

      if (!isHindi) {
        qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(q.q));
        const reviewOptsEn = [
          { letter: 'A', text: baseOpts[0] || '(A)' },
          { letter: 'B', text: baseOpts[1] || '(B)' },
          { letter: 'C', text: baseOpts[2] || '(C)' },
          { letter: 'D', text: baseOpts[3] || '(D)' },
          { letter: 'E', text: 'Option (E) — Not Attempted / अनुत्तरित प्रश्न (Safe Skip • 0 Penalty)', isSafeSkip: true }
        ];
        container.innerHTML = renderSolutionOpts(reviewOptsEn, false);
        if (expEl) {
          const expContent = q.exp ? escapeHtml(q.exp) : "Solution & explanation based on published answer keys.";
          expEl.innerHTML = `<p>${expContent}</p>`;
        }
      } else {
        const cached = ShaktiQBilingualEngine.getCachedQuestion(q.id || q.q);
        if (cached) {
          qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(cached.q));
          const reviewOptsHi = [
            { letter: 'A', text: cached.options[0] || baseOpts[0] || '(A)' },
            { letter: 'B', text: cached.options[1] || baseOpts[1] || '(B)' },
            { letter: 'C', text: cached.options[2] || baseOpts[2] || '(C)' },
            { letter: 'D', text: cached.options[3] || baseOpts[3] || '(D)' },
            { letter: 'E', text: 'विकल्प (E) — अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)', isSafeSkip: true }
          ];
          container.innerHTML = renderSolutionOpts(reviewOptsHi, true);
          if (expEl) expEl.innerHTML = `<p>${escapeHtml(cached.exp || q.exp || '')}</p>`;
        } else {
          qTextEl.innerHTML = `<span class="opacity-80">${renderFormattedQuestionHtml(cleanQuestionStem(q.q))}</span><span class="block mt-2 text-xs font-semibold text-[#10402D] animate-pulse">हिन्दी व्याख्या लोड हो रही है...</span>`;
          const reviewOptsPlaceholder = [
            { letter: 'A', text: baseOpts[0] || '(A)' },
            { letter: 'B', text: baseOpts[1] || '(B)' },
            { letter: 'C', text: baseOpts[2] || '(C)' },
            { letter: 'D', text: baseOpts[3] || '(D)' },
            { letter: 'E', text: 'विकल्प (E) — अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)', isSafeSkip: true }
          ];
          container.innerHTML = renderSolutionOpts(reviewOptsPlaceholder, true);

          const currentReviewIdx = currentReviewIndex;
          ShaktiQBilingualEngine.translateQuestionBundle(q.id || q.q, q.q, baseOpts, q.exp).then(hiBundle => {
            if (currentReviewIndex === currentReviewIdx && ShaktiQBilingualEngine.currentLang === 'hi') {
              qTextEl.innerHTML = renderFormattedQuestionHtml(cleanQuestionStem(hiBundle.q));
              const reviewOptsHiLoaded = [
                { letter: 'A', text: hiBundle.options[0] || baseOpts[0] || '(A)' },
                { letter: 'B', text: hiBundle.options[1] || baseOpts[1] || '(B)' },
                { letter: 'C', text: hiBundle.options[2] || baseOpts[2] || '(C)' },
                { letter: 'D', text: hiBundle.options[3] || baseOpts[3] || '(D)' },
                { letter: 'E', text: 'विकल्प (E) — अनुत्तरित प्रश्न (सुरक्षित छोड़ें • 0 अंक कटेगा)', isSafeSkip: true }
              ];
              container.innerHTML = renderSolutionOpts(reviewOptsHiLoaded, true);
              if (expEl) expEl.innerHTML = `<p>${escapeHtml(hiBundle.exp || q.exp || '')}</p>`;
            }
          });
        }
      }

      ShaktiQBilingualEngine.updateButtonsUI();
      initIcons();
    }

    function renderSolutionPalette() {
      const grid = document.getElementById('sol-palette-grid');
      if (!grid) return;

      let btnsHtml = '';
      reviewMockQuestions.forEach((q, idx) => {
        const userPick = reviewUserAnswers[idx];
        const isCorrect = (userPick === q.ans);
        const isUnattempted = !userPick;
        const isCurrent = (idx === currentReviewIndex);

        let colorClass = 'bg-[#EBF3E6] text-[#223127] border-[#C6DEC0]';
        if (isCorrect) {
          colorClass = 'bg-[#10402D] text-white border-[#10402D] font-bold';
        } else if (!isUnattempted) {
          colorClass = 'bg-rose-600 text-white border-rose-600 font-bold';
        }

        if (isCurrent) {
          colorClass += ' ring-2 ring-[#10402D] ring-offset-2';
        }

        // If filtering, dim non-matching buttons
        const matchesFilter = filteredReviewIndices.includes(idx);
        const opacityClass = matchesFilter ? 'opacity-100' : 'opacity-25 hover:opacity-75';

        btnsHtml += `
          <button type="button" onclick="solJumpToQuestion(${idx})" class="w-full aspect-square rounded-xl text-xs border flex items-center justify-center transition cursor-pointer ${colorClass} ${opacityClass}">
            ${idx + 1}
          </button>
        `;
      });

      grid.innerHTML = btnsHtml;
    }

    function solJumpToQuestion(idx) {
      currentReviewIndex = idx;
      renderCurrentSolutionQuestion();
      renderSolutionPalette();
    }

    function solNextQuestion() {
      const list = (filteredReviewIndices && filteredReviewIndices.length > 0)
        ? filteredReviewIndices
        : reviewMockQuestions.map((_, i) => i);
      const pos = list.indexOf(currentReviewIndex);
      if (pos !== -1 && pos < list.length - 1) {
        currentReviewIndex = list[pos + 1];
        renderCurrentSolutionQuestion();
        renderSolutionPalette();
      } else if (pos === -1 && currentReviewIndex < reviewMockQuestions.length - 1) {
        currentReviewIndex += 1;
        renderCurrentSolutionQuestion();
        renderSolutionPalette();
      } else {
        showToast("You are viewing the final solution in this filter.", "info");
      }
    }

    function solPrevQuestion() {
      const list = (filteredReviewIndices && filteredReviewIndices.length > 0)
        ? filteredReviewIndices
        : reviewMockQuestions.map((_, i) => i);
      const pos = list.indexOf(currentReviewIndex);
      if (pos > 0) {
        currentReviewIndex = list[pos - 1];
        renderCurrentSolutionQuestion();
        renderSolutionPalette();
      } else if (pos === -1 && currentReviewIndex > 0) {
        currentReviewIndex -= 1;
        renderCurrentSolutionQuestion();
        renderSolutionPalette();
      }
    }

    function exitTestSolutionReview() {
      document.getElementById('test-solution-workspace').classList.add('hidden');
      document.getElementById('view-testseries').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast("Returned to BPSC Mock Test Series.", "info");
    }

    function backToTestResultModal() {
      document.getElementById('test-solution-workspace').classList.add('hidden');
      document.getElementById('tt-result-modal').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

// Global exports for browser and node test runners
if (typeof window !== 'undefined') {
  window.currentMockQuestions = currentMockQuestions;
  window.mockUserAnswers = mockUserAnswers;
  window.mockMarkedForReview = mockMarkedForReview;
  window.activeMockTest = activeMockTest;
  window.renderTestSeriesCards = renderTestSeriesCards;
  window.filterTestSeries = filterTestSeries;
  window.getStudentAnalyticsData = getStudentAnalyticsData;
  window.renderStudentAnalyticsView = renderStudentAnalyticsView;
  window.openSubjectPractice = openSubjectPractice;
  window.switchStudentAccount = switchStudentAccount;
  window.startMockTest = startMockTest;
  window.updateMockTimer = updateMockTimer;
  window.renderCurrentQuestion = renderCurrentQuestion;
  window.openPaletteDrawer = openPaletteDrawer;
  window.closePaletteDrawer = closePaletteDrawer;
  window.renderQuestionPalette = renderQuestionPalette;
  window.ttSelectOption = ttSelectOption;
  window.ttSaveAndNext = ttSaveAndNext;
  window.ttPrevQuestion = ttPrevQuestion;
  window.ttClearResponse = ttClearResponse;
  window.ttMarkForReview = ttMarkForReview;
  window.ttJumpToQuestion = ttJumpToQuestion;
  window.setMockViewMode = setMockViewMode;
  window.updateViewToggleButtons = updateViewToggleButtons;
  window.renderVirtualOmrSheet = renderVirtualOmrSheet;
  window.getOmrRowHtml = getOmrRowHtml;
  window.updateSingleOmrRow = updateSingleOmrRow;
  window.highlightOmrRow = highlightOmrRow;
  window.updateOmrStats = updateOmrStats;
  window.selectOmrOption = selectOmrOption;
  window.jumpFromOmrToQuestion = jumpFromOmrToQuestion;
  window.filterOmrRows = filterOmrRows;
  window.applyOmrFilter = applyOmrFilter;
  window.getCutoffBand = getCutoffBand;
  window.renderCutoffMeter = renderCutoffMeter;
  window.submitMockTest = submitMockTest;
  window.prepareMockShare = prepareMockShare;
  window.copyMockResultText = copyMockResultText;
  window.fallbackCopyText = fallbackCopyText;
  window.drawScorecardCanvas = drawScorecardCanvas;
  window.shareOrDownloadScorecard = shareOrDownloadScorecard;
  window.exitMockTest = exitMockTest;
  window.closeTestResultModal = closeTestResultModal;
  window.renderResultQuestionsList = renderResultQuestionsList;
  window.ttReviewSpecificSolution = ttReviewSpecificSolution;
  window.solPracticeInPyqBank = solPracticeInPyqBank;
  window.ttReviewSolutions = ttReviewSolutions;
  window.updateSolutionStatsAndCounts = updateSolutionStatsAndCounts;
  window.buildFilteredReviewIndices = buildFilteredReviewIndices;
  window.filterSolutionQuestions = filterSolutionQuestions;
  window.renderCurrentSolutionQuestion = renderCurrentSolutionQuestion;
  window.renderSolutionPalette = renderSolutionPalette;
  window.solJumpToQuestion = solJumpToQuestion;
  window.solNextQuestion = solNextQuestion;
  window.solPrevQuestion = solPrevQuestion;
  window.exitTestSolutionReview = exitTestSolutionReview;
  window.backToTestResultModal = backToTestResultModal;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderTestSeriesCards,
    filterTestSeries,
    getStudentAnalyticsData,
    renderStudentAnalyticsView,
    openSubjectPractice,
    switchStudentAccount,
    startMockTest,
    updateMockTimer,
    renderCurrentQuestion,
    openPaletteDrawer,
    closePaletteDrawer,
    renderQuestionPalette,
    ttSelectOption,
    ttSaveAndNext,
    ttPrevQuestion,
    ttClearResponse,
    ttMarkForReview,
    ttJumpToQuestion,
    setMockViewMode,
    updateViewToggleButtons,
    renderVirtualOmrSheet,
    getOmrRowHtml,
    updateSingleOmrRow,
    highlightOmrRow,
    updateOmrStats,
    selectOmrOption,
    jumpFromOmrToQuestion,
    filterOmrRows,
    applyOmrFilter,
    getCutoffBand,
    renderCutoffMeter,
    submitMockTest,
    prepareMockShare,
    copyMockResultText,
    fallbackCopyText,
    drawScorecardCanvas,
    shareOrDownloadScorecard,
    exitMockTest,
    closeTestResultModal,
    renderResultQuestionsList,
    ttReviewSpecificSolution,
    solPracticeInPyqBank,
    ttReviewSolutions,
    updateSolutionStatsAndCounts,
    buildFilteredReviewIndices,
    filterSolutionQuestions,
    renderCurrentSolutionQuestion,
    renderSolutionPalette,
    solJumpToQuestion,
    solNextQuestion,
    solPrevQuestion,
    exitTestSolutionReview,
    backToTestResultModal
  };
}
