import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { checkAndSeedDatabase } from "@/db/seed-data";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Ensure data is seeded
    await checkAndSeedDatabase();

    const { searchParams } = new URL(req.url);
    const numQuestions = parseInt(searchParams.get("numQuestions") || "5", 10);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");

    let queryConditions = [];

    if (category && category !== "All Categories" && category !== "All") {
      queryConditions.push(eq(questions.category, category));
    }

    if (difficulty && difficulty !== "All Difficulties" && difficulty !== "All") {
      queryConditions.push(eq(questions.difficulty, difficulty));
    }

    let query = db.select().from(questions);

    if (queryConditions.length > 0) {
      query = query.where(and(...queryConditions)) as any;
    }

    const matchedQuestions = await query;

    // Shuffle the list of matched questions
    const shuffled = [...matchedQuestions].sort(() => Math.random() - 0.5);

    // Limit to requested count
    const selected = shuffled.slice(0, numQuestions);

    // Shuffle options for each question so order of display varies
    const processed = selected.map((q) => {
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      return {
        ...q,
        options: shuffledOptions,
      };
    });

    return NextResponse.json({
      success: true,
      questions: processed,
      totalAvailable: matchedQuestions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate quiz session" },
      { status: 500 }
    );
  }
}
