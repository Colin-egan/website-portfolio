"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type ChatMessage = { role: "user" | "model"; text: string };

export function PresentationChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/presentation-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessages([...next, { role: "model", text: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex h-[calc(100svh-7rem)] max-w-3xl flex-col px-4 pb-6">
      <div className="mb-4">
        <p className="font-display italic lowercase text-lg text-amber-400">live demo</p>
        <h2 className="font-display text-3xl font-bold md:text-4xl">Ask me anything</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {messages.length === 0 && (
          <p className="text-muted-foreground">Type a question below to start chatting.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 ${
                m.role === "user" ? "bg-amber-400 text-black" : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <p className="text-muted-foreground animate-pulse">Thinking…</p>}
        {error && <p className="text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          maxLength={4000}
          className="flex-1 rounded-full border border-border bg-background px-5 py-3 outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="rounded-full bg-amber-400 px-5 text-black transition disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}
