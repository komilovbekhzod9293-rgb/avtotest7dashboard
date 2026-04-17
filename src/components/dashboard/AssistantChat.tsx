import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const WEBHOOK_URL = "https://n8n.srv1215497.hstgr.cloud/webhook/ai";

interface Props {
  context: string;
}

export function AssistantChat({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Salom! Men AVTOTEST7 AI yordamchisiman. ${context} bo'limi bo'yicha savollaringizni bering.` },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (text.length > 1000) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, section: context, timestamp: new Date().toISOString() }),
      });

      let reply = "";
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        reply = data.reply ?? data.response ?? data.message ?? data.output ?? data.text ?? JSON.stringify(data);
      } else {
        reply = await res.text();
      }

      setMessages((m) => [...m, { role: "assistant", content: reply || "..." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Kechirasiz, ulanishda xatolik. Iltimos qayta urinib ko'ring." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 lg:bottom-6 right-5 lg:right-8 z-40",
          "inline-flex items-center gap-2 pl-3 pr-4 h-11 rounded-2xl",
          "bg-primary text-primary-foreground shadow-elevated",
          "hover:scale-[1.02] active:scale-[0.98] transition-transform",
          open && "opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">AI yordamchi</span>
      </button>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-50 bg-card border border-border shadow-elevated rounded-2xl flex flex-col",
          "bottom-4 right-4 left-4 lg:left-auto lg:bottom-6 lg:right-8",
          "w-auto lg:w-[380px] h-[70vh] lg:h-[560px] max-h-[640px]",
          "transition-all duration-200 origin-bottom-right",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              A7
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">AVTOTEST7 AI</div>
              <div className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Onlayn
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-muted-foreground px-3.5 py-2 rounded-2xl rounded-bl-md inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Yozyapti...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex items-end gap-2 bg-secondary rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-ring/20 transition">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={onKey}
              placeholder="Savolingizni yozing..."
              maxLength={1000}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none py-1"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0",
                input.trim() && !loading
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
