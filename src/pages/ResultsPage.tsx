import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Star, Clock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type QuizResult } from "@/data/questions";

const ResultsPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const lastResult = localStorage.getItem("lastQuizResult");
    if (lastResult) {
      setResult(JSON.parse(lastResult));
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!result) return null;

  // Use server-provided percentage if available; otherwise omit
  const percentage = typeof (result as any).percentage === "number"
    ? Math.max(0, Math.min(100, Math.round((result as any).percentage)))
    : undefined;

  const getPerformanceMessage = () => {
    const pct = percentage ?? 0;
    if (pct >= 90) return { message: "Outstanding!", emoji: "🏆", color: "text-accent" };
    if (pct >= 80) return { message: "Excellent!", emoji: "⭐", color: "text-primary" };
    if (pct >= 70) return { message: "Great job!", emoji: "🎉", color: "text-secondary" };
    if (pct >= 60) return { message: "Good effort!", emoji: "👏", color: "text-success" };
    return { message: "Keep practicing!", emoji: "💪", color: "text-muted-foreground" };
  };

  const performance = getPerformanceMessage();

  const playAgain = () => {
    localStorage.removeItem("lastQuizResult");
    navigate("/");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="animate-celebration mb-4">
            <div className="text-6xl mb-4">{performance.emoji}</div>
            <h1 className={`text-4xl font-bold mb-2 ${performance.color}`}>
              {performance.message}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {result.playerName}, here are your quiz results
          </p>
        </div>

        {/* Score Card */}
        <Card className="card-glass p-8 mb-8 animate-fade-in-up">
          <div className="text-center">
            <div className="text-6xl font-bold text-glow bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              {result.score}
            </div>
            <p className="text-xl text-muted-foreground mb-6">Total Score</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div className="text-2xl font-bold">{result.totalQuestions}</div>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-accent" />
                </div>
                <div className="text-2xl font-bold">{Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}</div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up [animation-delay:0.4s]">
          <Button 
            variant="outline" 
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;