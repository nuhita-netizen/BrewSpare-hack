"use client";
import { FormEvent, useState } from "react";
import { postApi } from "@/lib/api";

type Answer = { in_scope: boolean; answer: string };
const examples = ["What needs attention today?", "Which parts are at risk?"];

export default function ProjectChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setQuestion(clean);
    setLoading(true);
    try {
      const result = await postApi<Answer>("/ask", { question: clean });
      setAnswer(result);
      setQuestion("");
    } catch (error) {
      setAnswer({ in_scope: false, answer: error instanceof Error ? error.message : "BrewSpare could not answer right now." });
    } finally { setLoading(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void ask(question); }

  return <div className="project-chat">
    {answer && <div className={`chat-response ${answer.in_scope ? "" : "out-of-scope"}`} role="status" aria-live="polite"><span className="chat-spark">✦</span><p>{answer.answer}</p><button type="button" className="chat-close" aria-label="Dismiss answer" onClick={() => setAnswer(null)}>×</button></div>}
    <form className="ai-bar" onSubmit={submit}>
      <span className="chat-spark" aria-hidden="true">✦</span>
      <input className="ai-input" aria-label="Ask BrewSpare about the project" placeholder="Ask about assets, parts, inventory, maintenance…" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} />
      {examples.map((example) => <button type="button" className="chip chat-prompt" key={example} onClick={() => void ask(example)} disabled={loading}>{example}</button>)}
      <button className="btn" type="submit" disabled={loading || !question.trim()}>{loading ? "…" : "Ask"}</button>
    </form>
  </div>;
}
