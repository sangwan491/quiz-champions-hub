import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, type User } from "@/data/questions";
import { Linkedin, Mail, Phone, Gift } from "lucide-react";
import SetPassword from "./SetPassword";
import LoginForm from "./LoginForm";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserRegistrationProps {
  onUserRegistered: (user: User) => void;
}

type AuthStep = 'choose' | 'register' | 'login' | 'setPassword';

const UserRegistration = ({ onUserRegistered }: UserRegistrationProps) => {
  const [step, setStep] = useState<AuthStep>('choose');
  const [name, setName] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState<User | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    // Phone validation: Indian 10-digit mobile number
    const normalizedPhone = phone.replace(/[^0-9]/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a 10-digit mobile number",
        variant: "destructive"
      });
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email",
        variant: "destructive"
      });
      return;
    }

    if (linkedinProfile.trim()) {
      const url = linkedinProfile.trim();
      // Accept linkedin.com/in/ or company pages; require https and domain linkedin.com
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|company|school)\/[^\s/]+\/?$/i;
      if (!linkedinRegex.test(url)) {
        toast({
          title: "Invalid LinkedIn URL",
          description: "Use a full LinkedIn URL like https://www.linkedin.com/in/username",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const user = await api.registerUser({
        name: name.trim(),
        linkedinProfile: linkedinProfile.trim() || undefined,
        email: email.trim() || undefined,
        phone: normalizedPhone,
      });
      
      setNewUser(user);
      setStep('setPassword');
      
      toast({
        title: "Registration Successful!",
        description: "Now please set a password for your account."
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // If user already exists, suggest login
      if (error?.message?.includes("already exists")) {
        toast({
          title: "Account Exists",
          description: "This phone number is already registered. Please login instead.",
          variant: "destructive"
        });
        setStep('login');
      } else {
        toast({
          title: "Registration Failed",
          description: error?.message || "Failed to register. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSet = (user: User, token: string) => {
    // Store user and token
    localStorage.setItem("currentUser", JSON.stringify(user));
    // Trigger custom event for immediate header update
    window.dispatchEvent(new CustomEvent('userStateChanged'));
    onUserRegistered(user);
  };

  const handleLoginSuccess = (user: User, token: string) => {
    // Store user and token
    localStorage.setItem("currentUser", JSON.stringify(user));
    // Trigger custom event for immediate header update
    window.dispatchEvent(new CustomEvent('userStateChanged'));
    onUserRegistered(user);
  };

  // Choose between login and register
  if (step === 'choose') {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4 bg-home-hero">
        <div className="min-h-screen">
        <div className="px-4 py-6 w-full max-w-md animate-fade-in-up home-card border-none md:border-1 md:mt-20">
          <div className="text-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 hover:opacity-80 transition-opacity cursor-pointer"
              type="button"
              aria-label="Go to home page"
            >
              {/* <UserPlus className="w-8 h-8 text-primary-foreground" /> */}
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

            </button>
            <h1 className="text-2xl font-bold mb-6 text-foreground">Welcome</h1>
            {/* <p className="text-muted-foreground">Join the ultimate React India 2025 quiz competition</p> */}
          </div>

          <div className="space-y-6">
            <Button 
              onClick={() => setStep('register')}
              className="w-full btn-hero"
            >
              Create New Account
            </Button>
            
            <Button 
              onClick={() => setStep('login')}
              variant="outline"
              className="w-full"
            >
              I Already Have an Account
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to participate in the quiz session.{" "}
              <Link
                to="/rules"
                className="text-primary hover:underline font-medium"
              >
                Rules and Regulations
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="bg-brevo-brand bg-brevo-brand-landing fixed bottom-0 left-0 w-full h-20 bg-cover bg-center bg-no-repeat"></div>
      </div>
    );
  }

  // Login form
  if (step === 'login') {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setStep('register')}
      />
    );
  }

  // Set password step
  if (step === 'setPassword' && newUser) {
    return (
      <SetPassword
        user={newUser}
        onPasswordSet={handlePasswordSet}
        onBack={() => setStep('register')}
      />
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 px-4 py-6 bg-home-hero">
      <div className="flex login-page-container items-center justify-center mb-6">
      <div className="p-2 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-6">
          {/* <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary-foreground" />
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
          </div> */}
          <h1 className="text-2xl font-bold mb-2 text-foreground">Enter your details!</h1>
          {/* <p className="text-muted-foreground">Enter your details to get started</p> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
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
            <p className="text-xs text-muted-foreground mt-1">
              Should be valid and will be verified for prize distribution
            </p>
          </div>

          {/* Info message about completing profile */}
          <Alert className="bg-primary/5 border-primary/20">
            <Gift className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <span className="font-medium text-primary">Complete your profile to maximize your rewards!</span>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn Profile (optional)</Label>
            <div className="relative mt-1">
              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="linkedin"
                type="url"
                value={linkedinProfile}
                onChange={(e) => setLinkedinProfile(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button"
              onClick={() => setStep('choose')}
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
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link
              to="/rules"
              className="text-primary hover:underline font-medium"
            >
              Rules and Regulations
            </Link>
          </p>
        </div>
   
        
      </div>
      
        </div>
        <div className="mb-6 text-center">
          <p className="text-base text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setStep('login')}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
        
    </div>
  );
};

export default UserRegistration; 