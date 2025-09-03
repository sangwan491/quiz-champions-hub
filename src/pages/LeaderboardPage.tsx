import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Clock, Target, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, type QuizResult, type Quiz } from "@/data/questions";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("all");
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQuizzes();
    loadLeaderboard();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const quizzesData = await api.getQuizzes();
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const loadLeaderboard = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      let results: QuizResult[];
      
      if (selectedQuizId === "all") {
        results = await api.getResults();
        // Aggregate per user: sum scores across quizzes, keep best (lowest) time and latest completion date
        const byUser = new Map<string, QuizResult & { count: number }>();
        for (const r of results) {
          const key = r.userId;
          const existing = byUser.get(key);
          if (!existing) {
            byUser.set(key, { ...r, count: 1 });
          } else {
            const aggregated: QuizResult & { count: number } = {
              ...existing,
              score: existing.score + r.score,
              // Keep most recent completion time
              completedAt: new Date(r.completedAt) > new Date(existing.completedAt) ? r.completedAt : existing.completedAt,
              // For display, use minimal total time as "best time"
              timeSpent: Math.min(existing.timeSpent, r.timeSpent),
              // Keep player name from the most recent entry
              playerName: new Date(r.completedAt) > new Date(existing.completedAt) ? r.playerName : existing.playerName,
              // For totalQuestions we can sum or keep latest; choose sum for fairness
              totalQuestions: existing.totalQuestions + r.totalQuestions,
              count: existing.count + 1,
            };
            byUser.set(key, aggregated);
          }
        }
        results = Array.from(byUser.values()).map(({ count, ...rest }) => rest);
      } else {
        results = await api.getQuizResults(selectedQuizId);
      }
      
      setLeaderboard(results.sort((a, b) => b.score - a.score));
      
      if (showToast) {
        toast({
          title: "Refreshed",
          description: "Leaderboard updated successfully"
        });
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

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

  const getSelectedQuizTitle = () => {
    if (selectedQuizId === "all") return "Global";
    const quiz = quizzes.find(q => q.id === selectedQuizId);
    return quiz ? quiz.title : "Unknown Quiz";
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
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 ring-1 ring-yellow-500/10";
      case 2:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20 ring-1 ring-gray-400/10";
      case 3:
        return "bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20 ring-1 ring-orange-500/10";
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

  // Accuracy proxy: score vs nominal max (30 points per question)
  const calculateAccuracy = (result: QuizResult) => {
    return Math.round((result.score / Math.max(result.totalQuestions * 30, 1)) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {getSelectedQuizTitle()} Rankings
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {/* Quiz Selection */}
            <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select quiz..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Global Leaderboard</SelectItem>
                {quizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <div className="flex bg-muted rounded-lg p-1">
              {(['all', 'today', 'week'] as const).map((filterOption) => (
                <Button
                  key={filterOption}
                  variant={filter === filterOption ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(filterOption)}
                  className="capitalize"
                >
                  {filterOption === 'all' ? 'All Time' : filterOption}
                </Button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button 
              onClick={() => loadLeaderboard(true)} 
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {filter === 'all' && filteredResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card-glass p-6 text-center animate-fade-in-up">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-2xl font-bold">{filteredResults.length}</div>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </Card>
            
            <Card className="card-glass p-6 text-center animate-fade-in-up [animation-delay:0.1s]">
              <Target className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-2xl font-bold">
                {Math.round(filteredResults.reduce((acc, r) => acc + r.score, 0) / filteredResults.length)}
              </div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </Card>
            
            <Card className="card-glass p-6 text-center animate-fade-in-up [animation-delay:0.2s]">
              <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-2xl font-bold">
                {formatTime(Math.round(filteredResults.reduce((acc, r) => acc + r.timeSpent, 0) / filteredResults.length))}
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
              <h3 className="text-xl font-semibold mb-2">
                {filter === 'all' ? 'No results yet' : `No results for ${filter}`}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Be the first to complete a quiz!' 
                  : 'Try changing the filter or check back later.'
                }
              </p>
            </Card>
          ) : (
            filteredResults.map((result, index) => {
              const rank = index + 1;
              const accuracy = calculateAccuracy(result);
              
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
                        <div className="text-sm text-muted-foreground">
                          <p>{formatDate(result.completedAt)}</p>
                          <p className="text-xs">{result.totalQuestions} questions</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="text-2xl font-bold text-primary">{result.score}</div>
                        <p className="text-sm text-muted-foreground">Points</p>
                      </div>
                      
                      <div className="hidden sm:block">
                        <div className="text-lg font-semibold">{accuracy}%</div>
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

        {/* Current User's Rank (if they've played) */}
        {filteredResults.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Leaderboard updates in real-time as players complete quizzes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;