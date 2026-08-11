"use client";

import { useEffect, useState } from "react";

type Choice = { label: string; text: string };
type Question = { question: string; answer: string; choices: Choice[] };
type Unit = { unit: string; questions: Question[] };

const unitNames = [
  "The Global Tapestry", "Networks of Exchange", "Land-Based Empires",
  "Transoceanic Interconnections", "Revolutions", "Consequences of Industrialization",
  "Global Conflict", "Cold War and Decolonization", "Globalization",
];

const makeStarterBank = (): Unit[] => unitNames.map((unit, index) => ({
  unit,
  questions: [
    { question: `What is one development from Unit ${index + 1}: ${unit} that could be used as evidence in an AP World History argument?`, answer: "", choices: [] },
    { question: `How did a political, economic, or cultural development in ${unit} affect a society or region?`, answer: "", choices: [] },
    { question: `Compare one development in ${unit} with a development from a different region or time period.`, answer: "", choices: [] },
  ],
}));

const parseUnitOneQuestions = (text: string): Question[] => {
  const blocks = text.split(/\r?\n-{10,}\r?\n\s*/).filter((block) => /^\d+\.\s/m.test(block));
  return blocks.map((block) => {
    const numberedBlock = block.slice(block.search(/^\d+\.\s/m));
    const answerMatch = numberedBlock.match(/^\s*ANSWER:\s*([A-Z])\)/m);
    const withoutAnswer = numberedBlock
      .replace(/^\d+\.\s*/, "")
      .replace(/^\s*ANSWER:\s*.+$/m, "");
    const choicePattern = /^\s*([A-Z])\)\s*(.+)$/gm;
    const firstChoice = choicePattern.exec(withoutAnswer);
    choicePattern.lastIndex = 0;
    const choices = Array.from(withoutAnswer.matchAll(choicePattern), ([, label, choiceText]) => ({ label, text: choiceText.trim() }));
    const question = (firstChoice ? withoutAnswer.slice(0, firstChoice.index) : withoutAnswer).trim();
    return { question, answer: answerMatch?.[1] ?? "", choices };
  }).filter((item) => item.question);
};

export default function Home() {
  const [bank, setBank] = useState<Unit[]>(makeStarterBank);
  const [view, setView] = useState<"units" | "practice">("units");
  const [unitIndex, setUnitIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  useEffect(() => {
    fetch("/questions/unit-1.txt")
      .then((response) => response.text())
      .then((text) => {
        const questions = parseUnitOneQuestions(text);
        if (questions.length) setBank((current) => current.map((entry, index) => index === 0 ? { ...entry, questions } : entry));
      });
  }, []);

  const openUnit = (index: number) => { setUnitIndex(index); setQuestionIndex(Math.floor(Math.random() * Math.max(bank[index].questions.length, 1))); setSelectedChoice(null); setView("practice"); };
  const nextQuestion = () => { const total = bank[unitIndex].questions.length; if (!total) return; let next = questionIndex; if (total > 1) while (next === questionIndex) next = Math.floor(Math.random() * total); setQuestionIndex(next); setSelectedChoice(null); };
  const current = bank[unitIndex].questions[questionIndex];

  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={() => setView("units")}>AP WORLD <span>PRACTICE</span></button></header>
    <main>
      {view === "units" && <section className="units-view"><p className="eyebrow">Study by repetition</p><h1>Choose a unit.</h1><div className="unit-grid">{bank.map((entry, index) => <button className="unit-card" onClick={() => openUnit(index)} key={entry.unit}><span className="unit-number">UNIT {index + 1}</span><span className="unit-title">{entry.unit}</span><span className="question-count">{entry.questions.length} questions</span></button>)}</div></section>}
      {view === "practice" && <section className="practice-view"><div className="practice-bar"><button className="back-button" onClick={() => setView("units")}>← All units</button><p>Unit {unitIndex + 1} · {bank[unitIndex].unit}</p><p>{questionIndex + 1} / {bank[unitIndex].questions.length}</p></div><article className="question-card"><p className="question-number">Choose the best answer</p><h1>{current?.question ?? "No questions available for this unit yet."}</h1>{current?.choices.length ? <div className="choices">{current.choices.map((choice) => { const isSelected = selectedChoice === choice.label; const isCorrect = selectedChoice !== null && choice.label === current.answer; const isWrong = isSelected && choice.label !== current.answer; return <button className={`choice ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}`} onClick={() => setSelectedChoice(choice.label)} disabled={selectedChoice !== null} key={choice.label}><span>{choice.label}</span>{choice.text}</button>; })}</div> : <p className="no-options">Practice this prompt in writing or aloud.</p>}{selectedChoice && <p className={`result ${selectedChoice === current?.answer ? "right" : "wrong"}`}>{selectedChoice === current?.answer ? "Correct." : `Not quite — the correct answer is ${current?.answer}.`}</p>}<div className="question-actions"><button className="primary-button" onClick={nextQuestion}>Next question →</button></div></article></section>}
    </main><footer>AP World Practice</footer>
  </div>;
}
