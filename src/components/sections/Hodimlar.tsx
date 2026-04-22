import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, Clock, Award, Loader2, AlertCircle } from "lucide-react";

const SHEET_ID = "1AzPhbdZD5FaeSNgVjShNuJDygZElrdFkMzsauaBIscE";
const SHEET_NAME = "Hodimlar ish vaqti";
const API_KEY = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";

interface HodimRow {
  ism: string;
  sana: string;
  kelish: string;
  ketish: string;
  filial: string;
  soat: string;
}

function parseMinutes(soat: string): number {
  if (!soat) return 0;
  const match = soat.match(/(\d+)ч\s*(\d+)?м?/);
  if (!match) return 0;
  return parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
}

function today(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

export function Hodimlar() {
  const [rows, setRows] = useState<HodimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`;
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error(`API xatosi: ${res.status}`); return res.json(); })
      .then((data) => {
        const [, ...dataRows] = data.values as string[][];
        setRows(dataRows.filter((r) => r.length >= 5 && r[0]).map((r) => ({
          ism: r[0] ?? "",
          sana: r[1] ?? "",
          kelish: r[2] ?? "",
          ketish: r[3] ?? "",
          filial: r[4] ?? "",
          soat: r[5] ?? "",
        })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span></div>;
  if (error) return <div className="flex items-center justify-center h-64 gap-3 text-danger"><AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span></div>;

  const todayStr = today();
  const todayRows = rows.filter((r) => r.sana === todayStr);
  const displayRows = todayRows.length > 0 ? todayRows : rows;

  const avgMinutes = displayRows.filter(r => r.soat).reduce((s, r) => s + parseMinutes(r.soat), 0) / (displayRows.filter(r => r.soat).length || 1);
  const avgH = Math.floor(avgMinutes / 60);
  const avgM = Math.round(avgMinutes % 60);

  const mostHours = [...displayRows].filter(r => r.soat).sort((a, b) => parseMinutes(b.soat) - parseMinutes(a.soat))[0];

  return (
    <div>
      <Header title="Hodimlar" subtitle="Davomat va ish vaqti" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bugun ishda" value={String(todayRows.length || displayRows.length)} hint="hodim" icon={<Users className="h-4 w-4" />} />
        <StatCard label="O'rt. ish vaqti" value={avgMinutes > 0 ? `${avgH} soat ${avgM} daq` : "—"} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Novza filial" value={String(displayRows.filter(r => r.filial.includes("Novza")).length)} hint="hodim" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Ko'p ishlagan" value={mostHours?.ism.split(" ")[0] ?? "—"} hint={mostHours?.soat ?? ""} icon={<Award className="h-4 w-4" />} />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Bugungi smena</h3>
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
              {displayRows.map((e, i) => (
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
                  <td className="px-5 py-3.5 num text-muted-foreground">{e.kelish || "—"}</td>
                  <td className="px-5 py-3.5 num text-muted-foreground">{e.ketish || "—"}</td>
                  <td className="px-5 py-3.5 text-right num font-medium">{e.soat || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
