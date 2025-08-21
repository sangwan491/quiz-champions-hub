import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sampleQuestions, type Question } from "@/data/questions";

const AdminPage = () => {
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    category: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    points: 10
  });

  useEffect(() => {
    // Load questions from localStorage if available
    const storedQuestions = localStorage.getItem("adminQuestions");
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    }
  }, []);

  const saveQuestionsToStorage = (updatedQuestions: Question[]) => {
    localStorage.setItem("adminQuestions", JSON.stringify(updatedQuestions));
    setQuestions(updatedQuestions);
  };

  const resetForm = () => {
    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      category: "",
      difficulty: "easy",
      points: 10
    });
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
    setEditingQuestion(null);
  };

  const startEditing = (question: Question) => {
    setFormData({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      category: question.category,
      difficulty: question.difficulty,
      points: question.points
    });
    setEditingQuestion(question);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setIsAdding(false);
    resetForm();
  };

  const saveQuestion = () => {
    // Validation
    if (!formData.question.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive"
      });
      return;
    }

    if (formData.options.some(option => !option.trim())) {
      toast({
        title: "Error",
        description: "All answer options are required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category.trim()) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive"
      });
      return;
    }

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : Date.now().toString(),
      question: formData.question.trim(),
      options: formData.options.map(opt => opt.trim()),
      correctAnswer: formData.correctAnswer,
      category: formData.category.trim(),
      difficulty: formData.difficulty,
      points: formData.points
    };

    let updatedQuestions;
    if (editingQuestion) {
      updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id ? questionData : q
      );
      toast({
        title: "Success",
        description: "Question updated successfully"
      });
    } else {
      updatedQuestions = [...questions, questionData];
      toast({
        title: "Success",
        description: "Question added successfully"
      });
    }

    saveQuestionsToStorage(updatedQuestions);
    cancelEdit();
  };

  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    saveQuestionsToStorage(updatedQuestions);
    toast({
      title: "Success",
      description: "Question deleted successfully"
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'medium': return 'text-secondary';
      case 'hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

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
            <p className="text-xl text-muted-foreground">Manage quiz questions</p>
          </div>
          
          <Button onClick={startAdding} className="btn-hero flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Question
          </Button>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingQuestion) && (
          <Card className="card-glass p-6 mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Question Text */}
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="mt-2"
                />
              </div>

              {/* Answer Options */}
              <div>
                <Label>Answer Options</Label>
                <div className="grid gap-3 mt-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={formData.correctAnswer === index}
                          onChange={() => setFormData({ ...formData, correctAnswer: index })}
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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Science, History"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value: "easy" | "medium" | "hard") => 
                      setFormData({ ...formData, difficulty: value })
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
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
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
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Questions ({questions.length})</h2>
          
          {questions.map((question, index) => (
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

                  <h3 className="text-lg font-semibold mb-3">{question.question}</h3>

                  <div className="grid gap-2">
                    {question.options.map((option, optionIndex) => (
                      <div 
                        key={optionIndex} 
                        className={`p-3 rounded-lg border ${
                          optionIndex === question.correctAnswer 
                            ? 'border-success bg-success/10 text-success' 
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
                    onClick={() => startEditing(question)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteQuestion(question.id)}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {questions.length === 0 && (
            <Card className="card-glass p-8 text-center">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your quiz by adding your first question
              </p>
              <Button onClick={startAdding} className="btn-hero">
                Add First Question
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;