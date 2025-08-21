import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Clock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sampleLeaderboard, type QuizResult } from "@/data/questions";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    // Combine sample data with stored results
    const storedResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
    const allResults = [...sampleLeaderboard, ...storedResults];
    
    // Sort by score descending
    const sortedResults = allResults.sort((a, b) => b.score - a.score);
    
    setLeaderboard(sortedResults);
  }, []);

  const getFilteredResults = () => {
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return leaderboard.filter(result => {
          const resultDate = new Date(result.completedAt);
          return resultDate.toDateString() === now.toDateString();
        });
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return leaderboard.filter(result => {
          const resultDate = new Date(result.completedAt);
          return resultDate >= weekAgo;
        });
      default:
        return leaderboard;
    }
  };

  const filteredResults = getFilteredResults();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20";
      case 2:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20";
      case 3:
        return "bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20";
      default:
        return "bg-card border-border";
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Global Leaderboard
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            See how you rank against other quiz masters
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 mb-8">
          {(['all', 'week', 'today'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? "default" : "outline"}
              onClick={() => setFilter(filterOption)}
              className="capitalize"
            >
              {filterOption === 'all' ? 'All Time' : filterOption}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        {filter === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card-glass p-6 text-center animate-fade-in-up">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-2xl font-bold">{filteredResults.length}</div>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </Card>
            
            <Card className="card-glass p-6 text-center animate-fade-in-up [animation-delay:0.1s]">
              <Target className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-2xl font-bold">
                {filteredResults.length > 0 ? Math.round(filteredResults.reduce((acc, r) => acc + r.score, 0) / filteredResults.length) : 0}
              </div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </Card>
            
            <Card className="card-glass p-6 text-center animate-fade-in-up [animation-delay:0.2s]">
              <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-2xl font-bold">
                {filteredResults.length > 0 ? formatTime(Math.round(filteredResults.reduce((acc, r) => acc + r.timeSpent, 0) / filteredResults.length)) : '0:00'}
              </div>
              <p className="text-sm text-muted-foreground">Average Time</p>
            </Card>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <Card className="card-glass p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results yet</h3>
              <p className="text-muted-foreground">Be the first to complete a quiz!</p>
            </Card>
          ) : (
            filteredResults.map((result, index) => {
              const rank = index + 1;
              const percentage = Math.round((result.score / (result.totalQuestions * 30)) * 100);
              
              return (
                <Card 
                  key={result.id} 
                  className={`p-6 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up ${getRankClass(rank)}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center">
                        {getRankIcon(rank)}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{result.playerName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(result.completedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="text-2xl font-bold text-primary">{result.score}</div>
                        <p className="text-sm text-muted-foreground">Score</p>
                      </div>
                      
                      <div className="hidden sm:block">
                        <div className="text-lg font-semibold">{percentage}%</div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                      </div>
                      
                      <div className="hidden md:block">
                        <div className="text-lg font-semibold">{formatTime(result.timeSpent)}</div>
                        <p className="text-sm text-muted-foreground">Time</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;