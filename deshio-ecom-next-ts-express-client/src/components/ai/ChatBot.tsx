"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ArrowUp } from "lucide-react";
import api from "@/lib/axios";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "model",
  content:
    "Hello! I am your Deshio stylist & fashion concierge. Ask me for styling suggestions, sizing guidance, fabric care tips, or order queries.",
};

interface ChatBotProps {
  onClose: () => void;
}

export default function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = updatedMessages
        .filter((_, i) => i > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post("/ai/chat", {
        message: text,
        history: history.slice(0, -1),
      });

      const reply = res.data?.data?.reply || "I apologize, but I could not formulate a response.";
      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content:
            "Our concierge service is momentarily indisposed. Please try asking again shortly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col w-[380px] h-[520px] max-h-[80vh] rounded-2xl shadow-2xl bg-white border border-stone-200 overflow-hidden max-sm:w-[calc(100vw-2rem)] max-sm:right-4 max-sm:left-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-stone-900 text-white px-4 py-3.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-medium text-sm block leading-tight">
              Deshio Concierge
            </span>
            <span className="text-[10px] text-stone-400 font-light">
              Personal Fashion Assistant
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close concierge"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-900 text-white rounded-br-xs"
                  : "bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs shadow-xs"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200/90 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="border-t border-stone-200 p-3 bg-white flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for styling tips, sizing, fabrics…"
          disabled={isLoading}
          className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-stone-900 bg-stone-50/40"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="w-9 h-9 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0 shadow-xs"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
