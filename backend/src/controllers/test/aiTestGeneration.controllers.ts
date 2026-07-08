import { Response, Request } from "express";
import Test from "../../models/Test.model";
import Course from "../../models/Course.model";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AIQuestion {
  questionText: string;
  questionType: "MCQ" | "SAQ";
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  order: number;
}

interface AITestRequest {
  courseId: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  questionCount: number;
  questionTypes: ("MCQ" | "SAQ")[];
  duration: number;
  passingScore: number;
  topics?: string[];
  courseDetails?: any;
}

export const handleGenerateTestWithAI = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      courseId,
      title,
      description,
      difficulty,
      questionCount,
      questionTypes,
      duration,
      passingScore,
      topics,
      courseDetails,
    }: AITestRequest = req.body;

    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found",
      });
    }

    // Fetch course details for context
    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Build prompt for Gemini
    const prompt = `
You are an expert test creator for educational content. Create a ${questionCount}-question test for a course.

Course Details:
- Title: ${course.courseName}
- Description: ${course.courseDescription}
- Tech Stack: ${course.courseTechStack?.join(", ")}
- Content: ${course.courseContent?.join(", ")}
- Difficulty Level: ${difficulty}
${courseDetails ? `- Additional Details: ${JSON.stringify(courseDetails)}` : ""}

Test Requirements:
- Title: ${title}
- Description: ${description}
- Question Types: ${questionTypes.join(", ")}
- Duration: ${duration} minutes
- Passing Score: ${passingScore}%
${topics ? `- Focus Topics: ${topics.join(", ")}` : ""}

Generate questions in the following JSON format:
{
  "questions": [
    {
      "questionText": "Question text here",
      "questionType": "MCQ",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why this is correct",
      "points": 1,
      "order": 1
    }
  ]
}

For SAQ questions, use:
{
  "questionText": "Question text here",
  "questionType": "SAQ",
  "correctAnswer": "Expected answer",
  "explanation": "Explanation",
  "points": 2,
  "order": 1
}

Generate exactly ${questionCount} questions with a mix of ${questionTypes.join(" and ")}. 
Make questions challenging but fair for ${difficulty} level students.
Return ONLY valid JSON, no additional text.
`;

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response
      let aiResponse;
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        aiResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({
          success: false,
          message: "Failed to parse AI-generated questions",
          error: "Invalid JSON response from AI",
        });
      }

      if (!aiResponse.questions || !Array.isArray(aiResponse.questions)) {
        return res.status(500).json({
          success: false,
          message: "AI generated invalid question format",
        });
      }

      // Create test with AI-generated questions
      const { nanoid } = await import("nanoid");
      const testId = nanoid(10);

      const questionsWithOrder = aiResponse.questions.map((q: AIQuestion, index: number) => ({
        ...q,
        order: index + 1,
      }));

      const totalPoints = questionsWithOrder.reduce((sum: number, q: AIQuestion) => sum + q.points, 0);

      const newTest = new Test({
        testId,
        title,
        description,
        course: courseId,
        createdBy: userId,
        questions: questionsWithOrder,
        duration,
        totalPoints,
        passingScore,
        difficulty,
        status: "DRAFT",
        allowRetake: false,
        maxAttempts: 1,
        shuffleQuestions: false,
        showResults: true,
        tags: topics || [],
        isAIGenerated: true,
      });

      await newTest.save();

      res.status(201).json({
        success: true,
        message: "Test generated successfully with AI",
        data: newTest,
      });
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      return res.status(500).json({
        success: false,
        message: "Failed to generate test with AI",
        error: aiError instanceof Error ? aiError.message : "Unknown AI error",
      });
    }
  } catch (error) {
    console.error("Error in AI test generation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleEvaluateSAQWithAI = async (
  req: Request,
  res: Response
) => {
  try {
    const { questionText, userAnswer, expectedAnswer, explanation } = req.body;

    if (!questionText || !userAnswer || !expectedAnswer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for AI evaluation",
      });
    }

    const prompt = `
You are an expert educational evaluator. Evaluate a student's short answer response.

Question: ${questionText}
Expected Answer: ${expectedAnswer}
${explanation ? `Explanation: ${explanation}` : ""}
Student's Answer: ${userAnswer}

Evaluate the student's answer and provide:
1. A score out of 10
2. Whether the answer is correct (true/false)
3. Brief feedback explaining the score

Return ONLY valid JSON in this format:
{
  "score": 8,
  "isCorrect": false,
  "feedback": "Good attempt but missing key points about..."
}
`;

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let evaluation;
      try {
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        evaluation = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse AI evaluation:", parseError);
        // Fallback to basic evaluation
        evaluation = {
          score: 5,
          isCorrect: false,
          feedback: "Unable to evaluate with AI. Manual review required.",
        };
      }

      res.status(200).json({
        success: true,
        data: evaluation,
      });
    } catch (aiError) {
      console.error("AI evaluation error:", aiError);
      return res.status(500).json({
        success: false,
        message: "Failed to evaluate answer with AI",
        error: aiError instanceof Error ? aiError.message : "Unknown AI error",
      });
    }
  } catch (error) {
    console.error("Error in AI evaluation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGenerateQuestionsWithAI = async (
  req: Request,
  res: Response
) => {
  try {
    const { courseId, questionCount = 5, questionTypes = ["MCQ"], topics } = req.body;

    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const prompt = `
Generate ${questionCount} questions for a course.

Course Details:
- Title: ${course.courseName}
- Description: ${course.courseDescription}
- Tech Stack: ${course.courseTechStack?.join(", ")}
- Content: ${course.courseContent?.join(", ")}
${topics ? `- Focus Topics: ${topics.join(", ")}` : ""}

Question Types: ${questionTypes.join(", ")}

Generate questions in JSON format:
{
  "questions": [
    {
      "questionText": "Question text",
      "questionType": "MCQ",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Explanation",
      "points": 1,
      "order": 1
    }
  ]
}

Return ONLY valid JSON.
`;

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let aiResponse;
      try {
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        aiResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        return res.status(500).json({
          success: false,
          message: "Failed to parse AI response",
        });
      }

      res.status(200).json({
        success: true,
        data: aiResponse.questions || [],
      });
    } catch (aiError) {
      console.error("AI question generation error:", aiError);
      return res.status(500).json({
        success: false,
        message: "Failed to generate questions with AI",
      });
    }
  } catch (error) {
    console.error("Error in AI question generation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
