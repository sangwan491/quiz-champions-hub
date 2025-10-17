import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Zap, Trophy, Play, Clock, Users, CheckCircle, Share, Twitter, Linkedin, Copy, AlertCircle } from "lucide-react";
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
    // Check if user is already registered and load auth token
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("authToken");
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validate minimal required fields and ensure password is set
        if (parsedUser && typeof parsedUser.id === "string" && typeof parsedUser.name === "string" && parsedUser.name.trim() && parsedUser.phone) {
          setUser(parsedUser);
          // Set the auth token for API calls
          auth.setToken(savedToken);
        } else {
          // Clear invalid user data
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
      // Sort: active → scheduled (soonest first) → completed
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
    // Trigger custom event for immediate header update
    window.dispatchEvent(new CustomEvent('userStateChanged'));
  };

  // Listen for logout events to clear user state
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

    // If scheduled and not yet started, prevent start
    if (quiz.status === 'scheduled') {
      const now = Date.now();
      const schedMs = quiz.scheduledAt ? new Date(quiz.scheduledAt).getTime() : NaN;
      if (!Number.isNaN(schedMs) && now < schedMs) {
        toast({ title: "Scheduled", description: `Starts at ${new Date(schedMs).toLocaleString()}`, variant: "destructive" });
        return;
      }
    }

    // Store current user and quiz info for the quiz session (metadata only)
    localStorage.setItem("playerName", user.name);
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("currentQuiz", JSON.stringify({ id: quiz.id, title: quiz.title, scheduledAt: quiz.scheduledAt || null }));
    
    navigate("/quiz");
  };

  // Show registration form if user is not registered
  if (!user) {
    return <UserRegistration onUserRegistered={handleUserRegistered} />;
  }

  const features = [
    {
      icon: Brain,
      title: "Smart Questions",
      description: "Curated questions across multiple categories and difficulty levels"
    },
    {
      icon: Zap,
      title: "Real-time Scoring",
      description: "Instant feedback with dynamic scoring based on speed and accuracy"
    },
    {
      icon: Trophy,
      title: "Global Leaderboard",
      description: "Compete with players worldwide and climb the rankings"
    }
  ];

  const active = quizzes.filter(q => q.status === 'active');
  const scheduled = quizzes.filter(q => q.status === 'scheduled');
  const completed = quizzes.filter(q => q.status === 'completed');

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block animate-fade-in-up mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-semibold text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                React India 2025
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
              <span className="block text-foreground mb-2">Welcome,</span>
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                {user.name}!
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up leading-relaxed px-4" style={{animationDelay: '0.1s'}}>
              {active.length > 0 
                ? `🎯 ${active.length} active quiz${active.length > 1 ? 'zes' : ''} available! Test your knowledge and compete for the top spot!`
                : completed.length > 0
                  ? `🎓 No active quizzes currently. ${completed.length} quiz${completed.length > 1 ? 'zes' : ''} have ended.`
                  : "⏳ Waiting for the next quiz session to begin. Check back soon!"
              }
            </p>
            
            {/* Loading State */}
            {isLoading ? (
              <div className="text-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="inline-flex items-center px-6 py-3 bg-card backdrop-blur-sm rounded-full border border-border shadow-md">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
                  <span className="text-muted-foreground font-medium">Loading available quizzes...</span>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto mb-8 space-y-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                {scheduled.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                      <Clock className="w-5 h-5" />
                      <span>Scheduled Quizzes</span>
                    </div>
                    {scheduled.map((quiz, idx) => {
                      const schedMs = quiz.scheduledAt ? new Date(quiz.scheduledAt).getTime() : NaN;
                      const notStarted = !Number.isNaN(schedMs) && Date.now() < schedMs;
                      return (
                        <Card key={quiz.id} className="card-glass p-6 hover-lift" style={{animationDelay: `${0.1 * idx}s`}}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-lg md:text-xl font-bold text-foreground">{quiz.title}</h3>
                                <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  Scheduled
                                </div>
                              </div>
                              {quiz.description && (
                                <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-primary" />
                                  <span className="font-medium">{quiz.totalQuestions} Questions</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-secondary" />
                                  <span className="font-medium">Starts {quiz.scheduledAt ? new Date(quiz.scheduledAt).toLocaleString() : 'TBA'}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => startQuiz(quiz)}
                              disabled={quiz.hasAttempted || notStarted}
                              className="md:ml-4 rounded-[var(--radius-button)] shadow-md"
                              variant={notStarted ? "outline" : (quiz.hasAttempted ? "secondary" : "default")}
                              size="lg"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {notStarted ? "Starts Soon" : (quiz.hasAttempted ? "Completed" : "Start Quiz")}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
                {active.map((quiz, idx) => (
                  <Card key={quiz.id} className="card-glass p-6 hover-lift border-2 border-primary/20" style={{animationDelay: `${0.1 * (idx + scheduled.length)}s`}}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-foreground">{quiz.title}</h3>
                          {quiz.hasAttempted && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </div>
                          )}
                          {!quiz.hasAttempted && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
                              <Zap className="w-3 h-3" />
                              Active Now
                            </div>
                          )}
                        </div>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="font-medium">{quiz.totalQuestions} Questions</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span className="font-medium">{Math.floor((quiz.totalTime || 0) / 60)}m {((quiz.totalTime || 0) % 60)}s</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => startQuiz(quiz)}
                        disabled={quiz.hasAttempted}
                        className="md:ml-4 rounded-[var(--radius-button)] shadow-md btn-hero"
                        size="lg"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {quiz.hasAttempted ? "Completed" : "Start Quiz"}
                      </Button>
                    </div>
                  </Card>
                ))}

                {completed.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground font-semibold">
                      <AlertCircle className="w-5 h-5" />
                      <span>Ended Quizzes</span>
                    </div>
                    {completed.map((quiz, idx) => (
                      <Card key={quiz.id} className="card-glass p-6 opacity-80 hover:opacity-100 transition-opacity" style={{animationDelay: `${0.1 * (idx + active.length + scheduled.length)}s`}}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg md:text-xl font-bold text-foreground">{quiz.title}</h3>
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${quiz.hasAttempted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted/50 text-muted-foreground border-muted'}`}>
                                {quiz.hasAttempted ? <CheckCircle className="w-3 h-3" /> : null}
                                {quiz.hasAttempted ? 'Completed' : 'Ended'}
                              </div>
                            </div>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">{quiz.totalQuestions} Questions</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">{Math.floor((quiz.totalTime || 0) / 60)}m {((quiz.totalTime || 0) % 60)}s</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => startQuiz(quiz)}
                            disabled={!quiz.hasAttempted}
                            className="md:ml-4 rounded-[var(--radius-button)]"
                            variant={quiz.hasAttempted ? "secondary" : "outline"}
                            size="lg"
                          >
                            {quiz.hasAttempted ? "Completed" : "Ended"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-muted-foreground animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                <span className="font-medium">Multiple Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.3s'}} />
                <span className="font-medium">Timed Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.6s'}} />
                <span className="font-medium">Live Leaderboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brevo Ecosystem Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Discover Brevo
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The leading CRM suite to grow your business. Explore opportunities to join our team and learn from our engineering insights.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <Card className="brevo-card hover-lift animate-fade-in-up group">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Join Our Team</h3>
                <p className="text-muted-foreground mb-6 flex-1">Explore exciting career opportunities and be part of our growing team</p>
                <Button asChild variant="outline" className="w-full rounded-[var(--radius-button)] border-2">
                  <a href="https://www.brevo.com/careers/open-positions/" target="_blank" rel="noopener noreferrer">
                    View Open Positions
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="brevo-card hover-lift animate-fade-in-up group" style={{animationDelay: '0.1s'}}>
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Brevo Platform</h3>
                <p className="text-muted-foreground mb-6 flex-1">Discover our all-in-one CRM suite for email, SMS, chat, and more</p>
                <Button asChild variant="outline" className="w-full rounded-[var(--radius-button)] border-2">
                  <a href="https://www.brevo.com/" target="_blank" rel="noopener noreferrer">
                    Explore Brevo
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="brevo-card hover-lift animate-fade-in-up group sm:col-span-2 lg:col-span-1" style={{animationDelay: '0.2s'}}>
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Engineering Blog</h3>
                <p className="text-muted-foreground mb-6 flex-1">Read about our technical insights, innovations, and engineering culture</p>
                <Button asChild variant="outline" className="w-full rounded-[var(--radius-button)] border-2">
                  <a href="https://engineering.brevo.com/" target="_blank" rel="noopener noreferrer">
                    Read Our Blog
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Sharing Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Share Your Experience
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Let your network know about your participation in the Brevo Quiz Challenge @ React India 2025! 
              Copy our pre-written messages or share directly.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Twitter Share */}
            <Card className="brevo-card hover-lift animate-fade-in-up group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                  <Twitter className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-3 text-foreground">Share on Twitter</h3>
                  <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "Just participated in the Brevo Quiz Challenge @ React India 2025! 🚀 Testing my tech knowledge and discovering amazing opportunities @Brevo #BrevoQuiz #ReactIndia2025 #TechChallenge"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-[var(--radius-button)] border-2"
                      onClick={() => {
                        const tweetText = "Just participated in the Brevo Quiz Challenge @ React India 2025! 🚀 Testing my tech knowledge and discovering amazing opportunities @Brevo #BrevoQuiz #ReactIndia2025 #TechChallenge";
                        navigator.clipboard.writeText(tweetText);
                        toast({
                          title: "Copied!",
                          description: "Tweet copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-[var(--radius-button)]"
                      asChild
                    >
                      <a 
                        href="https://twitter.com/intent/tweet?text=Just%20participated%20in%20the%20Brevo%20Quiz%20Challenge%20%40%20React%20India%202025!%20%F0%9F%9A%80%20Testing%20my%20tech%20knowledge%20and%20discovering%20amazing%20opportunities%20%40Brevo%20%23BrevoQuiz%20%23ReactIndia2025%20%23TechChallenge"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Tweet
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* LinkedIn Share */}
            <Card className="brevo-card hover-lift animate-fade-in-up group" style={{animationDelay: '0.1s'}}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-3 text-foreground">Share on LinkedIn</h3>
                  <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "Excited to participate in the Brevo Quiz Challenge at React India 2025! It's been a great way to test my knowledge while learning about Brevo's innovative CRM platform and their engineering culture. Check out their open positions and engineering insights! #ReactIndia2025 #BrevoQuiz #TechCommunity"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-[var(--radius-button)] border-2"
                      onClick={() => {
                        const linkedinText = "Excited to participate in the Brevo Quiz Challenge at React India 2025! It's been a great way to test my knowledge while learning about Brevo's innovative CRM platform and their engineering culture. Check out their open positions and engineering insights! #ReactIndia2025 #BrevoQuiz #TechCommunity";
                        navigator.clipboard.writeText(linkedinText);
                        toast({
                          title: "Copied!",
                          description: "LinkedIn post copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-[var(--radius-button)]"
                      asChild
                    >
                      <a 
                        href="https://www.linkedin.com/sharing/share-offsite/?url=https://www.brevo.com&summary=Excited%20to%20participate%20in%20the%20Brevo%20Quiz%20Challenge%20at%20React%20India%202025!%20It's%20been%20a%20great%20way%20to%20test%20my%20knowledge%20while%20learning%20about%20Brevo's%20innovative%20CRM%20platform%20and%20their%20engineering%20culture.%20Check%20out%20their%20open%20positions%20and%20engineering%20insights!%20%23ReactIndia2025%20%23BrevoQuiz%20%23TechCommunity"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;