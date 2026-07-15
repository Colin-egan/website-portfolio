"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot } from "lucide-react";

const responses: Record<string, string> = {
  default: "That's a great question! I'd be happy to connect you with the Egan Lab team. Would you like to book a free consultation?",
  pricing: "We offer three packages: Website Build (starting at $800 one-time), Monthly Management ($30/mo, includes client portal access), and Automation ($450 one-time, includes client portal setup and remote data storage on Supabase). Which sounds like a fit?",
  hello: "Hey! 👋 I'm the Egan Lab assistant. I can help with pricing, timelines, or booking a call. What do you need?",
  hi: "Hey! 👋 I'm the Egan Lab assistant. I can help with pricing, timelines, or booking a call. What do you need?",
  timeline: "Most websites ship within 7–14 days. First draft is usually ready in 48 hours. We move fast!",
  contact: "You can reach Colin directly at colinthomasegan5@gmail.com, or just book a call from our contact page!",
  thanks: "You're welcome! Anything else I can help with? 😊",
};

function getResponse(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, val] of Object.entries(responses)) {
    if (lower.includes(key)) return val;
  }
  return responses.default;
}

interface Message { role: "user" | "bot"; text: string; }

export function ChatbotWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hey! 👋 Ask me anything about Egan Lab." },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      const botMsg = { role: "bot" as const, text: getResponse(userMsg.text) };
      setMessages((m) => [...m, botMsg]);
    }, 600);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
          <Bot size={12} className="text-white" />
        </div>
        <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Mini Chatbot</div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Online</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: 160 }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 pt-1 border-t border-white/5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything..."
          className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
        />
        <button
          onClick={send}
          className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={12} className="text-white" />
        </button>
      </div>
    </div>
  );
}
