import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingDown, TrendingUp, PiggyBank, Loader2, AlertCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const SHEET_ID = "1bLel0b3ULXWJ71Tgn_ynl5fvBrDIMZXo-CzeV9lnE3k";
const SHEET_NAME = "moliya";
const API_KEY = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const UZ_MONTHS = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
const EXPENSE_COLORS = ["hsl(222 47% 11%)","hsl(220 9% 46%)","hsl(230 70% 55%)","hsl(38 92% 50%)","hsl(220 13% 78%)"];

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("ru-RU") + " so'm";
const fmtShort = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + " mln";
  if (abs >= 1_000) return Math.round(n / 1_000) + " ming";
  return Math.round(n) + "";
};

function parseSumma(raw: string): number {
  const str = raw.trim();
  const isNegative = str.includes("-");
  const cleaned = str.replace(/-/g, "").replace(/[^\d\s,]/g, "").replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned) || 0;
  return isNegative ? -num : num;
}

function parseDate(sana: string): Date | null {
  const parts = sana.split(".");
  if (parts.length < 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

type Period = "kun" | "hafta" | "oy" | "barchasi";
interface Row { sana: string; ism: string; filial: string; turi: string; summa: number; kirimChiqim: string; izoh: string; }

export function Moliya() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("barchasi");

  useEffect(() => {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`)
      .then((res) => { if (!res.ok) throw new Error(`API xatosi: ${res.status}`); return res.json(); })
      .then((data) => {
        const [, ...dataRows] = data.values as string[][];
        setRows(dataRows.filter((r) => r.length >= 6 && r[0] && r[5]).map((r) => ({
          sana: r[0] ?? "", ism: r[1] ?? "", filial: r[2] ?? "", turi: r[4] ?? "",
          summa: parseSumma(r[5]), kirimChiqim: r[6] ?? "", izoh: r[7] ?? "",
        })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span></div>;
  if (error) return <div className="flex items-center justify-center h-64 gap-3 text-danger"><AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span></div>;

  const now = new Date();
  const filtered = rows.filter((r) => {
    if (period === "barchasi") return true;
    const d = parseDate(r.sana);
    if (!d) return false;
    if (period === "kun") return d.toDateString() === now.toDateString();
    if (period === "hafta") return (now.getTime() - d.getTime()) / (1000*60*60*24) >= 0 && (now.getTime() - d.getTime()) / (1000*60*60*24) < 7;
    if (period === "oy") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalRevenue = filtered.filter((r) => r.summa > 0).reduce((s, r) => s + r.summa, 0);
  const totalExpenses = filtered.filter((r) => r.summa < 0).reduce((s, r) => s + Math.abs(r.summa), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const novzaRevenue = filtered.filter((r) => r.summa > 0 && r.filial === "Novza").reduce((s, r) => s + r.summa, 0);
  const yunusobodRevenue = filtered.filter((r) => r.summa > 0 && r.filial === "Yunusobod").reduce((s, r) => s + r.summa, 0);
  const novzaExpenses = filtered.filter((r) => r.summa < 0 && r.filial === "Novza").reduce((s, r) => s + Math.abs(r.summa), 0);
  const yunusobodExpenses = filtered.filter((r) => r.summa < 0 && r.filial === "Yunusobod").reduce((s, r) => s + Math.abs(r.summa), 0);
  const novzaProfit = novzaRevenue - novzaExpenses;
  const yunusobodProfit = yunusobodRevenue - yunusobodExpenses;

  const monthMap: Record<string, { revenue: number; expenses: number }> = {};
  filtered.forEach((r) => {
    const parts = r.sana.split(".");
    if (parts.length < 2) return;
    const key = UZ_MONTHS[parseInt(parts[1], 10) - 1] ?? r.sana;
    if (!monthMap[key]) monthMap[key] = { revenue: 0, expenses: 0 };
    if (r.summa > 0) monthMap[key].revenue += r.summa;
    else monthMap[key].expenses += Math.abs(r.summa);
  });

  const chartData = Object.entries(monthMap).map(([month, v]) => ({
    month, "Daromad": Math.round(v.revenue / 1_000_000), "Foyda": Math.round((v.revenue - v.expenses) / 1_000_000),
  }));

  const filialMap: Record<string, number> = {};
  filtered.filter((r) => r.summa < 0).forEach((r) => {
    const k = r.filial || "Boshqa";
    filialMap[k] = (filialMap[k] ?? 0) + Math.abs(r.summa);
  });
  const totalExp = Object.values(filialMap).reduce((a, b) => a + b, 0) || 1;
  const expenseBreakdown = Object.entries(filialMap).map(([name, val], i) => ({
    name, value: Math.round((val / totalExp) * 100), color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  const periods: { id: Period; label: string }[] = [
    { id: "kun", label: "Bugun" },
    { id: "hafta", label: "Hafta" },
    { id: "oy", label: "Oy" },
    { id: "barchasi", label: "Barchasi" },
  ];

  return (
    <div>
      <Header title="Moliya" subtitle="Daromad, xarajat va foyda tahlili" />

      <div className="flex gap-2 mb-6">
        {periods.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
              period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Строка 1 — общая статистика с цветами */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="rounded-2xl p-5 shadow-soft border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-emerald-700 font-medium">Jami daromad</span>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><Wallet className="h-4 w-4 text-emerald-600" /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-900 num">{fmt(totalRevenue)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-red-100 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-red-700 font-medium">Jami xarajat</span>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-red-900 num">{fmt(totalExpenses)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-blue-700 font-medium">Sof foyda</span>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-blue-900 num">{fmt(totalProfit)}</p>
          <p className="text-xs text-blue-600 mt-1">Novza: {fmtShort(novzaProfit)}  |  Yunusobod: {fmtShort(yunusobodProfit)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-purple-700 font-medium">Marja</span>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><PiggyBank className="h-4 w-4 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-purple-900 num">{margin}%</p>
        </div>
      </div>

      {/* Строка 2 — по филиалам */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="rounded-2xl p-5 shadow-soft border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-emerald-700 font-medium">Novza — Daromad</span>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
          </div>
          <p className="text-xl font-bold text-emerald-900 num">{fmt(novzaRevenue)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-emerald-700 font-medium">Yunusobod — Daromad</span>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
          </div>
          <p className="text-xl font-bold text-emerald-900 num">{fmt(yunusobodRevenue)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-red-100 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-red-700 font-medium">Novza — Xarajat</span>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-red-600" /></div>
          </div>
          <p className="text-xl font-bold text-red-900 num">{fmt(novzaExpenses)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-red-100 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-red-700 font-medium">Yunusobod — Xarajat</span>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-red-600" /></div>
          </div>
          <p className="text-xl font-bold text-red-900 num">{fmt(yunusobodExpenses)}</p>
        </div>
      </div>

      {/* Строка 3 — широкие карточки прибыли по филиалам */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-5 shadow-soft border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-700 font-medium mb-1">Novza — Sof foyda</p>
          <p className="text-2xl font-bold text-blue-900 num">{fmt(novzaProfit)}</p>
          <div className="flex gap-6 mt-3 text-xs text-blue-600">
            <span>Daromad: <span className="font-semibold">{fmt(novzaRevenue)}</span></span>
            <span>Xarajat: <span className="font-semibold">{fmt(novzaExpenses)}</span></span>
          </div>
        </div>
        <div className="rounded-2xl p-5 shadow-soft border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-700 font-medium mb-1">Yunusobod — Sof foyda</p>
          <p className="text-2xl font-bold text-blue-900 num">{fmt(yunusobodProfit)}</p>
          <div className="flex gap-6 mt-3 text-xs text-blue-600">
            <span>Daromad: <span className="font-semibold">{fmt(yunusobodRevenue)}</span></span>
            <span>Xarajat: <span className="font-semibold">{fmt(yunusobodExpenses)}</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div><h3 className="font-semibold">Daromad va foyda</h3><p className="text-xs text-muted-foreground mt-0.5">Oylik dinamika · mln so'm</p></div>
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Daromad</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" />Foyda</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.22} /><stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(val) => [`${val} mln`, ""]} />
              <Area type="monotone" dataKey="Daromad" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
              <Area type="monotone" dataKey="Foyda" stroke="hsl(var(--brand))" strokeWidth={2.5} fill="url(#prof)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold">Xarajatlar tarkibi</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Filiallar bo'yicha</p>
          {expenseBreakdown.length === 0 ? <p className="text-sm text-muted-foreground">Xarajatlar yo'q</p> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {expenseBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(val) => [`${val}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {expenseBreakdown.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />{e.name}</span>
                    <span className="num font-medium">{e.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Tranzaksiyalar ({filtered.length})</h3>
          <span className="text-xs text-muted-foreground">{period === "barchasi" ? "Barchasi" : period === "kun" ? "Bugun" : period === "hafta" ? "Hafta" : "Oy"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="pb-3 font-medium">Sana</th>
                <th className="pb-3 font-medium">Ism</th>
                <th className="pb-3 font-medium">Filial</th>
                <th className="pb-3 font-medium">Turi</th>
                <th className="pb-3 font-medium text-right">Summa</th>
                <th className="pb-3 font-medium">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...filtered].reverse().map((r, i) => (
                <tr key={i} className="hover:bg-secondary/60 transition">
                  <td className="py-3 num text-muted-foreground">{r.sana}</td>
                  <td className="py-3 font-medium">{r.ism}</td>
                  <td className="py-3 text-muted-foreground">{r.filial}</td>
                  <td className="py-3 text-muted-foreground">{r.turi}</td>
                  <td className={`py-3 text-right num font-semibold ${r.summa >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {r.summa >= 0 ? "+" : "-"}{fmt(Math.abs(r.summa))}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.izoh || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
