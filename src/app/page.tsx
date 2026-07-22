"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Play,
  Volume2,
  VolumeX,
  Plus,
  Trash,
  Edit,
  Settings,
  Flame,
  RotateCcw,
  Home,
  BookOpen,
  Sparkles,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Database,
  Award,
  Info,
  ChevronRight,
  AlertTriangle,
  RotateCcw as ResetIcon,
  HelpCircle,
  Undo
} from "lucide-react";
import { GameAudio } from "@/utils/audio";
import { CATEGORY_COLORS, DIFFICULTY_SETTINGS } from "@/utils/constants";

export default function BamboozleQuizApp() {
  // ─── Screen View State ──────────────────────────────────────────
  // "menu" | "settings" | "gameplay" | "results" | "leaderboard" | "admin"
  const [view, setView] = useState<"menu" | "settings" | "gameplay" | "results" | "leaderboard" | "admin">("menu");

  // ─── Global App Settings / Player State ────────────────────────
  const [playerName, setPlayerName] = useState<string>("Player 1");
  const [categories, setCategories] = useState<string[]>(["Geography", "Science", "Technology", "Math", "History"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard" | "All">("Medium");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [maxAvailableQs, setMaxAvailableQs] = useState<number>(20);
  const [soundEnabled, setSoundOn] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // ─── Quiz Session Live State ───────────────────────────────────
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<number>(0);
  const [timeBonuses, setTimeBonuses] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [bonusType, setBonusType] = useState<"streak" | "time" | "both" | null>(null);

  // ─── Leaderboard / High Scores State ───────────────────────────
  const [scoresList, setScoresList] = useState<any[]>([]);
  const [lbCategoryFilter, setLbCategoryFilter] = useState<string>("All");
  const [lbDifficultyFilter, setLbDifficultyFilter] = useState<string>("All");
  const [lbSearchQuery, setLbSearchQuery] = useState<string>("");

  // ─── Admin Questions Management State ─────────────────────────
  const [adminQuestions, setAdminQuestions] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState<string>("");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>("All");
  
  // Create / Edit Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [formText, setFormText] = useState<string>("");
  const [formOptions, setFormOptions] = useState<string[]>(["", "", "", ""]);
  const [formAnswer, setFormAnswer] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formDifficulty, setFormDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [formCustomCategory, setFormCustomCategory] = useState<string>("");
  const [useCustomCategory, setUseCustomCategory] = useState<boolean>(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string>("");
  const [adminErrorMsg, setAdminErrorMsg] = useState<string>("");

  // ─── Timer Reference ───────────────────────────────────────────
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Initial Load ──────────────────────────────────────────────
  useEffect(() => {
    fetchQuestionsMetadata();
    fetchLeaderboard();
  }, []);

  // Update sound settings when state changes
  useEffect(() => {
    if (soundEnabled) {
      if (GameAudio.getMuted()) {
        GameAudio.toggleMute();
      }
      if (view === "gameplay") {
        GameAudio.startBackgroundMusic();
      }
    } else {
      if (!GameAudio.getMuted()) {
        GameAudio.toggleMute();
      }
      GameAudio.stopBackgroundMusic();
    }
  }, [soundEnabled, view]);

  // Clean up music and timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      GameAudio.stopBackgroundMusic();
    };
  }, []);

  // ─── Fetch Categories & General Metadata ───────────────────────
  const fetchQuestionsMetadata = async () => {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setAdminQuestions(data.questions || []);
      }
    } catch (e) {
      console.error("Error fetching questions metadata:", e);
    }
  };

  // ─── Fetch Leaderboard ─────────────────────────────────────────
  const fetchLeaderboard = async () => {
    const params = new URLSearchParams();
    if (lbCategoryFilter !== "All") params.append("category", lbCategoryFilter);
    if (lbDifficultyFilter !== "All") params.append("difficulty", lbDifficultyFilter);
    if (lbSearchQuery) params.append("search", lbSearchQuery);

    try {
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setScoresList(data.scores || []);
      }
    } catch (e) {
      console.error("Error loading leaderboard:", e);
    }
  };

  // Trigger leaderboard fetch when filters change
  useEffect(() => {
    fetchLeaderboard();
  }, [lbCategoryFilter, lbDifficultyFilter, lbSearchQuery]);

  // Determine available questions count based on filters
  useEffect(() => {
    const fetchAvailableCount = async () => {
      const params = new URLSearchParams();
      params.append("numQuestions", "1000"); // ask for all to count
      params.append("category", selectedCategory);
      params.append("difficulty", selectedDifficulty);

      try {
        const res = await fetch(`/api/quiz-session?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          const count = data.questions?.length || 0;
          setMaxAvailableQs(count);
          if (numQuestions > count) {
            setNumQuestions(Math.max(1, count));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAvailableCount();
  }, [selectedCategory, selectedDifficulty]);

  // ─── Launch Quiz Session ───────────────────────────────────────
  const startQuiz = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("numQuestions", numQuestions.toString());
    params.append("category", selectedCategory);
    params.append("difficulty", selectedDifficulty);

    try {
      const res = await fetch(`/api/quiz-session?${params.toString()}`);
      const data = await res.json();
      setLoading(false);

      if (data.success && data.questions?.length > 0) {
        setQuizQuestions(data.questions);
        setCurrentQIndex(0);
        setScore(0);
        setStreak(0);
        setMaxStreak(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setTimeBonuses(0);
        setHasAnswered(false);
        setSelectedOptionIdx(null);
        setFeedbackMsg("");
        
        // Setup initial timer based on question difficulty
        const firstQ = data.questions[0];
        const initialTimer = DIFFICULTY_SETTINGS[firstQ.difficulty as "Easy" | "Medium" | "Hard"]?.timer || 20;
        setTimeLeft(initialTimer);

        setView("gameplay");
        
        if (soundEnabled) {
          GameAudio.startBackgroundMusic();
        }

        // Start local timer ticking
        initTimer(initialTimer, data.questions, 0);
      } else {
        alert("No questions found matching these filters. Please select different options or add questions.");
      }
    } catch (e) {
      setLoading(false);
      alert("Failed to start quiz. Check server connection.");
    }
  };

  // ─── Gameplay Timer Logic ──────────────────────────────────────
  const initTimer = (startSeconds: number, questionsArray: any[], qIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let secLeft = startSeconds;
    timeLeftRef.current = secLeft;

    timerRef.current = setInterval(() => {
      secLeft--;
      timeLeftRef.current = secLeft;
      setTimeLeft(secLeft);

      if (secLeft <= 5 && secLeft > 0) {
        // Warning tick sound
        if (soundEnabled) GameAudio.playTick();
      }

      if (secLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleTimeExpired(questionsArray, qIndex);
      }
    }, 1000);
  };

  // Store current timer in ref to access it immediately without closure capture lag
  const timeLeftRef = useRef<number>(20);

  // ─── Handle Time Expiration ────────────────────────────────────
  const handleTimeExpired = (questionsArray: any[], qIndex: number) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setStreak(0);
    setWrongAnswers((prev) => prev + 1);
    setFeedbackMsg("⏰ Time's up! Stay quick!");
    
    if (soundEnabled) GameAudio.playWrong();

    // Advance after brief pause
    setTimeout(() => {
      advanceOrFinish(questionsArray, qIndex + 1);
    }, 2500);
  };

  // ─── Check / Process Submitted Answer ─────────────────────────
  const checkAnswer = (selectedOption: string, optionIdx: number) => {
    if (hasAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setHasAnswered(true);
    setSelectedOptionIdx(optionIdx);

    const currentQ = quizQuestions[currentQIndex];
    const isCorrect = selectedOption.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();

    let pointsEarned = 0;
    let bType: "streak" | "time" | "both" | null = null;
    let newStreak = streak;

    if (isCorrect) {
      // Base points from difficulty
      const basePoints = DIFFICULTY_SETTINGS[currentQ.difficulty as "Easy" | "Medium" | "Hard"]?.points || 2;
      pointsEarned = basePoints;

      // Update Streak
      newStreak += 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
      setCorrectAnswers((prev) => prev + 1);

      // Streak Bonus: multiplied on multiples of 3
      let isStreakBonus = false;
      if (newStreak > 0 && newStreak % 3 === 0) {
        pointsEarned *= 2;
        isStreakBonus = true;
        bType = "streak";
      }

      // Speed Time Bonus: if answered quickly with >= 10 seconds remaining
      const secRemaining = timeLeftRef.current;
      let isTimeBonus = false;
      if (secRemaining >= 10) {
        pointsEarned += 1;
        setTimeBonuses((prev) => prev + 1);
        isTimeBonus = true;
        if (isStreakBonus) {
          bType = "both";
        } else {
          bType = "time";
        }
      }

      setScore((prev) => prev + pointsEarned);
      setEarnedPoints(pointsEarned);
      setBonusType(bType);

      // Sound and Feedback
      if (bType === "both" || bType === "streak") {
        if (soundEnabled) GameAudio.playStreak();
      } else {
        if (soundEnabled) GameAudio.playCorrect();
      }

      // Dynamic Encouraging Feedback Messages (matching user specifications)
      if (newStreak >= 9) {
        setFeedbackMsg("🔥 LEGENDARY! UNSTOPPABLE!");
      } else if (newStreak >= 6) {
        setFeedbackMsg("⚡ ON FIRE! Amazing streak!");
      } else if (newStreak >= 3) {
        setFeedbackMsg("🎯 STREAK BONUS! Keep going!");
      } else {
        const correctMsgs = [
          "✅ Correct! Well done!",
          "✅ Nailed it!",
          "✅ Great job!",
          "✅ You got it!",
          "✅ Brilliant!",
        ];
        setFeedbackMsg(correctMsgs[Math.floor(Math.random() * correctMsgs.length)]);
      }
    } else {
      // Wrong Answer - reset streak
      setStreak(0);
      setWrongAnswers((prev) => prev + 1);
      setEarnedPoints(0);
      setBonusType(null);

      if (soundEnabled) GameAudio.playWrong();

      const wrongMsgs = [
        "❌ Not quite! Keep trying!",
        "❌ Oops! You'll get the next one!",
        "❌ So close! Don't give up!",
        "❌ Wrong! Learn and move on!",
        "❌ Better luck next time!",
      ];
      setFeedbackMsg(wrongMsgs[Math.floor(Math.random() * wrongMsgs.length)]);
    }

    // Auto-advance after 2.2 seconds
    setTimeout(() => {
      advanceOrFinish(quizQuestions, currentQIndex + 1);
    }, 2200);
  };

  // ─── Advance Question or Finish Quiz ───────────────────────────
  const advanceOrFinish = (questionsArray: any[], nextIndex: number) => {
    if (nextIndex < questionsArray.length) {
      setCurrentQIndex(nextIndex);
      setHasAnswered(false);
      setSelectedOptionIdx(null);
      setFeedbackMsg("");
      setEarnedPoints(0);
      setBonusType(null);

      const nextQ = questionsArray[nextIndex];
      const timerVal = DIFFICULTY_SETTINGS[nextQ.difficulty as "Easy" | "Medium" | "Hard"]?.timer || 20;
      setTimeLeft(timerVal);
      initTimer(timerVal, questionsArray, nextIndex);
    } else {
      // Game Complete! Stop music, calculate statistics and grade
      if (timerRef.current) clearInterval(timerRef.current);
      GameAudio.stopBackgroundMusic();
      if (soundEnabled) GameAudio.playGameComplete();
      
      saveScoreToLeaderboard();
      setView("results");
    }
  };

  // ─── Save Score to Database ────────────────────────────────────
  const saveScoreToLeaderboard = async () => {
    const accuracyVal = parseFloat(((correctAnswers / numQuestions) * 100).toFixed(1)) || 0;
    
    // Calculate grade letter
    let calculatedGrade = "F 💪";
    if (accuracyVal >= 90) calculatedGrade = "S 🏆";
    else if (accuracyVal >= 80) calculatedGrade = "A ⭐";
    else if (accuracyVal >= 70) calculatedGrade = "B 👍";
    else if (accuracyVal >= 60) calculatedGrade = "C 😊";
    else if (accuracyVal >= 50) calculatedGrade = "D 😐";

    const scorePayload = {
      playerName: playerName.trim() || "Anonymous Hero",
      score: score,
      correctAnswers: correctAnswers,
      wrongAnswers: wrongAnswers,
      totalQuestions: numQuestions,
      accuracy: accuracyVal,
      maxStreak: maxStreak,
      timeBonuses: timeBonuses,
      grade: calculatedGrade,
      difficulty: selectedDifficulty === "All" ? "Mixed" : selectedDifficulty,
      category: selectedCategory === "All Categories" ? "Mixed" : selectedCategory,
    };

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scorePayload),
      });
      const data = await res.json();
      if (data.success) {
        // Reload high scores in the background
        fetchLeaderboard();
      }
    } catch (e) {
      console.error("Failed to submit score:", e);
    }
  };

  // ─── Replay with Same Settings ──────────────────────────────────
  const handleReplay = () => {
    startQuiz();
  };

  // ─── Reset / Seed Data Helper ──────────────────────────────────
  const handleResetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the database questions to the original default seeded set?")) {
      return;
    }
    try {
      setLoading(true);
      // Let's create an endpoint or trigger it directly. We can use our seed check or we can write a clean logic.
      // Wait, we can fetch an endpoint or run custom delete-and-reseed.
      // Let's make sure we have a reset path! We can post to questions with reset command or write a custom trigger.
      // Let's create a reset route or let's clean database then call fetch which triggers checkAndSeed.
      // To clear database, we can write an api route or delete questions via loop.
      // Let's implement an direct delete and trigger seed mechanism.
      const res = await fetch("/api/questions");
      const data = await res.json();
      if (data.success) {
        // Delete each question
        for (const q of data.questions) {
          await fetch(`/api/questions/${q.id}`, { method: "DELETE" });
        }
        // Fetching again will automatically re-seed!
        await fetchQuestionsMetadata();
        alert("Database successfully reset and re-seeded with the 20 classic original questions!");
      }
    } catch (e) {
      alert("Error resetting database questions.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Admin Question Management Actions ─────────────────────────
  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg("");
    setAdminErrorMsg("");

    const categoryVal = useCustomCategory ? formCustomCategory.trim() : formCategory;
    if (!formText.trim()) return setAdminErrorMsg("Question text is required");
    if (!categoryVal) return setAdminErrorMsg("Please choose or write a category");
    if (!formAnswer.trim()) return setAdminErrorMsg("Please select the correct answer option");

    // Check that options are not blank
    if (formOptions.some((opt) => !opt.trim())) {
      return setAdminErrorMsg("All 4 option fields must be filled in");
    }

    // Ensure correct answer matches one of the options
    if (!formOptions.includes(formAnswer)) {
      return setAdminErrorMsg("Correct answer must match exactly one of the four options");
    }

    const payload = {
      text: formText,
      options: formOptions,
      answer: formAnswer,
      category: categoryVal,
      difficulty: formDifficulty,
    };

    try {
      let res;
      if (editingQuestionId) {
        res = await fetch(`/api/questions/${editingQuestionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setAdminSuccessMsg(editingQuestionId ? "Question updated successfully!" : "New question added to arcade bank!");
        resetForm();
        fetchQuestionsMetadata();
      } else {
        setAdminErrorMsg(data.error || "Failed to save question");
      }
    } catch (err: any) {
      setAdminErrorMsg("Error saving question to database");
    }
  };

  const handleEditClick = (q: any) => {
    setEditingQuestionId(q.id);
    setFormText(q.text);
    setFormOptions([...q.options]);
    setFormAnswer(q.answer);
    setFormCategory(q.category);
    setFormDifficulty(q.difficulty);
    setUseCustomCategory(false);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this quiz question?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAdminSuccessMsg("Question deleted.");
        fetchQuestionsMetadata();
      } else {
        setAdminErrorMsg(data.error || "Failed to delete question");
      }
    } catch (e) {
      setAdminErrorMsg("Error deleting question");
    }
  };

  const resetForm = () => {
    setEditingQuestionId(null);
    setFormText("");
    setFormOptions(["", "", "", ""]);
    setFormAnswer("");
    setFormCategory("Geography");
    setFormCustomCategory("");
    setUseCustomCategory(false);
    setFormDifficulty("Medium");
  };

  // Helper colors for UI badges
  const getCategoryColor = (cat: string) => {
    return CATEGORY_COLORS[cat] || "#87CEEB";
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === "Easy") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (diff === "Medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  };

  return (
    <main className="min-h-screen bg-[#0F1015] text-[#E2E4E9] font-sans antialiased selection:bg-[#FFD369] selection:text-[#0F1015] pb-12">
      {/* ─── Global Top Navigation Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#161720]/90 backdrop-blur-md border-b border-[#252836] px-6 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView("menu"); GameAudio.stopBackgroundMusic(); }}>
            <div className="bg-gradient-to-tr from-[#FFD369] to-[#FF6B6B] p-2.5 rounded-xl shadow-[0_0_15px_rgba(255,211,105,0.4)] hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-6 h-6 text-[#12131A] animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wider text-[#FFD369] font-mono select-none flex items-center gap-2">
                BAMBOOZLE<span className="text-[#FF6B6B] animate-bounce">!</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Arcade Trivia System</p>
            </div>
          </div>

          {/* Quick Stats Banner or Actions */}
          <div className="flex items-center gap-4">
            {/* Sound Toggle Button */}
            <button
              onClick={() => setSoundOn(!soundEnabled)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                soundEnabled
                  ? "bg-amber-500/10 text-[#FFD369] border-[#FFD369]/30 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(255,211,105,0.15)]"
                  : "bg-[#1E1F29] text-gray-500 border-gray-800 hover:text-gray-300"
              }`}
              title={soundEnabled ? "Mute Game Sounds" : "Enable Sound Effects"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="text-xs font-bold uppercase hidden md:inline">
                {soundEnabled ? "Audio ON" : "Muted"}
              </span>
            </button>

            {/* Admin Questions Button */}
            <button
              onClick={() => {
                setView(view === "admin" ? "menu" : "admin");
                GameAudio.stopBackgroundMusic();
              }}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 uppercase tracking-wider transition-all duration-200 ${
                view === "admin"
                  ? "bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/50 shadow-[0_0_15px_rgba(255,107,107,0.3)]"
                  : "bg-[#1F212E] hover:bg-[#2D2F40] text-gray-300 border-[#2D3142]"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Questions Bank</span>
            </button>

            {/* Scoreboard Button */}
            <button
              onClick={() => {
                setView(view === "leaderboard" ? "menu" : "leaderboard");
                GameAudio.stopBackgroundMusic();
              }}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 uppercase tracking-wider transition-all duration-200 ${
                view === "leaderboard"
                  ? "bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/50 shadow-[0_0_15px_rgba(78,205,196,0.3)]"
                  : "bg-[#1F212E] hover:bg-[#2D2F40] text-gray-300 border-[#2D3142]"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Screens Switchboard ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mt-8">
        
        {/* ── SCREEN 1: SPLASH / MAIN MENU ────────────────────────── */}
        {view === "menu" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1E202E] to-[#12131A] rounded-3xl border border-[#2B2E3F] p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
              
              {/* Decorative light glows */}
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFD369]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FF6B6B]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 max-w-xl text-center lg:text-left z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#FFD369]/10 text-[#FFD369] border border-[#FFD369]/20">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Double Streak Bonuses Enabled
                </span>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white font-mono">
                  THE ULTIMATE <br className="hidden md:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD369] via-[#4ECDC4] to-[#C3A6FF]">
                    ARCADE QUIZ
                  </span>
                </h2>

                <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                  Test your brain across high-octane categories! Features dynamic timers, time bonuses for lightning-fast answers, and escalating score multipliers on correct streaks.
                </p>

                {/* Player Name Card */}
                <div className="bg-[#12131C] p-4 rounded-2xl border border-[#2E3247] shadow-inner max-w-sm mx-auto lg:mx-0">
                  <label className="block text-xs uppercase font-extrabold text-gray-400 tracking-wider mb-2 text-left">
                    👤 Challenger Profile Name:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                      placeholder="Enter Player Name..."
                      className="bg-[#1D1E2A] text-white font-mono font-bold text-lg px-4 py-2.5 rounded-xl border border-[#2E3146] focus:border-[#FFD369] focus:outline-none focus:ring-1 focus:ring-[#FFD369] w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                  <button
                    onClick={() => {
                      if (!playerName.trim()) {
                        alert("Please enter a player name first!");
                        return;
                      }
                      setView("settings");
                    }}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FFD369] to-[#F7B32B] text-[#12131A] font-black text-lg uppercase tracking-wider shadow-[0_10px_25px_rgba(247,179,43,0.3)] hover:shadow-[0_12px_30px_rgba(247,179,43,0.5)] hover:scale-[1.03] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Configure & Play</span>
                  </button>

                  <button
                    onClick={() => setView("leaderboard")}
                    className="px-6 py-4 rounded-2xl bg-[#1E202E] hover:bg-[#252837] text-white font-bold text-sm uppercase tracking-widest border border-[#2F3246] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-[#FFD369]" />
                    <span>View Champions</span>
                  </button>
                </div>
              </div>

              {/* Graphic Logo representation */}
              <div className="flex-1 w-full max-w-sm relative flex justify-center z-10">
                <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-[#1E202E] to-[#12131C] rounded-[40px] border border-[#2C2E43] shadow-3xl p-6 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ECDC4]/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Miniature Arcade screen */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-mono">CREDITS: 99</span>
                    <span className="animate-pulse flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 font-black px-2 py-0.5 rounded-full uppercase">
                      ● LIVE
                    </span>
                  </div>

                  <div className="text-center py-6">
                    <div className="text-4xl font-extrabold text-[#FFD369] animate-pulse">
                      READY?
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-mono">Select choices before timers run out!</p>
                  </div>

                  {/* Micro Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 bg-[#FF6B6B] rounded-xl shadow-lg transform active:scale-95 duration-100 flex items-center justify-center text-xs font-black text-slate-900 uppercase">A</div>
                    <div className="h-10 bg-[#4ECDC4] rounded-xl shadow-lg transform active:scale-95 duration-100 flex items-center justify-center text-xs font-black text-slate-900 uppercase">B</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#161720] border border-[#252735] p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">{adminQuestions.length}</div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Total Questions</div>
                </div>
              </div>

              <div className="bg-[#161720] border border-[#252735] p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">5</div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Original Themes</div>
                </div>
              </div>

              <div className="bg-[#161720] border border-[#252735] p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">S 🏆</div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Top Grade</div>
                </div>
              </div>

              <div className="bg-[#161720] border border-[#252735] p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">3x</div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Streak Bonus</div>
                </div>
              </div>
            </div>

            {/* High Scores Preview */}
            <div className="bg-[#161720] border border-[#252735] rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FFD369]" /> Current Global High Scores
                </h3>
                <span className="text-xs text-[#4ECDC4] hover:underline cursor-pointer" onClick={() => setView("leaderboard")}>
                  View All &rarr;
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scoresList.slice(0, 3).map((item, idx) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div
                      key={item.id}
                      className="bg-[#1E202E]/60 rounded-2xl p-4 border border-[#2A2D40] flex items-center justify-between hover:border-amber-500/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{medals[idx] || `#${idx + 1}`}</span>
                        <div>
                          <div className="font-extrabold text-white font-mono">{item.playerName}</div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">
                            {item.category} • {item.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#FFD369] font-mono">{item.score} pts</div>
                        <div className="text-xs text-cyan-400 font-mono">{item.accuracy}% Acc</div>
                      </div>
                    </div>
                  );
                })}
                {scoresList.length === 0 && (
                  <div className="col-span-3 text-center py-6 text-gray-500 text-sm">
                    No score records yet. Be the first to secure a legendary rank!
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── SCREEN 2: GAMEPLAY SETTINGS ────────────────────────── */}
        {view === "settings" && (
          <div className="max-w-3xl mx-auto bg-[#161720] border border-[#252735] rounded-3xl p-8 shadow-2xl space-y-8 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Settings className="text-[#FFD369]" /> Configure Your Arcade Session
                </h2>
                <p className="text-xs text-gray-400 mt-1">Player Profile: <span className="font-bold text-[#FFD369] font-mono">{playerName}</span></p>
              </div>
              <button
                onClick={() => setView("menu")}
                className="text-xs font-bold uppercase text-gray-400 hover:text-white bg-[#1F212E] px-3 py-1.5 rounded-xl border border-gray-800"
              >
                &larr; Back
              </button>
            </div>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-widest text-[#4ECDC4] mb-3">
                  🗂️ Theme Category Topic:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedCategory("All Categories")}
                    className={`p-3.5 rounded-2xl border text-sm font-black transition-all ${
                      selectedCategory === "All Categories"
                        ? "bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/50 shadow-[0_0_12px_rgba(78,205,196,0.15)]"
                        : "bg-[#1E1F29]/60 hover:bg-[#252735] text-gray-300 border-gray-800"
                    }`}
                  >
                    🚀 All Categories
                  </button>
                  {categories.map((cat) => {
                    const color = getCategoryColor(cat);
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="p-3.5 rounded-2xl border text-sm font-black transition-all text-left relative overflow-hidden"
                        style={{
                          backgroundColor: isSelected ? `${color}18` : "#1E1F2930",
                          borderColor: isSelected ? color : "#2F3246",
                          color: isSelected ? "#FFFFFF" : "#9CA3AF"
                        }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Settings */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-widest text-[#FF6B6B] mb-3">
                  ⚡ Game Difficulty Level:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                    const setup = DIFFICULTY_SETTINGS[diff];
                    const isSelected = selectedDifficulty === diff;
                    return (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`p-4 rounded-2xl border transition-all text-left relative ${
                          isSelected
                            ? "bg-[#1E202E] border-current shadow-lg text-white"
                            : "bg-[#1E1F29]/60 hover:bg-[#252735] text-gray-400 border-gray-800"
                        }`}
                        style={{
                          borderColor: isSelected ? setup.color : undefined
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-lg" style={{ color: setup.color }}>
                            {diff}
                          </span>
                          <span className="text-xs bg-[#12131A] px-2 py-0.5 rounded-md text-gray-400 font-mono">
                            {setup.timer}s limit
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                          Points multiplier: <span className="font-bold text-white font-mono">{setup.points}x</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number of Questions Slider */}
              <div className="bg-[#12131A] p-5 rounded-2xl border border-[#222434] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#FFD369]">
                    📝 Number of Questions:
                  </span>
                  <span className="font-mono font-black text-xl text-[#FFD369] bg-[#FFD369]/10 px-3 py-1 rounded-xl">
                    {numQuestions} / {maxAvailableQs}
                  </span>
                </div>

                {maxAvailableQs > 0 ? (
                  <input
                    type="range"
                    min={1}
                    max={maxAvailableQs}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                    className="w-full accent-[#FFD369] cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none"
                  />
                ) : (
                  <p className="text-xs text-rose-400 font-bold">
                    ⚠️ No questions found under these filters! Please add questions or choose "All Categories".
                  </p>
                )}

                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                  <span>1 Question</span>
                  <span>Max Available ({maxAvailableQs})</span>
                </div>
              </div>

              {/* Sound and Music Toggle Details */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1C1E2A] p-4 rounded-2xl border border-[#2D3145]">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${soundEnabled ? "bg-[#FFD369]/10 text-[#FFD369]" : "bg-gray-800 text-gray-500"}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-white">Atmospheric Chiptune Synthesis</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Continuous live dynamic audio waveforms loop and sound effects</p>
                  </div>
                </div>

                <button
                  onClick={() => setSoundOn(!soundEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${
                    soundEnabled
                      ? "bg-[#FFD369] text-gray-900 border-[#FFD369]"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  }`}
                >
                  {soundEnabled ? "🔊 Enabled" : "🔇 Disabled"}
                </button>
              </div>

            </div>

            {/* Launch Game Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setView("menu")}
                className="px-6 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold uppercase transition-all"
              >
                Cancel
              </button>
              <button
                onClick={startQuiz}
                disabled={maxAvailableQs === 0 || loading}
                className={`px-10 py-3.5 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center gap-2 ${
                  maxAvailableQs === 0 || loading
                    ? "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#FFD369] to-[#FF6B6B] text-gray-950 font-black shadow-[0_10px_25px_rgba(255,211,105,0.25)] hover:scale-[1.02] cursor-pointer"
                }`}
              >
                {loading ? "Generating Engine..." : "🔥 Launch Quiz"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ── SCREEN 3: ARCADE GAMEPLAY VIEW ──────────────────────── */}
        {view === "gameplay" && quizQuestions.length > 0 && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
            
            {/* Live Progress HUD Bar */}
            <div className="bg-[#161720] border border-[#252735] rounded-2xl p-4 md:p-6 flex flex-wrap justify-between items-center gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#4ECDC4]">Challenge Level</span>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>👤 {playerName}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400 uppercase tracking-wider font-mono font-black">{selectedDifficulty}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Progress Indicators */}
              <div className="flex-1 max-w-xs mx-auto text-center">
                <span className="text-xs font-mono font-black text-gray-300">
                  Question {currentQIndex + 1} of {quizQuestions.length}
                </span>
                <div className="w-full bg-[#12131A] h-2.5 rounded-full overflow-hidden mt-1.5 border border-gray-800">
                  <div
                    className="bg-[#4ECDC4] h-full transition-all duration-300"
                    style={{ width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* HUD scoring */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">Total Score</span>
                  <div className="text-xl font-black font-mono text-[#FFD369] flex items-center justify-end gap-1">
                    <Sparkles className="w-4 h-4 text-[#FFD369] animate-pulse" /> {score}
                  </div>
                </div>

                {/* Streak Badge */}
                <div className={`p-2 rounded-xl flex items-center gap-1.5 border ${
                  streak > 0
                    ? "bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/40 animate-pulse"
                    : "bg-gray-800/50 text-gray-500 border-gray-800"
                }`}>
                  <Flame className="w-5 h-5 fill-current text-rose-500" />
                  <span className="text-sm font-mono font-black">{streak}</span>
                </div>
              </div>
            </div>

            {/* Current Question Main Display */}
            {(() => {
              const q = quizQuestions[currentQIndex];
              const categoryColor = getCategoryColor(q.category);
              return (
                <div className="bg-[#161720] border-2 border-[#2C2E43] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  
                  {/* Category badging */}
                  <div className="flex justify-between items-center mb-6">
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-slate-900 shadow-md"
                      style={{ backgroundColor: categoryColor }}
                    >
                      📚 {q.category}
                    </span>

                    <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border border-[#2B2E40] bg-[#1E202E]">
                      ⚡ {q.difficulty} • {q.points}pts
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-white font-mono leading-snug py-4 mb-4 select-none">
                    {q.text}
                  </h3>

                  {/* Timer Display Widget */}
                  <div className="flex flex-col items-center justify-center space-y-2 mb-8 bg-[#12131A] py-3 px-6 rounded-2xl border border-gray-800 max-w-sm mx-auto">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${timeLeft <= 5 ? "text-rose-500 animate-bounce" : "text-[#4ECDC4]"}`} />
                      <span className={`text-xl font-mono font-black ${timeLeft <= 5 ? "text-rose-500" : "text-[#4ECDC4]"}`}>
                        ⏱ {timeLeft}s remaining
                      </span>
                    </div>

                    {/* Timer graphical progress */}
                    <div className="w-full bg-[#1A1D2B] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          timeLeft <= 5 ? "bg-rose-500" : timeLeft <= 10 ? "bg-amber-400" : "bg-[#4ECDC4]"
                        }`}
                        style={{
                          width: `${(timeLeft / (DIFFICULTY_SETTINGS[q.difficulty as "Easy" | "Medium" | "Hard"]?.timer || 20)) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Options Answers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {q.options.map((option: string, idx: number) => {
                      const colors = ["bg-[#FF6B6B]", "bg-[#4ECDC4]", "bg-[#FFD369]", "bg-[#A8E6CF]"];
                      
                      // Feedback styling state logic
                      let buttonStyle = "bg-[#1E1F29] border-[#2D3044] text-gray-200 hover:border-gray-500 hover:bg-[#252837]";
                      
                      if (hasAnswered) {
                        const isCorrect = option.toLowerCase().trim() === q.answer.toLowerCase().trim();
                        const isSelected = selectedOptionIdx === idx;
                        
                        if (isCorrect) {
                          buttonStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.01]";
                        } else if (isSelected) {
                          buttonStyle = "bg-rose-500/20 border-rose-500 text-rose-400 font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                        } else {
                          buttonStyle = "bg-gray-900/40 border-gray-800 text-gray-500 opacity-60 pointer-events-none";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasAnswered}
                          onClick={() => checkAnswer(option, idx)}
                          className={`p-5 rounded-2xl border text-base font-bold text-left transition-all duration-200 uppercase relative flex items-center justify-between ${buttonStyle}`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-slate-900 bg-white/20 uppercase`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-mono">{option}</span>
                          </span>

                          {hasAnswered && option.toLowerCase().trim() === q.answer.toLowerCase().trim() && (
                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          {hasAnswered && selectedOptionIdx === idx && option.toLowerCase().trim() !== q.answer.toLowerCase().trim() && (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate feedback section */}
                  {hasAnswered && (
                    <div className="mt-8 p-4 rounded-2xl bg-[#12131A] border border-gray-800 text-center animate-pulse">
                      <p className="text-lg font-black text-[#FFD369] tracking-wider uppercase font-mono">
                        {feedbackMsg}
                      </p>

                      {earnedPoints > 0 && (
                        <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                          <span>+{earnedPoints} PTS ADDED</span>
                          {bonusType === "streak" && <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest">Streak 2X Multiplier</span>}
                          {bonusType === "time" && <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest">Time Speed Bonus</span>}
                          {bonusType === "both" && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest">Ultimate Speed & Streak Chime</span>}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

        {/* ── SCREEN 4: END OF QUIZ RESULTS & STATS ──────────────── */}
        {view === "results" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Hero Chapeau */}
            <div className="bg-[#161720] border-2 border-amber-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FFD369] via-[#4ECDC4] to-[#FF6B6B]" />
              
              <h2 className="text-4xl font-extrabold text-white uppercase tracking-wider font-mono">
                Quiz Session Concluded!
              </h2>

              <p className="text-gray-400 mt-2">
                Spectacular performance, <span className="text-[#FFD369] font-bold">{playerName}</span>! Let's examine your final telemetry.
              </p>

              {/* Letter Grade Display */}
              <div className="my-6 inline-flex flex-col items-center">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-extrabold">Evaluated Class Grade:</div>
                <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-[#FFD369] via-amber-300 to-yellow-500 font-mono mt-1 drop-shadow-lg">
                  {(() => {
                    const acc = ((correctAnswers / numQuestions) * 100);
                    if (acc >= 90) return "S 🏆";
                    if (acc >= 80) return "A ⭐";
                    if (acc >= 70) return "B 👍";
                    if (acc >= 60) return "C 😊";
                    if (acc >= 50) return "D 😐";
                    return "F 💪";
                  })()}
                </div>
              </div>
            </div>

            {/* Comprehensive Stats Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Telemetry card list */}
              <div className="bg-[#161720] border border-[#252735] rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                  <Info className="text-[#4ECDC4] w-5 h-5" /> Game Statistics Summary
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="bg-[#12131A] p-4 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Final Score</span>
                    <span className="text-2xl font-black font-mono text-[#FFD369]">{score} pts</span>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Accuracy Rate</span>
                    <span className="text-2xl font-black font-mono text-[#4ECDC4]">
                      {((correctAnswers / numQuestions) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Correct Answers</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {correctAnswers} <span className="text-xs text-gray-600">/ {numQuestions}</span>
                    </span>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Incorrect / Skips</span>
                    <span className="text-2xl font-black font-mono text-rose-400">
                      {wrongAnswers}
                    </span>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Max Correct Streak</span>
                    <span className="text-2xl font-black font-mono text-[#FF6B6B] flex items-center gap-1.5">
                      <Flame className="w-5 h-5 text-rose-500 fill-current" /> {maxStreak}
                    </span>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Speed Time Bonuses</span>
                    <span className="text-2xl font-black font-mono text-cyan-400">
                      {timeBonuses}
                    </span>
                  </div>

                </div>

                <div className="bg-[#2D2E3F]/30 p-4 rounded-2xl border border-purple-500/20 flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-purple-400 tracking-wider">Telemetry Assessment</span>
                    <p className="text-[11px] text-gray-400">
                      {correctAnswers === numQuestions
                        ? "Flawless victory! S Rank achieved. Your name will shine on the Hall of Fame."
                        : maxStreak >= 3
                        ? "Incredible! Your consecutive streak triggered multiple point bonuses."
                        : "Nice attempt. Work on consecutive responses to trigger high-score streak multiplier bonuses!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time high-scores leaderboard context */}
              <div className="bg-[#161720] border border-[#252735] rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2 mb-4">
                  <Trophy className="text-[#FFD369] w-5 h-5" /> Scoreboard Placement
                </h3>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {scoresList.slice(0, 7).map((scoreEntry, index) => {
                    const isSelf = scoreEntry.playerName === playerName && scoreEntry.score === score;
                    return (
                      <div
                        key={scoreEntry.id}
                        className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                          isSelf
                            ? "bg-amber-500/10 border-[#FFD369] text-white"
                            : "bg-[#1E1F29]/40 border-gray-800 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-gray-500 w-6">
                            #{index + 1}
                          </span>
                          <div>
                            <span className="font-bold text-sm block">{scoreEntry.playerName}</span>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500">
                              {scoreEntry.category} • {scoreEntry.difficulty}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-[#FFD369]">{scoreEntry.score} pts</span>
                          <span className="text-[10px] text-gray-500 block font-mono">{scoreEntry.accuracy}% Acc</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Finish actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={handleReplay}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-[#FFD369] to-[#FF6B6B] text-slate-900 font-extrabold text-base uppercase tracking-wider shadow-lg hover:scale-[1.03] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Play Again (Same Settings)</span>
              </button>

              <button
                onClick={() => {
                  setView("settings");
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-base border border-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5" />
                <span>Adjust Game Settings</span>
              </button>

              <button
                onClick={() => {
                  setView("menu");
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1E202E]/60 hover:bg-[#252837] text-gray-300 font-semibold text-base border border-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                <span>Main Menu</span>
              </button>
            </div>

          </div>
        )}

        {/* ── SCREEN 5: STANDALONE LEADERBOARD / HALL OF FAME ────── */}
        {view === "leaderboard" && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-[#161720] border border-[#252735] rounded-3xl p-6 md:p-8 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-2.5">
                    <Trophy className="text-[#FFD369]" /> Bamboozle! Hall of Fame
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Live scoreboard query. Filter by criteria or search players below.
                  </p>
                </div>

                <button
                  onClick={() => setView("menu")}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs uppercase self-start"
                >
                  &larr; Back to Main
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#4ECDC4] mb-2">Category Filter:</label>
                  <select
                    value={lbCategoryFilter}
                    onChange={(e) => setLbCategoryFilter(e.target.value)}
                    className="w-full bg-[#12131A] text-white border border-[#2B2E3F] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#4ECDC4]"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#FF6B6B] mb-2">Difficulty Filter:</label>
                  <select
                    value={lbDifficultyFilter}
                    onChange={(e) => setLbDifficultyFilter(e.target.value)}
                    className="w-full bg-[#12131A] text-white border border-[#2B2E3F] rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#FF6B6B]"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-[#FFD369] mb-2">Search Player Name:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lbSearchQuery}
                      onChange={(e) => setLbSearchQuery(e.target.value)}
                      placeholder="Type keyword..."
                      className="w-full bg-[#12131A] text-white border border-[#2B2E3F] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#FFD369]"
                    />
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Scoreboard List Table */}
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2C2E43] text-gray-400 text-xs uppercase tracking-widest font-black">
                      <th className="py-3 px-4 text-center">Rank</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Accuracy</th>
                      <th className="py-3 px-4">Max Streak</th>
                      <th className="py-3 px-4">Time Bonuses</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D1E2A] font-mono">
                    {scoresList.map((item, index) => {
                      const medalMap = ["🥇", "🥈", "🥉"];
                      return (
                        <tr key={item.id} className="hover:bg-[#1E1F29]/30 text-sm">
                          <td className="py-4 px-4 text-center text-lg font-black text-white">
                            {index < 3 ? medalMap[index] : index + 1}
                          </td>
                          <td className="py-4 px-4 font-bold font-sans text-white">
                            {item.playerName}
                          </td>
                          <td className="py-4 px-4 text-[#FFD369] font-black">
                            {item.score} <span className="text-[10px] font-normal text-gray-500 font-sans">pts</span>
                          </td>
                          <td className="py-4 px-4 text-[#4ECDC4] font-black">
                            {item.accuracy}%
                          </td>
                          <td className="py-4 px-4 text-[#FF6B6B]">
                            🔥 {item.maxStreak}
                          </td>
                          <td className="py-4 px-4 text-cyan-400">
                            ⏱ {item.timeBonuses}
                          </td>
                          <td className="py-4 px-4 font-sans text-xs">
                            <span className="bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-xs text-gray-500 font-sans">
                            {new Date(item.playedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {scoresList.length === 0 && (
                  <div className="text-center py-12 text-gray-500 space-y-2">
                    <Trophy className="w-12 h-12 text-gray-700 mx-auto" />
                    <p className="font-bold">No High Scores Found</p>
                    <p className="text-xs">Adjust your search parameters or select a game to start playing!</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ── SCREEN 6: QUESTIONS BANK ADMINISTRATOR ─────────────── */}
        {view === "admin" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header / Config Panel */}
            <div className="bg-[#161720] border border-[#252735] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-2.5">
                    <Database className="text-[#FF6B6B]" /> Questions Bank Manager
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete administrative CRUD workspace to modify, add, or reset trivial database telemetry.
                  </p>
                </div>

                <div className="flex gap-2 self-start">
                  <button
                    onClick={handleResetDatabase}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-[#FF6B6B] border border-[#FF6B6B]/30 font-black rounded-xl text-xs uppercase flex items-center gap-1"
                  >
                    <ResetIcon className="w-3.5 h-3.5" /> Re-Seed Defaults
                  </button>
                  <button
                    onClick={() => setView("menu")}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs uppercase"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Interactive Split-Panel Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Form column (5 Cols) */}
                <div className="lg:col-span-5 bg-[#12131A] p-6 rounded-2xl border border-[#292B3C] space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-gray-800 pb-2 flex items-center gap-1.5">
                    <Plus className="text-[#FFD369] w-4 h-4" />
                    {editingQuestionId ? "Update Selected Question" : "Add Custom Question"}
                  </h3>

                  {adminSuccessMsg && <p className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 p-2.5 rounded-xl font-bold font-mono">{adminSuccessMsg}</p>}
                  {adminErrorMsg && <p className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 p-2.5 rounded-xl font-bold font-mono">{adminErrorMsg}</p>}

                  <form onSubmit={saveQuestion} className="space-y-4 text-xs font-semibold">
                    
                    {/* Prompt text */}
                    <div>
                      <label className="block text-gray-400 mb-1">Question Prompt Text:</label>
                      <textarea
                        rows={2}
                        value={formText}
                        onChange={(e) => setFormText(e.target.value)}
                        placeholder="e.g. What is the temperature of absolute zero?"
                        className="w-full bg-[#1A1D2C] border border-[#2B2E42] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD369] text-sm"
                      />
                    </div>

                    {/* Difficulty and Category */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 mb-1">Difficulty:</label>
                        <select
                          value={formDifficulty}
                          onChange={(e) => setFormDifficulty(e.target.value as any)}
                          className="w-full bg-[#1A1D2C] border border-[#2B2E42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FFD369]"
                        >
                          <option value="Easy">Easy (1 pt, 30s)</option>
                          <option value="Medium">Medium (2 pts, 20s)</option>
                          <option value="Hard">Hard (3 pts, 10s)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1">Category Select:</label>
                        <div className="flex flex-col gap-1">
                          {!useCustomCategory ? (
                            <select
                              value={formCategory}
                              onChange={(e) => setFormCategory(e.target.value)}
                              className="w-full bg-[#1A1D2C] border border-[#2B2E42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FFD369]"
                            >
                              <option value="">Select Existing...</option>
                              {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={formCustomCategory}
                              onChange={(e) => setFormCustomCategory(e.target.value)}
                              placeholder="New Category Name..."
                              className="w-full bg-[#1A1D2C] border border-[#2B2E42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FFD369]"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setUseCustomCategory(!useCustomCategory);
                              if (!useCustomCategory) {
                                setFormCategory("");
                              } else {
                                setFormCustomCategory("");
                              }
                            }}
                            className="text-[9px] text-[#4ECDC4] hover:underline uppercase text-left mt-1"
                          >
                            {useCustomCategory ? "← Use Existing Category" : "✎ Type Custom Category"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Options Array */}
                    <div className="space-y-2">
                      <label className="block text-gray-400">Multiple Choice Options (4 Choices):</label>
                      {formOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <span className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...formOptions];
                              updated[oIdx] = e.target.value;
                              setFormOptions(updated);
                            }}
                            placeholder={`Option choice ${oIdx + 1}`}
                            className="w-full bg-[#1A1D2C] border border-[#2B2E42] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#FFD369]"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Target Answer */}
                    <div>
                      <label className="block text-gray-400 mb-1">Pick Exact Correct Answer:</label>
                      <select
                        value={formAnswer}
                        onChange={(e) => setFormAnswer(e.target.value)}
                        className="w-full bg-[#1A1D2C] border border-[#2B2E42] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FFD369] text-xs font-bold"
                      >
                        <option value="">Select Option Choice...</option>
                        {formOptions.map((opt, oIdx) => (
                          <option key={oIdx} value={opt} disabled={!opt.trim()}>
                            {opt ? `Choice ${String.fromCharCode(65 + oIdx)}: ${opt}` : `Choice ${String.fromCharCode(65 + oIdx)} (Empty)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-[#FFD369] to-[#FF6B6B] hover:opacity-95 text-[#12131A] font-extrabold rounded-xl uppercase tracking-wider transition-all"
                      >
                        {editingQuestionId ? "Save Changes" : "Create Question"}
                      </button>
                      
                      {editingQuestionId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded-xl uppercase"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                  </form>
                </div>

                {/* List column (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Search questions keyword..."
                        className="w-full bg-[#12131A] border border-[#2B2E42] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B6B]"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                    </div>

                    <select
                      value={adminCategoryFilter}
                      onChange={(e) => setAdminCategoryFilter(e.target.value)}
                      className="bg-[#12131A] border border-[#2B2E42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B6B]"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question Cards Container */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {adminQuestions
                      .filter((q) => {
                        const matchKeyword = q.text.toLowerCase().includes(adminSearch.toLowerCase());
                        const matchCategory = adminCategoryFilter === "All" || q.category === adminCategoryFilter;
                        return matchKeyword && matchCategory;
                      })
                      .map((q) => {
                        const catColor = getCategoryColor(q.category);
                        return (
                          <div
                            key={q.id}
                            className={`p-4 rounded-xl border transition-all ${
                              editingQuestionId === q.id
                                ? "bg-amber-500/10 border-[#FFD369]"
                                : "bg-[#1E1F29]/50 border-gray-800 hover:border-[#2F3246]"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span
                                  className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-slate-900"
                                  style={{ backgroundColor: catColor }}
                                >
                                  {q.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getDifficultyColor(q.difficulty)}`}>
                                  {q.difficulty}
                                </span>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleEditClick(q)}
                                  className="p-1 text-gray-400 hover:text-[#FFD369]"
                                  title="Edit Question"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1 text-gray-400 hover:text-red-400"
                                  title="Delete Question"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-white mb-2 leading-relaxed">
                              {q.text}
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isCorrect = opt.toLowerCase().trim() === q.answer.toLowerCase().trim();
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-1 rounded px-2 ${
                                      isCorrect
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                                        : "bg-gray-900/30 text-gray-400"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                    {adminQuestions.length === 0 && (
                      <div className="text-center py-12 text-gray-600">
                        No custom questions found matching current criteria.
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </section>

      {/* Retro Footer decor */}
      <footer className="mt-16 text-center text-xs text-gray-600 font-mono space-y-1 select-none">
        <p>© 2026 BAMBOOZLE! ARCADE ENTERTAINMENT SYSTEM INC.</p>
        <p className="text-[10px]">CO-ENGINES POWERED BY NEXT.JS, POSTGRESQL & DRizzle ORM</p>
      </footer>
    </main>
  );
}
