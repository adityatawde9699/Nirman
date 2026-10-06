"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";
type Message = { id: number; text: string; kind: "success" | "error" };
function emit(text: string, kind: Message["kind"]) {
  window.dispatchEvent(
    new CustomEvent("nirman-toast", { detail: { id: Date.now(), text, kind } }),
  );
}
export const toast = {
  success: (text: string) => emit(text, "success"),
  error: (text: string) => emit(text, "error"),
};
export function Toaster() {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    const handle = (e: Event) => {
      const m = (e as CustomEvent<Message>).detail;
      setMessages((old) => [...old, m]);
      setTimeout(
        () => setMessages((old) => old.filter((x) => x.id !== m.id)),
        5500,
      );
    };
    window.addEventListener("nirman-toast", handle);
    return () => window.removeEventListener("nirman-toast", handle);
  }, []);
  return (
    <div className="toast-stack" aria-live="polite">
      {messages.map((m) => (
        <div className={`toast ${m.kind}`} key={m.id}>
          {m.kind === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <TriangleAlert size={19} />
          )}
          <p>{m.text}</p>
          <button
            aria-label="Dismiss notification"
            onClick={() =>
              setMessages((old) => old.filter((x) => x.id !== m.id))
            }
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
