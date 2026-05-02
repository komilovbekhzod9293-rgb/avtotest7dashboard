import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  Phone, ArrowLeft, Loader2, AlertCircle,
  Calendar, ThumbsUp, ThumbsDown,
  MessageSquare, ChevronRight,
  Lightbulb, Activity, Zap, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CONFIG ────────────────────────────────────────────────
const SHEET_ID = "1eG0H0QrV5QyoeHelycZvROOSkg580h2HFLzjksfGJJQ";
const API_KEY  = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const RANGE    = "%D0%9B%D0%B8%D1%81%D1%821!A:T";

const MANAGER_MAP: Record<string, string> = {
  "1559": "Ziyoda",
  "1615": "Rayhon",
  "1627": "Omina",
  "1625": "Muxlisa",
  "1621": "Rais",
  "1619": "Jamshid",
};

function resolveManager(raw: string): string {
  const t = (raw ?? "").trim();
  return MANAGER_MAP[t] ?? t;
}

// ─── TYPES ─────────────────────────────────────────────────
interface CallRow {
  callId:      string;
  managerId:   string;
  managerName: string;
  status:      string;
  date:        string;
  transcript:  string;
  score:       number;
  managerPct:  string;
  clientPct:   string;
  lidSifati:   string;
  ehtiyoj:     string;
  yakun:       string;
  yaxshi:      string;
  xatolar:     string;
  tavsiya:     string;
  dinamika:    string;
  kritik:      string;
  clientPhone: string;
}

type Period = "bugun" | "hafta" | "oy" | "barchasi";
type View   = "managers" | "calls" | "detail";

// ─── DATE HELPERS ──────────────────────────────────────────
function parseSheetDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw); // формат уже нормальный: 2026-05-02T05:52:20Z
  if (!isNaN(d.getTime())) return d;
  return null;
}

function formatDate(raw: string): string {
  const d = parseSheetDate(raw);
  if (!d) return raw;
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function filterByPeriod(rows: CallRow[], period: Period): CallRow[] {
  if (period === "barchasi") return rows;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now).getTime();

  return rows.filter((r) => {
    const d = parseSheetDate(r.date);
    if (!d) return false;
    if (period === "bugun") return startOfDay(d).getTime() === todayStart;
    if (period === "hafta") {
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    }
    if (period === "oy") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

// ─── STYLING HELPERS ───────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function lidColor(lid: string) {
  const l = lid?.toLowerCase();
  if (l === "issiq") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (l === "iliq")  return "bg-amber-500/15  text-amber-600  border-amber-500/30";
  if (l === "sovuq") return "bg-blue-500/15   text-blue-600   border-blue-500/30";
  return "bg-secondary text-muted-foreground border-border";
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "bugun",    label: "Bugun"    },
  { id: "hafta",    label: "Hafta"    },
  { id: "oy",       label: "Oy"       },
  { id: "barchasi", label: "Barchasi" },
];

// ─── INFO CARD ─────────────────────────────────────────────
type CardColor = "blue" | "emerald" | "red" | "amber" | "purple";

const cardStyles: Record<CardColor, string> = {
  blue:    "border-blue-500/20    bg-blue-500/5",
  emerald: "border-emerald-500/20 bg-emerald-500/5",
  red:     "border-red-500/20     bg-red-500/5",
  amber:   "border-amber-500/20   bg-amber-500/5",
  purple:  "border-purple-500/20  bg-purple-500/5",
};

const cardIconStyles: Record<CardColor, string> = {
  blue:    "text-blue-500",
  emerald: "text-emerald-500",
  red:     "text-red-500",
  amber:   "text-amber-500",
  purple:  "text-purple-500",
};

function InfoCard({
  icon, title, color, children,
}: {
  icon: React.ReactNode;
  title: string;
  color: CardColor;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", cardStyles[color])}>
      <div className={cn("flex items-center gap-2 mb-2", cardIconStyles[color])}>
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export function SotuvAnalizi() {
  const [rows,    setRows]    = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [period,  setPeriod]  = useState<Period>("barchasi");
  const [view,    setView]    = useState<View>("managers");
  const [selMgr,  setSelMgr]  = useState<string | null>(null);
  const [selCall, setSelCall] = useState<CallRow | null>(null);

  // ── fetch data ─────────────────────────────────────────
  useEffect(() => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`API xatosi: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const all: string[][] = data.values ?? [];
        const parsed: CallRow[] = all
          .slice(1)
          .filter((row) => row[1])
          .map((row) => ({
            callId:      (row[0]  ?? "").trim(),
            managerId:   (row[1]  ?? "").trim(),
            managerName: resolveManager(row[1] ?? ""),
            status:      (row[3]  ?? "").trim(),
            date:        (row[4]  ?? "").trim(),
            transcript:  (row[5]  ?? "").trim(),
            clientPhone: (row[7]  ?? "").trim(),
            score:       parseInt(row[9]  ?? "0") || 0,
            managerPct:  (row[10] ?? "").trim(),
            clientPct:   (row[11] ?? "").trim(),
            lidSifati:   (row[12] ?? "").trim(),
            ehtiyoj:     (row[13] ?? "").trim(),
            yakun:       (row[14] ?? "").trim(),
            yaxshi:      (row[15] ?? "").trim(),
            xatolar:     (row[16] ?? "").trim(),
            tavsiya:     (row[17] ?? "").trim(),
            dinamika:    (row[18] ?? "").trim(),
            kritik:      (row[19] ?? "").trim(),
          }))
          .filter((r) => r.managerName !== "");
        setRows(parsed);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── navigation ─────────────────────────────────────────
  function openManager(name: string) {
    setSelMgr(name);
    setSelCall(null);
    setView("calls");
  }

  function openCall(call: CallRow) {
    setSelCall(call);
    setView("detail");
  }

  function backToManagers() {
    setView("managers");
    setSelMgr(null);
    setSelCall(null);
  }

  function backToCalls() {
    setView("calls");
    setSelCall(null);
  }

  // ── period tabs ────────────────────────────────────────
  const PeriodTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => setPeriod(p.id)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition",
            period === p.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  // ── loading / error ────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center gap-3 py-32 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Yuklanmoqda…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center gap-3 py-32 text-red-500">
      <AlertCircle className="h-5 w-5" />
      <span>Xatolik: {error}</span>
    </div>
  );

  const filtered = filterByPeriod(rows, period);

  // ══════════════════════════════════════════════════════
  // VIEW: CALL DETAIL
  // ══════════════════════════════════════════════════════
  if (view === "detail" && selCall) {
    const c = selCall;
    return (
      <div>
        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
          <button onClick={backToManagers} className="hover:text-foreground transition">
            Barcha menejerlar
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <button onClick={backToCalls} className="hover:text-foreground transition">
            {c.managerName}
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">{c.clientPhone || `#${c.callId}`}</span>
        </div>

        <Header
          title={c.clientPhone || `Zvonok #${c.callId}`}
          subtitle={formatDate(c.date)}
        />

        {/* top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className={cn("rounded-2xl border p-4 text-center", scoreBg(c.score))}>
            <div className={cn("text-3xl font-bold", scoreColor(c.score))}>{c.score || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Umumiy ball</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{c.managerPct || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Menedjer gapirdi</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{c.clientPct || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Mijoz gapirdi</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center flex flex-col items-center justify-center">
            {c.lidSifati ? (
              <>
                <span className={cn("px-2 py-0.5 rounded-full text-sm font-semibold border", lidColor(c.lidSifati))}>
                  {c.lidSifati}
                </span>
                <div className="text-xs text-muted-foreground mt-1">Lid sifati</div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">—</div>
            )}
          </div>
        </div>

        {/* info cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {c.ehtiyoj && (
            <InfoCard icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} title="Ehtiyoj Aniqlash" color="blue">
              {c.ehtiyoj}
            </InfoCard>
          )}
          {c.yakun && (
            <InfoCard icon={<CheckCircle className="h-4 w-4" />} title="Yakun" color="emerald">
              {c.yakun}
            </InfoCard>
          )}
          {c.yaxshi && (
            <InfoCard icon={<ThumbsUp className="h-4 w-4" />} title="Yaxshi Narsalar" color="emerald">
              {c.yaxshi}
            </InfoCard>
          )}
          {c.xatolar && (
            <InfoCard icon={<ThumbsDown className="h-4 w-4" />} title="Xatolar" color="red">
              {c.xatolar}
            </InfoCard>
          )}
          {c.tavsiya && (
            <InfoCard icon={<Lightbulb className="h-4 w-4" />} title="Tavsiya" color="amber">
              {c.tavsiya}
            </InfoCard>
          )}
          {c.dinamika && (
            <InfoCard icon={<Activity className="h-4 w-4" />} title="Suhbat Dinamikasi" color="purple">
              {c.dinamika}
            </InfoCard>
          )}
        </div>

        {/* kritik signal */}
        {c.kritik && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 flex gap-3">
            <Zap className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-600 mb-1">Kritik Signal</div>
              <p className="text-sm leading-relaxed">{c.kritik}</p>
            </div>
          </div>
        )}

        {/* transcript */}
        {c.transcript && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Transkript</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {c.transcript}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // VIEW: MANAGER CALLS
  // ══════════════════════════════════════════════════════
  if (view === "calls" && selMgr) {
    const mgrCalls = filterByPeriod(
      rows.filter((r) => r.managerName === selMgr),
      period
    ).sort((a, b) => {
      const da = parseSheetDate(a.date)?.getTime() ?? 0;
      const db = parseSheetDate(b.date)?.getTime() ?? 0;
      return db - da;
    });

    const avgScore = mgrCalls.length
      ? Math.round(mgrCalls.reduce((s, c) => s + c.score, 0) / mgrCalls.length)
      : 0;

    const hotLeads = mgrCalls.filter((c) => c.lidSifati?.toLowerCase() === "issiq").length;

    return (
      <div>
        <button
          onClick={backToManagers}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Barcha menejerlar
        </button>

        <Header title={selMgr} subtitle={`${mgrCalls.length} ta zvonok`} />

        <PeriodTabs />

        {/* quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{mgrCalls.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Zvonoklar</div>
          </div>
          <div className={cn("rounded-2xl border p-4 text-center", scoreBg(avgScore))}>
            <div className={cn("text-2xl font-bold", scoreColor(avgScore))}>{avgScore || "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">O'rtacha ball</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{hotLeads}</div>
            <div className="text-xs text-muted-foreground mt-1">Issiq lidlar</div>
          </div>
        </div>

        {mgrCalls.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            Bu davr uchun zvonoklar yo'q
          </p>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Zvonoklar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun bosing</p>
            </div>
            <div className="divide-y divide-border">
              {mgrCalls.map((c) => (
                <button
                  key={c.callId}
                  onClick={() => openCall(c)}
                  className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{c.clientPhone || `#${c.callId}`}</span>
                      {c.lidSifati && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", lidColor(c.lidSifati))}>
                          {c.lidSifati}
                        </span>
                      )}
                      {c.ehtiyoj && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">
                          {c.ehtiyoj}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(c.date)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={cn("text-xl font-bold", scoreColor(c.score))}>
                      {c.score || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">ball</div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // VIEW: MANAGERS LIST
  // ══════════════════════════════════════════════════════
  const byManager: Record<string, CallRow[]> = {};
  filtered.forEach((r) => {
    if (!byManager[r.managerName]) byManager[r.managerName] = [];
    byManager[r.managerName].push(r);
  });

  const managerList = Object.entries(byManager)
    .map(([name, calls]) => ({
      name,
      calls,
      avgScore: calls.length
        ? Math.round(calls.reduce((s, c) => s + c.score, 0) / calls.length)
        : 0,
    }))
    .sort((a, b) => b.calls.length - a.calls.length);

  return (
    <div>
      <Header
        title="Sotuv Analizi"
        subtitle="Menejerlar va zvonoklar tahlili"
      />

      <PeriodTabs />

      {managerList.length === 0 ? (
        <p className="text-center py-16 text-sm text-muted-foreground">
          Bu davr uchun ma'lumot yo'q
        </p>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Menejerlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Batafsil ko'rish uchun bosing
            </p>
          </div>
          <div className="divide-y divide-border">
            {managerList.map((m) => (
              <button
                key={m.name}
                onClick={() => openManager(m.name)}
                className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition flex items-center gap-4"
              >
                <div className={cn(
                  "h-11 w-11 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm shrink-0",
                  avatarColor(m.name)
                )}>
                  {m.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.calls.length} ta zvonok
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={cn("text-lg font-bold", scoreColor(m.avgScore))}>
                    {m.avgScore || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">o'rtacha ball</div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
