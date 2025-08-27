import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Zap, Trophy, Play, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, type Quiz, type User } from "@/data/questions";
import UserRegistration from "@/components/UserRegistration";

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already registered
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadActiveQuizzes();
    }
  }, [user]);

  const loadActiveQuizzes = async () => {
    try {
      setIsLoading(true);
      const quizzes = await api.getActiveQuizzes();
      setActiveQuizzes(quizzes);
      
      // Check user attempts for each active quiz
      if (user) {
        const attempts: Record<string, boolean> = {};
        for (const quiz of quizzes) {
          try {
            const attemptData = await api.checkUserAttempt(user.id, quiz.id);
            attempts[quiz.id] = attemptData.hasAttempted;
          } catch (error) {
            console.error(`Error checking attempt for quiz ${quiz.id}:`, error);
            attempts[quiz.id] = false;
          }
        }
        setUserAttempts(attempts);
      }
    } catch (error) {
      console.error('Error loading active quizzes:', error);
      setActiveQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegistered = (registeredUser: User) => {
    setUser(registeredUser);
    localStorage.setItem("currentUser", JSON.stringify(registeredUser));
  };

  const startQuiz = async (quiz: Quiz) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please register first to join the quiz",
        variant: "destructive"
      });
      return;
    }

    // Check if user has already attempted this quiz
    if (userAttempts[quiz.id]) {
      toast({
        title: "Already Attempted",
        description: "You have already completed this quiz. Each quiz can only be attempted once.",
        variant: "destructive"
      });
      return;
    }

    // Store current user and quiz info for the quiz session
    localStorage.setItem("playerName", user.name);
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("currentQuiz", JSON.stringify(quiz));
    
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="@/assets/quiz-hero.jpg" 
            alt="Quiz Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/60" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-glow">
                Welcome
              </span>
              <br />
              <span className="text-foreground">{user.name}!</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in-up [animation-delay:0.2s]">
              {activeQuizzes.length > 0 
                ? `${activeQuizzes.length} active quiz${activeQuizzes.length > 1 ? 'es' : ''} available! Test your knowledge and compete for the top spot!`
                : "Waiting for the next quiz session to begin. Check back soon!"
              }
            </p>
            
            {/* Loading State */}
            {isLoading ? (
              <div className="text-center animate-fade-in-up [animation-delay:0.4s]">
                <div className="inline-flex items-center px-6 py-3 bg-card/70 backdrop-blur-sm rounded-full border border-border/50">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3"></div>
                  <span className="text-muted-foreground">Loading available quizzes...</span>
                </div>
              </div>
            ) : activeQuizzes.length > 0 ? (
              <div className="max-w-2xl mx-auto mb-8 space-y-4 animate-fade-in-up [animation-delay:0.4s]">
                {activeQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="card-glass p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{quiz.title}</h3>
                          {userAttempts[quiz.id] && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </div>
                          )}
                        </div>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{quiz.questions.length} Questions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{quiz.time_per_question}s per question</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => startQuiz(quiz)}
                        disabled={userAttempts[quiz.id]}
                        className="ml-4"
                        variant={userAttempts[quiz.id] ? "secondary" : "default"}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {userAttempts[quiz.id] ? "Completed" : "Start Quiz"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto text-center animate-fade-in-up [animation-delay:0.4s]">
                <Card className="card-glass p-8">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Quizzes</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no active quiz sessions at the moment. Check back soon or contact an admin to start a quiz!
                  </p>
                  <Button
                    onClick={loadActiveQuizzes}
                    variant="outline"
                    className="w-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Check Again
                  </Button>
                </Card>
              </div>
            )}

            <div className="flex justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up [animation-delay:0.6s]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>Multiple Categories</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse [animation-delay:0.3s]" />
                <span>Timed Questions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:0.6s]" />
                <span>Live Leaderboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose QuizMaster?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-glass p-8 hover-lift animate-fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;