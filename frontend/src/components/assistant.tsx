"use client";
import { useState } from "react";
import {
  ArrowUp,
  BookOpen,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { aiService } from "@/lib/api";
import type { Answer, Project } from "@/lib/types";
import { Button } from "./ui/button";
import { Alert, Governance } from "./shared";
const questions = [
  "What approvals are required for my project?",
  "Why do I need Pollution Control Consent?",
  "What documents are missing?",
  "What is the expected approval sequence?",
  "Which approvals can run in parallel?",
];
export function Assistant({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { question: string; answer: Answer }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(question: string) {
    if (!project || busy) return;
    setBusy(true);
    setError("");
    setInput("");
    try {
      const answer = await aiService.ask(question, project.id);
      setMessages((old) => [...old, { question, answer }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="assistant-backdrop">
      <aside
        className="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-label="NIRMAN Regulatory Assistant"
      >
        <header>
          <span className="assistant-icon">
            <Sparkles size={20} />
          </span>
          <div>
            <h3>NIRMAN Regulatory Assistant</h3>
            <p>Grounded answers. Clear next steps.</p>
          </div>
          <Button
            variant="ghost"
            aria-label="Close assistant"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </header>
        <div className="assistant-body">
          <div className="assistant-context">
            <span className="tiny-dot green" />{" "}
            {project?.name || "Create a project to ask questions"}
            <small>Demonstration knowledge catalogue</small>
          </div>
          {messages.length === 0 && (
            <>
              <div className="assistant-welcome">
                <BookOpen size={30} />
                <h2>
                  Make sense of your
                  <br />
                  approval journey.
                </h2>
                <p>
                  Ask about requirements, documents, dependencies or the next
                  step.
                </p>
              </div>
              <div className="suggested-questions">
                {questions.map((q) => (
                  <button
                    key={q}
                    disabled={!project || busy}
                    onClick={() => ask(q)}
                  >
                    <MessageSquareText size={15} />
                    {q}
                    <ArrowUp size={14} />
                  </button>
                ))}
              </div>
            </>
          )}
          {messages.map((m, i) => (
            <div className="chat-turn" key={i}>
              <div className="chat-question">{m.question}</div>
              <div className="chat-answer">
                <Sparkles size={17} />
                <p>{m.answer.answer}</p>
                <div className="answer-citations">
                  <div>
                    <span>SOURCE</span>
                    <strong>{m.answer.source}</strong>
                  </div>
                  <div>
                    <span>RULE</span>
                    <p>{m.answer.rule}</p>
                  </div>
                  <div>
                    <span>EXPLANATION</span>
                    <p>{m.answer.explanation}</p>
                  </div>
                </div>
                <small>{m.answer.provider} · Illustrative guidance</small>
              </div>
            </div>
          ))}
          {busy && (
            <div className="chat-loading">
              <Loader2 className="spin" size={18} /> Consulting the demo
              knowledge catalogue…
            </div>
          )}
          {error && <Alert kind="red">{error}</Alert>}
        </div>
        <form
          className="assistant-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) void ask(input);
          }}
        >
          <input
            placeholder="Ask about your project…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!project || busy}
            aria-label="Question for regulatory assistant"
          />
          <Button
            disabled={!project || busy || input.trim().length < 3}
            aria-label="Send question"
            type="submit"
          >
            <ArrowUp size={18} />
          </Button>
        </form>
        <div className="assistant-disclaimer">
          <ShieldCheck size={14} /> AI assists. Authorized officers decide.
        </div>
      </aside>
    </div>
  );
}
