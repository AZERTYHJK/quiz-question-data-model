import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculatePoints } from "@/utils/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const qId = parseInt(id, 10);
    if (isNaN(qId)) {
      return NextResponse.json(
        { success: false, error: "Invalid question ID" },
        { status: 400 }
      );
    }

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

    const [updated] = await db
      .update(questions)
      .set({
        text,
        options,
        answer,
        category,
        difficulty,
        points: calculatedPoints,
      })
      .where(eq(questions.id, qId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const { id } = await props.params;
    const qId = parseInt(id, 10);
    if (isNaN(qId)) {
      return NextResponse.json(
        { success: false, error: "Invalid question ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(questions)
      .where(eq(questions.id, qId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
      question: deleted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete question" },
      { status: 500 }
    );
  }
}
