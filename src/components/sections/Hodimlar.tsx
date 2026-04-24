import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, Clock, Award, Loader2, AlertCircle, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_ID = "1AzPhbdZD5FaeSNgVjShNuJDygZElrdFkMzsauaBIscE";
const SHEET_NAME = "Hodimlar ish vaqti";
const API_KEY = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";

interface HodimRow {
  ism: string; sana: string; kelish: string; ketish: string; filial: string; soat: string;
}

function parseMinutes(soat: string): number {
  if (!soat) return 0;
  const match = soat.match(/(\d+)ч\s*(\d+)?м?/);
  if (!match) return 0;
  return parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
}

function parseRowDate(sana: string): Date | null {
  const parts = sana.split(".");
  if (parts.length < 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

function inputToSheetDate(input: string): string {
  const parts = input.split("-");
  if (parts.length < 3) return "";
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function todayStr(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}.${String(now.getMonth()+1).padStart(2,"0")}.${now.getFullYear()}`;
}

type Period = "kun" | "hafta" | "oy" | "barchasi";

export function Hodimlar() {
  const [rows, setRows] = useState<HodimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("kun");
  const [showCalc, setShowCalc] = useState(false);
  const [calcIsm, setCalcIsm] = useState("");
  const [calcFrom, setCalcFrom] = useState("");
  const [calcTo, setCalcTo] = useState("");
  const [calcStavka, setCalcStavka] = useState("");
  const [calcNorma, setCalcNorma] = useState("8");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  useEffect(() => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`;
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error(`API xatosi: ${res.status}`); return res.json(); })
      .then((data) => {
        const [, ...dataRows] = data.values as string[][];
        setRows(dataRows.filter((r) => r.length >= 5 && r[0]).map((r) => ({
          ism: r[0] ?? "", sana: r[1] ?? "", kelish: r[2] ?? "",
          ketish: r[3] ?? "", filial: r[4] ?? "", soat: r[5] ?? "",
        })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span></div>;
  if (error) return <div className="flex items-center justify-center h-64 gap-3 text-danger"><AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span></div>;

  const now = new Date();
  const filtered = rows.filter((r) => {
    const d = parseRowDate(r.sana);
    if (!d) return false;
    if (period === "kun") return r.sana === todayStr();
    if (period === "hafta") return (now.getTime() - d.getTime()) / (1000*60*60*24) >= 0 && (now.getTime() - d.getTime()) / (1000*60*60*24) < 7;
    if (period === "oy") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const withTime = filtered.filter(r => r.soat);
  const avgMinutes = withTime.length > 0 ? withTime.reduce((s, r) => s + parseMinutes(r.soat), 0) / withTime.length : 0;
  const avgH = Math.floor(avgMinutes / 60);
  const avgM = Math.round(avgMinutes % 60);
  const mostHours = [...filtered].filter(r => r.soat).sort((a, b) => parseMinutes(b.soat) - parseMinutes(a.soat))[0];
  const novzaCount = filtered.filter(r => r.filial.includes("Novza")).length;
  const yunusobodCount = filtered.filter(r => r.filial.includes("Yunusobod")).length;
  const uniqueNames = [...new Set(rows.map(r => r.ism))].filter(Boolean);

  function calcOylik() {
    if (!calcIsm || !calcFrom || !calcTo || !calcStavka || !calcNorma) {
      setCalcResult("Barcha maydonlarni to'ldiring");
      return;
    }
    const stavka = parseFloat(calcStavka.replace(/\s/g, "").replace(",", "."));
    const normaHour = parseFloat(calcNorma);
    if (isNaN(stavka) || isNaN(normaHour)) {
      setCalcResult("Stavka yoki normani to'g'ri kiriting");
      return;
    }

    const fromSheet = inputToSheetDate(calcFrom);
    const toSheet = inputToSheetDate(calcTo);
    const fromDate = parseRowDate(fromSheet);
    const toDate = parseRowDate(toSheet);

    if (!fromDate || !toDate) {
      setCalcResult("Sanani to'g'ri kiriting");
      return;
    }

    // Рабочие дни в периоде (6 дней в неделю, воскресенье выходной)
    let workDaysInPeriod = 0;
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      if (cur.getDay() !== 0) workDaysInPeriod++;
      cur.setDate(cur.getDate() + 1);
    }

    // Стоимость 1 минуты
    const totalNormaMinutes = workDaysInPeriod * normaHour * 60;
    const minutePrice = stavka / totalNormaMinutes;

    // Отработанные минуты из Sheets
    const workedRows = rows.filter(r => {
      if (r.ism !== calcIsm) return false;
      const d = parseRowDate(r.sana);
      if (!d) return false;
      return d >= fromDate && d <= toDate;
    });

    const workedMinutes = workedRows.reduce((s, r) => s + parseMinutes(r.soat), 0);
    const workedH = Math.floor(workedMinutes / 60);
    const workedM = workedMinutes % 60;
    const earned = Math.round(minutePrice * workedMinutes);

    setCalcResult(
      `👤 ${calcIsm}\n` +
      `📅 ${fromSheet} — ${toSheet}\n` +
      `📋 Topilgan yozuvlar: ${workedRows.length} ta kun\n` +
      `⏱ Jami ishlagan: ${workedH}ч ${workedM}м\n` +
      `📊 Norma: ${workDaysInPeriod} ish kuni × ${normaHour}s = ${Math.round(totalNormaMinutes/60)}s\n` +
      `💵 1 daqiqa narxi: ${Math.round(minutePrice).toLocaleString("ru-RU")} so'm\n` +
      `💰 Hisoblangan oylik: ${earned.toLocaleString("ru-RU")} so'm`
    );
  }

  const periods: { id: Period; label: string }[] = [
    { id: "kun", label: "Bugun" },
    { id: "hafta", label: "Hafta" },
    { id: "oy", label: "Oy" },
    { id: "barchasi", label: "Barchasi" },
  ];

  return (
    <div>
      <Header title="Hodimlar" subtitle="Davomat va ish vaqti" />

      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
              period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}>
            {p.label}
          </button>
        ))}
        <button onClick={() => { setShowCalc(!showCalc); setCalcResult(null); }}
          className={cn("ml-auto px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
            showCalc ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          )}>
          <Calculator className="h-4 w-4" />
          Oylikni Hisoblash
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl p-5 shadow-soft border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-blue-700 font-medium">Ishda</span>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><Users className="h-4 w-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-blue-900">{filtered.length}</p>
          <p className="text-xs text-blue-600 mt-1">hodim</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-emerald-700 font-medium">O'rt. ish vaqti</span>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><Clock className="h-4 w-4 text-emerald-600" /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{avgMinutes > 0 ? `${avgH}ч ${avgM}м` : "—"}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-purple-700 font-medium">Filiallar</span>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center"><Users className="h-4 w-4 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-purple-900">{filtered.length}</p>
          <p className="text-xs text-purple-600 mt-1">Novza: {novzaCount}  |  Yunusobod: {yunusobodCount}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-soft border border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-amber-700 font-medium">Ko'p ishlagan</span>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center"><Award className="h-4 w-4 text-amber-600" /></div>
          </div>
          <p className="text-2xl font-bold text-amber-900">{mostHours?.ism.split(" ")[0] ?? "—"}</p>
          <p className="text-xs text-amber-600 mt-1">{mostHours?.soat ?? ""}</p>
        </div>
      </div>

      {showCalc && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calculator className="h-4 w-4" />Oylik hisoblash</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hodim</label>
              <select value={calcIsm} onChange={(e) => setCalcIsm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                <option value="">Tanlang</option>
                {uniqueNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dan (sana)</label>
              <input type="date" value={calcFrom} onChange={(e) => setCalcFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gacha (sana)</label>
              <input type="date" value={calcTo} onChange={(e) => setCalcTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Oylik stavka (so'm)</label>
              <input type="text" placeholder="4000000" value={calcStavka} onChange={(e) => setCalcStavka(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Kunlik norma (soat)</label>
              <input type="number" min="1" max="24" value={calcNorma} onChange={(e) => setCalcNorma(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>
          <button onClick={calcOylik}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
            Hisoblash
          </button>
          {calcResult && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-medium whitespace-pre-line leading-relaxed text-emerald-900">
              {calcResult}
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Hodimlar jadvali</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Kelish, ketish va ish vaqti</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="px-5 py-3 font-medium">Hodim</th>
                <th className="px-5 py-3 font-medium">Filial</th>
                <th className="px-5 py-3 font-medium">Kelish</th>
                <th className="px-5 py-3 font-medium">Ketish</th>
                <th className="px-5 py-3 font-medium text-right">Ish vaqti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Ma'lumot yo'q</td></tr>
              ) : filtered.map((e, i) => (
                <tr key={i} className="hover:bg-secondary/60 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                        {e.ism.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{e.ism}</div>
                        <div className="text-xs text-muted-foreground">{e.sana}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{e.filial}</td>
                  <td className="px-5 py-3.5 num text-emerald-600 font-medium">{e.kelish || "—"}</td>
                  <td className="px-5 py-3.5 num text-red-500 font-medium">{e.ketish || "—"}</td>
                  <td className="px-5 py-3.5 text-right num font-bold text-blue-700">{e.soat || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
