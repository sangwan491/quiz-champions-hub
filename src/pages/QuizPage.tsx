import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { sampleQuestions, type Question } from "@/data/questions";

const QuizPage = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sampleQuestions.length) * 100;

  useEffect(() => {
    const playerName = localStorage.getItem("playerName");
    if (!playerName) {
      navigate("/");
      return;
    }

    if (timeLeft > 0 && !showAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showAnswer) {
      setShowAnswer(true);
      setTimeout(nextQuestion, 2000);
    }
  }, [timeLeft, showAnswer, navigate]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;

    setSelectedAnswer(answerIndex);
    setShowAnswer(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      const timeBonus = Math.floor(timeLeft / 3);
      setScore(score + currentQuestion.points + timeBonus);
    }

    setTimeout(nextQuestion, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= sampleQuestions.length) {
      completeQuiz();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(30);
    }
  };

  const completeQuiz = () => {
    const playerName = localStorage.getItem("playerName") || "Anonymous";
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    const result = {
      id: Date.now().toString(),
      playerName,
      score,
      totalQuestions: sampleQuestions.length,
      completedAt: new Date(),
      timeSpent
    };

    // Save to localStorage (in a real app, this would go to a database)
    const existingResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
    existingResults.push(result);
    localStorage.setItem("quizResults", JSON.stringify(existingResults));
    localStorage.setItem("lastQuizResult", JSON.stringify(result));

    navigate("/results");
  };

  const getAnswerClass = (index: number) => {
    if (!showAnswer) return "btn-answer";
    
    if (index === currentQuestion.correctAnswer) {
      return "btn-answer correct";
    } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
      return "btn-answer incorrect";
    }
    return "btn-answer";
  };

  const getAnswerIcon = (index: number) => {
    if (!showAnswer) return null;
    
    if (index === currentQuestion.correctAnswer) {
      return <CheckCircle className="w-5 h-5" />;
    } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
      return <XCircle className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {sampleQuestions.length}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className={`font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-foreground'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Score: {score}</span>
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-success/20 text-success' :
                currentQuestion.difficulty === 'medium' ? 'bg-secondary/20 text-secondary' :
                'bg-destructive/20 text-destructive'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
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
                  className={`${getAnswerClass(index)} flex items-center justify-between text-left`}
                >
                  <span>{option}</span>
                  {getAnswerIcon(index)}
                </button>
              ))}
            </div>

            {/* Answer Feedback */}
            {showAnswer && (
              <div className="text-center animate-fade-in-up">
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div className="text-success">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Correct! +{currentQuestion.points + Math.floor(timeLeft / 3)} points</p>
                  </div>
                ) : (
                  <div className="text-destructive">
                    <XCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">
                      Incorrect. The correct answer was: {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuizPage;