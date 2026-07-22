import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(), // Array of options
  answer: text("answer").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongAnswers: integer("wrong_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  accuracy: real("accuracy").notNull(),
  maxStreak: integer("max_streak").notNull(),
  timeBonuses: integer("time_bonuses").notNull(),
  grade: text("grade").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});
