"use client";

import { useEffect, useState } from "react";

type Choice = { label: string; text: string };
type Question = { question: string; answer: string; choices: Choice[] };
type Unit = { unit: string; questions: Question[] };
type Stimulus = { title: string; source: string; text?: string; image?: boolean };

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
const parseQuestions = (text: string): Question[] => text.split(/\r?\n-{10,}\r?\n\s*/).filter((block) => /^\d+\.\s/m.test(block)).map((block) => {
  const numbered = block.slice(block.search(/^\d+\.\s/m));
  const answer = numbered.match(/^\s*ANSWER:\s*([A-Z])\)/m)?.[1] ?? "";
  const withoutAnswer = numbered.replace(/^\d+\.\s*/, "").replace(/^\s*ANSWER:\s*.+$/m, "");
  const choicePattern = /^\s*([A-Z])\)\s*(.+)$/gm;
  const first = choicePattern.exec(withoutAnswer); choicePattern.lastIndex = 0;
  return { question: (first ? withoutAnswer.slice(0, first.index) : withoutAnswer).trim(), answer, choices: Array.from(withoutAnswer.matchAll(choicePattern), ([, label, choiceText]) => ({ label, text: choiceText.trim() })) };
}).filter((item) => item.question);

export default function Home() {
  const [bank, setBank] = useState<Unit[]>(makeStarterBank);
  const [view, setView] = useState<"units" | "practice">("units");
  const [unitIndex, setUnitIndex] = useState(0); const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [submitted, setSubmitted] = useState(false);
  useEffect(() => { fetch("/questions/unit-1.txt").then((r) => r.text()).then((text) => { const questions = parseQuestions(text); if (questions.length) setBank((current) => current.map((item, i) => i === 0 ? { ...item, questions } : item)); }); }, []);
  const openUnit = (index: number) => { setUnitIndex(index); setQuestionIndex(0); setSelected(null); setSubmitted(false); setView("practice"); };
  const next = () => { if (!submitted) return; const total = bank[unitIndex].questions.length; if (questionIndex < total - 1) { setQuestionIndex((i) => i + 1); setSelected(null); setSubmitted(false); } };
  const current = bank[unitIndex].questions[questionIndex]; const questionNumber = questionIndex + 1;
  const stimulus = stimuli[questionNumber - ((questionNumber - 1) % 3)];
  const isLast = questionNumber === bank[unitIndex].questions.length;
  return <div className="app-shell"><header className="site-header"><button className="brand" onClick={() => setView("units")}>AP Classroom <span>Practice</span></button></header><main>
    {view === "units" && <section className="units-view"><p className="eyebrow">AP World History: Modern</p><h1>Course units</h1><div className="unit-grid">{bank.map((entry, index) => { const locked = index > 1; return <button className={`unit-card ${locked ? "locked" : ""}`} disabled={locked} onClick={() => openUnit(index)} key={entry.unit}><span className="unit-number">UNIT {index + 1}</span><span className="unit-title">{entry.unit}</span><span className="question-count">{locked ? "Locked" : `${entry.questions.length} questions`}</span></button>; })}</div></section>}
    {view === "practice" && <section className="practice-view"><div className="practice-bar"><button className="back-button" onClick={() => setView("units")}>← All units</button><p>Unit {unitIndex + 1} · Multiple choice</p><p className="progress">Question {questionNumber} of {bank[unitIndex].questions.length}</p></div><div className="assessment-layout"><aside className="stimulus-card">{stimulus?.image ? <><iframe className="source-pdf" title="Source image: Countess of Béarn granting a fief" src="/questions/unit-1-source.pdf#page=22" /><a href="/questions/unit-1-source.pdf#page=22" target="_blank" rel="noreferrer">Open source image ↗</a></> : <><p className="source-label">{stimulus?.title ?? "Source"}</p><blockquote>{stimulus?.text}</blockquote></>}<p className="source-citation">{stimulus?.source}</p></aside><article className="question-card"><p className="question-number">Question {questionNumber}</p><h1>{current?.question}</h1><div className="choices">{current?.choices.map((choice) => { const chosen = selected === choice.label; const correct = submitted && choice.label === current.answer; const incorrect = submitted && chosen && choice.label !== current.answer; return <button className={`choice ${chosen ? "selected" : ""} ${correct ? "correct" : ""} ${incorrect ? "incorrect" : ""}`} onClick={() => !submitted && setSelected(choice.label)} disabled={submitted} key={choice.label}><span>{choice.label}</span>{choice.text}</button>; })}</div>{submitted && <p className={`result ${selected === current?.answer ? "right" : "wrong"}`}>{selected === current?.answer ? "Correct." : `Incorrect. The correct answer is ${current?.answer}.`}</p>}<div className="question-actions">{!submitted ? <button className="primary-button" onClick={() => setSubmitted(true)} disabled={!selected}>Submit answer</button> : <button className="primary-button" onClick={next} disabled={isLast}>{isLast ? "Assessment complete" : "Next question →"}</button>}</div></article></div></section>}
  </main></div>;
}
