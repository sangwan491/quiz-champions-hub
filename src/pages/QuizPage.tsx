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
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

      // Start quiz session on server, receive quiz payload, then shuffle client-side
      try {
        const start = await api.startQuiz(quizData.id);
        const shuffled = shuffleQuizForClient(start.quiz);
        setQuiz(shuffled);
        const firstTime = shuffled.questions?.[0]?.time || 30;
        setTimeLeft(firstTime);
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

  const currentQuestion = quiz?.questions[currentQuestionIndex];
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
    if (isLast) {
      // Complete immediately with the updated answers to avoid race condition
      completeQuiz(updated);
    } else {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(quiz.questions[nextIdx].time || 30);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuestion || !quiz) return;
    recordAnswer(answerIndex);
  };

  // nextQuestion logic is handled inside recordAnswer to keep state consistent

  const completeQuiz = async (finalAnswers?: any[]) => {
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
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen py-8">
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
                    strokeDasharray={`${(timeLeft / (currentQuestion?.time || 30)) * 100}, 100`}
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
        <Card key={currentQuestion.id} className="card-quiz animate-fade-in-up">
          <div className="space-y-6">
            {/* Warning Banner */}
            <div className="text-xs text-yellow-800 bg-yellow-100 rounded-md px-3 py-2">
              Do not refresh or close this page during the quiz. Your progress may be lost.
            </div>
            {/* Category & Difficulty */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                {currentQuestion.category}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  +{currentQuestion.positivePoints} / -{currentQuestion.negativePoints} pts • {currentQuestion.time}s
                </span>
              </div>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Answer Options */}
            <div className="grid gap-4">
              {currentQuestion.options.map((option, index) => (
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