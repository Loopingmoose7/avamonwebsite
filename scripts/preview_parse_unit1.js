const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'public', 'questions', 'unit-1-merged.txt');
const text = fs.readFileSync(file,'utf8');
function parseQuestions(text) {
  if (!text) return [];
  const parts = text.split(/(?=^\d+\.)/m).map(p => p.trim()).filter(Boolean);
  const questions = [];
  for (const part of parts) {
    if (!/^\d+\./.test(part)) continue;
    const body = part.replace(/^\d+\.\s*/, "");
    const answerMatch = body.match(/ANSWER:\s*([A-Z])/i);
    const answer = answerMatch ? answerMatch[1].toUpperCase() : "";
    const withoutAnswer = body.replace(/\r?\n?\s*ANSWER:\s*.+$/im, '').trim();
    const choices = [];
    if (/(^|\n)\s*\(?A\)?[\.)]?\s*/.test(withoutAnswer)) {
      const regex = /(^|\n)\s*\(?([A-D])\)?[\.)]?\s*([\s\S]*?)(?=(?:\n\s*\(?[A-D]\)?[\.)]?\s*)|$)/gm;
      let m;
      while ((m = regex.exec(withoutAnswer)) !== null) {
        const lbl = m[2]; const txt = (m[3] || '').trim();
        if (lbl && txt) choices.push({ label: lbl, text: txt });
      }
    } else {
      const lines = withoutAnswer.split(/\r?\n/);
      for (const line of lines) {
        const lm = line.match(/^\s*([A-D])[\.)\)]?\s+(.+)$/);
        if (lm) choices.push({ label: lm[1], text: lm[2].trim() });
      }
    }
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
    questionText = questionText.replace(/\s*\(?[A-D]\)?[\.)]?\s*$/,'').trim();
    questions.push({ question: questionText, answer, choices });
  }
  return questions.filter(q => q.question && q.choices.length >= 3);
}
const qs = parseQuestions(text);
console.log('parsed', qs.length, 'questions');
for (let i = 24; i < 36; i++) {
  const q = qs[i];
  console.log('---', i+1, '---');
  if (!q) { console.log('missing'); continue; }
  console.log('Q:', q.question);
  console.log('Choices:');
  for (const c of q.choices) console.log(' ', c.label, c.text);
  console.log('Answer:', q.answer);
}
