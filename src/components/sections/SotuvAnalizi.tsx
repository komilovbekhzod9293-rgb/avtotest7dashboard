import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { managers as mockManagers } from "@/data/mock";
import {
  Phone, TrendingUp, Target, Wallet,
  ArrowUpRight, ArrowDownRight, ArrowLeft,
  MessageSquare, Loader2, AlertCircle
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";

// ─── Google Sheets config ───────────────────────────────────────────────────
const SHEET_ID = "1StqPMbH2IWX_722F9MVp92gKOGitlTuUBVYrtZ7GUvI";
const API_KEY  = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const RANGE    = "Лист1!A:P";

// ─── Types ──────────────────────────────────────────────────────────────────
type Period = "bugun" | "hafta" | "oy" | "barchasi";

interface SaleRow {
  hodim: string;      // колонка P (индекс 15)
  tolovKuni: string;  // колонка F (индекс 5)
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // формат "20.04.2026"
  const parts = raw.trim().split(".");
  if (parts.length === 3) {
    return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  }
  return null;
}

function filterByPeriod(rows: SaleRow[], period: Period): SaleRow[] {
  if (period === "barchasi") return rows;
  const now = new Date();
  return rows.filter((r) => {
    const d = parseDate(r.tolovKuni);
    if (!d) return false;
    if (period === "bugun") return d.toDateString() === now.toDateString();
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

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(n) + " so'm";

// ─── Component ──────────────────────────────────────────────────────────────
export function SotuvAnalizi() {
  const [rows, setRows]       = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [period, setPeriod]   = useState<Period>("barchasi");
  const [selected, setSelected] = useState<string | null>(null);

  // Загрузка из Google Sheets
  useEffect(() => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`API xatosi: ${r.status}`); return r.json(); })
      .then((data) => {
        const all: string[][] = data.values || [];
        // первая строка — заголовки
        const parsed: SaleRow[] = all.slice(1)
          .filter((row) => row[15]) // должна быть колонка P (Hodim)
          .map((row) => ({
            hodim:     (row[15] ?? "").trim(),
            tolovKuni: (row[5]  ?? "").trim(), // колонка F
          }))
          .filter((r) => r.hodim !== "");
        setRows(parsed);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Фильтруем по периоду
  const filtered = filterByPeriod(rows, period);

  // Считаем продажи по каждому менеджеру
  const salesByManager: Record<string, number> = {};
  filtered.forEach((r) => {
    salesByManager[r.hodim] = (salesByManager[r.hodim] ?? 0) + 1;
  });

  // Список менеджеров из реальных данных, сортировка по продажам
  const managerList = Object.entries(salesByManager)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales);

  const totalSales = filtered.length;
  const maxSales   = managerList[0]?.sales || 1;

  const periods: { id: Period; label: string }[] = [
    { id: "bugun",    label: "Bugun"    },
    { id: "hafta",    label: "Hafta"    },
    { id: "oy",       label: "Oy"       },
    { id: "barchasi", label: "Barchasi" },
  ];

  // ── Детальный вид менеджера (из mock — оставляем как есть) ───────────────
  const mockManager = mockManagers.find((m) => m.name === selected);
  if (selected && mockManager) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Barcha menejerlar
        </button>
        <Header title={mockManager.name} subtitle={`${mockManager.role} · kunlik tahlil`} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Qo'ng'iroqlar" value={String(mockManager.calls)} delta={mockManager.delta} icon={<Phone className="h-4 w-4" />} />
          <StatCard label="Sotuvlar" value={String(salesByManager[mockManager.name] ?? mockManager.sales)} delta={mockManager.delta} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="Reja" value={`${mockManager.sales}/${mockManager.target}`} hint={`${Math.round((mockManager.sales / mockManager.target) * 100)}% bajarildi`} icon={<Target className="h-4 w-4" />} />
          <StatCard label="Daromad" value={fmtMoney(mockManager.revenue)} delta={mockManager.delta} icon={<Wallet className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-soft">
            <h3 className="font-semibold mb-1">Haftalik faollik</h3>
            <p className="text-xs text-muted-foreground mb-4">Qo'ng'iroqlar va sotuvlar</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockManager.weekly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "hsl(var(--secondary))" }} />
                <Bar dataKey="calls" fill="hsl(var(--muted-foreground))" radius={[6,6,0,0]} name="Qo'ng'iroqlar" />
                <Bar dataKey="sales" fill="hsl(var(--primary))"          radius={[6,6,0,0]} name="Sotuvlar" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">AI eslatmalar</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Qo'ng'iroqlardan avtomatik tahlil</p>
            <div className="space-y-3">
              {mockManager.notes.map((n, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <span className="text-xs text-muted-foreground shrink-0 w-12 pt-0.5">{n.time}</span>
                  <p className="text-sm leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Главный экран ────────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="Sotuv Analizi"
        subtitle="Menejerlar samaradorligi va qo'ng'iroqlar tahlili"
      />

      {/* Фильтр периода — точно как в Moliya */}
      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map((p) => (
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Jami sotuvlar"
          value={loading ? "…" : String(totalSales)}
          delta={5.4}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Faol menejerlar"
          value={loading ? "…" : String(managerList.length)}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="O'rtacha sotuv"
          value={loading ? "…" : managerList.length
            ? String(Math.round(totalSales / managerList.length))
            : "0"}
          icon={<Phone className="h-4 w-4" />}
        />
      </div>

      {/* Список менеджеров */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Menejerlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Batafsil ko'rish uchun bosing</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {period === "bugun" ? "Bugun" : period === "hafta" ? "Hafta" : period === "oy" ? "Oy" : "Barchasi"}
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center gap-3 py-16 text-red-500">
            <AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span>
          </div>
        )}
        {!loading && !error && managerList.length === 0 && (
          <p className="text-center py-16 text-sm text-muted-foreground">
            Bu davr uchun ma'lumot yo'q
          </p>
        )}

        {!loading && !error && (
          <div className="divide-y divide-border">
            {managerList.map((m) => {
              const completion = Math.round((m.sales / maxSales) * 100);
              const mock = mockManagers.find((mm) => mm.name === m.name);
              return (
                <button
                  key={m.name}
                  onClick={() => setSelected(m.name)}
                  className="w-full text-left px-5 py-4 hover:bg-secondary/60 transition flex items-center gap-4"
                >
                  <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {mock && (
                        <span className="text-xs text-muted-foreground">{mock.role}</span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 w-full max-w-md bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          completion >= 80 ? "bg-success" : completion >= 50 ? "bg-warning" : "bg-danger"
                        )}
                        style={{ width: `${Math.min(100, completion)}%` }}
                      />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Sotuv</div>
                      <div className="font-semibold">{m.sales}</div>
                    </div>
                    {mock && (
                      <div className="text-right w-20">
                        <div className="text-xs text-muted-foreground">O'zgarish</div>
                        <div className={cn("font-semibold inline-flex items-center gap-0.5", mock.trend === "up" ? "text-success" : "text-danger")}>
                          {mock.trend === "up"
                            ? <ArrowUpRight className="h-3.5 w-3.5" />
                            : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {Math.abs(mock.delta)}%
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Недельный график (из mock) */}
      <div className="mt-6 bg-card rounded-2xl border border-border p-5 shadow-soft">
        <h3 className="font-semibold mb-1">Haftalik sotuv dinamikasi</h3>
        <p className="text-xs text-muted-foreground mb-4">Barcha menejerlar bo'yicha umumiy</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={mockManagers[0].weekly.map((d, i) => ({
              day: d.day,
              sales: mockManagers.reduce((s, mm) => s + mm.weekly[i].sales, 0),
            }))}
          >
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
