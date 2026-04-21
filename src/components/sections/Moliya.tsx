import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Wallet, TrendingDown, TrendingUp, PiggyBank, Loader2, AlertCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SHEET_ID = "1bLel0b3ULXWJ71Tgn_ynl5fvBrDIMZXo-CzeV9lnE3k";
const SHEET_NAME = "moliya";
const API_KEY = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const UZ_MONTHS = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
const EXPENSE_COLORS = ["hsl(222 47% 11%)","hsl(220 9% 46%)","hsl(230 70% 55%)","hsl(38 92% 50%)","hsl(220 13% 78%)"];

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("ru-RU") + " so'm";

function parseSumma(raw: string): number {
  const str = raw.trim();
  const isNegative = str.startsWith("-");
  // убираем минус, "p.", все пробелы, потом запятую → точка
  const cleaned = str
    .replace("-", "")
    .replace(/p\./i, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned) || 0;
  return isNegative ? -num : num;
}

interface Row { sana: string; ism: string; filial: string; turi: string; summa: number; kategoriya: string; izoh: string; }

export function Moliya() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`)
      .then((res) => { if (!res.ok) throw new Error(`API xatosi: ${res.status}`); return res.json(); })
      .then((data) => {
        const [, ...dataRows] = data.values as string[][];
        const parsed = dataRows
          .filter((r) => r.length >= 5 && r[0] && r[4])
          .map((r) => ({
            sana: r[0] ?? "", ism: r[1] ?? "", filial: r[2] ?? "", turi: r[3] ?? "",
            summa: parseSumma(r[4]),
            kategoriya: r[5] ?? "", izoh: r[6] ?? "",
          }));
        console.log("Parsed rows:", parsed); // для отладки
        setRows(parsed);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span></div>;
  if (error) return <div className="flex items-center justify-center h-64 gap-3 text-danger"><AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span></div>;

  const totalRevenue = rows.filter((r) => r.summa > 0).reduce((s, r) => s + r.summa, 0);
  const totalExpenses = rows.filter((r) => r.summa < 0).reduce((s, r) => s + Math.abs(r.summa), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const monthMap: Record<string, { revenue: number; expenses: number }> = {};
  rows.forEach((r) => {
    const parts = r.sana.split(".");
    if (parts.length < 2) return;
    const key = UZ_MONTHS[parseInt(parts[1], 10) - 1] ?? r.sana;
    if (!monthMap[key]) monthMap[key] = { revenue: 0, expenses: 0 };
    if (r.summa > 0) monthMap[key].revenue += r.summa;
    else monthMap[key].expenses += Math.abs(r.summa);
  });

  const chartData = Object.entries(monthMap).map(([month, v]) => ({
    month,
    "Daromad": Math.round(v.revenue / 1_000_000),
    "Foyda": Math.round((v.revenue - v.expenses) / 1_000_000),
  }));

  const filialMap: Record<string, number> = {};
  rows.filter((r) => r.summa < 0).forEach((r) => {
    const k = r.filial || "Boshqa";
    filialMap[k] = (filialMap[k] ?? 0) + Math.abs(r.summa);
  });
  const totalExp = Object.values(filialMap).reduce((a, b) => a + b, 0) || 1;
  const expenseBreakdown = Object.entries(filialMap).map(([name, val], i) => ({
    name, value: Math.round((val / totalExp) * 100), color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  return (
    <div>
      <Header title="Moliya" subtitle="Daromad, xarajat va foyda tahlili" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Jami daromad" value={fmt(totalRevenue)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Jami xarajat" value={fmt(totalExpenses)} icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Sof foyda" value={fmt(totalProfit)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Marja" value={`${margin}%`} icon={<PiggyBank className="h-4 w-4" />} />
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
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
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
        <h3 className="font-semibold mb-4">So'nggi tranzaksiyalar</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="pb-3 font-medium">Sana</th><th className="pb-3 font-medium">Ism</th><th className="pb-3 font-medium">Filial</th><th className="pb-3 font-medium">Turi</th><th className="pb-3 font-medium text-right">Summa</th><th className="pb-3 font-medium">Kategoriya</th><th className="pb-3 font-medium">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...rows].reverse().slice(0, 20).map((r, i) => (
                <tr key={i}>
                  <td className="py-3 num text-muted-foreground">{r.sana}</td>
                  <td className="py-3 font-medium">{r.ism}</td>
                  <td className="py-3 text-muted-foreground">{r.filial}</td>
                  <td className="py-3 text-muted-foreground">{r.turi}</td>
                  <td className={`py-3 text-right num font-semibold ${r.summa >= 0 ? "text-success" : "text-danger"}`}>
                    {r.summa >= 0 ? "+" : "-"}{fmt(Math.abs(r.summa))}
                  </td>
                  <td className="py-3">{r.kategoriya || "—"}</td>
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
