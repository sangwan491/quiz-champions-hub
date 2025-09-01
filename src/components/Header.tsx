import { Trophy, Settings, Home, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    // Clear local auth state
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    // Soft navigation by forcing reload so hooks re-evaluate user state
    location.pathname !== '/' ? (window.location.href = '/') : window.location.reload();
  };

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">Q</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              QuizMaster
            </h1>
          </Link>

          <nav className="flex items-center space-x-2">
            {/* Hide Home and Leaderboard links on admin routes */}
            {!isAdminRoute && (
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
              </>
            )}

            {/* Show Admin except on home and leaderboard routes */}
            {location.pathname !== '/' && location.pathname !== '/leaderboard' && (
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

            {/* Right-aligned auth */}
            <div className="ml-4 flex items-center gap-2">
              {currentUser && (
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;