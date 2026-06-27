import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const SHEET_ID  = "1bLel0b3ULXWJ71Tgn_ynl5fvBrDIMZXo-CzeV9lnE3k";
const SHEET_NAME = "moliya";
const API_KEY   = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";

const CHIQIM_COLORS: Record<string, string> = {
  "Marketing":                    "hsl(230 70% 55%)",
  "AI harajatlari":               "hsl(270 60% 55%)",
  "Oylik":                        "hsl(142 60% 45%)",
  "Soliq":                        "hsl(38 92% 50%)",
  "Arenda Novza":                 "hsl(200 70% 50%)",
  "Arenda Yunusobod":             "hsl(190 60% 40%)",
  "Ofis harajat":                 "hsl(160 50% 45%)",
  "KPI":                          "hsl(25 85% 55%)",
  "Bonus":                        "hsl(340 70% 55%)",
  "Pul qaytildi":                 "hsl(0 70% 55%)",
  "Foyda":                        "hsl(95 55% 45%)",
  "Mavsumiy sherik doniyor aka":  "hsl(30 60% 35%)",
  "Ehson/Xayriya":                "hsl(0 0% 55%)",
  "Mavsumiy sherik Ikrom aka":    "hsl(150 55% 30%)",
  "Invest Texnika":               "hsl(265 50% 40%)",
  "Invest ai":                    "hsl(220 15% 25%)",
  "Invest Remont":                "hsl(45 80% 55%)",
  "Boshqa":                       "hsl(220 9% 60%)",
};

const KIRIM_COLORS: Record<string, string> = {
  "Online":     "hsl(230 70% 55%)",
  "Ofline":     "hsl(160 50% 45%)",
  "Individual": "hsl(270 60% 55%)",
  "Rus tili":   "hsl(0 70% 55%)",
  "Kirim":      "hsl(142 60% 45%)",
  "Boshqa":     "hsl(220 9% 60%)",
};

const TURI_COLORS: Record<string, string> = {
  "Naqd":   "hsl(38 92% 50%)",
  "Karta":  "hsl(230 70% 55%)",
  "Boshqa": "hsl(220 9% 60%)",
};

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("ru-RU") + " so'm";

function parseDate(sana: string): Date | null {
  const parts = sana.trim().split(".");
  if (parts.length < 3) return null;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(d.getTime())) return null;
  return d;
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function defaultFrom(): string {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

function defaultTo(): string {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

interface Row {
  sana:         string;
  filial:       string;
  summa:        number;
  kirimChiqim:  string;
  chiqimTuri:   string;
  onlineOfline: string;
  turi:         string;
}

function parseSumma(raw: string): number {
  const str = raw.trim();
  const isNeg = str.includes("-");
  const cleaned = str.replace(/-/g, "").replace(/[^\d\s,]/g, "").replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned) || 0;
  return isNeg ? -num : num;
}

type View = "chiqim" | "kirim";

interface BreakdownProps {
  groupId:        string;
  title:          string;
  totalLabel:     string;
  rows:           Row[];
  groupKey:       (r: Row) => string;
  colors:         Record<string, string>;
  positive:       boolean;
  filial:         string;
  expanded:       string | null;
  onToggleExpand: (key: string | null) => void;
}

function Breakdown({ groupId, title, totalLabel, rows, groupKey, colors, positive, filial, expanded, onToggleExpand }: BreakdownProps) {
  const grouped: Record<string, number> = {};
  rows.forEach(r => {
    const key = groupKey(r) || "Boshqa";
    grouped[key] = (grouped[key] ?? 0) + Math.abs(r.summa);
  });

  const total = Object.values(grouped).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const pieData = sorted.map(([name, value]) => ({ name, value, color: colors[name] ?? colors["Boshqa"] }));

  const signClass   = positive ? "text-green-600" : "text-red-500";
  const totalCardCls = positive ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5";
  const totalTextCls = positive ? "text-green-700" : "text-red-700";
  const totalAmtCls   = positive ? "text-green-600" : "text-red-600";
  const totalSubCls   = positive ? "text-green-500" : "text-red-500";
  const sign = positive ? "+" : "-";

  if (sorted.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm mb-8">
        Bu davr uchun {title.toLowerCase()} uchun ma'lumot yo'q
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>

      <div className={cn("bg-card rounded-2xl border p-5 mb-6", totalCardCls)}>
        <p className={cn("text-sm font-medium mb-1", totalTextCls)}>{totalLabel}</p>
        <p className={cn("text-3xl font-bold", totalAmtCls)}>{fmt(total)}</p>
        <p className={cn("text-xs mt-1", totalSubCls)}>{sorted.length} ta kategoriya · {rows.length} ta tranzaksiya</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Kategoriyalar bo'yicha</h3>
          </div>
          <div className="divide-y divide-border">
            {sorted.map(([name, summa]) => {
              const pct = total > 0 ? (summa / total * 100).toFixed(1) : "0";
              const color = colors[name] ?? colors["Boshqa"];
              const expandKey = `${groupId}:${name}`;
              const isOpen = expanded === expandKey;
              const categoryRows = rows
                .filter(r => (groupKey(r) || "Boshqa") === name)
                .sort((a, b) => (parseDate(a.sana)?.getTime() ?? 0) - (parseDate(b.sana)?.getTime() ?? 0));
              return (
                <div key={name}>
                  <button
                    onClick={() => onToggleExpand(isOpen ? null : expandKey)}
                    className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-secondary/40 transition"
                  >
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="text-xs font-semibold mt-1" style={{ color }}>{fmt(summa)}</div>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="bg-secondary/30 px-5 py-3">
                      <p className="text-xs text-muted-foreground mb-2">{name} — {categoryRows.length} ta tranzaksiya, qanday hisoblangani:</p>
                      <div className="space-y-1">
                        {categoryRows.map((r, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{r.sana}{filial === "Barchasi" ? ` · ${r.filial}` : ""}</span>
                            <span className="font-medium">{fmt(r.summa)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold mt-2 pt-2 border-t border-border">
                        <span>Jami</span>
                        <span style={{ color }}>{fmt(summa)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4">Taqsimot</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(val: number) => [fmt(val), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                <span className="truncate text-muted-foreground">{e.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Batafsil jadval</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                <th className="px-4 py-3 font-medium">Kategoriya</th>
                <th className="px-4 py-3 font-medium text-right">Summa</th>
                <th className="px-4 py-3 font-medium text-right">Ulushi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(([name, summa]) => {
                const pct = total > 0 ? (summa / total * 100).toFixed(1) : "0";
                const color = colors[name] ?? colors["Boshqa"];
                return (
                  <tr key={name} className="hover:bg-secondary/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                        <span className="font-medium">{name}</span>
                      </div>
                    </td>
                    <td className={cn("px-4 py-3 text-right font-semibold", signClass)}>{sign}{fmt(summa)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{pct}%</td>
                  </tr>
                );
              })}
              <tr className="bg-secondary/50 font-semibold">
                <td className="px-4 py-3">Jami</td>
                <td className={cn("px-4 py-3 text-right", totalAmtCls)}>{sign}{fmt(total)}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function MoliyaChiqim() {
  const [rows,     setRows]     = useState<Row[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [from,     setFrom]     = useState(defaultFrom());
  const [to,       setTo]       = useState(defaultTo());
  const [filial,   setFilial]   = useState("Barchasi");
  const [view,     setView]     = useState<View>("chiqim");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`)
      .then(r => { if (!r.ok) throw new Error(`API xatosi: ${r.status}`); return r.json(); })
      .then(data => {
        const all: string[][] = data.values ?? [];
        const parsed: Row[] = all.slice(1)
          .filter(r => r[0] && r[5])
          .map(r => ({
            sana:         r[0] ?? "",
            filial:       r[2] ?? "",
            summa:        parseSumma(r[5] ?? ""),
            kirimChiqim:  (r[6] ?? "").trim(),
            chiqimTuri:   (r[8] ?? "").trim() || "Boshqa",
            onlineOfline: (r[3] ?? "").trim() || "Boshqa",
            turi:         (r[4] ?? "").trim() || "Boshqa",
          }));
        setRows(parsed);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 gap-3 text-red-500">
      <AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span>
    </div>
  );

  const fromDate = inputToDate(from);
  const toDate   = inputToDate(to);

  const baseFiltered = rows.filter(r => {
    const d = parseDate(r.sana);
    if (!d) return false;
    if (fromDate && d < fromDate) return false;
    if (toDate   && d >= toDate)  return false;
    if (filial !== "Barchasi" && r.filial !== filial) return false;
    return true;
  });

  const isChiqim = view === "chiqim";

  const filtered = isChiqim
    ? baseFiltered.filter(r => r.kirimChiqim.toLowerCase().includes("chiq") && r.summa < 0)
    : baseFiltered.filter(r => r.kirimChiqim.toLowerCase().includes("kirim") && r.summa > 0);

  return (
    <div>
      <Header title="Moliya Analizi" subtitle="Kirim / Chiqim" />

      {/* Tab almashtirish */}
      <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium mb-4 w-fit">
        {([
          ["chiqim", "Chiqim analizi"],
          ["kirim",  "Kirim analizi"],
        ] as [View, string][]).map(([id, label]) => (
          <button key={id} onClick={() => { setView(id); setExpanded(null); }}
            className={cn("px-4 py-2 transition border-r border-border last:border-0",
              view === id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {/* Фильтры */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dan</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Gacha</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
              {["Barchasi", "Novza", "Yunusobod"].map(f => (
                <button key={f} onClick={() => setFilial(f)}
                  className={cn("flex-1 py-2 px-2 transition border-r border-border last:border-0 text-xs",
                    filial === f ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center text-muted-foreground text-sm">
          {isChiqim ? "Bu davr uchun chiqimlar yo'q" : "Bu davr uchun kirimlar yo'q"}
        </div>
      ) : isChiqim ? (
        <Breakdown
          groupId="chiqim-turi"
          title="Chiqim turi bo'yicha"
          totalLabel="Jami chiqim"
          rows={filtered}
          groupKey={r => r.chiqimTuri}
          colors={CHIQIM_COLORS}
          positive={false}
          filial={filial}
          expanded={expanded}
          onToggleExpand={setExpanded}
        />
      ) : (
        <>
          <Breakdown
            groupId="kirim-kategoriya"
            title="Kirim kategoriyasi bo'yicha (Online/Ofline/Rus tili/Individual/Kirim)"
            totalLabel="Jami kirim"
            rows={filtered}
            groupKey={r => r.onlineOfline}
            colors={KIRIM_COLORS}
            positive={true}
            filial={filial}
            expanded={expanded}
            onToggleExpand={setExpanded}
          />
          <Breakdown
            groupId="kirim-turi"
            title="To'lov turi bo'yicha (Naqd/Karta)"
            totalLabel="Jami kirim"
            rows={filtered}
            groupKey={r => r.turi}
            colors={TURI_COLORS}
            positive={true}
            filial={filial}
            expanded={expanded}
            onToggleExpand={setExpanded}
          />
        </>
      )}
    </div>
  );
}
