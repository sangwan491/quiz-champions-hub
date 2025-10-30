import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, type Question, type Quiz, type User } from "@/data/questions";
import { shuffleQuizForClient, deshuffleAnswersForServer, type ShuffledQuiz } from "@/data/questions";

const QuizPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quiz, setQuiz] = useState<ShuffledQuiz | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedAnswer: number | null }>>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);

  // Prevent copy/cut/paste and text selection during quiz
  useEffect(() => {
    if (!quiz || quizEnded) return;
    const stop = (e: Event) => e.preventDefault();
    const disableContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('copy', stop);
    document.addEventListener('cut', stop);
    document.addEventListener('paste', stop);
    document.addEventListener('contextmenu', disableContext);
    document.addEventListener('selectstart', stop);
    return () => {
      document.removeEventListener('copy', stop);
      document.removeEventListener('cut', stop);
      document.removeEventListener('paste', stop);
      document.removeEventListener('contextmenu', disableContext);
      document.removeEventListener('selectstart', stop);
    };
  }, [quiz, quizEnded]);

  // Warn on reload/navigation during quiz
  useEffect(() => {
    if (!quiz || quizEnded) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [quiz, quizEnded]);

  useEffect(() => {
    initializeQuiz();
  }, []);

  type SavedProgress = {
    sessionId: string;
    userId: string;
    quizId: string;
    quiz: ShuffledQuiz;
    currentQuestionIndex: number;
    timeLeft: number;
    answers: Array<{ questionId: string; selectedAnswer: number | null }>;
    lastTickAt: number; // ms
    startedAt?: string; // ISO
  };

  const makeProgressKey = (uid: string, qid: string) => `quizProgress:${uid}:${qid}`;

  const getMaxTime = (qz: ShuffledQuiz) => {
    const total = Number(qz.totalTime || 0);
    if (total && total > 0) return total;
    return (qz.questions || []).reduce((sum, q) => sum + Number((q as Question).time || 0), 0);
  };

  const initializeQuiz = async () => {
    try {
      // Get user and quiz from localStorage
      const userStr = localStorage.getItem("currentUser");
      const quizStr = localStorage.getItem("currentQuiz");
      
      if (!userStr || !quizStr) {
        toast({
          title: "Error",
          description: "Missing quiz session data. Please start from the home page.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      const userData = JSON.parse(userStr);
      const quizData = JSON.parse(quizStr);
      
      setUser(userData);
      
      // Check if user has already attempted this quiz
      try {
        const attemptData = await api.checkUserAttempt(userData.id, quizData.id);
        if (attemptData.hasAttempted) {
          toast({
            title: "Already Attempted",
            description: "You have already completed this quiz. Redirecting to results.",
            variant: "destructive"
          });
          navigate("/");
          return;
        }
      } catch (error) {
        console.error('Error checking user attempt:', error);
      }

      // Start (or resume) server session and get quiz payload, then resume locally if possible
      let started;
      try {
        started = await api.startQuiz(quizData.id);
      } catch (error) {
        console.error('Error starting quiz session:', error);
        toast({
          title: "Error",
          description: "Failed to start quiz session. Please try again.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setSessionId(started.sessionId);
      setSessionStartedAt(started.startedAt);

      // Server now returns sanitized questions; no hydration from bank
      const hydratedQuiz: Quiz = started.quiz as Quiz;

      const key = makeProgressKey(userData.id, quizData.id);
      const savedRaw = localStorage.getItem(key);

      if (savedRaw) {
        try {
          const saved: SavedProgress = JSON.parse(savedRaw);
          // Validate saved progress belongs to same user/quiz; prefer same session but allow resume if session matches
          if (saved.userId === userData.id && saved.quizId === quizData.id) {
            const savedQuiz = saved.quiz;
            const maxTime = getMaxTime(savedQuiz);

            // Overall expiry check using server startedAt if available
            if (started.startedAt) {
              const elapsedSinceStart = Math.floor((Date.now() - new Date(started.startedAt).getTime()) / 1000);
              if (maxTime > 0 && elapsedSinceStart >= maxTime) {
                // Auto submit with whatever answers we have
                setQuiz(savedQuiz);
                setAnswers(saved.answers || []);
                setCurrentQuestionIndex(saved.currentQuestionIndex || 0);
                setTimeLeft(0);
                setIsLoading(false);
                // Defer submit to next tick so state is set
                setTimeout(() => completeQuiz(saved.answers || []), 0);
                return;
              }
            }

            // Fast-forward by time elapsed since last tick
            let idx = saved.currentQuestionIndex || 0;
            let tLeft = saved.timeLeft ?? ((savedQuiz.questions?.[idx] as Question)?.time || 30);
            const updatedAnswers = Array.isArray(saved.answers) ? [...saved.answers] : [];
            let delta = Math.max(0, Math.floor((Date.now() - (saved.lastTickAt || Date.now())) / 1000));
            const total = savedQuiz.questions.length;

            while (delta > 0 && idx < total) {
              if (delta < tLeft) {
                tLeft = tLeft - delta;
                delta = 0;
                break;
              }
              // Current question elapsed
              delta -= tLeft;
              if (!updatedAnswers[idx]) {
                updatedAnswers[idx] = { questionId: (savedQuiz.questions[idx] as Question).id, selectedAnswer: null };
              }
              idx += 1;
              if (idx >= total) break;
              tLeft = (savedQuiz.questions[idx] as Question).time || 30;
            }

            if (idx >= total) {
              // Completed due to elapsed time
              setQuiz(savedQuiz);
              setAnswers(updatedAnswers);
              setCurrentQuestionIndex(total - 1);
              setTimeLeft(0);
              setIsLoading(false);
              setTimeout(() => completeQuiz(updatedAnswers), 0);
              return;
            }

            // Resume at computed position
            setQuiz(savedQuiz);
            setAnswers(updatedAnswers);
            setCurrentQuestionIndex(idx);
            setSelectedAnswer(null);
            setShowAnswer(false);
            setTimeLeft(tLeft);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to parse saved progress, starting fresh');
        }
      }

      // No valid saved progress -> start fresh and shuffle
      const shuffled = shuffleQuizForClient(hydratedQuiz);
      if (!shuffled.questions || shuffled.questions.length === 0) {
        toast({ title: "Error", description: "No questions found for this quiz.", variant: "destructive" });
        navigate("/");
        return;
      }
      setQuiz(shuffled);
      const firstTime = (shuffled.questions?.[0] as Question)?.time || 30;
      setTimeLeft(firstTime);
      // Persist initial progress
      try {
        const keyFresh = makeProgressKey(userData.id, shuffled.id);
        const payload: SavedProgress = {
          sessionId: started.sessionId,
          userId: userData.id,
          quizId: shuffled.id,
          quiz: shuffled,
          currentQuestionIndex: 0,
          timeLeft: firstTime,
          answers: [],
          lastTickAt: Date.now(),
          startedAt: started.startedAt,
        };
        localStorage.setItem(keyFresh, JSON.stringify(payload));
      } catch {
        // Ignore localStorage errors - non-critical
      }

    } catch (error) {
      console.error('Error initializing quiz:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive"
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = (quiz?.questions[currentQuestionIndex] as Question | undefined);
  const progress = quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0;

  useEffect(() => {
    if (!quiz || quizEnded) return;
    if (timeLeft > 0 && !showAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showAnswer) {
      // Time's up - record no answer and advance/complete atomically
      recordAnswer(null);
    }
  }, [timeLeft, showAnswer, quiz, currentQuestion, quizEnded]);

  // Persist progress when key states change
  useEffect(() => {
    if (!quiz || !user || quizEnded) return;
    try {
      const key = makeProgressKey(user.id, quiz.id);
      const payload: SavedProgress = {
        sessionId: sessionId || "",
        userId: user.id,
        quizId: quiz.id,
        quiz,
        currentQuestionIndex,
        timeLeft,
        answers,
        lastTickAt: Date.now(),
        startedAt: sessionStartedAt || undefined,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore localStorage errors - non-critical
    }
  }, [quiz, user, currentQuestionIndex, timeLeft, answers, quizEnded, sessionId, sessionStartedAt]);

  const recordAnswer = (answerIndex: number | null) => {
    if (showAnswer || !currentQuestion || !quiz) return;
    setSelectedAnswer(answerIndex === null ? null : answerIndex);
    setShowAnswer(true);
    const updated = [...answers];
    updated[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
    };
    setAnswers(updated);
    const isLast = currentQuestionIndex + 1 >= quiz.questions.length;
    
    // Move to next question or complete quiz after a brief delay
    setTimeout(() => {
      if (isLast) {
        // Complete quiz only at the very end
        completeQuiz(updated);
      } else {
        // Move to next question
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        setSelectedAnswer(null);
        setShowAnswer(false);
        setTimeLeft((quiz.questions[nextIdx] as Question).time || 30);
      }
    }, 500); // Brief delay to show answer was recorded
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuestion || !quiz) return;
    recordAnswer(answerIndex);
  };

  // nextQuestion logic is handled inside recordAnswer to keep state consistent

  const completeQuiz = async (finalAnswers?: Array<{ questionId: string; selectedAnswer: number | null }>) => {
    if (!user || !quiz || quizEnded) return;

    setQuizEnded(true);
    setIsSubmitting(true);
    
    try {
      const deShuffled = deshuffleAnswersForServer(quiz, finalAnswers ?? answers);
      const serverResult = await api.submitResult({
        userId: user.id,
        quizId: quiz.id,
        answers: deShuffled,
      });

      // Clear saved progress on successful completion
      try {
        const key = makeProgressKey(user.id, quiz.id);
        localStorage.removeItem(key);
      } catch {
        // Ignore localStorage errors - non-critical
      }

      // Store result for display on results page (from server)
      const result = {
        playerName: user.name,
        score: serverResult.score,
        totalQuestions: serverResult.totalQuestions,
        timeSpent: serverResult.timeSpent,
        completedAt: serverResult.completedAt
      };
      localStorage.setItem("lastQuizResult", JSON.stringify(result));

      toast({
        title: "Quiz Completed!",
        description: `You scored ${serverResult.score} points!`
      });

      navigate("/results");
    } catch (error) {
      console.error('Failed to submit results:', error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to submit quiz results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getAnswerClass = (index: number) => {
    // Hide correct/incorrect indicators
    return "btn-answer";
  };

  const getAnswerIcon = (index: number) => {
    // Hide any icon feedback
    return null;
  };

  const getDifficultyColor = (difficulty: string) => {
    return 'bg-muted/20 text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center select-none">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center select-none">
        <Card className="card-glass p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Quiz Not Available</h2>
          <p className="text-muted-foreground mb-4">
            The quiz session may have ended or there's no active quiz.
          </p>
          <Button onClick={() => navigate("/")} className="btn-hero">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  // Show submission loader when submitting
  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center select-none">
        <div className="text-center animate-fade-in-up">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary mx-auto mb-4" 
                 style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary)))' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-glow animate-pulse">Submitting Your Results...</h2>
          <p className="text-muted-foreground">Please wait while we process your amazing performance!</p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 select-none bg-hero">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">{quiz.title}</h1>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
            </div>
            {/* Circular Timer */}
            <div className="relative">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={timeLeft <= 10 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth="3"
                    strokeDasharray={`${(timeLeft / ((currentQuestion as Question)?.time || 30)) * 100}, 100`}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${timeLeft <= 10 ? 'animate-pulse drop-shadow-lg' : ''}`}
                    style={{
                      filter: timeLeft <= 10 ? 'drop-shadow(0 0 8px hsl(var(--destructive)))' : 'drop-shadow(0 0 8px hsl(var(--primary)))'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className={`w-4 h-4 mx-auto mb-1 ${timeLeft <= 10 ? 'text-destructive animate-bounce' : 'text-primary'}`} />
                    <span className={`font-bold text-sm ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                      {timeLeft}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Progress value={progress} className="h-4 progress-glow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground drop-shadow-sm">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                {currentQuestionIndex + 1}/{quiz.questions.length} Questions
              </span>
              <span className="flex items-center gap-1">
                🚀 You're doing great!
              </span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card key={(currentQuestion as Question).id} className="card-quiz animate-fade-in-up">
          <div className="space-y-6">
            {/* Warning Banner */}
            <div className="text-xs text-yellow-800 bg-yellow-100 rounded-md px-3 py-2">
              Do not refresh or close this page during the quiz. Your progress may be lost.
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm text-muted-foreground">
                +{(currentQuestion as Question).positivePoints} / -{(currentQuestion as Question).negativePoints} pts • {(currentQuestion as Question).time}s
              </span>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold leading-relaxed">
              {(currentQuestion as Question).question}
            </h2>

            {/* Answer Options */}
            <div className="grid gap-4">
              {(currentQuestion as Question).options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showAnswer}
                  className={`${getAnswerClass(index)} flex items-center justify-between text-left transition-all duration-200 group hover-lift animate-slide-in-right`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="group-hover:text-primary transition-colors duration-200">{option}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                </button>
              ))}
            </div>

            {/* Timer Warning */}
            {timeLeft <= 10 && !showAnswer && (
              <div className="text-center animate-fade-in-up">
                <div className="text-destructive">
                  <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-medium">Hurry up! Only {timeLeft} seconds left!</p>
                </div>
              </div>
            )}

            {/* Answer Feedback */}
            {showAnswer && (
              <div className="text-center animate-fade-in-up">
                {/* Hide explicit correct/incorrect and correct answer text */}
                <div className="text-muted-foreground">
                  <p className="font-medium">Answer recorded. Moving to the next question...</p>
                </div>
              </div>
            )}

            {/* End Quiz Early */}
            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => completeQuiz()} disabled={isSubmitting}>
                End Quiz
              </Button>
            </div>
          </div>
        </Card>

        {/* Quiz Info Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Player: {user?.name} • Avg Timer: {Math.round((quiz.totalTime || 0) / Math.max(quiz.questions.length || 1, 1))}s per question</p>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;