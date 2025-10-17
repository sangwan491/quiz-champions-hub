import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Star, Clock, Home, TrendingUp, Award, Sparkles } from "lucide-react";
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
    if (pct >= 90) return { message: "Outstanding Performance!", emoji: "🏆", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" };
    if (pct >= 80) return { message: "Excellent Work!", emoji: "⭐", color: "text-secondary", bgColor: "bg-secondary/10", borderColor: "border-secondary/20" };
    if (pct >= 70) return { message: "Great Job!", emoji: "🎉", color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" };
    if (pct >= 60) return { message: "Good Effort!", emoji: "👏", color: "text-success", bgColor: "bg-success/10", borderColor: "border-success/20" };
    return { message: "Keep Practicing!", emoji: "💪", color: "text-muted-foreground", bgColor: "bg-muted/10", borderColor: "border-muted/20" };
  };

  const performance = getPerformanceMessage();

  const playAgain = () => {
    localStorage.removeItem("lastQuizResult");
    navigate("/");
  };

  return (
    <div className="min-h-screen py-8 md:py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Celebration Header */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in-up">
          <div className="relative inline-block mb-6 animate-celebration">
            <div className="text-7xl md:text-8xl animate-float">{performance.emoji}</div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
            </div>
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold mb-3 ${performance.color} animate-fade-in-up`} style={{animationDelay: '0.1s'}}>
            {performance.message}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Congratulations, <span className="font-bold text-foreground">{result.playerName}</span>! Here are your results.
          </p>
        </div>

        {/* Score Card */}
        <Card className={`brevo-card p-8 md:p-10 mb-8 ${performance.bgColor} border-2 ${performance.borderColor} animate-fade-in-up shadow-xl`} style={{animationDelay: '0.3s'}}>
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">
                {result.score}
              </div>
              <div className="absolute -top-6 -right-6">
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-accent animate-bounce" />
              </div>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-semibold">Total Points Earned</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-2xl mx-auto">
              {/* Questions */}
              <div className="text-center bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{result.totalQuestions}</div>
                <p className="text-sm text-muted-foreground font-medium">Questions Answered</p>
              </div>
              
              {/* Time */}
              <div className="text-center bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Time Spent</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Badge */}
        {percentage !== undefined && (
          <Card className="brevo-card p-6 mb-8 text-center animate-fade-in-up hover-lift" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-center gap-3">
              <Award className={`w-6 h-6 ${performance.color}`} />
              <p className="text-lg font-semibold text-foreground">
                You scored <span className={`font-bold ${performance.color}`}>{percentage}%</span>
              </p>
              <TrendingUp className={`w-6 h-6 ${performance.color}`} />
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <Button 
            onClick={() => navigate("/leaderboard")}
            className="btn-hero flex items-center justify-center gap-2 shadow-lg"
            size="lg"
          >
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </Button>
          
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center justify-center gap-2 border-2 rounded-[var(--radius-button)] shadow-md"
            size="lg"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </div>

        {/* Motivational Message */}
        <div className="mt-12 text-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <Card className="brevo-card p-6 md:p-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/10">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {percentage && percentage >= 80 ? (
                <>
                  Amazing work! Your performance shows great knowledge. Share your achievement on social media and inspire others! 🌟
                </>
              ) : percentage && percentage >= 60 ? (
                <>
                  Good job! You're on the right track. Keep learning and you'll master it in no time! 💪
                </>
              ) : (
                <>
                  Every expert was once a beginner. Keep practicing and you'll see improvement! We believe in you! 🚀
                </>
              )}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;

