import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Trophy, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/quiz-hero.jpg";

const HomePage = () => {
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  const startQuiz = () => {
    if (playerName.trim()) {
      localStorage.setItem("playerName", playerName.trim());
      navigate("/quiz");
    }
  };

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
            src={heroImage} 
            alt="Quiz Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/60" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-glow">
                Test Your
              </span>
              <br />
              <span className="text-foreground">Knowledge</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in-up [animation-delay:0.2s]">
              Challenge yourself with our interactive quiz platform. 
              Compete globally and prove your expertise across various topics.
            </p>

            <div className="max-w-md mx-auto mb-8 animate-fade-in-up [animation-delay:0.4s]">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-card border-border text-card-foreground"
                  onKeyPress={(e) => e.key === "Enter" && startQuiz()}
                />
                <Button
                  onClick={startQuiz}
                  disabled={!playerName.trim()}
                  className="btn-hero whitespace-nowrap"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </div>

            <div className="flex justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up [animation-delay:0.6s]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>8 Questions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse [animation-delay:0.3s]" />
                <span>Multiple Categories</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:0.6s]" />
                <span>Global Leaderboard</span>
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