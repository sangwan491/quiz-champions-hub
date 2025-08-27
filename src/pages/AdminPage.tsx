import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Play, Square, RotateCcw, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, type Question, type Quiz, type QuizSession, type QuizResult } from "@/data/questions";

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
    timePerQuestion: 30
  });

  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    category: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    points: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quizzesData, sessionsData, resultsData] = await Promise.all([
        api.getQuizzes(),
        api.getSessions(),
        api.getResults()
      ]);
      
      setQuizzes(quizzesData);
      setSessions(sessionsData);
      setResults(resultsData);
      
      // Select the first quiz by default
      if (quizzesData.length > 0) {
        setSelectedQuiz(quizzesData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quiz Management
  const handleCreateQuiz = async () => {
    if (!quizFormData.title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const newQuiz = await api.createQuiz(quizFormData);
      setQuizzes([...quizzes, newQuiz]);
      setSelectedQuiz(newQuiz);
      setIsAddingQuiz(false);
      setQuizFormData({ title: "", description: "", timePerQuestion: 30 });
      
      toast({
        title: "Success",
        description: "Quiz created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await api.deleteQuiz(quizId);
      const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
      setQuizzes(updatedQuizzes);
      
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(updatedQuizzes[0] || null);
      }
      
      toast({
        title: "Success",
        description: "Quiz deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive"
      });
    }
  };

  // Question Management
  const resetQuestionForm = () => {
    setQuestionFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      category: "",
      difficulty: "easy",
      points: 10
    });
  };

  const startAddingQuestion = () => {
    resetQuestionForm();
    setIsAddingQuestion(true);
    setEditingQuestion(null);
  };

  const startEditingQuestion = (question: Question) => {
    setQuestionFormData({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      category: question.category,
      difficulty: question.difficulty,
      points: question.points
    });
    setEditingQuestion(question);
    setIsAddingQuestion(false);
  };

  const cancelQuestionEdit = () => {
    setEditingQuestion(null);
    setIsAddingQuestion(false);
    resetQuestionForm();
  };

  const saveQuestion = async () => {
    if (!selectedQuiz) return;

    // Validation
    if (!questionFormData.question.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive"
      });
      return;
    }

    if (questionFormData.options.some(option => !option.trim())) {
      toast({
        title: "Error",
        description: "All answer options are required",
        variant: "destructive"
      });
      return;
    }

    if (!questionFormData.category.trim()) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive"
      });
      return;
    }

    try {
      let updatedQuestion;
      if (editingQuestion) {
        updatedQuestion = await api.updateQuestion(selectedQuiz.id, editingQuestion.id, questionFormData);
        toast({
          title: "Success",
          description: "Question updated successfully"
        });
      } else {
        updatedQuestion = await api.addQuestion(selectedQuiz.id, questionFormData);
        toast({
          title: "Success",
          description: "Question added successfully"
        });
      }

      // Refresh quiz data
      const updatedQuizzes = await api.getQuizzes();
      setQuizzes(updatedQuizzes);
      setSelectedQuiz(updatedQuizzes.find(q => q.id === selectedQuiz.id) || null);
      
      cancelQuestionEdit();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!selectedQuiz) return;

    try {
      await api.deleteQuestion(selectedQuiz.id, questionId);
      
      // Refresh quiz data
      const updatedQuizzes = await api.getQuizzes();
      setQuizzes(updatedQuizzes);
      setSelectedQuiz(updatedQuizzes.find(q => q.id === selectedQuiz.id) || null);
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  // Session Management
  const startSession = async (quizId: string) => {
    try {
      const newSession = await api.startSession(quizId);
      setSessions(prev => [...prev, newSession]);
      
      toast({
        title: "Success",
        description: "Quiz session started successfully"
      });
      
      // Reload sessions to get updated state
      const updatedSessions = await api.getSessions();
      setSessions(updatedSessions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start quiz session",
        variant: "destructive"
      });
    }
  };

  const stopSession = async (quizId: string) => {
    try {
      await api.stopSession(quizId);
      
      toast({
        title: "Success",
        description: "Quiz session stopped successfully"
      });
      
      // Reload sessions to get updated state
      const updatedSessions = await api.getSessions();
      setSessions(updatedSessions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop quiz session",
        variant: "destructive"
      });
    }
  };

  const stopAllSessions = async () => {
    try {
      await api.stopAllSessions();
      
      toast({
        title: "Success",
        description: "All quiz sessions stopped successfully"
      });
      
      // Reload sessions to get updated state
      const updatedSessions = await api.getSessions();
      setSessions(updatedSessions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop all quiz sessions",
        variant: "destructive"
      });
    }
  };

  // Leaderboard Management
  const resetLeaderboard = async () => {
    try {
      await api.resetLeaderboard();
      setResults([]);
      
      toast({
        title: "Success",
        description: "Global leaderboard reset successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset global leaderboard",
        variant: "destructive"
      });
    }
  };

  const resetQuizLeaderboard = async (quizId: string) => {
    try {
      await api.resetQuizLeaderboard(quizId);
      // Remove results for this specific quiz
      setResults(prev => prev.filter(result => result.quizId !== quizId));
      
      const quiz = quizzes.find(q => q.id === quizId);
      toast({
        title: "Success",
        description: `${quiz?.title || 'Quiz'} leaderboard reset successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset quiz leaderboard",
        variant: "destructive"
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionFormData.options];
    newOptions[index] = value;
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">Manage quizzes and sessions</p>
          </div>
          
          {/* Session Status */}
          <Card className="card-glass p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${sessions.some(s => s.isActive) ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-medium">
                {sessions.some(s => s.isActive) ? 'Session Active' : 'No Active Session'}
              </span>
              {sessions.some(s => s.isActive) && (
                <Button size="sm" variant="outline" onClick={() => stopAllSessions()}>
                  <Square className="w-4 h-4 mr-1" />
                  Stop All
                </Button>
              )}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="quizzes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quizzes">Quiz Management</TabsTrigger>
            <TabsTrigger value="sessions">Session Control</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Quiz Management Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            {/* Quiz Selection and Creation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label>Select Quiz:</Label>
                <Select 
                  value={selectedQuiz?.id || ""} 
                  onValueChange={(value) => setSelectedQuiz(quizzes.find(q => q.id === value) || null)}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={() => setIsAddingQuiz(true)} className="btn-hero">
                <Plus className="w-4 h-4 mr-2" />
                New Quiz
              </Button>
            </div>

            {/* Create Quiz Form */}
            {isAddingQuiz && (
              <Card className="card-glass p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create New Quiz</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingQuiz(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="quiz-title">Quiz Title *</Label>
                    <Input
                      id="quiz-title"
                      value={quizFormData.title}
                      onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                      placeholder="Enter quiz title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quiz-description">Description</Label>
                    <Textarea
                      id="quiz-description"
                      value={quizFormData.description}
                      onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                      placeholder="Enter quiz description"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time-per-question">Time per Question (seconds)</Label>
                    <Input
                      id="time-per-question"
                      type="number"
                      min="10"
                      max="300"
                      value={quizFormData.timePerQuestion}
                      onChange={(e) => setQuizFormData({ ...quizFormData, timePerQuestion: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateQuiz}>
                      <Save className="w-4 h-4 mr-2" />
                      Create Quiz
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingQuiz(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Selected Quiz Info */}
            {selectedQuiz && (
              <Card className="card-glass p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{selectedQuiz.title}</h3>
                    {selectedQuiz.description && (
                      <p className="text-muted-foreground mb-3">{selectedQuiz.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedQuiz.questions.length} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedQuiz.time_per_question}s per question
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={startAddingQuestion} className="btn-hero">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDeleteQuiz(selectedQuiz.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Add/Edit Question Form */}
            {(isAddingQuestion || editingQuestion) && selectedQuiz && (
              <Card className="card-glass p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={cancelQuestionEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={questionFormData.question}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                      placeholder="Enter the question..."
                      className="mt-2"
                    />
                  </div>

                  {/* Answer Options */}
                  <div>
                    <Label>Answer Options</Label>
                    <div className="grid gap-3 mt-2">
                      {questionFormData.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={questionFormData.correctAnswer === index}
                              onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: index })}
                              className="text-primary"
                            />
                            <span className="text-sm font-medium">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Select the radio button next to the correct answer
                    </p>
                  </div>

                  {/* Category and Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={questionFormData.category}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, category: e.target.value })}
                        placeholder="e.g., Science, History"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select 
                        value={questionFormData.difficulty} 
                        onValueChange={(value: "easy" | "medium" | "hard") => 
                          setQuestionFormData({ ...questionFormData, difficulty: value })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        max="100"
                        value={questionFormData.points}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) || 10 })}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button onClick={saveQuestion} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {editingQuestion ? 'Update' : 'Save'} Question
                    </Button>
                    <Button variant="outline" onClick={cancelQuestionEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Questions List */}
            {selectedQuiz && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">
                  Questions ({selectedQuiz.questions.length})
                </h3>
                
                {selectedQuiz.questions.map((question, index) => (
                  <Card key={question.id} className="card-glass p-6 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                            {question.category}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-muted/20 ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty.toUpperCase()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {question.points} points
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold mb-3">{question.question}</h4>

                        <div className="grid gap-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex} 
                              className={`p-3 rounded-lg border ${
                                optionIndex === question.correctAnswer 
                                  ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300' 
                                  : 'border-border bg-muted/5'
                              }`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                              {optionIndex === question.correctAnswer && (
                                <span className="ml-2 text-xs font-medium">(Correct)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startEditingQuestion(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteQuestion(question.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {selectedQuiz.questions.length === 0 && (
                  <Card className="card-glass p-8 text-center">
                    <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No questions yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Start building your quiz by adding questions
                    </p>
                    <Button onClick={startAddingQuestion} className="btn-hero">
                      Add First Question
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {!selectedQuiz && quizzes.length === 0 && (
              <Card className="card-glass p-8 text-center">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">No quizzes yet</h4>
                <p className="text-muted-foreground mb-4">
                  Create your first quiz to get started
                </p>
                <Button onClick={() => setIsAddingQuiz(true)} className="btn-hero">
                  Create First Quiz
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Session Control Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="card-glass p-6">
              <h3 className="text-xl font-semibold mb-4">Session Management</h3>
              
              <div className="space-y-4">
                {/* Active Sessions Display */}
                {sessions.filter(s => s.isActive).length > 0 ? (
                  <div className="space-y-3">
                    <Label>Active Sessions:</Label>
                    {sessions.filter(s => s.isActive).map((session) => {
                      const quiz = quizzes.find(q => q.id === session.quizId);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{quiz?.title || 'Unknown Quiz'}</p>
                            <p className="text-sm text-muted-foreground">
                              Started: {new Date(session.startedAt || '').toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <Button 
                              onClick={() => stopSession(session.quizId)} 
                              variant="destructive" 
                              size="sm"
                            >
                              <Square className="w-4 h-4 mr-1" />
                              Stop
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <Button onClick={stopAllSessions} variant="destructive" className="w-full">
                      <Square className="w-4 h-4 mr-2" />
                      Stop All Sessions
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Status</p>
                      <p className="text-sm text-muted-foreground">No active sessions</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Start New Session */}
                <div className="space-y-3">
                  <Label>Start a quiz session:</Label>
                  <div className="flex gap-2 flex-wrap">
                    {quizzes.map((quiz) => {
                      const hasActiveSession = sessions.some(s => s.quizId === quiz.id && s.isActive);
                      return (
                        <Button 
                          key={quiz.id}
                          onClick={() => startSession(quiz.id)}
                          variant={hasActiveSession ? "secondary" : "outline"}
                          className="flex items-center gap-2"
                          disabled={hasActiveSession}
                        >
                          <Play className="w-4 h-4" />
                          {quiz.title}
                          {hasActiveSession && " (Active)"}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="card-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Leaderboard Management</h3>
                <div className="flex gap-2">
                  <Button onClick={resetLeaderboard} variant="destructive">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Global Leaderboard
                  </Button>
                </div>
              </div>

              {/* Quiz-specific Leaderboard Controls */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-lg">Quiz-specific Leaderboards</h4>
                <div className="grid gap-3">
                  {quizzes.map((quiz) => {
                    const quizResults = results.filter(result => result.quizId === quiz.id);
                    return (
                      <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {quizResults.length} result{quizResults.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button 
                          onClick={() => resetQuizLeaderboard(quiz.id)} 
                          variant="outline" 
                          size="sm"
                          disabled={quizResults.length === 0}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Global Results Display */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-lg mb-4">All Results</h4>
                <div className="space-y-3">
                  {results.length > 0 ? (
                    results
                      .sort((a, b) => b.score - a.score)
                      .map((result, index) => {
                        const quiz = quizzes.find(q => q.id === result.quizId);
                        return (
                          <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg">#{index + 1}</span>
                              <div>
                                <p className="font-medium">{result.playerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {quiz?.title || 'Unknown Quiz'} • {result.score} points • {result.timeSpent}s
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Date(result.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No results yet. Results will appear here after users complete quizzes.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;