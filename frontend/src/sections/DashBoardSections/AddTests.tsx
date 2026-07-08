import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Clock, Award, CheckCircle, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  createTest, 
  updateTest, 
  publishTest, 
  deleteTest, 
  getTestsByInstructor,
  generateTestWithAI,
  getAllActiveCourses,
  getCourseById
} from '@/lib/testService';
import LoadingScreen from '@/components/LoadingScreen';

interface Question {
  questionText: string;
  questionType: 'MCQ' | 'SAQ';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

interface Test {
  testId: string;
  title: string;
  description: string;
  course: string;
  duration: number;
  totalPoints: number;
  passingScore: number;
  difficulty: string;
  status: string;
  questions: Question[];
}

const AddTests = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    duration: 30,
    passingScore: 60,
    difficulty: 'INTERMEDIATE',
    instructions: '',
    allowRetake: false,
    maxAttempts: 1,
    shuffleQuestions: false,
    showResults: true,
    questions: [] as Question[],
  });
  const [aiFormData, setAiFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    difficulty: 'INTERMEDIATE',
    questionCount: 10,
    questionTypes: ['MCQ', 'SAQ'],
    duration: 30,
    passingScore: 60,
    topics: '',
  });

  useEffect(() => {
    loadTests();
    loadCourses();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await getTestsByInstructor();
      setTests(data);
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await getAllActiveCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const handleCourseSelect = async (courseId: string) => {
    try {
      const courseDetails = await getCourseById(courseId);
      
      if (!courseDetails) {
        console.error('No course details returned');
        return;
      }

      setSelectedCourse(courseDetails);
      
      // Auto-fill form with course details using real database field names
      setFormData({
        ...formData,
        course: courseId,
        title: `${courseDetails.courseName} Test`,
        description: courseDetails.description,
      });
      setAiFormData({
        ...aiFormData,
        courseId: courseId,
        title: `${courseDetails.courseName} Test`,
        description: courseDetails.description,
        topics: courseDetails.courseTechStack?.join(', ') || '',
      });
    } catch (error) {
      console.error('Failed to fetch course details:', error);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          questionType: 'MCQ',
          options: ['', '', '', ''],
          correctAnswer: '',
          explanation: '',
          points: 1,
        },
      ],
    });
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    const updatedOptions = [...(updatedQuestions[questionIndex].options || [])];
    updatedOptions[optionIndex] = value;
    updatedQuestions[questionIndex].options = updatedOptions;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await updateTest(editingTest.testId, formData);
      } else {
        await createTest(formData);
      }
      setIsDialogOpen(false);
      setEditingTest(null);
      resetForm();
      loadTests();
    } catch (error) {
      console.error('Failed to save test:', error);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAiGenerating(true);
      const testData = {
        ...aiFormData,
        topics: aiFormData.topics ? aiFormData.topics.split(',').map(t => t.trim()) : [],
        courseDetails: selectedCourse, // Pass course details to AI
      };
      await generateTestWithAI(testData);
      setIsDialogOpen(false);
      resetForm();
      loadTests();
    } catch (error) {
      console.error('Failed to generate test with AI:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description,
      course: test.course,
      duration: test.duration,
      passingScore: test.passingScore,
      difficulty: test.difficulty,
      instructions: '',
      allowRetake: false,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResults: true,
      questions: test.questions,
    });
    setIsDialogOpen(true);
  };

  const handlePublish = async (testId: string) => {
    try {
      await publishTest(testId);
      loadTests();
    } catch (error) {
      console.error('Failed to publish test:', error);
    }
  };

  const handleDelete = async (testId: string) => {
    if (confirm('Are you sure you want to delete this test?')) {
      try {
        await deleteTest(testId);
        loadTests();
      } catch (error) {
        console.error('Failed to delete test:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course: '',
      duration: 30,
      passingScore: 60,
      difficulty: 'INTERMEDIATE',
      instructions: '',
      allowRetake: false,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResults: true,
      questions: [],
    });
    setAiFormData({
      courseId: '',
      title: '',
      description: '',
      difficulty: 'INTERMEDIATE',
      questionCount: 10,
      questionTypes: ['MCQ', 'SAQ'],
      duration: 30,
      passingScore: 60,
      topics: '',
    });
    setSelectedCourse(null);
    setCreationMode('manual');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <motion.div
      className="dark:bg-white/5 bg-black/5 rounded-lg p-6 shadow-2xl dark:shadow-sm dark:shadow-white border-2 dark:border-white border-black"
      variants={{
        hidden: { opacity: 0.3, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Test Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Create and manage course tests</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTest(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTest ? 'Edit Test' : 'Create New Test'}</DialogTitle>
              </DialogHeader>
              
              {!editingTest && (
                <div className="flex gap-4 mb-4">
                  <Button
                    type="button"
                    variant={creationMode === 'manual' ? 'default' : 'outline'}
                    onClick={() => setCreationMode('manual')}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Manual Creation
                  </Button>
                  <Button
                    type="button"
                    variant={creationMode === 'ai' ? 'default' : 'outline'}
                    onClick={() => setCreationMode('ai')}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generation
                  </Button>
                </div>
              )}

              {creationMode === 'manual' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Test Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Select Course</Label>
                    <select
                      id="course"
                      value={formData.course}
                      onChange={(e) => handleCourseSelect(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.courseId} value={course.courseId}>
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                    {selectedCourse && (
                      <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                        <p className="font-semibold">{selectedCourse.courseName}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {selectedCourse.description?.substring(0, 150)}...
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {selectedCourse.courseTechStack?.slice(0, 3).map((tech: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
                
                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Questions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                  
                  {formData.questions.map((question, qIndex) => (
                    <Card key={qIndex}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Question {qIndex + 1}</Label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div>
                          <Label>Question Type</Label>
                          <select
                            value={question.questionType}
                            onChange={(e) => handleQuestionChange(qIndex, 'questionType', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="MCQ">Multiple Choice</option>
                            <option value="SAQ">Short Answer</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label>Question Text</Label>
                          <Textarea
                            value={question.questionText}
                            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                            required
                          />
                        </div>
                        
                        {question.questionType === 'MCQ' && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            {question.options?.map((option, oIndex) => (
                              <div key={oIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div>
                          <Label>Correct Answer</Label>
                          {question.questionType === 'MCQ' ? (
                            <select
                              value={question.correctAnswer as string}
                              onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            >
                              {question.options?.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              value={question.correctAnswer as string}
                              onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                              required
                            />
                          )}
                        </div>
                        
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTest ? 'Update Test' : 'Create Test'}
                  </Button>
                </div>
              </form>
              ) : (
                <form onSubmit={handleAIGenerate} className="space-y-4">
                  <div>
                    <Label htmlFor="ai-courseId">Select Course</Label>
                    <select
                      id="ai-courseId"
                      value={aiFormData.courseId}
                      onChange={(e) => handleCourseSelect(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.courseId} value={course.courseId}>
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                    {selectedCourse && (
                      <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                        <p className="font-semibold">{selectedCourse.courseName}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {selectedCourse.description?.substring(0, 150)}...
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {selectedCourse.courseTechStack?.slice(0, 3).map((tech: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai-title">Test Title</Label>
                      <Input
                        id="ai-title"
                        value={aiFormData.title}
                        onChange={(e) => setAiFormData({ ...aiFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ai-difficulty">Difficulty</Label>
                      <select
                        id="ai-difficulty"
                        value={aiFormData.difficulty}
                        onChange={(e) => setAiFormData({ ...aiFormData, difficulty: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ai-description">Description</Label>
                    <Textarea
                      id="ai-description"
                      value={aiFormData.description}
                      onChange={(e) => setAiFormData({ ...aiFormData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai-questionCount">Number of Questions</Label>
                      <Input
                        id="ai-questionCount"
                        type="number"
                        min="1"
                        max="50"
                        value={aiFormData.questionCount}
                        onChange={(e) => setAiFormData({ ...aiFormData, questionCount: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ai-duration">Duration (minutes)</Label>
                      <Input
                        id="ai-duration"
                        type="number"
                        min="5"
                        value={aiFormData.duration}
                        onChange={(e) => setAiFormData({ ...aiFormData, duration: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ai-passingScore">Passing Score (%)</Label>
                    <Input
                      id="ai-passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={aiFormData.passingScore}
                      onChange={(e) => setAiFormData({ ...aiFormData, passingScore: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-topics">Topics (comma-separated)</Label>
                    <Input
                      id="ai-topics"
                      placeholder="e.g., React, JavaScript, TypeScript"
                      value={aiFormData.topics}
                      onChange={(e) => setAiFormData({ ...aiFormData, topics: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Question Types</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={aiFormData.questionTypes.includes('MCQ')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiFormData({ ...aiFormData, questionTypes: [...aiFormData.questionTypes, 'MCQ'] });
                            } else {
                              setAiFormData({ ...aiFormData, questionTypes: aiFormData.questionTypes.filter(t => t !== 'MCQ') });
                            }
                          }}
                        />
                        MCQ
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={aiFormData.questionTypes.includes('SAQ')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiFormData({ ...aiFormData, questionTypes: [...aiFormData.questionTypes, 'SAQ'] });
                            } else {
                              setAiFormData({ ...aiFormData, questionTypes: aiFormData.questionTypes.filter(t => t !== 'SAQ') });
                            }
                          }}
                        />
                        SAQ
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={aiGenerating}>
                      {aiGenerating ? 'Generating...' : 'Generate with AI'}
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Tests List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <Card key={test.testId} className="shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <Badge className={getStatusColor(test.status)} variant="outline">
                    {test.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>{test.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Award className="h-4 w-4" />
                    <span>{test.totalPoints} points</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span>Passing: {test.passingScore}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span>{test.questions.length} questions</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {test.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handlePublish(test.testId)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(test)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(test.testId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {tests.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-600 dark:text-slate-400">
              <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No tests created yet</p>
              <p className="text-sm">Create your first test to get started</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AddTests;
