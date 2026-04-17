import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { financeMonthly, expenseBreakdown } from "@/data/mock";
import { Wallet, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const fmt = (n: number) => `${n} mln`;

export function Moliya() {
  const last = financeMonthly[financeMonthly.length - 1];
  const prev = financeMonthly[financeMonthly.length - 2];
  const margin = ((last.profit / last.revenue) * 100).toFixed(1);

  return (
    <div>
      <Header title="Moliya" subtitle="Daromad, xarajat va foyda tahlili" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Oylik daromad" value={fmt(last.revenue) + " so'm"} delta={((last.revenue - prev.revenue) / prev.revenue) * 100} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Xarajatlar" value={fmt(last.expenses) + " so'm"} delta={((last.expenses - prev.expenses) / prev.expenses) * 100} icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Sof foyda" value={fmt(last.profit) + " so'm"} delta={((last.profit - prev.profit) / prev.profit) * 100} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Marja" value={`${margin}%`} delta={2.4} icon={<PiggyBank className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-soft">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Daromad va foyda</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Oylik dinamika · mln so'm</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary"/>Daromad</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand"/>Foyda</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={financeMonthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
              <Area type="monotone" dataKey="profit" stroke="hsl(var(--brand))" strokeWidth={2.5} fill="url(#prof)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold">Xarajatlar tarkibi</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Avgust oyi</p>
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
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />
                  {e.name}
                </span>
                <span className="num font-medium">{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
        <h3 className="font-semibold mb-4">Oylik hisobot</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="pb-3 font-medium">Oy</th>
                <th className="pb-3 font-medium text-right">Daromad</th>
                <th className="pb-3 font-medium text-right">Xarajat</th>
                <th className="pb-3 font-medium text-right">Foyda</th>
                <th className="pb-3 font-medium text-right">Marja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {financeMonthly.slice().reverse().map((r) => (
                <tr key={r.month}>
                  <td className="py-3 font-medium">{r.month}</td>
                  <td className="py-3 text-right num">{r.revenue} mln</td>
                  <td className="py-3 text-right num text-muted-foreground">{r.expenses} mln</td>
                  <td className="py-3 text-right num font-semibold">{r.profit} mln</td>
                  <td className="py-3 text-right num">{((r.profit / r.revenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
