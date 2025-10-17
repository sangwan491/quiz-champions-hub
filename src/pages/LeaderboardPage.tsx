import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Target, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, type QuizResult, type Quiz } from "@/data/questions";

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("all");
  const [filter, setFilter] = useState<'all' | 'today'>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const { toast } = useToast();

  useEffect(() => {
    loadQuizzes();
    loadLeaderboard();
    // Get logged-in user id
    try {
      const saved = localStorage.getItem("currentUser");
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.id) setCurrentUserId(u.id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadLeaderboard();
    setCurrentPage(1);
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
        // Aggregate per user: sum scores and total time across quizzes; keep latest completion date
        const byUser = new Map<string, (QuizResult & { count: number })>();
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
              completedAt:
                new Date(r.completedAt) > new Date(existing.completedAt)
                  ? r.completedAt
                  : existing.completedAt,
              // Sum time spent across all attempts (global total time)
              timeSpent: existing.timeSpent + r.timeSpent,
              // Keep player name from the most recent entry
              playerName:
                new Date(r.completedAt) > new Date(existing.completedAt)
                  ? r.playerName
                  : existing.playerName,
              // Sum total questions across attempts
              totalQuestions: existing.totalQuestions + r.totalQuestions,
              // prefer phone if present on latest
              phone:
                new Date(r.completedAt) > new Date(existing.completedAt)
                  ? r.phone || existing.phone
                  : existing.phone || r.phone,
              count: existing.count + 1,
            };
            byUser.set(key, aggregated);
          }
        }
        // Save attempt counts and reduce list
        setAttemptCounts(
          Object.fromEntries(
            Array.from(byUser.entries()).map(([uid, v]) => [uid, v.count])
          )
        );
        results = Array.from(byUser.values()).map(({ count, ...rest }) => rest);
      } else {
        results = await api.getQuizResults(selectedQuizId);
        setAttemptCounts({});
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
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE));
  const paginatedResults = filteredResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Current user rank/info
  const myIndex = filteredResults.findIndex(r => r.userId === currentUserId);
  const myResult = myIndex >= 0 ? filteredResults[myIndex] : null;

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

  // Accuracy removed per requirements

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="container mx-auto">
          <div className="text-center py-12 animate-fade-in-up">
            <div className="relative mb-8 inline-block">
              <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:h-20 border-b-4 border-primary mx-auto shadow-lg" 
                   style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.3))' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Loading Leaderboard...</h2>
            <p className="text-muted-foreground">Fetching the top performers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 md:p-6 pb-12">
      <div className="container mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-10 animate-fade-in-up">
          <div className="inline-block mb-4">
            <Trophy className="w-16 h-16 md:w-20 md:h-20 text-primary animate-float mx-auto" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
            Leaderboard
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            {getSelectedQuizTitle()} Rankings
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {/* Quiz Selection */}
            <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
              <SelectTrigger className="w-full sm:w-64 rounded-[var(--radius-button)] border-2 shadow-sm">
                <SelectValue placeholder="Select quiz..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌍 Global Leaderboard</SelectItem>
                {quizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <div className="flex bg-card rounded-[var(--radius-button)] p-1 border-2 border-border shadow-sm">
              {(['all', 'today'] as const).map((filterOption) => (
                <Button
                  key={filterOption}
                  variant={filter === filterOption ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(filterOption)}
                  className="capitalize rounded-[var(--radius-button)]"
                >
                  {filterOption === 'all' ? 'All Time' : 'Today'}
                </Button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button 
              onClick={() => loadLeaderboard(true)} 
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="rounded-[var(--radius-button)] border-2 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* My Stats */}
        {myResult && (
          <Card className="brevo-card p-5 md:p-6 mb-6 md:mb-8 animate-fade-in-up border-2 border-primary/20 shadow-lg" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <div className="text-xs md:text-sm text-muted-foreground font-medium mb-1">Your Position</div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">#{myIndex + 1}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs md:text-sm text-muted-foreground font-medium mb-1">Your Points</div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{myResult.score}</div>
              </div>
            </div>
            {selectedQuizId === 'all' && (
              <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground font-medium">
                🎯 {attemptCounts[currentUserId || ""] || 1} quizzes attempted
              </div>
            )}
          </Card>
        )}

        {/* Stats Cards */}
        {filter === 'all' && filteredResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Card className="brevo-card p-6 text-center hover-lift shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{filteredResults.length}</div>
              <p className="text-sm text-muted-foreground font-medium">Total Players</p>
            </Card>
            
            <Card className="brevo-card p-6 text-center hover-lift shadow-md">
              <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {Math.round(filteredResults.reduce((acc, r) => acc + r.score, 0) / filteredResults.length)}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Average Score</p>
            </Card>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3 md:space-y-4">
          {paginatedResults.length === 0 ? (
            <Card className="brevo-card p-8 md:p-12 text-center animate-fade-in-up">
              <Trophy className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground mx-auto mb-6 opacity-50" />
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                {filter === 'all' ? 'No results yet' : `No results for ${filter}`}
              </h3>
              <p className="text-muted-foreground text-base">
                {filter === 'all' 
                  ? 'Be the first to complete a quiz and claim the top spot! 🏆' 
                  : 'Try changing the filter or check back later.'
                }
              </p>
            </Card>
          ) : (
            paginatedResults.map((result, index) => {
              const rank = (currentPage - 1) * PAGE_SIZE + index + 1;
              
              return (
                <Card 
                  key={result.id} 
                  className={`p-5 md:p-6 transition-all duration-300 hover-lift animate-fade-in-up ${getRankClass(rank)} shadow-md`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center flex-shrink-0">
                        {getRankIcon(rank)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base md:text-lg text-foreground truncate">
                          {result.playerName}
                          {currentUserId === result.userId && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 align-middle font-semibold">You</span>
                          )}
                        </h3>
                        <div className="text-xs md:text-sm text-muted-foreground mt-1 space-y-0.5">
                          <p className="font-medium">{formatDate(result.completedAt)}</p>
                          <div className="flex flex-wrap gap-2">
                            {result.phone && (
                              <span className="inline-flex items-center gap-1 text-xs">
                                📞 {result.phone}
                              </span>
                            )}
                            {selectedQuizId === 'all' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2 py-0.5 rounded-full">
                                🎯 {attemptCounts[result.userId] || 1} quizzes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 text-right flex-shrink-0">
                      <div>
                        <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{result.score}</div>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">Points</p>
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-base md:text-lg font-bold text-foreground">{formatTime(result.timeSpent)}</div>
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">Time</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredResults.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 mt-8 animate-fade-in-up">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="rounded-[var(--radius-button)] border-2"
            >
              ← Prev
            </Button>
            <div className="px-4 py-2 bg-card rounded-[var(--radius-button)] border-2 border-border text-sm font-semibold text-foreground shadow-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="rounded-[var(--radius-button)] border-2"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Footer Info */}
        {filteredResults.length > 0 && (
          <div className="mt-8 text-center animate-fade-in-up">
            <Card className="brevo-card p-4 inline-block">
              <p className="text-sm text-muted-foreground font-medium">
                🔄 Leaderboard updates in real-time as players complete quizzes
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;