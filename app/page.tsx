"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Choice = { label: string; text: string };
type Question = { question: string; answer: string; choices: Choice[] };
type Unit = { unit: string; questions: Question[] };
type Stimulus = { title: string; source: string; text?: string; image?: boolean };
type UnitProgress = { questionIndex: number; answers: Record<number, string>; submittedQuestions: Record<number, boolean> };

const progressStorageKey = "ap-world-practice-progress";

const unitNames = ["The Global Tapestry", "Networks of Exchange", "Land-Based Empires", "Transoceanic Interconnections", "Revolutions", "Consequences of Industrialization", "Global Conflict", "Cold War and Decolonization", "Globalization"];
const stimuli: Record<number, Stimulus> = {
  1: { title: "Source 1", source: "Patricia Crone, Slaves on Horses, 1980", text: "“The adoption of the mamluk institutions by the Abbasids was followed almost immediately by the disintegration of the state. … nothing less could now save the marriage between religion and power to which the Islamic state owed its existence.”\n\n*mamluk: an enslaved soldier of Turkic origin" },
  4: { title: "Source 2", source: "Sanskrit inscription, Malayapura kingdom, Sumatra, c. 1350 C.E.", text: "“I … dedicated this statue of the bodhisattva Amoghapasa on the orders of His Majesty King Adityawarman, for the benefit and salvation and happiness of all creatures.\n\nHail to the King—experienced in the arts of war, well versed in the sciences … He is free from all physical desire. … He has collected jewels by the millions … King of kings!”\n\n*Amoghapasa: a major figure worshipped in Mahayana Buddhism" },
  7: { title: "Source 3", source: "Arthur Demarest, Ancient Maya: The Rise and Fall of a Rainforest Civilization, 2004", text: "“One of the most important aspects of the Maya economy was the exchange of exotic goods. Maya rulers and elites needed such goods to maintain and reinforce their social status and power. … Jaguar pelts, fine textiles, feathers, and other such products were exchanged over long distances within the Maya lowlands. … These high-status goods held together the Maya world.”" },
  10: { title: "Source 4", source: "Pietro Ranzano, Catholic Church official, c. 1480", text: "“In that year [1450 C.E.] there came to Naples a three-man embassy from the King of Ethiopia to His Highness, our King Alfonso. … in Ethiopia there are innumerable Christians—since both the people and the king there worship Christ. … King David, whom they call Zara Yacob, was said … to be the most civilized, the most just, and the most pious of princes.”" },
  13: { title: "Source 5", source: "Edward III of England, royal decree, 1351", text: "“I, Edward, by the grace of God king of England, sent this decree to … the archbishop of Canterbury … because of the great number of people who died in the recent pestilence, those who survive see that masters need servants … and so they now refuse to serve as workmen unless they receive excessive wages.”" },
  16: { title: "Source 6", source: "Pedro de Cieza de León, Spanish chronicler, sixteenth century", text: "“The roads that the Incas built were among the grandest in the world. … Some were very broad and crossed the entire kingdom. … If the king wished to make a road, he only had to command his officials, and it was completed quickly.”" },
  19: { title: "Source 7", source: "Historical account of East African states", text: "The source describes the long-standing connections of East African coastal states with Arabian merchants and rulers, including trade across the Indian Ocean and the continuing role of councils of elders alongside rulers." },
  22: { title: "Source 8: Medieval Europe", source: "Image: Countess of Béarn granting a fief", image: true },
  25: { title: "Source 9", source: "Petition concerning Madurai, South India", text: "The petitioner describes the disruption of Madurai following conquest, recalls Hindu rulers’ irrigation works on the Kaveri River, laments the absence of dharma, and appeals to a ruler for support in restoring the city and its religious order." },
  28: { title: "Source 10", source: "Account of scholarship in the Muslim world", text: "The source describes Turkic dynasties, including the Timurids, sponsoring scholars who preserved, translated, and expanded scientific and intellectual traditions inherited from earlier societies." },
};

const makeStarterBank = (): Unit[] => unitNames.map((unit, index) => ({ unit, questions: [{ question: `What is one development from Unit ${index + 1}: ${unit} that could be used as evidence in an AP World History argument?`, answer: "", choices: [] }] }));
const parseQuestions = (text: string): Question[] => {
  if (!text) return [];
  // Split into blocks starting with a number and a dot
  const parts = text.split(/(?=^\d+\.)/m).map(p => p.trim()).filter(Boolean);
  const questions: Question[] = [];
  for (const part of parts) {
    // Ensure part starts with number
    if (!/^\d+\./.test(part)) continue;
    // Remove leading number
    const body = part.replace(/^\d+\.\s*/, "");
    // Try to find an ANSWER: line (formats: ANSWER: A or ANSWER: A) or ANSWER: A)
    const answerMatch = body.match(/ANSWER:\s*([A-Z])/i);
    const answer = answerMatch ? answerMatch[1].toUpperCase() : "";
    // Remove any ANSWER line for parsing choices
    const withoutAnswer = body.replace(/\r?\n?\s*ANSWER:\s*.+$/im, '').trim();
    // Extract choices like 'A) text' or 'A. text' or '(A) text'
    const choicePattern = /(?:^|\n)\s*\(?([A-D])\)?[\.)]?\s*([\s\S]*?)(?=(?:\n\s*\(?[A-D]\)?[\.)]?\s*)|$)/gm;
    const choices: Choice[] = [];
    let m: RegExpExecArray | null;
    // If lines contain 'A)' style, use regex; otherwise try to detect by leading letters
    if (/(^|\n)\s*\(?A\)?[\.)]?\s*/.test(withoutAnswer)) {
      const regex = /(^|\n)\s*\(?([A-D])\)?[\.)]?\s*([\s\S]*?)(?=(?:\n\s*\(?[A-D]\)?[\.)]?\s*)|$)/gm;
      while ((m = regex.exec(withoutAnswer)) !== null) {
        const lbl = m[2]; const txt = (m[3] || '').trim();
        if (lbl && txt) choices.push({ label: lbl, text: txt });
      }
    } else {
      // Try line beginnings like 'A. Text' or 'A) Text'
      const lines = withoutAnswer.split(/\r?\n/);
      for (const line of lines) {
        const lm = line.match(/^\s*([A-D])[\.)\)]?\s+(.+)$/);
        if (lm) choices.push({ label: lm[1], text: lm[2].trim() });
      }
    }
    // Determine question stem (text before first choice)
    let questionText = withoutAnswer;
    if (choices.length) {
      const firstChoice = choices[0];
      const idx = withoutAnswer.indexOf(firstChoice.text);
      if (idx > 0) questionText = withoutAnswer.slice(0, idx).trim();
      else {
        const lines = withoutAnswer.split(/\r?\n/);
        questionText = lines.slice(0, Math.max(0, lines.length - choices.length)).join(' ').trim();
      }
    }
    // Remove any trailing choice label markers (e.g. "A)", "A.", "(A)") left on the stem
    questionText = questionText.replace(/\s*\(?[A-D]\)?[\.)]?\s*$/,'').trim();
    questions.push({ question: questionText, answer, choices });
  }
  return questions.filter(q => q.question && q.choices.length >= 3);
};

export default function Home() {
  const [bank, setBank] = useState<Unit[]>(makeStarterBank);
  const [view, setView] = useState<"units" | "practice">("units");
  const [unitIndex, setUnitIndex] = useState(0); const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<number, boolean>>({});
  const [progressByUnit, setProgressByUnit] = useState<Record<number, UnitProgress>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(progressStorageKey) ?? "{}"); } catch { return {}; }
  });
  useEffect(() => {
    // Try merged file first, then fallback to original
    const paths = ['/questions/unit-1-merged.txt', '/questions/unit-1.txt'];
    let tried = 0;
    const tryNext = () => {
      if (tried >= paths.length) return;
      const p = paths[tried++];
      fetch(p).then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.text();
      }).then((text) => {
        const questions = parseQuestions(text);
        if (questions.length) setBank((current) => current.map((item, i) => i === 0 ? { ...item, questions } : item));
      }).catch(() => tryNext());
    };
    tryNext();
  }, []);
  const saveProgress = (index: number, progress: UnitProgress) => setProgressByUnit((currentProgress) => { const nextProgress = { ...currentProgress, [index]: progress }; localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress)); return nextProgress; });
  const openUnit = (index: number) => {
    if (index !== 0) return;
    const saved = progressByUnit[index];
    setUnitIndex(index); setQuestionIndex(saved?.questionIndex ?? 0); setAnswers(saved?.answers ?? {}); setSubmittedQuestions(saved?.submittedQuestions ?? {}); setView("practice");
  };
  const goToQuestion = (index: number) => { setQuestionIndex(index); saveProgress(unitIndex, { questionIndex: index, answers, submittedQuestions }); };
  const current = bank[unitIndex].questions[questionIndex]; const questionNumber = questionIndex + 1;
  // Compute stimulus key (start index for groups of 3). If missing, cycle through available stimuli keys.
  const stimulusKeys = Object.keys(stimuli).map(k => parseInt(k, 10)).sort((a,b) => a-b);
  const baseKey = questionNumber - ((questionNumber - 1) % 3);
  const stimulus = ((): Stimulus | undefined => {
    if (stimuli[baseKey]) return stimuli[baseKey];
    if (!stimulusKeys.length) return undefined;
    const groupIndex = Math.floor((questionNumber - 1) / 3);
    const key = stimulusKeys[groupIndex % stimulusKeys.length];
    return stimuli[key];
  })();
  const totalQuestions = bank[unitIndex].questions.length;
  const selected = answers[questionIndex] ?? null;
  const submitted = submittedQuestions[questionIndex] ?? false;
  const isLast = questionNumber === totalQuestions;
  return <div className="app-shell"><header className="site-header"><button className="brand" onClick={() => setView("units")}>AP Classroom <span>Practice</span></button></header><main>
    {view === "units" && <section className="units-view"><p className="eyebrow">AP World History: Modern</p><h1>Course units</h1><div className="unit-grid">{bank.map((entry, index) => { const locked = index !== 0; return <button className={`unit-card ${locked ? "locked" : ""}`} disabled={locked} onClick={() => openUnit(index)} key={entry.unit}><span className="unit-number">UNIT {index + 1}</span><span className="unit-title">{entry.unit}</span><span className="question-count">{locked ? "Locked" : `${entry.questions.length} questions`}</span></button>; })}</div></section>}
    {view === "practice" && <section className="practice-view"><div className="practice-bar"><button className="back-button" onClick={() => setView("units")}>← All units</button><p>Unit {unitIndex + 1} · Multiple choice</p><p className="progress"><span>{questionNumber}</span> / {totalQuestions}</p></div><div className="assessment-layout"><aside className="stimulus-card">{stimulus?.image ? <><p className="source-label">{stimulus.title}</p><Image className="source-image" src="/questions/countess-fief.png" alt="Countess of Béarn granting a fief" width={176} height={240} /></> : <><p className="source-label">{stimulus?.title ?? "Source"}</p><blockquote>{stimulus?.text}</blockquote></>}<p className="source-citation">{stimulus?.source}</p></aside><article className="question-card"><p className="question-number">Question {questionNumber}</p><h1>{current?.question}</h1><div className="choices">{current?.choices.map((choice) => { const chosen = selected === choice.label; const correct = submitted && choice.label === current.answer; const incorrect = submitted && chosen && choice.label !== current.answer; return <button className={`choice ${chosen ? "selected" : ""} ${correct ? "correct" : ""} ${incorrect ? "incorrect" : ""}`} onClick={() => !submitted && (() => { const nextAnswers = { ...answers, [questionIndex]: choice.label }; setAnswers(nextAnswers); saveProgress(unitIndex, { questionIndex, answers: nextAnswers, submittedQuestions }); })()} disabled={submitted} key={choice.label}><span>{choice.label}</span>{choice.text}</button>; })}</div><div className="question-actions"><button className="secondary-button" onClick={() => goToQuestion(questionIndex - 1)} disabled={questionIndex === 0}>← Previous</button>{!submitted && <button className="primary-button" onClick={() => { const nextSubmitted = { ...submittedQuestions, [questionIndex]: true }; setSubmittedQuestions(nextSubmitted); saveProgress(unitIndex, { questionIndex, answers, submittedQuestions: nextSubmitted }); }} disabled={!selected}>Submit answer</button>}<button className="primary-button" onClick={() => goToQuestion(questionIndex + 1)} disabled={isLast}>Next →</button></div></article></div></section>}
  </main></div>;
}
