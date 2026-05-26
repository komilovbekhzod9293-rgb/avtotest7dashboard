import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { TrendingUp, Loader2, AlertCircle, Plus, X, CheckCircle2, Clock, CalendarClock, Globe, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const SHEET_ID = "1bLel0b3ULXWJ71Tgn_ynl5fvBrDIMZXo-CzeV9lnE3k";
const SHEET_NAME = "moliya";
const API_KEY = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const WEBHOOK_URL = "https://n8n.srv1215497.hstgr.cloud/webhook/moliya";
const REJADAGI_SHEET_ID = "1pgMDVt57G6TFkHfSZDCLY8bH1R-39a1rVhQb_Be9-Kc";
const REJADAGI_WEBHOOK = "https://n8n.srv1215497.hstgr.cloud/webhook/rasxodqoshish";
const ONLINE_WEBHOOK = "https://n8n.srv1215497.hstgr.cloud/webhook/add";
const UZ_MONTHS = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
const EXPENSE_COLORS = ["hsl(222 47% 11%)","hsl(220 9% 46%)","hsl(230 70% 55%)","hsl(38 92% 50%)","hsl(220 13% 78%)"];

// ============ PUL TAQSIMOTI SOZLAMASI ============
interface Bucket { id: string; nomi: string; summa: number; kun: number; ustuvor: number; }
const BUCKETS: Bucket[] = [
  { id: "rahbar_7",    nomi: "Rahbarlar oyligi (7-kun)",    summa: 20_000_000, kun: 7,  ustuvor: 1 },
  { id: "ar_novza",   nomi: "Novza filial arendasi",        summa: 18_000_000, kun: 7,  ustuvor: 1 },
  { id: "ar_yunus",   nomi: "Yunusobod filial arendasi",    summa: 9_000_000,  kun: 9,  ustuvor: 1 },
  { id: "ikrom",      nomi: "Ikrom Bekturdiyev (sherik)",   summa: 15_000_000, kun: 3,  ustuvor: 2 },
  { id: "oqit_op",    nomi: "O'qituvchilar + operatorlar",  summa: 38_000_000, kun: 4,  ustuvor: 1 },
  { id: "doniyor",    nomi: "Doniyor aka (sherik)",         summa: 20_000_000, kun: 10, ustuvor: 2 },
  { id: "rahbar_14",  nomi: "Rahbarlar oyligi (14-kun)",    summa: 20_000_000, kun: 14, ustuvor: 1 },
  { id: "rop",        nomi: "Rop oyligi",                   summa: 7_000_000,  kun: 15, ustuvor: 1 },
  { id: "operator2",  nomi: "2 operator oyligi",            summa: 10_000_000, kun: 20, ustuvor: 1 },
  { id: "rahbar_21",  nomi: "Rahbarlar oyligi (21-kun)",    summa: 20_000_000, kun: 21, ustuvor: 1 },
  { id: "rahbar_28",  nomi: "Rahbarlar oyligi (28-kun)",    summa: 20_000_000, kun: 28, ustuvor: 1 },
  { id: "soliq",      nomi: "Soliq",                        summa: 5_000_000,  kun: 30, ustuvor: 2 },
  { id: "marketing",  nomi: "Marketing",                    summa: 10_000_000, kun: 30, ustuvor: 3 },
  { id: "ofis",       nomi: "Ofis xarajatlari",             summa: 6_000_000,  kun: 30, ustuvor: 3 },
  { id: "ai",         nomi: "AI xarajatlari",               summa: 3_000_000,  kun: 30, ustuvor: 3 },
  { id: "ehson",      nomi: "Ehson / Xayriya",              summa: 1_000_000,  kun: 30, ustuvor: 2 },
  { id: "podushka",   nomi: "Moliyaviy yostiq (zaxira)",    summa: 5_000_000,  kun: 30, ustuvor: 4 },
];

interface TaqsimItem {
  id: string; nomi: string; kerak: number; toplangan: number;
  foiz: number; targetKun: number; kunQoldi: number; yetarli: boolean;
}

interface TaqsimResult {
  items: TaqsimItem[];
  kunlikKirim: number;
  tahlilOylar: string[];
  qolgan: number;
}

function taqsimla(rows: Row[], bugun: Date): TaqsimResult {
  // 1) O'tgan 1-2 oy kirimlarini tahlil qilish
  const oylar: { oy: number; yil: number }[] = [];
  for (let i = 1; i <= 2; i++) {
    const d = new Date(bugun.getFullYear(), bugun.getMonth() - i, 1);
    oylar.push({ oy: d.getMonth(), yil: d.getFullYear() });
  }

  const tahlilOylar: string[] = [];
  let jami = 0; let kunSoni = 0;
  oylar.forEach(({ oy, yil }) => {
    const oyRows = rows.filter(r => {
      const p = r.sana.split(".");
      if (p.length < 3) return false;
      return parseInt(p[1]) - 1 === oy && parseInt(p[2]) === yil && r.summa > 0;
    });
    if (oyRows.length === 0) return;
    const oyKirim = oyRows.reduce((s, r) => s + r.summa, 0);
    jami += oyKirim;
    kunSoni += new Date(yil, oy + 1, 0).getDate();
    tahlilOylar.push(`${UZ_MONTHS[oy]} ${yil}`);
  });

  // Agar tahlil yo'q bo'lsa joriy oy kirimini ishlatamiz
  if (kunSoni === 0) {
    const joriyRows = rows.filter(r => {
      const p = r.sana.split(".");
      if (p.length < 3) return false;
      return parseInt(p[1]) - 1 === bugun.getMonth() && parseInt(p[2]) === bugun.getFullYear() && r.summa > 0;
    });
    jami = joriyRows.reduce((s, r) => s + r.summa, 0);
    kunSoni = bugun.getDate();
    tahlilOylar.push(`${UZ_MONTHS[bugun.getMonth()]} ${bugun.getFullYear()} (joriy oy)`);
  }

  const kunlikKirim = kunSoni > 0 ? Math.round(jami / kunSoni) : 0;

  // 2) Joriy oy kirimini hisoblash (kassa)
  const joriyOyRows = rows.filter(r => {
    const p = r.sana.split(".");
    if (p.length < 3) return false;
    return parseInt(p[1]) - 1 === bugun.getMonth() && parseInt(p[2]) === bugun.getFullYear();
  });
  const joriyKirim = joriyOyRows.filter(r => r.summa > 0).reduce((s, r) => s + r.summa, 0);
  const joriyChiqim = joriyOyRows.filter(r => r.summa < 0).reduce((s, r) => s + Math.abs(r.summa), 0);
  const kassa = joriyKirim - joriyChiqim;

  // 3) Har bir xarajat uchun target sana va prognoz
  const bugunKun = bugun.getDate();
  const items: TaqsimItem[] = BUCKETS.map(b => {
    let targetKun = b.kun;
    let kunQoldi: number;

    if (targetKun <= bugunKun) {
      // Bu oy o'tib ketgan — keyingi oyga
      const keyingiOy = new Date(bugun.getFullYear(), bugun.getMonth() + 1, targetKun);
      kunQoldi = Math.max(1, Math.ceil((keyingiOy.getTime() - bugun.getTime()) / 86400000));
    } else {
      kunQoldi = targetKun - bugunKun;
    }

    // Prognoz: bu kun davomida qancha yig'iladi?
    const prognoz = kunlikKirim * kunQoldi;
    // Kassadan va prognozdan umumiy qancha bor?
    // Har bir xarajatga proporsional ulush beramiz
    return { id: b.id, nomi: b.nomi, kerak: b.summa, toplangan: 0, foiz: 0, targetKun, kunQoldi, yetarli: false };
  });

  // 4) Kassani ustuvorlik bo'yicha taqsimlash
  let qolgan = Math.max(0, kassa);
  const ustuvorlar = [...new Set(BUCKETS.map(b => b.ustuvor))].sort((a, b) => a - b);

  for (const u of ustuvorlar) {
    if (qolgan <= 0) break;
    let guruh = items.filter(i => {
      const b = BUCKETS.find(x => x.id === i.id)!;
      return b.ustuvor === u && i.toplangan < i.kerak - 1;
    });
    while (qolgan > 1 && guruh.length > 0) {
      const vaznlar = guruh.map(i => (i.kerak - i.toplangan) / Math.max(1, i.kunQoldi));
      const jamiVazn = vaznlar.reduce((a, b) => a + b, 0);
      if (jamiVazn <= 0) break;
      let ishlatildi = 0;
      guruh.forEach((item, idx) => {
        const ulush = qolgan * (vaznlar[idx] / jamiVazn);
        const beriladi = Math.min(ulush, item.kerak - item.toplangan);
        item.toplangan += beriladi;
        ishlatildi += beriladi;
      });
      qolgan -= ishlatildi;
      guruh = guruh.filter(i => i.toplangan < i.kerak - 1);
      if (ishlatildi < 1) break;
    }
  }

  // 5) Foiz va yetarlilikni hisoblash
  items.forEach(i => {
    i.foiz = Math.min(100, Math.round((i.toplangan / i.kerak) * 100));
    i.yetarli = i.toplangan >= i.kerak - 1;
  });

  // 6) Sana bo'yicha o'sish tartibida saralash
  items.sort((a, b) => {
    const aKun = a.kunQoldi;
    const bKun = b.kunQoldi;
    return aKun - bKun;
  });

  return { items, kunlikKirim, tahlilOylar, qolgan: Math.max(0, qolgan) };
}
// =================================================

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

function todayInputFormat(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function inputToSheetDate(input: string): string {
  const parts = input.split("-");
  if (parts.length < 3) return "";
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatSummaInput(val: string): string {
  return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

type Period = "kun" | "hafta" | "oy" | "barchasi";
interface Row { sana: string; ism: string; filial: string; turi: string; summa: number; kirimChiqim: string; izoh: string; }
interface RejadagiRow { nomi: string; sana: string; summa: number; status: string; izoh: string; }

function Toggle({ left, right, value, onChange, leftColor, rightColor }: {
  left: string; right: string; value: string; onChange: (v: string) => void; leftColor?: string; rightColor?: string;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
      <button onClick={() => onChange(left)} className={cn("flex-1 py-2 px-3 transition", value === left ? (leftColor || "bg-primary text-primary-foreground") : "bg-background text-muted-foreground hover:text-foreground")}>{left}</button>
      <button onClick={() => onChange(right)} className={cn("flex-1 py-2 px-3 transition border-l border-border", value === right ? (rightColor || "bg-primary text-primary-foreground") : "bg-background text-muted-foreground hover:text-foreground")}>{right}</button>
    </div>
  );
}

export function Moliya() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("barchasi");
  const [rejadagi, setRejadagi] = useState<RejadagiRow[]>([]);
  const [rejadagiLoading, setRejadagiLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formSana, setFormSana] = useState(todayInputFormat());
  const [formIsm, setFormIsm] = useState("");
  const [formFilial, setFormFilial] = useState("Novza");
  const [formOnline, setFormOnline] = useState("Offline");
  const [formTuri, setFormTuri] = useState("Naqd");
  const [formSumma, setFormSumma] = useState("");
  const [formKirim, setFormKirim] = useState("Kirim");
  const [formIzoh, setFormIzoh] = useState("");
  const [formTelefon, setFormTelefon] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formResult, setFormResult] = useState<string | null>(null);

  const [showRejadagiForm, setShowRejadagiForm] = useState(false);
  const [rejNomi, setRejNomi] = useState("");
  const [rejSana, setRejSana] = useState(todayInputFormat());
  const [rejSumma, setRejSumma] = useState("");
  const [rejIzoh, setRejIzoh] = useState("");
  const [rejLoading, setRejLoading] = useState(false);
  const [rejResult, setRejResult] = useState<string | null>(null);

  const [showOnlineForm, setShowOnlineForm] = useState(false);
  const [onlineIsm, setOnlineIsm] = useState("");
  const [onlineTelefon, setOnlineTelefon] = useState("");
  const [onlineSumma, setOnlineSumma] = useState("");
  const [onlineSana, setOnlineSana] = useState(todayInputFormat());
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineResult, setOnlineResult] = useState<string | null>(null);

  const [modalFilial, setModalFilial] = useState<"Novza" | "Yunusobod" | null>(null);
  const [filterKirim, setFilterKirim] = useState("Barchasi");
  const [filterFilial, setFilterFilial] = useState("Barchasi");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [tolovLoading, setTolovLoading] = useState<number | null>(null);

  // Pul taqsimoti state
  const [taqsimOpen, setTaqsimOpen] = useState(false);
  const [tahlilOpen, setTahlilOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`)
      .then(res => { if (!res.ok) throw new Error(`API xatosi: ${res.status}`); return res.json(); })
      .then(data => {
        const [, ...dataRows] = data.values as string[][];
        setRows(dataRows.filter(r => r.length >= 6 && r[0] && r[5]).map(r => ({
          sana: r[0] ?? "", ism: r[1] ?? "", filial: r[2] ?? "", turi: r[4] ?? "",
          summa: parseSumma(r[5]), kirimChiqim: r[6] ?? "", izoh: r[7] ?? "",
        })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchRejadagi = () => {
    setRejadagiLoading(true);
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${REJADAGI_SHEET_ID}/values/Лист1?key=${API_KEY}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        const [, ...dataRows] = (data.values || []) as string[][];
        setRejadagi(
          dataRows
            .filter(r => r.length >= 3 && r[0] && r[3] !== "tolov qilindi")
            .map(r => ({
              nomi: r[0] ?? "", sana: r[1] ?? "",
              summa: parseFloat(r[2]?.replace(/\s/g, "") || "0") || 0,
              status: r[3] ?? "rejada", izoh: r[4] ?? "",
            }))
        );
      })
      .catch(() => {})
      .finally(() => setRejadagiLoading(false));
  };

  useEffect(() => { fetchData(); fetchRejadagi(); }, []);

  async function submitForm() {
    if (!formIsm || !formSumma) { setFormResult("❌ Ism va summani kiriting"); return; }
    setFormLoading(true); setFormResult(null);
    const summaNum = parseInt(formSumma.replace(/\s/g, ""));
    const finalSumma = formKirim === "Chiqim" ? -summaNum : summaNum;
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sana: inputToSheetDate(formSana), ism: formIsm, filial: formFilial, online_offline: formOnline, telefon: formTelefon, turi: formTuri, summa: finalSumma, kirim_chiqim: formKirim, izoh: formIzoh }),
      });
      setFormResult("✅ Muvaffaqiyatli saqlandi!");
      setFormIsm(""); setFormSumma(""); setFormIzoh(""); setFormTelefon(""); setFormSana(todayInputFormat());
      setTimeout(() => fetchData(), 2000);
    } catch { setFormResult("❌ Xatolik yuz berdi"); }
    finally { setFormLoading(false); }
  }

  async function submitRejadagi() {
    if (!rejNomi || !rejSumma) { setRejResult("❌ Nomi va summani kiriting"); return; }
    setRejLoading(true); setRejResult(null);
    try {
      await fetch(REJADAGI_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", nomi: rejNomi, sana: inputToSheetDate(rejSana), summa: parseInt(rejSumma.replace(/\s/g, "")), izoh: rejIzoh, status: "rejada" }),
      });
      setRejResult("✅ Saqlandi!");
      setRejNomi(""); setRejSumma(""); setRejIzoh(""); setRejSana(todayInputFormat());
      setTimeout(() => fetchRejadagi(), 2000);
    } catch { setRejResult("❌ Xatolik"); }
    finally { setRejLoading(false); }
  }

  async function submitOnline() {
    if (!onlineIsm || !onlineSumma || !onlineTelefon) { setOnlineResult("❌ Barcha maydonlarni to'ldiring"); return; }
    setOnlineLoading(true); setOnlineResult(null);
    try {
      await fetch(ONLINE_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ism: onlineIsm, telefon: onlineTelefon, summa: parseInt(onlineSumma.replace(/\s/g, "")), sana: inputToSheetDate(onlineSana) }),
      });
      setOnlineResult("✅ Saqlandi!");
      setOnlineIsm(""); setOnlineTelefon(""); setOnlineSumma(""); setOnlineSana(todayInputFormat());
      setTimeout(() => fetchData(), 2000);
    } catch { setOnlineResult("❌ Xatolik yuz berdi"); }
    finally { setOnlineLoading(false); }
  }

  async function tolovQilindi(item: RejadagiRow, index: number) {
    setTolovLoading(index);
    try {
      await fetch(REJADAGI_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tolov_qilindi", nomi: item.nomi, sana: item.sana, summa: item.summa, izoh: item.izoh }),
      });
      setTimeout(() => fetchRejadagi(), 2000);
    } catch {}
    finally { setTolovLoading(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda…</span></div>;
  if (error) return <div className="flex items-center justify-center h-64 gap-3 text-danger"><AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span></div>;

  const now = new Date();
  const periodFiltered = rows.filter(r => {
    if (period === "barchasi") return true;
    const d = parseDate(r.sana);
    if (!d) return false;
    if (period === "kun") return d.toDateString() === now.toDateString();
    if (period === "hafta") return (now.getTime() - d.getTime()) / (1000*60*60*24) >= 0 && (now.getTime() - d.getTime()) / (1000*60*60*24) < 7;
    if (period === "oy") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalRevenue  = periodFiltered.filter(r => r.summa > 0).reduce((s, r) => s + r.summa, 0);
  const totalExpenses = periodFiltered.filter(r => r.summa < 0).reduce((s, r) => s + Math.abs(r.summa), 0);
  const totalProfit   = totalRevenue - totalExpenses;
  const margin        = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const novzaRevenue    = periodFiltered.filter(r => r.summa > 0 && r.filial === "Novza").reduce((s, r) => s + r.summa, 0);
  const novzaExpenses   = periodFiltered.filter(r => r.summa < 0 && r.filial === "Novza").reduce((s, r) => s + Math.abs(r.summa), 0);
  const novzaProfit     = novzaRevenue - novzaExpenses;
  const yunusobodRevenue  = periodFiltered.filter(r => r.summa > 0 && r.filial === "Yunusobod").reduce((s, r) => s + r.summa, 0);
  const yunusobodExpenses = periodFiltered.filter(r => r.summa < 0 && r.filial === "Yunusobod").reduce((s, r) => s + Math.abs(r.summa), 0);
  const yunusobodProfit   = yunusobodRevenue - yunusobodExpenses;

  // Pul taqsimoti hisoblash
  const taqsim = taqsimla(rows, now);
  const yetarliSon = taqsim.items.filter(i => i.yetarli).length;
  const xatarliSon = taqsim.items.filter(i => !i.yetarli && i.kunQoldi <= 3).length;

  const tableFiltered = periodFiltered.filter(r => {
    if (filterKirim === "Kirim" && r.summa < 0) return false;
    if (filterKirim === "Chiqim" && r.summa > 0) return false;
    if (filterFilial !== "Barchasi" && r.filial !== filterFilial) return false;
    if (filterFrom) { const d = parseDate(r.sana); const from = parseDate(inputToSheetDate(filterFrom)); if (d && from && d < from) return false; }
    if (filterTo) { const d = parseDate(r.sana); const to = parseDate(inputToSheetDate(filterTo)); if (d && to && d > to) return false; }
    return true;
  });

  const monthMap: Record<string, { revenue: number; expenses: number }> = {};
  periodFiltered.forEach(r => {
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
  periodFiltered.filter(r => r.summa < 0).forEach(r => { const k = r.filial || "Boshqa"; filialMap[k] = (filialMap[k] ?? 0) + Math.abs(r.summa); });
  const totalExp = Object.values(filialMap).reduce((a, b) => a + b, 0) || 1;
  const expenseBreakdown = Object.entries(filialMap).map(([name, val], i) => ({ name, value: Math.round((val / totalExp) * 100), color: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }));

  const periods: { id: Period; label: string }[] = [
    { id: "kun", label: "Bugun" }, { id: "hafta", label: "Hafta" }, { id: "oy", label: "Oy" }, { id: "barchasi", label: "Barchasi" },
  ];

  const modalData = modalFilial ? {
    revenue:  modalFilial === "Novza" ? novzaRevenue  : yunusobodRevenue,
    expenses: modalFilial === "Novza" ? novzaExpenses : yunusobodExpenses,
    profit:   modalFilial === "Novza" ? novzaProfit   : yunusobodProfit,
  } : null;

  return (
    <div>
      <Header title="Moliya" subtitle="Daromad, xarajat va foyda tahlili" />

      <div className="flex flex-wrap gap-2 mb-6">
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition", period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => { setShowOnlineForm(!showOnlineForm); setOnlineResult(null); if (showForm) setShowForm(false); if (showRejadagiForm) setShowRejadagiForm(false); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
              showOnlineForm ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {showOnlineForm ? <X className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {showOnlineForm ? "Yopish" : "Online to'lov"}
          </button>
          <button onClick={() => { setShowRejadagiForm(!showRejadagiForm); setRejResult(null); if (showForm) setShowForm(false); if (showOnlineForm) setShowOnlineForm(false); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
              showRejadagiForm ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {showRejadagiForm ? <X className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
            {showRejadagiForm ? "Yopish" : "Rejadagi xarajat"}
          </button>
          <button onClick={() => { setShowForm(!showForm); setFormResult(null); if (showRejadagiForm) setShowRejadagiForm(false); if (showOnlineForm) setShowOnlineForm(false); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
              showForm ? "bg-primary text-primary-foreground" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Yopish" : "Yangi yozuv"}
          </button>
        </div>
      </div>

      {showOnlineForm && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-4 w-4" />Online to'lov qo'shish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Ism Familya</label><input type="text" value={onlineIsm} onChange={e => setOnlineIsm(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Telefon raqami</label><input type="tel" placeholder="+998 90 000 00 00" value={onlineTelefon} onChange={e => setOnlineTelefon(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Summa (so'm)</label><input type="text" value={onlineSumma} onChange={e => setOnlineSumma(formatSummaInput(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Sana</label><input type="date" value={onlineSana} onChange={e => setOnlineSana(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          </div>
          <button onClick={submitOnline} disabled={onlineLoading} className="px-6 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition disabled:opacity-50 inline-flex items-center gap-2">
            {onlineLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
          </button>
          {onlineResult && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium inline-block ml-3", onlineResult.startsWith("✅") ? "text-emerald-700" : "text-red-600")}>{onlineResult}</div>}
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" />Yangi kirim / chiqim</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Sana</label><input type="date" value={formSana} onChange={e => setFormSana(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Ism Familya</label><input type="text" value={formIsm} onChange={e => setFormIsm(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Telefon raqami</label><input type="tel" placeholder="+998 90 000 00 00" value={formTelefon} onChange={e => setFormTelefon(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Summa (so'm)</label><input type="text" value={formSumma} onChange={e => setFormSumma(formatSummaInput(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Filial</label><Toggle left="Novza" right="Yunusobod" value={formFilial} onChange={setFormFilial} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Turi</label><Toggle left="Naqd" right="Karta" value={formTuri} onChange={setFormTuri} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Online / Offline</label><Toggle left="Offline" right="Online" value={formOnline} onChange={setFormOnline} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Kirim / Chiqim</label><Toggle left="Kirim" right="Chiqim" value={formKirim} onChange={setFormKirim} leftColor="bg-emerald-600 text-white" rightColor="bg-red-500 text-white" /></div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Izoh (ixtiyoriy)</label><input type="text" value={formIzoh} onChange={e => setFormIzoh(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          </div>
          <button onClick={submitForm} disabled={formLoading} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-2">
            {formLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
          </button>
          {formResult && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium", formResult.startsWith("✅") ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100")}>{formResult}</div>}
        </div>
      )}

      {showRejadagiForm && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><CalendarClock className="h-4 w-4" />Rejadagi xarajat qo'shish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Xarajat nomi</label><input type="text" placeholder="Ijara, Maosh..." value={rejNomi} onChange={e => setRejNomi(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Sana / Oy</label><input type="date" value={rejSana} onChange={e => setRejSana(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Summa (so'm)</label><input type="text" value={rejSumma} onChange={e => setRejSumma(formatSummaInput(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Izoh</label><input type="text" value={rejIzoh} onChange={e => setRejIzoh(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          </div>
          <button onClick={submitRejadagi} disabled={rejLoading} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2">
            {rejLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
          </button>
          {rejResult && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium inline-block ml-3", rejResult.startsWith("✅") ? "text-emerald-700" : "text-red-600")}>{rejResult}</div>}
        </div>
      )}

      {/* Marja */}
      <div className={cn("rounded-2xl p-5 shadow-soft border mb-4",
        totalProfit < 0 ? "border-red-200 bg-gradient-to-br from-red-50 to-white" : "border-purple-100 bg-gradient-to-br from-purple-50 to-white")}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn("text-sm font-medium mb-1", totalProfit < 0 ? "text-red-700" : "text-purple-700")}>Marja</p>
            <p className={cn("text-3xl font-bold num", totalProfit < 0 ? "text-red-600" : "text-purple-900")}>{totalProfit < 0 ? "-" : ""}{margin}%</p>
            <p className={cn("text-xs mt-1", totalProfit < 0 ? "text-red-600" : "text-purple-600")}>
              Daromad: {fmt(totalRevenue)} · Xarajat: {fmt(totalExpenses)} · Sof foyda:{" "}
              <span className={cn("font-semibold", totalProfit < 0 ? "text-red-600" : "")}>{totalProfit < 0 ? "-" : ""}{fmt(totalProfit)}</span>
            </p>
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", totalProfit < 0 ? "bg-red-100" : "bg-purple-100")}>
            <TrendingUp className={cn("h-6 w-6", totalProfit < 0 ? "text-red-600" : "text-purple-600")} />
          </div>
        </div>
      </div>

      {/* Novza Yunusobod */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className={cn("rounded-2xl p-5 shadow-soft border cursor-pointer transition",
          novzaProfit < 0 ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300" : "border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300")}
          onClick={() => setModalFilial("Novza")}>
          <p className={cn("text-sm font-medium mb-2", novzaProfit < 0 ? "text-red-700" : "text-blue-700")}>Novza — Sof foyda</p>
          <p className={cn("text-2xl font-bold num", novzaProfit < 0 ? "text-red-600" : "text-blue-900")}>{novzaProfit < 0 ? "-" : ""}{fmt(novzaProfit)}</p>
          <p className={cn("text-xs mt-2", novzaProfit < 0 ? "text-red-500" : "text-blue-600")}>Batafsil ko'rish →</p>
        </div>
        <div className={cn("rounded-2xl p-5 shadow-soft border cursor-pointer transition",
          yunusobodProfit < 0 ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300" : "border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300")}
          onClick={() => setModalFilial("Yunusobod")}>
          <p className={cn("text-sm font-medium mb-2", yunusobodProfit < 0 ? "text-red-700" : "text-blue-700")}>Yunusobod — Sof foyda</p>
          <p className={cn("text-2xl font-bold num", yunusobodProfit < 0 ? "text-red-600" : "text-blue-900")}>{yunusobodProfit < 0 ? "-" : ""}{fmt(yunusobodProfit)}</p>
          <p className={cn("text-xs mt-2", yunusobodProfit < 0 ? "text-red-500" : "text-blue-600")}>Batafsil ko'rish →</p>
        </div>
      </div>

      {/* ====== PUL TAQSIMOTI — YANGI KICHIK OYNA ====== */}
      <div className="bg-card rounded-2xl border border-border shadow-soft mb-6 overflow-hidden">
        {/* Compact header — always visible */}
        <button
          onClick={() => setTaqsimOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Pul taqsimoti</span>
              {/* Info icon */}
              <button
                onClick={e => { e.stopPropagation(); setTahlilOpen(v => !v); }}
                className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition"
                title="Tahlil haqida"
              >
                <Info className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {xatarliSon > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />{xatarliSon} xatar
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />{yetarliSon}/{taqsim.items.length}
              </span>
              <span className="text-xs text-muted-foreground">
                · Kunlik kirim: ~{fmtShort(taqsim.kunlikKirim)}
              </span>
            </div>
          </div>
          {taqsimOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Tahlil explanation modal */}
        {tahlilOpen && (
          <div className="mx-5 mb-3 p-4 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900">
            <p className="font-semibold mb-1">📊 Nima asosida taqsimlanyapti?</p>
            <p className="mb-2">
              Sistema o'tgan <strong>{taqsim.tahlilOylar.join(" va ")}</strong> oylaridagi kirimlarni tahlil qildi.
              O'sha oylar bo'yicha kunlik o'rtacha kirim: <strong>{fmt(taqsim.kunlikKirim)}</strong>.
            </p>
            <p className="mb-2">
              Har bir xarajatga qancha kun qolganiga qarab — shoshilinchlik hisoblanadi.
              Qancha kam kun qolsa, kassadan shuncha katta ulush shu xarajatga ajratiladi.
            </p>
            <p className="mb-2">
              Ustuvorlik darajasi ham hisobga olinadi: maoshlar va arenda birinchi, sheriklar ikkinchi, marketing va ofis xarajatlari uchinchi, zaxira oxirgi navbatda to'ldiriladi.
            </p>
            <p className="text-blue-700">
              ⚠️ Bu prognoz — real hisob emas. Pul kassaga tushganda taqsimlash yangilanadi.
            </p>
          </div>
        )}

        {/* Expanded list */}
        {taqsimOpen && (
          <div className="px-5 pb-5">
            <div className="space-y-2">
              {taqsim.items.map(v => (
                <div key={v.id} className={cn("p-3 rounded-xl border",
                  v.yetarli ? "border-emerald-200 bg-emerald-50" :
                  v.kunQoldi <= 3 ? "border-red-200 bg-red-50" :
                  "border-border bg-background")}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {v.yetarli
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        : <Clock className={cn("h-3.5 w-3.5 shrink-0", v.kunQoldi <= 3 ? "text-red-500" : "text-muted-foreground")} />}
                      <span className="font-medium text-sm truncate">{v.nomi}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {v.targetKun}-kun · {v.kunQoldi} kun qoldi
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-1">
                    <div className={cn("h-full rounded-full transition-all",
                      v.yetarli ? "bg-emerald-500" : v.kunQoldi <= 3 ? "bg-red-500" : "bg-primary")}
                      style={{ width: `${v.foiz}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="num text-muted-foreground">{fmtShort(v.toplangan)} / {fmtShort(v.kerak)}</span>
                    <span className={cn("font-semibold",
                      v.yetarli ? "text-emerald-600" : v.kunQoldi <= 3 ? "text-red-500" : "text-muted-foreground")}>
                      {v.foiz}%{!v.yetarli ? ` · ${fmtShort(v.kerak - v.toplangan)} kerak` : " ✓"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Hammasi yopilsa qoladi</span>
              <span className={cn("num font-bold text-sm", taqsim.qolgan > 0 ? "text-emerald-600" : "text-muted-foreground")}>{fmt(taqsim.qolgan)}</span>
            </div>
          </div>
        )}
      </div>
      {/* ====== PUL TAQSIMOTI TUGADI ====== */}

      {/* Rejadagi xarajatlar — ТРОНУТО НОЛЬ */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Rejadagi xarajatlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Joriy sof foyda: <span className={cn("font-semibold", totalProfit < 0 ? "text-red-500" : "")}>{totalProfit < 0 ? "-" : ""}{fmt(totalProfit)}</span></p>
          </div>
        </div>
        {rejadagiLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="h-4 w-4 animate-spin" /><span>Yuklanmoqda…</span></div>
        ) : rejadagi.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Rejadagi xarajatlar yo'q</p>
        ) : (
          <div className="space-y-2">
            {rejadagi.map((item, i) => {
              const covered = totalProfit >= item.summa;
              return (
                <div key={i} className={cn("flex items-center justify-between p-4 rounded-xl border transition",
                  covered ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                  <div className="flex items-center gap-3">
                    {covered ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Clock className="h-5 w-5 text-red-400 shrink-0" />}
                    <div>
                      <p className={cn("font-semibold text-sm", covered ? "text-emerald-900" : "text-red-900")}>{item.nomi}</p>
                      <p className={cn("text-xs mt-0.5", covered ? "text-emerald-600" : "text-red-500")}>{item.sana}{item.izoh ? ` · ${item.izoh}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={cn("num font-bold text-sm", covered ? "text-emerald-700" : "text-red-600")}>{fmt(item.summa)}</p>
                    {covered && (
                      <button onClick={() => tolovQilindi(item, i)} disabled={tolovLoading === i}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap">
                        {tolovLoading === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        To'landi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <span className="text-xs font-semibold text-muted-foreground">Jami rejadagi xarajatlar</span>
              <span className="num font-bold text-sm">{fmt(rejadagi.reduce((s, r) => s + r.summa, 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Xarajatlardan keyin qoladi</span>
              <span className={cn("num font-bold text-sm", totalProfit - rejadagi.reduce((s, r) => s + r.summa, 0) >= 0 ? "text-emerald-600" : "text-red-500")}>
                {totalProfit - rejadagi.reduce((s, r) => s + r.summa, 0) < 0 ? "-" : ""}
                {fmt(totalProfit - rejadagi.reduce((s, r) => s + r.summa, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalFilial && modalData && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-elevated w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{modalFilial} — Batafsil</h3>
              <button onClick={() => setModalFilial(null)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="rounded-xl p-4 border border-emerald-100 bg-emerald-50">
                <p className="text-xs text-emerald-700 font-medium mb-1">Jami daromad</p>
                <p className="text-xl font-bold text-emerald-900 num">{fmt(modalData.revenue)}</p>
              </div>
              <div className="rounded-xl p-4 border border-red-100 bg-red-50">
                <p className="text-xs text-red-700 font-medium mb-1">Jami xarajat</p>
                <p className="text-xl font-bold text-red-900 num">{fmt(modalData.expenses)}</p>
              </div>
              <div className={cn("rounded-xl p-4 border", modalData.profit < 0 ? "border-red-100 bg-red-50" : "border-blue-100 bg-blue-50")}>
                <p className={cn("text-xs font-medium mb-1", modalData.profit < 0 ? "text-red-700" : "text-blue-700")}>Sof foyda</p>
                <p className={cn("text-xl font-bold num", modalData.profit < 0 ? "text-red-600" : "text-blue-900")}>{modalData.profit < 0 ? "-" : ""}{fmt(modalData.profit)}</p>
              </div>
              <div className={cn("rounded-xl p-4 border", totalProfit < 0 ? "border-red-100 bg-red-50" : "border-purple-100 bg-purple-50")}>
                <p className={cn("text-xs font-medium mb-1", totalProfit < 0 ? "text-red-700" : "text-purple-700")}>Umumiy sof foyda (2 filial)</p>
                <p className={cn("text-xl font-bold num", totalProfit < 0 ? "text-red-600" : "text-purple-900")}>{totalProfit < 0 ? "-" : ""}{fmt(totalProfit)}</p>
                <p className={cn("text-xs mt-1", totalProfit < 0 ? "text-red-500" : "text-purple-600")}>
                  Novza: {novzaProfit < 0 ? "-" : ""}{fmt(novzaProfit)} + Yunusobod: {yunusobodProfit < 0 ? "-" : ""}{fmt(yunusobodProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* График */}
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
                {expenseBreakdown.map(e => (
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

      {/* Filtr */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-4">
        <h3 className="font-semibold mb-4">Filtr</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Turi</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
              {["Barchasi", "Kirim", "Chiqim"].map(v => (
                <button key={v} onClick={() => setFilterKirim(v)}
                  className={cn("flex-1 py-2 px-2 transition border-r border-border last:border-0 text-xs",
                    filterKirim === v ? (v === "Kirim" ? "bg-emerald-600 text-white" : v === "Chiqim" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground") : "bg-background text-muted-foreground hover:text-foreground")}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
              {["Barchasi", "Novza", "Yunusobod"].map(v => (
                <button key={v} onClick={() => setFilterFilial(v)}
                  className={cn("flex-1 py-2 px-2 transition border-r border-border last:border-0 text-xs",
                    filterFilial === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Dan</label><input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Gacha</label><input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Tranzaksiyalar ({tableFiltered.length})</h3>
          {(filterKirim !== "Barchasi" || filterFilial !== "Barchasi" || filterFrom || filterTo) && (
            <button onClick={() => { setFilterKirim("Barchasi"); setFilterFilial("Barchasi"); setFilterFrom(""); setFilterTo(""); }}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary">Filterni tozalash</button>
          )}
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
              {[...tableFiltered].reverse().map((r, i) => (
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
