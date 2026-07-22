export interface QuestionSeed {
  text: string;
  options: string[];
  answer: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const SEED_QUESTIONS: QuestionSeed[] = [
  // ─── Geography ───────────────────────────────────────────────
  {
    text: "What is the capital of France?",
    options: ["Paris", "Rome", "Berlin", "Madrid"],
    answer: "Paris",
    category: "Geography",
    difficulty: "Easy"
  },
  {
    text: "Which is the largest continent by area?",
    options: ["Africa", "Asia", "Europe", "Americas"],
    answer: "Asia",
    category: "Geography",
    difficulty: "Easy"
  },
  {
    text: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    answer: "Canberra",
    category: "Geography",
    difficulty: "Medium"
  },
  {
    text: "Which country has the longest coastline?",
    options: ["Russia", "Australia", "Canada", "Norway"],
    answer: "Canada",
    category: "Geography",
    difficulty: "Hard"
  },
  
  // ─── Science ─────────────────────────────────────────────────
  {
    text: "What is the chemical symbol for Gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: "Au",
    category: "Science",
    difficulty: "Medium"
  },
  {
    text: "How many bones are in the adult human body?",
    options: ["196", "206", "216", "226"],
    answer: "206",
    category: "Science",
    difficulty: "Medium"
  },
  {
    text: "What planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"],
    answer: "Mars",
    category: "Science",
    difficulty: "Easy"
  },
  {
    text: "What is the speed of light (approx)?",
    options: ["300 km/s", "3,000 km/s", "300,000 km/s", "3,000,000 km/s"],
    answer: "300,000 km/s",
    category: "Science",
    difficulty: "Hard"
  },
  
  // ─── Technology ──────────────────────────────────────────────
  {
    text: "What does CPU stand for?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Utility",
      "Core Processing Unit"
    ],
    answer: "Central Processing Unit",
    category: "Technology",
    difficulty: "Easy"
  },
  {
    text: "Which language is Python named after?",
    options: [
      "A snake species",
      "Monty Python (comedy group)",
      "Greek mythology",
      "A math concept"
    ],
    answer: "Monty Python (comedy group)",
    category: "Technology",
    difficulty: "Medium"
  },
  {
    text: "What does HTML stand for?",
    options: [
      "HyperText Markup Language",
      "High Transfer Markup Language",
      "HyperText Management Language",
      "High Text Markup Language"
    ],
    answer: "HyperText Markup Language",
    category: "Technology",
    difficulty: "Easy"
  },
  {
    text: "What year was Python first released?",
    options: ["1985", "1989", "1991", "1995"],
    answer: "1991",
    category: "Technology",
    difficulty: "Hard"
  },
  
  // ─── Math ────────────────────────────────────────────────────
  {
    text: "What is the value of Pi (first 3 digits)?",
    options: ["3.12", "3.14", "3.16", "3.18"],
    answer: "3.14",
    category: "Math",
    difficulty: "Easy"
  },
  {
    text: "What is 12 × 13?",
    options: ["144", "152", "156", "164"],
    answer: "156",
    category: "Math",
    difficulty: "Medium"
  },
  {
    text: "What is the square root of 169?",
    options: ["11", "12", "13", "14"],
    answer: "13",
    category: "Math",
    difficulty: "Medium"
  },
  {
    text: "What is 2 to the power of 10?",
    options: ["512", "1024", "2048", "256"],
    answer: "1024",
    category: "Math",
    difficulty: "Hard"
  },
  
  // ─── History ─────────────────────────────────────────────────
  {
    text: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: "1945",
    category: "History",
    difficulty: "Easy"
  },
  {
    text: "Who was the first person to walk on the Moon?",
    options: [
      "Buzz Aldrin",
      "Neil Armstrong",
      "Yuri Gagarin",
      "John Glenn"
    ],
    answer: "Neil Armstrong",
    category: "History",
    difficulty: "Easy"
  },
  {
    text: "Which empire was the largest in history by land area?",
    options: [
      "Roman Empire",
      "British Empire",
      "Mongol Empire",
      "Ottoman Empire"
    ],
    answer: "British Empire",
    category: "History",
    difficulty: "Hard"
  },
  {
    text: "In what year did the Berlin Wall fall?",
    options: ["1987", "1988", "1989", "1991"],
    answer: "1989",
    category: "History",
    difficulty: "Medium"
  }
];

export const CATEGORY_COLORS: Record<string, string> = {
  Geography: "#4ECDC4",
  Science:   "#A8E6CF",
  Technology: "#FFD369",
  Math:      "#FF6B6B",
  History:   "#C3A6FF",
  General:   "#87CEEB"
};

export const DIFFICULTY_SETTINGS = {
  Easy:   { timer: 30, color: "#4ECDC4", points: 1 },
  Medium: { timer: 20, color: "#FFD369", points: 2 },
  Hard:   { timer: 10, color: "#FF6B6B", points: 3 }
};

export function calculatePoints(difficulty: "Easy" | "Medium" | "Hard"): number {
  return DIFFICULTY_SETTINGS[difficulty]?.points || 2;
}
