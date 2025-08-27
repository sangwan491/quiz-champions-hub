import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, type User } from "@/data/questions";
import { UserPlus, Linkedin } from "lucide-react";

interface UserRegistrationProps {
  onUserRegistered: (user: User) => void;
}

const UserRegistration = ({ onUserRegistered }: UserRegistrationProps) => {
  const [name, setName] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const user = await api.registerUser({
        name: name.trim(),
        linkedinProfile: linkedinProfile.trim()
      });
      
      // Store user in localStorage for session persistence
      localStorage.setItem('quizUser', JSON.stringify(user));
      
      toast({
        title: "Welcome!",
        description: `Registration successful. Hello, ${user.name}!`
      });
      
      onUserRegistered(user);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="card-glass p-8 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Join the Quiz!</h1>
          <p className="text-muted-foreground">Enter your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <div className="relative mt-1">
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="linkedin"
                type="url"
                value={linkedinProfile}
                onChange={(e) => setLinkedinProfile(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Optional - helps us connect with you
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full btn-hero"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Start Quiz"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By registering, you agree to participate in the quiz session
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UserRegistration; 