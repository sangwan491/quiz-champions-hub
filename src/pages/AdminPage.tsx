import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, RotateCcw, Clock, Users, ToggleLeft, ToggleRight, Link as LinkIcon, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, auth, type Question, type Quiz, type QuizResult } from "@/data/questions";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
  });

  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    category: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    positivePoints: 10,
    negativePoints: 2,
    time: 30,
  });

  // Timer input as free-typing string; validated on blur/save
  const [timeInput, setTimeInput] = useState<string>("30");
  // Free inputs for points (no steppers)
  const [positivePointsInput, setPositivePointsInput] = useState<string>("10");
  const [negativePointsInput, setNegativePointsInput] = useState<string>("2");

  // Filters (UI removed below)
  const [quizCategoryFilter, setQuizCategoryFilter] = useState<string>("all");
  const [quizDifficultyFilter, setQuizDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [bankCategoryFilter, setBankCategoryFilter] = useState<string>("all");
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");

  // Question Bank edit modal
  const [bankEditQuestion, setBankEditQuestion] = useState<Question | null>(null);

  useEffect(() => {
    // verify admin via backend
    (async () => {
      try {
        // Check if user has a valid token first
        const token = auth.getToken();
        if (!token) {
          toast({ title: "Login Required", description: "Please login first to access admin panel.", variant: "destructive" });
          navigate("/");
          return;
        }

        const status = await api.getAdminStatus();
        if (!status?.isAdmin) {
          toast({ title: "Unauthorized", description: "Admin access required. Contact administrator.", variant: "destructive" });
          navigate("/");
          return;
        }
        setIsAdmin(true);
      } catch (error: any) {
        console.error('Admin check failed:', error);
        if (error.message?.includes('401') || error.message?.includes('Authentication')) {
          toast({ title: "Login Required", description: "Please login first to access admin panel.", variant: "destructive" });
        } else {
          toast({ title: "Access Error", description: "Failed to verify admin access. Please try again.", variant: "destructive" });
        }
        navigate("/");
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [quizzesData, resultsData, bank] = await Promise.all([
        api.getQuizzes(),
        api.getResults(),
        api.getQuestionBank(),
      ]);
      
      setQuizzes(quizzesData);
      setResults(resultsData);
      setQuestionBank(bank);
      
      // Restore last selected quiz if available
      const savedSelectedId = localStorage.getItem("adminSelectedQuizId");
      const nextSelected = (savedSelectedId && quizzesData.find(q => q.id === savedSelectedId)) || quizzesData[0] || null;
      setSelectedQuiz(nextSelected);
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
      const updated = [...quizzes, newQuiz];
      setQuizzes(updated);
      setSelectedQuiz(newQuiz);
      localStorage.setItem("adminSelectedQuizId", newQuiz.id);
      setIsAddingQuiz(false);
      setQuizFormData({ title: "", description: "" });
      
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
        const next = updatedQuizzes[0] || null;
        setSelectedQuiz(next);
        if (next) localStorage.setItem("adminSelectedQuizId", next.id);
        else localStorage.removeItem("adminSelectedQuizId");
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
      positivePoints: 10,
      negativePoints: 2,
      time: 30,
    });
    setTimeInput("30");
    setPositivePointsInput("10");
    setNegativePointsInput("2");
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
      correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
      category: question.category,
      difficulty: question.difficulty,
      positivePoints: question.positivePoints,
      negativePoints: question.negativePoints,
      time: question.time,
    });
    setTimeInput(String(question.time));
    setPositivePointsInput(String(question.positivePoints));
    setNegativePointsInput(String(question.negativePoints));
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
      toast({ title: "Error", description: "Question text is required", variant: "destructive" });
      return;
    }

    if (questionFormData.options.some(option => !option.trim())) {
      toast({ title: "Error", description: "All answer options are required", variant: "destructive" });
      return;
    }

    if (!questionFormData.category.trim()) {
      toast({ title: "Error", description: "Category is required", variant: "destructive" });
      return;
    }

    // Parse timer from free-typed input
    let parsedTime = parseInt(timeInput, 10);
    if (Number.isNaN(parsedTime)) {
      toast({ title: "Invalid time", description: "Please provide a valid number of seconds", variant: "destructive" });
      return;
    }
    parsedTime = Math.max(5, Math.min(600, parsedTime));

    try {
      const payload = { ...questionFormData, time: parsedTime };
      let updatedQuestion;
      if (editingQuestion) {
        updatedQuestion = await api.updateQuestion(selectedQuiz.id, editingQuestion.id, payload);
        toast({ title: "Success", description: "Question updated successfully" });
      } else {
        updatedQuestion = await api.addQuestion(selectedQuiz.id, payload);
        toast({ title: "Success", description: "Question added successfully" });
      }

      // Refresh quiz data while preserving selection
      const updatedQuizzes = await api.getQuizzes();
      setQuizzes(updatedQuizzes);
      const nextSel = updatedQuizzes.find(q => q.id === selectedQuiz.id) || null;
      setSelectedQuiz(nextSel);
      if (nextSel) localStorage.setItem("adminSelectedQuizId", nextSel.id);
      
      cancelQuestionEdit();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save question", variant: "destructive" });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!selectedQuiz) return;

    try {
      await api.deleteQuestion(selectedQuiz.id, questionId);
      
      // Refresh quiz data
      const updatedQuizzes = await api.getQuizzes();
      setQuizzes(updatedQuizzes);
      const nextSel = updatedQuizzes.find(q => q.id === selectedQuiz.id) || null;
      setSelectedQuiz(nextSel);
      if (nextSel) localStorage.setItem("adminSelectedQuizId", nextSel.id);
      
      toast({ title: "Success", description: "Question deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
    }
  };

  // Quiz Status Management
  const setQuizStatus = async (status: Quiz["status"]) => {
    if (!selectedQuiz) return;
    try {
      const updated = await api.updateQuiz(selectedQuiz.id, { status });
      const updatedQuizzes = quizzes.map(q => q.id === updated.id ? updated : q);
      setQuizzes(updatedQuizzes);
      setSelectedQuiz(updated);
      localStorage.setItem("adminSelectedQuizId", updated.id);
      toast({ title: "Updated", description: `Quiz set to ${status}` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const attachToQuiz = async (questionId: string) => {
    if (!selectedQuiz) return;
    try {
      await api.attachQuestionToQuiz(selectedQuiz.id, questionId);
      await loadData();
      if (selectedQuiz) localStorage.setItem("adminSelectedQuizId", selectedQuiz.id);
      toast({ title: "Attached", description: "Question added to quiz" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to attach question", variant: "destructive" });
    }
  };

  const detachFromQuiz = async (questionId: string) => {
    if (!selectedQuiz) return;
    try {
      await api.detachQuestionFromQuiz(selectedQuiz.id, questionId);
      await loadData();
      if (selectedQuiz) localStorage.setItem("adminSelectedQuizId", selectedQuiz.id);
      toast({ title: "Detached", description: "Question removed from quiz" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to detach question", variant: "destructive" });
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

  // Derived data (filters removed)
  const filteredQuizQuestions = selectedQuiz ? selectedQuiz.questions : [];
  const filteredBank = questionBank;

  const openBankEditModal = (q: Question) => {
    setBankEditQuestion(q);
    setQuestionFormData({
      question: q.question,
      options: [...q.options],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      category: q.category,
      difficulty: q.difficulty,
      positivePoints: q.positivePoints,
      negativePoints: q.negativePoints,
      time: q.time,
    });
    setTimeInput(String(q.time));
    setPositivePointsInput(String(q.positivePoints));
    setNegativePointsInput(String(q.negativePoints));
  };

  const closeBankEditModal = () => {
    setBankEditQuestion(null);
    resetQuestionForm();
  };

  const saveBankQuestion = async () => {
    if (!bankEditQuestion) return;
    // Validate
    if (!questionFormData.question.trim()) {
      toast({ title: "Error", description: "Question text is required", variant: "destructive" });
      return;
    }
    if (questionFormData.options.some(o => !o.trim())) {
      toast({ title: "Error", description: "All answer options are required", variant: "destructive" });
      return;
    }
    let parsedTime = parseInt(timeInput, 10);
    if (Number.isNaN(parsedTime)) parsedTime = bankEditQuestion.time;
    parsedTime = Math.max(5, Math.min(600, parsedTime));

    try {
      await api.updateQuestionBank(bankEditQuestion.id, { ...questionFormData, time: parsedTime });
      toast({ title: "Updated", description: "Question updated in bank" });
      // Refresh bank and quizzes (stats)
      await loadData();
      closeBankEditModal();
    } catch {
      toast({ title: "Error", description: "Failed to update bank question", variant: "destructive" });
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
            <p className="text-xl text-muted-foreground">Manage quizzes and questions</p>
          </div>
        </div>

        <Tabs defaultValue="quizzes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quizzes">Quiz Management</TabsTrigger>
            <TabsTrigger value="status">Status & Publishing</TabsTrigger>
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
                  onValueChange={(value) => {
                    const next = quizzes.find(q => q.id === value) || null;
                    setSelectedQuiz(next);
                    if (next) localStorage.setItem("adminSelectedQuizId", next.id);
                  }}
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
              
              <Button onClick={() => setIsAddingQuiz(true)} className="btn-hero" type="button">
                <Plus className="w-4 h-4 mr-2" />
                New Quiz
              </Button>
            </div>

            {/* Create Quiz Form */}
            {isAddingQuiz && (
              <Card className="card-glass p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create New Quiz</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddingQuiz(false)} type="button">
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
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateQuiz} type="button">
                      <Save className="w-4 h-4 mr-2" />
                      Create Quiz
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingQuiz(false)} type="button">
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
                        {selectedQuiz.totalQuestions} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.round((selectedQuiz.totalTime || 0) / Math.max(selectedQuiz.totalQuestions || 1, 1))}s avg time
                      </span>
                      <span className="px-3 py-1 rounded-full bg-muted/20 text-muted-foreground">Status: {selectedQuiz.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={startAddingQuestion} className="btn-hero" type="button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDeleteQuiz(selectedQuiz.id)}
                      className="text-destructive hover:text-destructive"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Add Question Form (edit now inline below each question) */}
            {isAddingQuestion && selectedQuiz && (
              <Card className="card-glass p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Add New Question</h3>
                  <Button variant="ghost" size="sm" onClick={cancelQuestionEdit} type="button">
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      <Label htmlFor="positivePoints">Positive Points</Label>
                      <Input
                        id="positivePoints"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={positivePointsInput}
                        onChange={(e) => setPositivePointsInput(e.target.value)}
                        onBlur={() => {
                          let v = parseInt(positivePointsInput, 10);
                          if (Number.isNaN(v)) v = questionFormData.positivePoints;
                          v = Math.max(0, v);
                          setQuestionFormData({ ...questionFormData, positivePoints: v });
                          setPositivePointsInput(String(v));
                        }}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="negativePoints">Negative Points</Label>
                      <Input
                        id="negativePoints"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={negativePointsInput}
                        onChange={(e) => setNegativePointsInput(e.target.value)}
                        onBlur={() => {
                          let v = parseInt(negativePointsInput, 10);
                          if (Number.isNaN(v)) v = questionFormData.negativePoints;
                          v = Math.max(0, v);
                          setQuestionFormData({ ...questionFormData, negativePoints: v });
                          setNegativePointsInput(String(v));
                        }}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="time">Time (seconds)</Label>
                      <Input
                        id="time"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        onBlur={() => {
                          let v = parseInt(timeInput, 10);
                          if (Number.isNaN(v)) v = questionFormData.time;
                          v = Math.max(5, Math.min(600, v));
                          setQuestionFormData({ ...questionFormData, time: v });
                          setTimeInput(String(v));
                        }}
                        placeholder="e.g., 30"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button onClick={saveQuestion} className="flex items-center gap-2" type="button">
                      <Save className="w-4 h-4" />
                      {editingQuestion ? 'Update' : 'Save'} Question
                    </Button>
                    <Button variant="outline" onClick={cancelQuestionEdit} type="button">
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
                  Questions ({selectedQuiz.totalQuestions})
                </h3>
                
                {filteredQuizQuestions.map((question, index) => (
                  <Card key={question.id} className="card-glass p-6 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`} }>
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
                            +{question.positivePoints} / -{question.negativePoints} pts • {question.time}s
                          </span>
                        </div>

                        {editingQuestion?.id === question.id ? (
                          <div className="space-y-6">
                            <div>
                              <Label htmlFor="question-inline">Question</Label>
                              <Textarea
                                id="question-inline"
                                value={questionFormData.question}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>Answer Options</Label>
                              <div className="grid gap-3 mt-2">
                                {questionFormData.options.map((option, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name="correctAnswerInline"
                                        checked={questionFormData.correctAnswer === idx}
                                        onChange={() => setQuestionFormData({ ...questionFormData, correctAnswer: idx })}
                                        className="text-primary"
                                      />
                                      <span className="text-sm font-medium">
                                        {String.fromCharCode(65 + idx)}
                                      </span>
                                    </div>
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(idx, e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                      className="flex-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <div>
                                <Label htmlFor="category-inline">Category</Label>
                                <Input
                                  id="category-inline"
                                  value={questionFormData.category}
                                  onChange={(e) => setQuestionFormData({ ...questionFormData, category: e.target.value })}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="difficulty-inline">Difficulty</Label>
                                <Select 
                                  value={questionFormData.difficulty}
                                  onValueChange={(value: "easy" | "medium" | "hard") => setQuestionFormData({ ...questionFormData, difficulty: value })}
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
                                <Label htmlFor="positivePoints-inline">Positive Points</Label>
                                <Input
                                  id="positivePoints-inline"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={positivePointsInput}
                                  onChange={(e) => setPositivePointsInput(e.target.value)}
                                  onBlur={() => {
                                    let v = parseInt(positivePointsInput, 10);
                                    if (Number.isNaN(v)) v = questionFormData.positivePoints;
                                    v = Math.max(0, v);
                                    setQuestionFormData({ ...questionFormData, positivePoints: v });
                                    setPositivePointsInput(String(v));
                                  }}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="negativePoints-inline">Negative Points</Label>
                                <Input
                                  id="negativePoints-inline"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={negativePointsInput}
                                  onChange={(e) => setNegativePointsInput(e.target.value)}
                                  onBlur={() => {
                                    let v = parseInt(negativePointsInput, 10);
                                    if (Number.isNaN(v)) v = questionFormData.negativePoints;
                                    v = Math.max(0, v);
                                    setQuestionFormData({ ...questionFormData, negativePoints: v });
                                    setNegativePointsInput(String(v));
                                  }}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="time-inline">Time (seconds)</Label>
                                <Input
                                  id="time-inline"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={timeInput}
                                  onChange={(e) => setTimeInput(e.target.value)}
                                  onBlur={() => {
                                    let v = parseInt(timeInput, 10);
                                    if (Number.isNaN(v)) v = questionFormData.time;
                                    v = Math.max(5, Math.min(600, v));
                                    setQuestionFormData({ ...questionFormData, time: v });
                                    setTimeInput(String(v));
                                  }}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button onClick={saveQuestion} className="flex items-center gap-2" type="button">
                                <Save className="w-4 h-4" />
                                Save
                              </Button>
                              <Button variant="outline" onClick={cancelQuestionEdit} type="button">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startEditingQuestion(question)}
                          type="button"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteQuestion(question.id)}
                          className="text-destructive hover:text-destructive"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredQuizQuestions.length === 0 && (
                  <Card className="card-glass p-8 text-center">
                    <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No questions yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Click below to add your first question
                    </p>
                    <Button onClick={startAddingQuestion} className="btn-hero" type="button">
                      Add Question
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* Question Bank */}
            {selectedQuiz && (
              <Card className="card-glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Question Bank</h3>
                </div>

                <div className="grid gap-3">
                  {filteredBank.map((q) => {
                    const attached = selectedQuiz.questions.some(sq => sq.id === q.id);
                    return (
                      <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{q.question}</p>
                          <p className="text-sm text-muted-foreground">{q.category} • {q.difficulty} • {q.time}s</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openBankEditModal(q)} type="button">
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          {attached ? (
                            <Button size="sm" variant="outline" onClick={() => detachFromQuiz(q.id)} type="button">
                              <Unlink className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => attachToQuiz(q.id)} type="button">
                              <LinkIcon className="w-4 h-4 mr-1" /> Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bank Edit Modal */}
                <Dialog open={!!bankEditQuestion} onOpenChange={(open) => !open && closeBankEditModal()}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bank-question">Question</Label>
                        <Textarea
                          id="bank-question"
                          value={questionFormData.question}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Answer Options</Label>
                        <div className="grid gap-3 mt-2">
                          {questionFormData.options.map((option, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="bank-correct"
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
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <Label htmlFor="bank-category">Category</Label>
                          <Input id="bank-category" value={questionFormData.category} onChange={(e) => setQuestionFormData({ ...questionFormData, category: e.target.value })} className="mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="bank-difficulty">Difficulty</Label>
                          <Select value={questionFormData.difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setQuestionFormData({ ...questionFormData, difficulty: value })}>
                            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="bank-positive">Positive Points</Label>
                          <Input id="bank-positive" type="text" inputMode="numeric" pattern="[0-9]*" value={positivePointsInput} onChange={(e) => setPositivePointsInput(e.target.value)} onBlur={() => {
                            let v = parseInt(positivePointsInput, 10);
                            if (Number.isNaN(v)) v = questionFormData.positivePoints;
                            v = Math.max(0, v);
                            setQuestionFormData({ ...questionFormData, positivePoints: v });
                            setPositivePointsInput(String(v));
                          }} className="mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="bank-negative">Negative Points</Label>
                          <Input id="bank-negative" type="text" inputMode="numeric" pattern="[0-9]*" value={negativePointsInput} onChange={(e) => setNegativePointsInput(e.target.value)} onBlur={() => {
                            let v = parseInt(negativePointsInput, 10);
                            if (Number.isNaN(v)) v = questionFormData.negativePoints;
                            v = Math.max(0, v);
                            setQuestionFormData({ ...questionFormData, negativePoints: v });
                            setNegativePointsInput(String(v));
                          }} className="mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="bank-time">Time (seconds)</Label>
                          <Input id="bank-time" type="text" inputMode="numeric" pattern="[0-9]*" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} onBlur={() => {
                            let v = parseInt(timeInput, 10);
                            if (Number.isNaN(v)) v = questionFormData.time;
                            v = Math.max(5, Math.min(600, v));
                            setQuestionFormData({ ...questionFormData, time: v });
                            setTimeInput(String(v));
                          }} className="mt-2" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveBankQuestion} type="button"><Save className="w-4 h-4 mr-2" /> Save</Button>
                      <Button variant="outline" onClick={closeBankEditModal} type="button">Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Card>
            )}
          </TabsContent>

          {/* Status Control Tab */}
          <TabsContent value="status" className="space-y-6">
            {selectedQuiz ? (
              <Card className="card-glass p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedQuiz.title}</h3>
                    <p className="text-muted-foreground">Current status: {selectedQuiz.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant={selectedQuiz.status === 'active' ? 'default' : 'outline'} onClick={() => setQuizStatus('active')} type="button">
                      <ToggleRight className="w-4 h-4 mr-1" /> Active
                    </Button>
                    <Button variant={selectedQuiz.status === 'inactive' ? 'default' : 'outline'} onClick={() => setQuizStatus('inactive')} type="button">
                      <ToggleLeft className="w-4 h-4 mr-1" /> Inactive
                    </Button>
                    <Button variant={selectedQuiz.status === 'completed' ? 'default' : 'outline'} onClick={() => setQuizStatus('completed')} type="button">
                      <Clock className="w-4 h-4 mr-1" /> Completed
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Use these controls to publish your quiz or mark it as completed. Players will only see quizzes marked as Active.</p>
              </Card>
            ) : (
              <Card className="card-glass p-6 text-center">Select a quiz to manage its status.</Card>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="card-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Leaderboard Management</h3>
                <div className="flex gap-2">
                  <Button onClick={() => api.resetLeaderboard().then(() => toast({ title: 'Success', description: 'Global leaderboard reset successfully' })).catch(() => toast({ title:'Error', description: 'Failed to reset global leaderboard', variant: 'destructive' }))} variant="destructive" type="button">
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
                          onClick={() => api.resetQuizLeaderboard(quiz.id).then(() => toast({ title: 'Success', description: `${quiz.title} leaderboard reset successfully` })).catch(() => toast({ title: 'Error', description: 'Failed to reset quiz leaderboard', variant: 'destructive' }))} 
                          variant="outline" 
                          size="sm"
                          disabled={quizResults.length === 0}
                          type="button"
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
                                {isAdmin && result.phone && (
                                  <p className="text-xs text-muted-foreground">📞 {result.phone}</p>
                                )}
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