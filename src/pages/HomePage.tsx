import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Zap, Trophy, Play, Clock, Users, CheckCircle, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, auth, type Quiz, type User } from "@/data/questions";
import UserRegistration from "@/components/UserRegistration";

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Array<Pick<Quiz, 'id' | 'title' | 'description' | 'status' | 'totalTime' | 'totalQuestions' | 'createdAt' | 'scheduledAt'> & { hasAttempted: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("authToken");
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser.id === "string" && typeof parsedUser.name === "string" && parsedUser.name.trim() && parsedUser.phone) {
          setUser(parsedUser);
          auth.setToken(savedToken);
        } else {
          auth.clearToken();
        }
      } catch (error) {
        console.error("Error parsing saved user:", error);
        auth.clearToken();
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      if (!user) return;
      const list = await api.getUserQuizzes(user.id);
      const sorted = list.sort((a, b) => {
        const rank = (s: string) => (s === 'active' ? 0 : s === 'scheduled' ? 1 : s === 'completed' ? 2 : 3);
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        if (a.status === 'scheduled' && b.status === 'scheduled') {
          const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
          if (at !== bt) return at - bt;
        }
        return a.title.localeCompare(b.title);
      });
      setQuizzes(sorted);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegistered = (registeredUser: User) => {
    setUser(registeredUser);
    localStorage.setItem("currentUser", JSON.stringify(registeredUser));
    window.dispatchEvent(new CustomEvent('userStateChanged'));
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue === null) {
        setUser(null);
        auth.clearToken();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const startQuiz = async (quiz: typeof quizzes[number]) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please register first to join the quiz",
        variant: "destructive"
      });
      return;
    }

    if (quiz.status === 'completed' && !quiz.hasAttempted) {
      toast({
        title: "Quiz Ended",
        description: "This quiz has ended and can no longer be attempted.",
        variant: "destructive"
      });
      return;
    }

    if (quiz.hasAttempted) {
      toast({
        title: "Already Attempted",
        description: "You have already completed this quiz.",
        variant: "destructive"
      });
      return;
    }

    if (quiz.status === 'scheduled') {
      const now = Date.now();
      const schedMs = quiz.scheduledAt ? new Date(quiz.scheduledAt).getTime() : NaN;
      if (!Number.isNaN(schedMs) && now < schedMs) {
        toast({ title: "Scheduled", description: `Starts at ${new Date(schedMs).toLocaleString()}`, variant: "destructive" });
        return;
      }
    }

    localStorage.setItem("playerName", user.name);
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("currentQuiz", JSON.stringify({ id: quiz.id, title: quiz.title, scheduledAt: quiz.scheduledAt || null }));
    
    navigate("/quiz");
  };

  if (!user) {
    return <UserRegistration onUserRegistered={handleUserRegistered} />;
  }

  const features = [
    {
      icon: Brain,
      title: "Smart Questions",
      description: "Curated questions across multiple categories and difficulty levels",
      color: "purple" as const
    },
    {
      icon: Zap,
      title: "Real-time Scoring",
      description: "Instant feedback with dynamic scoring based on speed and accuracy",
      color: "teal" as const
    },
    {
      icon: Trophy,
      title: "Global Leaderboard",
      description: "Compete with players worldwide and climb the rankings",
      color: "orange" as const
    }
  ];

  const active = quizzes.filter(q => q.status === 'active');
  const scheduled = quizzes.filter(q => q.status === 'scheduled');
  const completed = quizzes.filter(q => q.status === 'completed');

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent-strong to-accent/50 opacity-60" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-primary/20 mb-6 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">React India 2025 Quiz Challenge</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in-up">
              <span className="text-foreground">Welcome back,</span>
              <br />
              <span className="text-primary">{user.name}!</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 animate-fade-in-up">
              {active.length > 0 
                ? `${active.length} active quiz${active.length > 1 ? 'es' : ''} available. Ready to compete?`
                : scheduled.length > 0
                  ? `${scheduled.length} upcoming quiz${scheduled.length > 1 ? 'zes' : ''}. Stay tuned!`
                  : "Check back soon for new quiz sessions!"
              }
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`card-feature ${feature.color} p-6 hover-lift`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${feature.color === 'purple' ? '[hsl(var(--feature-purple)/0.1)]' : feature.color === 'teal' ? '[hsl(var(--feature-teal)/0.1)]' : '[hsl(var(--feature-orange)/0.1)]'}`}>
                    <feature.icon className={`w-6 h-6 ${feature.color === 'purple' ? 'text-[hsl(var(--feature-purple))]' : feature.color === 'teal' ? 'text-[hsl(var(--feature-teal))]' : 'text-[hsl(var(--feature-orange))]'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quizzes Section */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-card rounded-xl shadow-card">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span className="text-muted-foreground font-medium">Loading quizzes...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Active Quizzes */}
              {active.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/20">
                    <div className="p-2 bg-primary rounded-lg">
                      <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Active Quizzes</h2>
                    <span className="ml-auto badge-primary">{active.length} available</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {active.map((quiz) => (
                      <Card key={quiz.id} className="card-elevated hover-lift">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-foreground">{quiz.title}</h3>
                                {quiz.hasAttempted && (
                                  <span className="badge-success">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </span>
                                )}
                              </div>
                              {quiz.description && (
                                <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{quiz.totalQuestions} Questions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{Math.floor((quiz.totalTime || 0) / 60)}m total</span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => startQuiz(quiz)}
                            disabled={quiz.hasAttempted}
                            className="w-full"
                            size="lg"
                            variant={quiz.hasAttempted ? "outline" : "default"}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {quiz.hasAttempted ? "Already Completed" : "Start Quiz"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduled Quizzes */}
              {scheduled.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-[hsl(var(--feature-orange)/0.2)]">
                    <div className="p-2 bg-[hsl(var(--feature-orange))] rounded-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Scheduled Quizzes</h2>
                    <span className="ml-auto badge-warning">{scheduled.length} upcoming</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scheduled.map((quiz) => {
                      const schedMs = quiz.scheduledAt ? new Date(quiz.scheduledAt).getTime() : NaN;
                      const notStarted = !Number.isNaN(schedMs) && Date.now() < schedMs;
                      
                      return (
                        <Card key={quiz.id} className="card-elevated border-[hsl(var(--feature-orange)/0.3)]">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-foreground">{quiz.title}</h3>
                                  <span className="badge-warning">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Scheduled
                                  </span>
                                </div>
                                {quiz.description && (
                                  <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{quiz.totalQuestions} Questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{quiz.scheduledAt ? new Date(quiz.scheduledAt).toLocaleDateString() : 'TBA'}</span>
                              </div>
                            </div>
                            
                            {quiz.scheduledAt && (
                              <div className="mb-6 p-3 bg-accent rounded-lg border border-border">
                                <p className="text-sm font-medium text-accent-foreground">
                                  Starts: {new Date(quiz.scheduledAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                            
                            <Button
                              onClick={() => startQuiz(quiz)}
                              disabled={notStarted || quiz.hasAttempted}
                              className="w-full"
                              size="lg"
                              variant="outline"
                            >
                              {notStarted ? "Not Started Yet" : quiz.hasAttempted ? "Already Completed" : "Start Quiz"}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Quizzes */}
              {completed.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-border">
                    <div className="p-2 bg-muted rounded-lg">
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Ended Quizzes</h2>
                    <span className="ml-auto text-xs font-medium text-muted-foreground">{completed.length} quiz{completed.length > 1 ? 'zes' : ''}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {completed.map((quiz) => (
                      <Card key={quiz.id} className="card-elevated opacity-60">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-foreground">{quiz.title}</h3>
                            {quiz.hasAttempted && (
                              <span className="badge-success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </span>
                            )}
                          </div>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{quiz.totalQuestions} Questions</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {active.length === 0 && scheduled.length === 0 && completed.length === 0 && (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No Quizzes Available</h3>
                    <p className="text-muted-foreground">
                      Check back soon for exciting new quiz challenges!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
