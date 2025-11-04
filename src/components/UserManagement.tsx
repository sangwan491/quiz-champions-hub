import { useState, useEffect } from "react";
import { Search, KeyRound, Trash2, Trophy, ChevronLeft, ChevronRight, Edit2, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, type User, type QuizResult } from "@/data/questions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserWithAdmin extends User {
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 10;

export function UserManagement() {
  const [users, setUsers] = useState<UserWithAdmin[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithAdmin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Reset Password Dialog
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; user: UserWithAdmin | null }>({
    open: false,
    user: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Delete User Dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserWithAdmin | null }>({
    open: false,
    user: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // View Scores Dialog
  const [scoresDialog, setScoresDialog] = useState<{ open: boolean; user: UserWithAdmin | null; scores: QuizResult[] }>({
    open: false,
    user: null,
    scores: [],
  });
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // Edit Score Dialog
  const [editScoreDialog, setEditScoreDialog] = useState<{ open: boolean; score: QuizResult | null }>({
    open: false,
    score: null,
  });
  const [editedScore, setEditedScore] = useState<number>(0);
  const [isEditingScore, setIsEditingScore] = useState(false);

  // Reset Quiz Dialog
  const [resetQuizDialog, setResetQuizDialog] = useState<{ open: boolean; score: QuizResult | null; user: UserWithAdmin | null }>({
    open: false,
    score: null,
    user: null,
  });
  const [isResettingQuiz, setIsResettingQuiz] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredUsers(users);
      setCurrentPage(1);
      return;
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.linkedinProfile.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordDialog.user) return;

    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResetting(true);
      await api.resetUserPassword(resetPasswordDialog.user.id, newPassword);
      
      toast({
        title: "Success",
        description: `Password reset successfully for ${resetPasswordDialog.user.name}`,
      });

      // Close dialog and reset form
      setResetPasswordDialog({ open: false, user: null });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      setIsDeleting(true);
      await api.deleteUser(deleteDialog.user.id);
      
      toast({
        title: "Success",
        description: `User ${deleteDialog.user.name} deleted successfully`,
      });

      // Refresh user list
      await loadUsers();
      setDeleteDialog({ open: false, user: null });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewScores = async (user: UserWithAdmin) => {
    try {
      setIsLoadingScores(true);
      setScoresDialog({ open: true, user, scores: [] });
      
      const scores = await api.getUserScores(user.id);
      setScoresDialog({ open: true, user, scores });
    } catch (error: any) {
      console.error('Error loading scores:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load user scores",
        variant: "destructive",
      });
      setScoresDialog({ open: false, user: null, scores: [] });
    } finally {
      setIsLoadingScores(false);
    }
  };

  const handleEditScore = async () => {
    if (!editScoreDialog.score) return;

    try {
      setIsEditingScore(true);
      await api.updateQuizScore(editScoreDialog.score.id, editedScore);
      
      toast({
        title: "Success",
        description: "Score updated successfully",
      });

      // Refresh scores list
      if (scoresDialog.user) {
        const scores = await api.getUserScores(scoresDialog.user.id);
        setScoresDialog({ ...scoresDialog, scores });
      }
      
      setEditScoreDialog({ open: false, score: null });
    } catch (error: any) {
      console.error('Error updating score:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update score",
        variant: "destructive",
      });
    } finally {
      setIsEditingScore(false);
    }
  };

  const handleResetQuiz = async () => {
    if (!resetQuizDialog.score || !resetQuizDialog.user) return;

    try {
      setIsResettingQuiz(true);
      await api.resetUserQuiz(resetQuizDialog.user.id, resetQuizDialog.score.quizId);
      
      toast({
        title: "Success",
        description: `Quiz reset successfully. ${resetQuizDialog.user.name} can now retake this quiz.`,
      });

      // Refresh scores list
      if (scoresDialog.user) {
        const scores = await api.getUserScores(scoresDialog.user.id);
        setScoresDialog({ ...scoresDialog, scores });
      }
      
      setResetQuizDialog({ open: false, score: null, user: null });
    } catch (error: any) {
      console.error('Error resetting quiz:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset quiz",
        variant: "destructive",
      });
    } finally {
      setIsResettingQuiz(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage registered users, reset passwords, and view performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </Badge>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>LinkedIn ID</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No users found matching your search' : 'No users registered yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.phone || '—'}</TableCell>
                      <TableCell>{user.email || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {user.linkedinProfile ? (
                          <a
                            href={user.linkedinProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {user.linkedinProfile}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setResetPasswordDialog({ open: true, user })}
                            disabled={user.isAdmin || isResetting}
                            title={user.isAdmin ? "Cannot modify admin users" : "Reset password"}
                          >
                            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewScores(user)}
                            disabled={isLoadingScores}
                          >
                            {isLoadingScores ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: true, user })}
                            disabled={user.isAdmin || isDeleting}
                            className="text-destructive hover:text-destructive"
                            title={user.isAdmin ? "Cannot delete admin users" : "Delete user"}
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordDialog({ open: false, user: null });
          setNewPassword("");
          setConfirmPassword("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordDialog.user?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialog({ open: false, user: null });
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialog({ open: false, user: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteDialog.user?.name}</strong> and all their quiz data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Scores Dialog */}
      <Dialog open={scoresDialog.open} onOpenChange={(open) => {
        if (!open) {
          setScoresDialog({ open: false, user: null, scores: [] });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Scores - {scoresDialog.user?.name}</DialogTitle>
            <DialogDescription>
              Performance history for all completed quizzes
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingScores ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : scoresDialog.scores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quiz attempts found
              </div>
            ) : (
              <div className="space-y-4">
                {scoresDialog.scores.map((score) => (
                  <Card key={score.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold">Quiz #{score.quizId}</h4>
                          <p className="text-sm text-muted-foreground">
                            Completed {new Date(score.completedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-lg px-4 py-1">
                            {score.score} pts
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditScoreDialog({ open: true, score });
                              setEditedScore(score.score);
                            }}
                            title="Edit score"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setResetQuizDialog({ open: true, score, user: scoresDialog.user })}
                            className="text-orange-600 hover:text-orange-700"
                            title="Reset quiz for this user"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScoresDialog({ open: false, user: null, scores: [] })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Score Dialog */}
      <Dialog open={editScoreDialog.open} onOpenChange={(open) => {
        if (!open) {
          setEditScoreDialog({ open: false, score: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Score</DialogTitle>
            <DialogDescription>
              Update the score for this quiz attempt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editScore">Score</Label>
              <Input
                id="editScore"
                type="number"
                value={editedScore}
                onChange={(e) => setEditedScore(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current score: {editScoreDialog.score?.score} points
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditScoreDialog({ open: false, score: null })}
              disabled={isEditingScore}
            >
              Cancel
            </Button>
            <Button onClick={handleEditScore} disabled={isEditingScore}>
              {isEditingScore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditingScore ? "Saving..." : "Save Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Quiz Confirmation Dialog */}
      <AlertDialog open={resetQuizDialog.open} onOpenChange={(open) => {
        if (!open) {
          setResetQuizDialog({ open: false, score: null, user: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Quiz Attempt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete <strong>{resetQuizDialog.user?.name}</strong>'s attempt for Quiz #{resetQuizDialog.score?.quizId} and allow them to retake it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingQuiz}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetQuiz}
              disabled={isResettingQuiz}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isResettingQuiz && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResettingQuiz ? "Resetting..." : "Reset Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
