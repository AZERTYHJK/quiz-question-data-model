import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaderboard } from "@/db/schema";
import { desc, eq, and, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");
    const difficultyFilter = searchParams.get("difficulty");
    const searchName = searchParams.get("search");

    let queryConditions = [];

    if (categoryFilter && categoryFilter !== "All Categories" && categoryFilter !== "All") {
      queryConditions.push(eq(leaderboard.category, categoryFilter));
    }

    if (difficultyFilter && difficultyFilter !== "All Difficulties" && difficultyFilter !== "All") {
      queryConditions.push(eq(leaderboard.difficulty, difficultyFilter));
    }

    if (searchName) {
      queryConditions.push(ilike(leaderboard.playerName, `%${searchName}%`));
    }

    let query = db.select().from(leaderboard);

    if (queryConditions.length > 0) {
      query = query.where(and(...queryConditions)) as any;
    }

    const scores = await query
      .orderBy(desc(leaderboard.score), desc(leaderboard.accuracy))
      .limit(50);

    return NextResponse.json({
      success: true,
      scores,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      playerName,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      accuracy,
      maxStreak,
      timeBonuses,
      grade,
      difficulty,
      category,
    } = body;

    if (!playerName || score === undefined || correctAnswers === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required scoreboard metrics" },
        { status: 400 }
      );
    }

    const [newEntry] = await db
      .insert(leaderboard)
      .values({
        playerName: playerName.trim() || "Anonymous",
        score: parseInt(score, 10),
        correctAnswers: parseInt(correctAnswers, 10),
        wrongAnswers: parseInt(wrongAnswers || 0, 10),
        totalQuestions: parseInt(totalQuestions || 0, 10),
        accuracy: parseFloat(accuracy || 0),
        maxStreak: parseInt(maxStreak || 0, 10),
        timeBonuses: parseInt(timeBonuses || 0, 10),
        grade: grade || "N/A",
        difficulty: difficulty || "Medium",
        category: category || "All",
      })
      .returning();

    return NextResponse.json({
      success: true,
      entry: newEntry,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record score" },
      { status: 500 }
    );
  }
}
