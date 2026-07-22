import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { checkAndSeedDatabase } from "@/db/seed-data";
import { calculatePoints } from "@/utils/constants";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Check and seed if database is empty
    await checkAndSeedDatabase();

    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(desc(questions.id));

    // Get unique categories present in the DB
    const uniqueCategories = Array.from(new Set(allQuestions.map((q) => q.category)));

    return NextResponse.json({
      success: true,
      questions: allQuestions,
      categories: uniqueCategories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, options, answer, category, difficulty } = body;

    if (!text || !options || !answer || !category || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { success: false, error: "Options must be an array of at least 2 choices" },
        { status: 400 }
      );
    }

    if (!options.includes(answer)) {
      return NextResponse.json(
        { success: false, error: "Correct answer must be one of the options" },
        { status: 400 }
      );
    }

    const calculatedPoints = calculatePoints(difficulty);

    const [newQuestion] = await db
      .insert(questions)
      .values({
        text,
        options,
        answer,
        category,
        difficulty,
        points: calculatedPoints,
      })
      .returning();

    return NextResponse.json({
      success: true,
      question: newQuestion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
}
