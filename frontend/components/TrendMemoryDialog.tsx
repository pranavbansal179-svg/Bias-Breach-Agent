"use client";
import React, { useState } from "react";
import { Sparkles, Send, X, Bot, Library, Loader2 } from "lucide-react";
import { askTrendMemory } from "@/lib/api";

interface TrendMemoryDialogProps {
  topic: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrendMemoryDialog({ topic, isOpen, onClose }: TrendMemoryDialogProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; sources?: string[] }>>([
    {
      role: "assistant",
      text: `Hello! I am the Trend Memory AI for "${topic}". Ask me how different media sources (Left, Center, Right, Reddit, Tech Blogs) frame this story or which voices are missing.`,
    },
  ]);

  if (!isOpen) return null;

  async function handleAsk() {
    if (!question.trim() || loading) return;
    const userQ = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: userQ }]);
    setLoading(true);

    try {
      const res = await askTrendMemory(topic, userQ);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.answer,
          sources: res.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Unable to query Trend Memory at this time. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[600px] w-full max-w-2xl overflow-hidden rounded-3xl border border-purple-500/30 bg-[#121620] shadow-2xl shadow-purple-950/50 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0e121a]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Trend Memory &bull; RAG Intelligence
              </h2>
              <p className="text-xs text-slate-400">
                Synthesizing multi-bubble perspectives for: <strong className="text-purple-300">{topic}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-none"
                    : "bg-[#0c101a] border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                <p>{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                      <Library className="h-3 w-3 text-purple-400" />
                      Referenced Bubble Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((s, si) => (
                        <span key={si} className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-purple-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Querying vector store across media sources...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-800/80 p-4 bg-[#0e121a]">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder={`Ask a question (e.g., "What are the biggest criticisms raised on Reddit?")`}
              className="flex-1 rounded-xl border border-slate-700/60 bg-[#121620] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors"
            >
              <span>Ask</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
