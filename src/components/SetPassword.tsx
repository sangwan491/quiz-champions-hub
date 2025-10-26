import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, type User } from "@/data/questions";
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SetPasswordProps {
  user: User;
  onPasswordSet: (user: User, token: string) => void;
  onBack: () => void;
}

const SetPassword = ({ user, onPasswordSet, onBack }: SetPasswordProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await api.setPassword(user.id, password);
      
      toast({
        title: "Password Set!",
        description: "Your account is now ready. Welcome to the Brevo Quiz Challenge!"
      });
      
      onPasswordSet(result.user, result.token);
    } catch (error: any) {
      console.error('Set password error:', error);
      toast({
        title: "Failed to Set Password",
        description: error?.message || "Failed to set password. Please try again.",
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
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Set Your Password</h1>
          <p className="text-muted-foreground">
            Hi {user.name}! Please create a secure password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Important Warning Message */}
          <Alert className="bg-amber-500/10 border-amber-500/50">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium text-amber-500">Please remember your password!</span>
              <br />
              <span className="text-muted-foreground">
                Password can only be reset by admin at the Brevo booth.
              </span>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 6 characters long
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 btn-hero"
              disabled={isLoading}
            >
              {isLoading ? "Setting Password..." : "Set Password"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your password will be securely encrypted and stored safely.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SetPassword; 