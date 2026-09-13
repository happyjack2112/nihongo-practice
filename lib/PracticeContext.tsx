"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Question } from "@/lib/questionBuilder";

type ResultEntry = Question & { userAnswer: string; correct: boolean };

type Ctx = {
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  results: ResultEntry[];
  setResults: (r: ResultEntry[]) => void;
};

const PracticeContext = createContext<Ctx | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<ResultEntry[]>([]);
  return (
    <PracticeContext.Provider value={{ questions, setQuestions, results, setResults }}>
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice harus dipakai di dalam PracticeProvider");
  return ctx;
}
