import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  Phone, ArrowLeft, Loader2, AlertCircle,
  Calendar, ThumbsUp, ThumbsDown,
  MessageSquare, ChevronRight,
  Lightbulb, Activity, Zap, CheckCircle, ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_ID  = "1eG0H0QrV5QyoeHelycZvROOSkg580h2HFLzjksfGJJQ";
const SHEET_ID2 = "1StqPMbH2IWX_722F9MVp92gKOGitlTuUBVYrtZ7GUvI";
const API_KEY   = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const RANGE1    = "%D0%9B%D0%B8%D1%81%D1%821!A:T";
const RANGE2    = "%D0%9B%D0%B8%D1%81%D1%821!A:P";

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

type SalesMap = Record<string, number>;
type Period = "bugun" | "hafta" | "oy" | "barchasi";
type View   = "managers" | "calls" | "detail";

function parseSheetDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function parseSaleDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length === 3) {
    const day   = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year  = parseInt(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
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

function filterSalesByPeriod(
  salesRows: { name: string; date: Date }[],
  period: Period
): { name: string; date: Date }[] {
  if (period === "barchasi") return salesRows;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now).getTime();
  return salesRows.filter(({ date: d }) => {
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
  if (l === "issiq") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (l === "iliq")  return "bg-amber-500/15  text-amber-700  border-amber-500/30";
  if (l === "sovuq") return "bg-blue-500/15   text-blue-700   border-blue-500/30";
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

function InfoCard({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: CardColor; children: React.ReactNode;
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

// ── Back button component ──────────────────────────────────
function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition mb-5 border border-border"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

export function SotuvAnalizi() {
  const [rows,     setRows]     = useState<CallRow[]>([]);
  const [allSales, setAllSales] = useState<{ name: string; date: Date }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [period,   setPeriod]   = useState<Period>("barchasi");
  const [view,     setView]     = useState<View>("managers");
  const [selMgr,   setSelMgr]   = useState<string | null>(null);
  const [selCall,  setSelCall]  = useState<CallRow | null>(null);

  useEffect(() => {
    const url1 = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE1}?key=${API_KEY}`;
    const url2 = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID2}/values/${RANGE2}?key=${API_KEY}`;

    Promise.all([fetch(url1), fetch(url2)])
      .then(async ([r1, r2]) => {
        if (!r1.ok) throw new Error(`API xatosi (1): ${r1.status}`);
        if (!r2.ok) throw new Error(`API xatosi (2): ${r2.status}`);
        return Promise.all([r1.json(), r2.json()]);
      })
      .then(([data1, data2]) => {
        const all: string[][] = data1.values ?? [];
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
            // clientPhone: row[7] — номер клиента из колонки H
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
          .filter((r) => r.managerName !== "" && r.status === "done");

        setRows(parsed);

        const all2: string[][] = data2.values ?? [];
        const sales: { name: string; date: Date }[] = [];
        all2.slice(1).forEach((row) => {
          const hodim   = (row[15] ?? "").trim();
          const dateRaw = (row[5]  ?? "").trim();
          if (!hodim || hodim === "y") return;
          if (!dateRaw || dateRaw.toLowerCase().includes("avto")) return;
          const date = parseSaleDate(dateRaw);
          if (!date) return;
          sales.push({ name: hodim, date });
        });
        setAllSales(sales);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const salesMap: SalesMap = {};
  filterSalesByPeriod(allSales, period).forEach(({ name }) => {
    const key = name.trim();
    salesMap[key] = (salesMap[key] ?? 0) + 1;
  });

  function openManager(name: string) { setSelMgr(name); setSelCall(null); setView("calls"); }
  function openCall(call: CallRow)   { setSelCall(call); setView("detail"); }
  function backToManagers()          { setView("managers"); setSelMgr(null); setSelCall(null); }
  function backToCalls()             { setView("calls"); setSelCall(null); }

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

  if (loading) return (
    <div className="flex items-center justify-center gap-3 py-32 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center gap-3 py-32 text-red-500">
      <AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span>
    </div>
  );

  const filtered = filterByPeriod(rows, period);

  // ══════════════════════════════════════════════════════
  // VIEW: CALL DETAIL
  // ══════════════════════════════════════════════════════
  if (view === "detail" && selCall) {
    const c = selCall;
    // Показываем номер телефона если есть, иначе callId
    const displayPhone = c.clientPhone || `#${c.callId}`;
    return (
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5 flex-wrap">
          <button onClick={backToManagers} className="hover:text-foreground transition">Barcha menejerlar</button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <button onClick={backToCalls} className="hover:text-foreground transition">{c.managerName}</button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium">{displayPhone}</span>
        </div>

        <BackButton onClick={backToCalls} label={c.managerName} />

        <Header title={displayPhone} subtitle={formatDate(c.date)} />

        {/* Stats row — с заголовками */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className={cn("rounded-2xl border p-4 text-center", scoreBg(c.score))}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Umumiy ball</div>
            <div className={cn("text-3xl font-bold", scoreColor(c.score))}>{c.score || "—"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Menejer gapirdi</div>
            <div className="text-2xl font-bold">{c.managerPct || "—"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mijoz gapirdi</div>
            <div className="text-2xl font-bold">{c.clientPct || "—"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center flex flex-col items-center justify-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lid sifati</div>
            {c.lidSifati ? (
              <span className={cn("px-3 py-1 rounded-full text-sm font-semibold border", lidColor(c.lidSifati))}>
                {c.lidSifati}
              </span>
            ) : (
              <div className="text-muted-foreground">—</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {c.ehtiyoj && (
            <InfoCard icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} title="Ehtiyoj Aniqlash" color="blue">
              {c.ehtiyoj}
            </InfoCard>
          )}
          {c.yakun && (
            <InfoCard icon={<CheckCircle className="h-4 w-4" />} title="Yakun" color="emerald">{c.yakun}</InfoCard>
          )}
          {c.yaxshi && (
            <InfoCard icon={<ThumbsUp className="h-4 w-4" />} title="Yaxshi Narsalar" color="emerald">{c.yaxshi}</InfoCard>
          )}
          {c.xatolar && (
            <InfoCard icon={<ThumbsDown className="h-4 w-4" />} title="Xatolar" color="red">{c.xatolar}</InfoCard>
          )}
          {c.tavsiya && (
            <InfoCard icon={<Lightbulb className="h-4 w-4" />} title="Tavsiya" color="amber">{c.tavsiya}</InfoCard>
          )}
          {c.dinamika && (
            <InfoCard icon={<Activity className="h-4 w-4" />} title="Suhbat Dinamikasi" color="purple">{c.dinamika}</InfoCard>
          )}
        </div>

        {c.kritik && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 flex gap-3">
            <Zap className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-600 mb-1">Kritik Signal</div>
              <p className="text-sm leading-relaxed">{c.kritik}</p>
            </div>
          </div>
        )}

        {c.transcript && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Transkript</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.transcript}</p>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // VIEW: MANAGER CALLS — таблица с заголовками
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

    const avgScore   = mgrCalls.length ? Math.round(mgrCalls.reduce((s, c) => s + c.score, 0) / mgrCalls.length) : 0;
    const hotLeads   = mgrCalls.filter((c) => c.lidSifati?.toLowerCase() === "issiq").length;
    const salesCount = salesMap[selMgr] ?? 0;

    return (
      <div>
        <BackButton onClick={backToManagers} label="Barcha menejerlar" />

        <Header title={selMgr} subtitle={`${mgrCalls.length} ta zvonok tahlil qilindi`} />
        <PeriodTabs />

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Zvonoklar</div>
            <div className="text-2xl font-bold">{mgrCalls.length}</div>
          </div>
          <div className={cn("rounded-2xl border p-4 text-center", scoreBg(avgScore))}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">O'rtacha ball</div>
            <div className={cn("text-2xl font-bold", scoreColor(avgScore))}>{avgScore || "—"}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Issiq lidlar</div>
            <div className="text-2xl font-bold text-emerald-500">{hotLeads}</div>
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sotuvlar</div>
            <div className="text-2xl font-bold text-blue-500">{salesCount}</div>
          </div>
        </div>

        {mgrCalls.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">Bu davr uchun zvonoklar yo'q</p>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Zvonoklar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun qatorga bosing</p>
            </div>
            {/* Заголовки таблицы */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_110px_90px_36px] gap-4 px-5 py-2.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div>Telefon / Sana</div>
              <div>Lid sifati</div>
              <div>Ehtiyoj</div>
              <div className="text-right">Ball</div>
              <div></div>
            </div>
            <div className="divide-y divide-border">
              {mgrCalls.map((c) => {
                const displayPhone = c.clientPhone || `#${c.callId}`;
                return (
                  <button
                    key={c.callId}
                    onClick={() => openCall(c)}
                    className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition grid grid-cols-[1fr_120px_110px_90px_36px] gap-4 items-center"
                  >
                    {/* Телефон + дата */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{displayPhone}</div>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{formatDate(c.date)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Lid sifati */}
                    <div>
                      {c.lidSifati ? (
                        <span className={cn("text-xs px-2.5 py-1 rounded-full border font-semibold", lidColor(c.lidSifati))}>
                          {c.lidSifati}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    {/* Ehtiyoj */}
                    <div>
                      {c.ehtiyoj ? (
                        <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground font-medium">
                          {c.ehtiyoj}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    {/* Ball */}
                    <div className="text-right">
                      <div className={cn("text-xl font-bold", scoreColor(c.score))}>{c.score || "—"}</div>
                      <div className="text-xs text-muted-foreground">ball</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // VIEW: MANAGERS LIST — таблица с заголовками
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
      avgScore: calls.length ? Math.round(calls.reduce((s, c) => s + c.score, 0) / calls.length) : 0,
      sales: salesMap[name] ?? 0,
    }))
    .sort((a, b) => b.calls.length - a.calls.length);

  return (
    <div>
      <Header title="Sotuv Analizi" subtitle="Menejerlar va zvonoklar tahlili" />
      <PeriodTabs />

      {managerList.length === 0 ? (
        <p className="text-center py-16 text-sm text-muted-foreground">Bu davr uchun ma'lumot yo'q</p>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Menejerlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun qatorga bosing</p>
          </div>
          {/* Заголовки таблицы */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_120px_120px_36px] gap-4 px-5 py-2.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Menejer</div>
            <div className="text-center">Zvonoklar</div>
            <div className="text-center">Sotuvlar</div>
            <div className="text-right">O'rtacha ball</div>
            <div></div>
          </div>
          <div className="divide-y divide-border">
            {managerList.map((m) => (
              <button
                key={m.name}
                onClick={() => openManager(m.name)}
                className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition grid grid-cols-[1fr_100px_120px_120px_36px] gap-4 items-center"
              >
                {/* Мэнэджер */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white text-sm shrink-0",
                    avatarColor(m.name)
                  )}>
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.name}</div>
                  </div>
                </div>

                {/* Звонки */}
                <div className="text-center">
                  <div className="text-lg font-bold">{m.calls.length}</div>
                  <div className="text-xs text-muted-foreground">zvonok</div>
                </div>

                {/* Продажи */}
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center text-blue-500">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span className="text-lg font-bold">{m.sales}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">sotuv</div>
                </div>

                {/* Средний балл */}
                <div className="text-right">
                  <div className={cn("text-lg font-bold", scoreColor(m.avgScore))}>{m.avgScore || "—"}</div>
                  <div className="text-xs text-muted-foreground">ball</div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
