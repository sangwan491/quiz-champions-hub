import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, type Question, type Quiz, type User } from "@/data/questions";

const QuizPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);

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
      
      // Verify the quiz is still active
      try {
        const activeQuiz = await api.getActiveQuiz(quizData.id);
        setQuiz(activeQuiz);
        const firstTime = activeQuiz.questions?.[0]?.time || 30;
        setTimeLeft(firstTime);
      } catch (error) {
        toast({
          title: "Quiz Unavailable",
          description: "This quiz is no longer active.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

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
      // Time's up - record no answer
      setShowAnswer(true);
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = {
        questionId: currentQuestion?.id,
        selectedAnswer: null,
        correct: false,
        timeSpent: currentQuestion?.time || 30,
        points: -(currentQuestion?.negativePoints || 0) // penalty for timeout
      };
      setAnswers(newAnswers);
      setTimeout(nextQuestion, 2000);
    }
  }, [timeLeft, showAnswer, quiz, currentQuestion, quizEnded]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer || !currentQuestion || !quiz) return;

    setSelectedAnswer(answerIndex);
    setShowAnswer(true);

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const timeSpent = (currentQuestion.time || 30) - timeLeft;
    const timeBonus = isCorrect && currentQuestion.positivePoints > 0 ? Math.floor(timeLeft / 3) : 0;
    const basePoints = isCorrect ? currentQuestion.positivePoints : -(currentQuestion.negativePoints || 0);
    const questionScore = isCorrect ? basePoints + timeBonus : basePoints;

    setScore(score + questionScore);

    // Record the answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      correct: isCorrect,
      timeSpent,
      points: questionScore
    };
    setAnswers(newAnswers);

    setTimeout(nextQuestion, 2000);
  };

  const nextQuestion = () => {
    if (!quiz) return;

    if (currentQuestionIndex + 1 >= quiz.questions.length) {
      completeQuiz();
    } else {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(quiz.questions[nextIdx].time || 30);
    }
  };

  const completeQuiz = async () => {
    if (!user || !quiz || quizEnded) return;

    setQuizEnded(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await api.submitResult({
        userId: user.id,
        quizId: quiz.id,
        score,
        totalQuestions: quiz.questions.length,
        timeSpent,
      });

      // Store result for display on results page
      const result = {
        playerName: user.name,
        score,
        totalQuestions: quiz.questions.length,
        timeSpent,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem("lastQuizResult", JSON.stringify(result));

      toast({
        title: "Quiz Completed!",
        description: `You scored ${score} points!`
      });

      navigate("/results");
    } catch (error) {
      console.error('Failed to submit results:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getAnswerClass = (index: number) => {
    if (!showAnswer) return "btn-answer";
    
    if (index === currentQuestion?.correctAnswer) {
      return "btn-answer correct";
    } else if (index === selectedAnswer && index !== currentQuestion?.correctAnswer) {
      return "btn-answer incorrect";
    }
    return "btn-answer";
  };

  const getAnswerIcon = (index: number) => {
    if (!showAnswer) return null;
    
    if (index === currentQuestion?.correctAnswer) {
      return <CheckCircle className="w-5 h-5" />;
    } else if (index === selectedAnswer && index !== currentQuestion?.correctAnswer) {
      return <XCircle className="w-5 h-5" />;
    }
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
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className={`font-bold text-lg ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Score: {score} points</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="card-quiz animate-fade-in-up">
          <div className="space-y-6">
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
                  className={`${getAnswerClass(index)} flex items-center justify-between text-left transition-all duration-200`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-muted-foreground">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{option}</span>
                  </div>
                  {getAnswerIcon(index)}
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
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div className="text-green-600 dark:text-green-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">
                      Correct! +{currentQuestion.positivePoints + (currentQuestion.positivePoints > 0 ? Math.floor(timeLeft / 3) : 0)} points
                    </p>
                    {timeLeft > 0 && currentQuestion.positivePoints > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Including {Math.floor(timeLeft / 3)} bonus points for speed!
                      </p>
                    )}
                  </div>
                ) : selectedAnswer !== null ? (
                  <div className="text-red-600 dark:text-red-400">
                    <XCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">
                      Incorrect. The correct answer was: {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                ) : (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">
                      Time's up! The correct answer was: {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                )}
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