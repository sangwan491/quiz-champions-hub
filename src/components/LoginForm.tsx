import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api, type User } from "@/data/questions";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

interface LoginFormProps {
  onLoginSuccess: (user: User, token: string) => void;
  onSwitchToRegister: () => void;
}

const LoginForm = ({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load saved credentials on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem("rememberedPhone");
    const savedPassword = localStorage.getItem("rememberedPassword");
    
    if (savedPhone && savedPassword) {
      setPhone(savedPhone);
      setPassword(savedPassword);
      setRememberPassword(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    // Normalize and validate phone - 10-digit mobile number
    const normalizedPhone = phone.replace(/[^0-9]/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a 10-digit mobile number",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await api.login(normalizedPhone.trim(), password);
      
      // Save or clear credentials based on checkbox
      if (rememberPassword) {
        localStorage.setItem("rememberedPhone", normalizedPhone);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedPhone");
        localStorage.removeItem("rememberedPassword");
      }
      
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${result.user.name}`
      });
      
      onLoginSuccess(result.user, result.token);
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error?.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-background to-muted/20 p-4 bg-home-hero">
    <div className="min-h-screen flex login-page-container items-center justify-center">
      <div className="px-4 py-6 w-full max-w-md animate-fade-in-up border-none mb-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* <LogIn className="w-8 h-8 text-primary-foreground" /> */}
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
              width="250.000000pt" height="250.000000pt" viewBox="0 0 250.000000 250.000000"
              preserveAspectRatio="xMidYMid meet">

              <g transform="translate(0.000000,250.000000) scale(0.100000,-0.100000)"
              fill="#0c996e" stroke="none">
              <path d="M1139 2490 c-648 -64 -1131 -594 -1131 -1240 0 -691 551 -1242 1242
              -1242 691 0 1242 551 1242 1242 0 597 -415 1103 -1000 1219 -118 23 -251 31
              -353 21z m271 -490 c112 -13 191 -51 259 -126 113 -123 120 -320 18 -462 l-35
              -49 41 -32 c186 -142 239 -389 129 -595 -43 -83 -147 -178 -244 -225 -144 -70
              -182 -75 -528 -76 l-305 0 -3 775 c-1 426 0 781 3 788 6 15 534 17 665 2z"/>
              <path d="M970 1509 l0 -283 28 27 c32 30 123 73 238 111 82 27 180 79 221 118
              32 30 63 98 63 139 0 50 -39 120 -80 144 -32 18 -56 20 -252 23 l-218 3 0
              -282z"/>
              <path d="M1410 1213 c-30 -14 -104 -43 -164 -64 -130 -47 -137 -51 -188 -97
              -71 -64 -82 -97 -86 -259 l-4 -143 167 0 c120 0 184 4 229 16 227 59 333 251
              241 440 -25 51 -106 135 -129 133 -6 0 -36 -12 -66 -26z"/>
              </g>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Sign in to continue!</h1>
          {/* <p className="text-muted-foreground">Sign in to continue to the Brevo Quiz Challenge</p> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 mb-4"
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
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberPassword}
              onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              Remember password
            </Label>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            By continuing, you agree to participate in the quiz session.{" "}
            <Link
              to="/rules"
              className="text-primary hover:underline font-medium"
            >
              Rules and Regulations
            </Link>
          </p>

          <Button 
            type="submit" 
            className="w-full btn-hero"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-medium"
            >
              Register here
            </button>
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Forgot your password? Feel free to contact the admin at the Brevo booth for reset or assistance.
          </p>
        </div>
      </div>
    </div>
    <div className="bg-brevo-brand bg-brevo-brand-login fixed bottom-0 left-0 w-full h-20 bg-cover bg-center bg-no-repeat"></div>
    </div>
  );
};

export default LoginForm; 