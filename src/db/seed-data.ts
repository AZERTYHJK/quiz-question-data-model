import { db } from "./index";
import { questions } from "./schema";
import { sql } from "drizzle-orm";
import { SEED_QUESTIONS, calculatePoints } from "@/utils/constants";

export async function checkAndSeedDatabase() {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(questions);
    const count = Number(existing[0]?.count || 0);
    
    if (count === 0) {
      console.log("Database is empty. Seeding default questions...");
      const values = SEED_QUESTIONS.map(q => ({
        text: q.text,
        options: q.options,
        answer: q.answer,
        category: q.category,
        difficulty: q.difficulty,
        points: calculatePoints(q.difficulty),
      }));
      await db.insert(questions).values(values);
      console.log(`Successfully seeded ${values.length} questions.`);
    }
  } catch (error) {
    console.error("Error during database seed check:", error);
  }
}
