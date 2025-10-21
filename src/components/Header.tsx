import { Trophy, Settings, Home, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/data/questions";

const Header = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState<boolean>(false);

  const isActive = (path: string) => location.pathname === path;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isQuizRoute = location.pathname === '/quiz' || location.pathname === '/results';

  // Update user state reactively
  useEffect(() => {
    const checkUser = () => {
      try {
        const raw = localStorage.getItem('currentUser');
        const user = raw ? JSON.parse(raw) : null;
        setCurrentUser(user);
        
        // Check admin status if user is logged in
        if (user) {
          checkAdminStatus();
        } else {
          setIsAdmin(false);
          setAdminCheckLoading(false);
        }
      } catch {
        setCurrentUser(null);
        setIsAdmin(false);
        setAdminCheckLoading(false);
      }
    };
    
    checkUser();
    // Listen for storage changes to update user state
    window.addEventListener('storage', checkUser);
    // Listen for custom events (for same-window updates)
    window.addEventListener('userStateChanged', checkUser);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userStateChanged', checkUser);
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      setAdminCheckLoading(true);
      const status = await api.getAdminStatus();
      setIsAdmin(status?.isAdmin || false);
    } catch (error) {
      console.error('Admin status check failed:', error);
      setIsAdmin(false);
    } finally {
      setAdminCheckLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear local auth state
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAdmin(false);
    setAdminCheckLoading(false);
    
    // Trigger a custom storage event since localStorage changes from same window don't trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'currentUser',
      oldValue: 'user_data',
      newValue: null,
      url: window.location.href
    }));
    
    // Trigger custom event for immediate updates
    window.dispatchEvent(new CustomEvent('userStateChanged'));
    
    // Soft navigation by forcing reload so hooks re-evaluate user state
    location.pathname !== '/' ? (window.location.href = '/') : window.location.reload();
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm bg-header ">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-fit h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center bg-none">
              <span style={{ width: '100px', height: '32px' }}>
                <svg width="100" height="30" viewBox="0 0 1000 295" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M820.28 182.338C820.28 137.755 848.604 106.4 888.892 106.4C929.18 106.4 957.956 137.737 957.956 182.338C957.956 226.939 929.187 256.5 888.892 256.5C848.598 256.5 820.28 
  225.588 820.28 182.338ZM778.224 182.338C778.224 248.12 824.262 294.479 888.886 294.479C953.51 294.479 1000 248.12 1000 182.338C1000 116.556 953.962 68.4399 888.886 68.4399C823.81 
  68.4399 778.224 115.686 778.224 182.338ZM563.521 71.0853L650.292 291.821H691.025L777.791 71.0853H733.966L671.104 241.498H670.214L607.352 71.0853H563.521ZM394.856 174.383C397.508 
  133.76 424.515 106.4 461.261 106.4C493.128 106.4 517.037 126.712 520.58 157.179H447.089C420.973 157.179 406.801 160.269 396.191 174.402H394.856V174.39V174.383ZM352.805 
  181.006C352.805 246.788 399.289 294.46 463.468 294.46C506.854 294.46 544.916 272.391 561.295 237.502L525.885 219.835C513.494 242.792 489.585 256.482 463.468 256.482C432.028 256.482 
  403.704 232.637 403.704 209.679C403.704 197.766 411.673 192.457 423.18 192.457H563.502V180.544C563.502 114.317 521.007 68.4029 459.925 68.4029C398.844 68.4029 352.799 115.649 
  352.799 180.988M232.399 291.796H272.242V156.285C272.242 127.149 290.382 106.394 315.627 106.394C326.256 106.394 337.311 109.927 342.635 114.774C346.623 104.174 352.818 93.5923 
  362.111 82.9924C351.482 74.1684 333.342 68.4153 315.627 68.4153C266.937 68.4153 232.399 104.618 232.399 156.267V291.809V291.796ZM39.843 145.698V37.9598H105.358C127.486 37.9598 
  142.103 50.7611 142.103 70.185C142.103 92.2542 123.072 109.033 84.1191 121.834C57.5571 130.214 45.6116 137.281 41.1785 145.679L39.843 145.692V145.698ZM39.843 253.861V208.835C39.843 
  188.967 56.6668 169.543 80.1311 162.032C100.943 154.966 118.193 147.899 132.81 140.407C152.286 151.895 164.232 171.744 164.232 192.5C164.232 227.814 130.584 253.861 84.9909 
  253.861H39.843ZM0 291.821H88.5337C155.829 291.821 206.282 249.884 206.282 194.257C206.282 163.79 190.794 136.43 163.341 118.763C177.513 104.63 184.153 88.2955 184.153 
  68.4276C184.153 27.3784 154.493 0 109.791 0H0V291.821Z" fill="#0B996E"/>
  </svg>


              </span>
            </div>
            {/* <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-gray-400">
             Quiz Challenge @ React India 2025
            </h1> */}
          </Link>

          <nav className="flex items-center space-x-2">
            {/* Show navigation when user is logged in on all routes except during quiz/results */}
            {currentUser && !isQuizRoute && (
              <>
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to="/" className="flex items-center space-x-2">
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                </Button>

                <Button
                  variant={isActive("/leaderboard") ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to="/leaderboard" className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">Leaderboard</span>
                  </Link>
                </Button>

                {/* Only show admin nav if user is admin and not still checking */}
                {isAdmin && !adminCheckLoading && (
                  <Button
                    variant={isActive("/admin") ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link to="/admin" className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  </Button>
                )}
              </>
            )}

            {/* Right-aligned auth - show logout if user exists */}
            {currentUser && (
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2 ml-4">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;