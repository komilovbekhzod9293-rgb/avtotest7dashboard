import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { managers } from "@/data/mock";
import { Phone, TrendingUp, Target, Wallet, ArrowUpRight, ArrowDownRight, ArrowLeft, MessageSquare } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const fmtMoney = (n: number) => new Intl.NumberFormat("uz-UZ").format(n) + " so'm";

export function SotuvAnalizi() {
  const [selected, setSelected] = useState<string | null>(null);
  const manager = managers.find((m) => m.id === selected);

  if (manager) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Barcha menejerlar
        </button>
        <Header title={manager.name} subtitle={`${manager.role} · kunlik tahlil`} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Qo'ng'iroqlar" value={String(manager.calls)} delta={manager.delta} icon={<Phone className="h-4 w-4" />} />
          <StatCard label="Sotuvlar" value={String(manager.sales)} delta={manager.delta} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="Reja" value={`${manager.sales}/${manager.target}`} hint={`${Math.round((manager.sales/manager.target)*100)}% bajarildi`} icon={<Target className="h-4 w-4" />} />
          <StatCard label="Daromad" value={fmtMoney(manager.revenue)} delta={manager.delta} icon={<Wallet className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Haftalik faollik</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Qo'ng'iroqlar va sotuvlar</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={manager.weekly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--secondary))" }}
                />
                <Bar dataKey="calls" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} name="Qo'ng'iroqlar" />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Sotuvlar" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">AI eslatmalar</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Qo'ng'iroqlardan avtomatik tahlil</p>
            <div className="space-y-3">
              {manager.notes.map((n, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <span className="text-xs num text-muted-foreground shrink-0 w-12 pt-0.5">{n.time}</span>
                  <p className="text-sm text-foreground leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalCalls = managers.reduce((s, m) => s + m.calls, 0);
  const totalSales = managers.reduce((s, m) => s + m.sales, 0);
  const totalRevenue = managers.reduce((s, m) => s + m.revenue, 0);
  const conversion = ((totalSales / totalCalls) * 100).toFixed(1);

  return (
    <div>
      <Header title="Sotuv Analizi" subtitle="Menejerlar samaradorligi va qo'ng'iroqlar tahlili" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Jami qo'ng'iroqlar" value={String(totalCalls)} delta={8.2} icon={<Phone className="h-4 w-4" />} />
        <StatCard label="Jami sotuvlar" value={String(totalSales)} delta={5.4} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Konversiya" value={`${conversion}%`} delta={1.8} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Umumiy daromad" value={fmtMoney(totalRevenue)} delta={9.1} icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Menejerlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun bosing</p>
          </div>
          <span className="text-xs text-muted-foreground">Bugun</span>
        </div>
        <div className="divide-y divide-border">
          {managers.map((m) => {
            const completion = Math.round((m.sales / m.target) * 100);
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition group flex items-center gap-4"
              >
                <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.role}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full max-w-md bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", completion >= 80 ? "bg-success" : completion >= 60 ? "bg-warning" : "bg-danger")}
                      style={{ width: `${Math.min(100, completion)}%` }}
                    />
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-8 num">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Qo'ng'iroq</div>
                    <div className="font-semibold">{m.calls}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Sotuv</div>
                    <div className="font-semibold">{m.sales}</div>
                  </div>
                  <div className="text-right w-20">
                    <div className="text-xs text-muted-foreground">O'zgarish</div>
                    <div className={cn("font-semibold inline-flex items-center gap-0.5", m.trend === "up" ? "text-success" : "text-danger")}>
                      {m.trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {Math.abs(m.delta)}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 bg-card rounded-2xl border border-border p-5 shadow-soft">
        <h3 className="font-semibold mb-1">Haftalik sotuv dinamikasi</h3>
        <p className="text-xs text-muted-foreground mb-4">Barcha menejerlar bo'yicha umumiy</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={managers[0].weekly.map((d, i) => ({
            day: d.day,
            sales: managers.reduce((s, m) => s + m.weekly[i].sales, 0),
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="sales" stroke="hsl(var(--brand))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--brand))" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
