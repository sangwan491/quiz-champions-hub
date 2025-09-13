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
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <span style={{ width: '32px', height: '32px' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  fill="none"
                  viewBox="0 0 32 32"
                  className="sib-logo__clickable___vYxcX undefined"
                >
                  <circle cx="16" cy="16" r="16" fill="var(--brand-forest-green-600)"></circle>
                  <path
                    fill="#fff"
                    d="M21.002 14.54c.99-.97 1.453-2.089 1.453-3.45 0-2.814-2.07-4.69-5.19-4.69H9.6v20h6.18c4.698 0 8.22-2.874 8.22-6.686 0-2.089-1.081-3.964-2.998-5.174Zm-8.62-5.538h4.573c1.545 0 2.565.877 2.565 2.208 0 1.513-1.329 2.663-4.048 3.54-1.854.574-2.688 1.059-2.997 1.634l-.094.001V9.002Zm3.151 14.796h-3.152v-3.085c0-1.362 1.175-2.693 2.813-3.208 1.453-.484 2.657-.969 3.677-1.482 1.36.787 2.194 2.148 2.194 3.57 0 2.42-2.35 4.205-5.532 4.205Z"
                  ></path>
                </svg>
              </span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              QuizMaster by Brevo
            </h1>
          </Link>

          <nav className="flex items-center space-x-2">
            {/* Only show navigation if user is logged in and not on quiz/admin routes */}
            {currentUser && !isQuizRoute && !isAdminRoute && (
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