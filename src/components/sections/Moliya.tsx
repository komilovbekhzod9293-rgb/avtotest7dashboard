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

interface Bucket { id: string; nomi: string; summa: number; kun: number; chiqimTuri: string; hasDate: boolean; }
const BUCKETS: Bucket[] = [
  { id: "ikrom",     nomi: "Ikrom Bekturdiyev (sherik)",  summa: 15000000, kun: 3,  chiqimTuri: "Mavsumiy sherik Ikrom aka",   hasDate: true  },
  { id: "oqit_op",   nomi: "O'qituvchilar + operatorlar", summa: 38000000, kun: 4,  chiqimTuri: "Oylik",                       hasDate: true  },
  { id: "rahbar_7",  nomi: "Rahbarlar oyligi (7-kun)",    summa: 26000000, kun: 7,  chiqimTuri: "Foyda",                       hasDate: true  },
  { id: "ar_novza",  nomi: "Novza filial arendasi",       summa: 18000000, kun: 7,  chiqimTuri: "Arenda Novza",                hasDate: true  },
  { id: "ar_yunus",  nomi: "Yunusobod filial arendasi",   summa: 8500000,  kun: 9,  chiqimTuri: "Arenda Yunusobod",            hasDate: true  },
  { id: "doniyor",   nomi: "Doniyor aka (sherik)",        summa: 20000000, kun: 10, chiqimTuri: "Mavsumiy sherik doniyor aka", hasDate: true  },
  { id: "rahbar_14", nomi: "Rahbarlar oyligi (14-kun)",   summa: 26000000, kun: 14, chiqimTuri: "Foyda",                       hasDate: true  },
  { id: "rop",       nomi: "Rop oyligi",                  summa: 7000000,  kun: 15, chiqimTuri: "Oylik",                       hasDate: true  },
  { id: "operator2", nomi: "2 operator oyligi",           summa: 10000000, kun: 20, chiqimTuri: "Oylik",                       hasDate: true  },
  { id: "rahbar_21", nomi: "Rahbarlar oyligi (21-kun)",   summa: 26000000, kun: 21, chiqimTuri: "Foyda",                       hasDate: true  },
  { id: "rahbar_28", nomi: "Rahbarlar oyligi (28-kun)",   summa: 26000000, kun: 28, chiqimTuri: "Foyda",                       hasDate: true  },
  { id: "soliq",     nomi: "Soliq",                       summa: 5000000,  kun: 31, chiqimTuri: "Soliq",                       hasDate: false },
  { id: "marketing", nomi: "Marketing",                   summa: 10000000, kun: 31, chiqimTuri: "Marketing",                   hasDate: false },
  { id: "ofis",      nomi: "Ofis xarajatlari",            summa: 6000000,  kun: 31, chiqimTuri: "Ofis harajat",                hasDate: false },
  { id: "ai",        nomi: "AI xarajatlari",              summa: 3000000,  kun: 31, chiqimTuri: "AI harajatlari",              hasDate: false },
  { id: "ehson",     nomi: "Ehson / Xayriya",             summa: 1000000,  kun: 31, chiqimTuri: "Ehson/Xayriya",              hasDate: false },
  { id: "invest_future", nomi: "Invest Future",           summa: 30000000, kun: 31, chiqimTuri: "Invest Future",              hasDate: true  },
  { id: "podushka",  nomi: "Moliyaviy yostiq (zaxira)",   summa: 5000000,  kun: 31, chiqimTuri: "",                            hasDate: false },
];

function findClosestBucket(buckets: Bucket[], txKun: number): Bucket {
  let closest = buckets[0];
  let minDiff = Math.abs(txKun - buckets[0].kun);
  for (let i = 1; i < buckets.length; i++) {
    const diff = Math.abs(txKun - buckets[i].kun);
    if (diff < minDiff) { minDiff = diff; closest = buckets[i]; }
  }
  return closest;
}

interface TaqsimItem {
  id: string; nomi: string; kerak: number;
  toplangan: number; foiz: number;
  foizReal: number; foizKassa: number;
  targetKun: number; kunQoldi: number;
  kechikkan: boolean;
  yetarli: boolean; tolanganReal: boolean;
  tolanganSumma: number; hasDate: boolean;
}
interface TaqsimResult {
  items: TaqsimItem[]; kunlikKirim: number; tahlilOylar: string[]; qolgan: number;
}

function taqsimla(rows: Row[], bugun: Date): TaqsimResult {
  const oylar: { oy: number; yil: number }[] = [];
  for (let i = 1; i <= 2; i++) {
    const d = new Date(bugun.getFullYear(), bugun.getMonth() - i, 1);
    oylar.push({ oy: d.getMonth(), yil: d.getFullYear() });
  }
  const tahlilOylar: string[] = [];
  let jamiKirim = 0; let kunSoni = 0;
  oylar.forEach(function(it) {
    const oy = it.oy; const yil = it.yil;
    const oyRows = rows.filter(function(r) {
      const p = r.sana.split(".");
      if (p.length < 3) return false;
      return parseInt(p[1]) - 1 === oy && parseInt(p[2]) === yil && r.summa > 0;
    });
    if (oyRows.length === 0) return;
    jamiKirim += oyRows.reduce(function(s, r) { return s + r.summa; }, 0);
    kunSoni += new Date(yil, oy + 1, 0).getDate();
    tahlilOylar.push(UZ_MONTHS[oy] + " " + yil);
  });
  if (kunSoni === 0) {
    const joriy = rows.filter(function(r) {
      const p = r.sana.split(".");
      if (p.length < 3) return false;
      return parseInt(p[1]) - 1 === bugun.getMonth() && parseInt(p[2]) === bugun.getFullYear() && r.summa > 0;
    });
    jamiKirim = joriy.reduce(function(s, r) { return s + r.summa; }, 0);
    kunSoni = bugun.getDate();
    tahlilOylar.push(UZ_MONTHS[bugun.getMonth()] + " " + bugun.getFullYear() + " (joriy oy)");
  }
  const kunlikKirim = kunSoni > 0 ? Math.round(jamiKirim / kunSoni) : 0;

  const kassaKirim = rows.filter(function(r) { return r.summa > 0; }).reduce(function(s, r) { return s + r.summa; }, 0);
  const kassaChiqim = rows.filter(function(r) { return r.summa < 0; }).reduce(function(s, r) { return s + Math.abs(r.summa); }, 0);
  const kassa = Math.max(0, kassaKirim - kassaChiqim);

  const joriyOy = bugun.getMonth();
  const joriyYil = bugun.getFullYear();
  const bucketTolangan: Record<string, number> = {};
  rows.forEach(function(r) {
    const p = r.sana.split(".");
    if (p.length < 3) return;
    const rOy = parseInt(p[1]) - 1;
    const rYil = parseInt(p[2]);
    if (rOy !== joriyOy || rYil !== joriyYil) return;
    if (r.summa >= 0) return;
    const tur = r.chiqimTuri || "";
    if (!tur) return;
    const txKun = parseInt(p[0]);
    const matching = BUCKETS.filter(function(b) { return b.chiqimTuri === tur && b.hasDate; });
    if (matching.length === 0) {
      const bezdateMatch = BUCKETS.find(function(b) { return b.chiqimTuri === tur && !b.hasDate; });
      if (bezdateMatch) bucketTolangan[bezdateMatch.id] = (bucketTolangan[bezdateMatch.id] || 0) + Math.abs(r.summa);
      return;
    }
    if (matching.length === 1) {
      bucketTolangan[matching[0].id] = (bucketTolangan[matching[0].id] || 0) + Math.abs(r.summa);
      return;
    }
    const closest = findClosestBucket(matching, txKun);
    bucketTolangan[closest.id] = (bucketTolangan[closest.id] || 0) + Math.abs(r.summa);
  });

  const items: TaqsimItem[] = BUCKETS.map(function(b) {
    let targetSana: Date;
    let kechikkan = false;
    if (b.kun === 31) {
      targetSana = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0);
    } else {
      const buOyda = new Date(bugun.getFullYear(), bugun.getMonth(), b.kun);
      if (buOyda <= bugun) {
        targetSana = buOyda;
        kechikkan = true;
      } else {
        targetSana = buOyda;
        kechikkan = false;
      }
    }
    const kunQoldi = kechikkan ? 0 : Math.max(1, Math.ceil((targetSana.getTime() - bugun.getTime()) / 86400000));
    const tolanganSumma = Math.min(b.summa, bucketTolangan[b.id] || 0);
    const tolanganReal = tolanganSumma >= b.summa * 0.95;
    if (tolanganReal) kechikkan = false;
    return {
      id: b.id, nomi: b.nomi, kerak: b.summa,
      toplangan: 0, foiz: 0, foizReal: 0, foizKassa: 0,
      targetKun: b.kun, kunQoldi: kunQoldi,
      kechikkan: kechikkan,
      yetarli: false, tolanganReal: tolanganReal,
      tolanganSumma: tolanganSumma,
      hasDate: b.hasDate,
    };
  });

  const kassaBezdatnyx = kassa * 0.14;
  const kassaDatli = kassa * 0.86;

  const bezDate = items.filter(function(i) { return !i.hasDate && !i.tolanganReal; });
  if (bezDate.length > 0) {
    const ulush = kassaBezdatnyx / bezDate.length;
    bezDate.forEach(function(item) {
      const qoldi = item.kerak - item.tolanganSumma;
      item.toplangan = Math.min(ulush, qoldi);
    });
  }

  const withDate = items.filter(function(i) { return i.hasDate && !i.tolanganReal; });
  withDate.sort(function(a, b) {
    if (a.kechikkan && !b.kechikkan) return -1;
    if (!a.kechikkan && b.kechikkan) return 1;
    return a.kunQoldi - b.kunQoldi;
  });

  let qolganBudjet = kassaDatli;
  withDate.forEach(function(item) {
    if (qolganBudjet <= 0) return;
    const qoldi = item.kerak - item.tolanganSumma;
    const ajratildi = Math.min(qolganBudjet, qoldi);
    item.toplangan = ajratildi;
    qolganBudjet -= ajratildi;
  });

  items.forEach(function(i) {
    i.foizReal = Math.min(100, Math.round((i.tolanganSumma / i.kerak) * 100));
    i.foizKassa = Math.min(100 - i.foizReal, Math.round((i.toplangan / i.kerak) * 100));
    i.foiz = Math.min(100, i.foizReal + i.foizKassa);
    i.yetarli = i.foiz >= 100;
  });

  items.sort(function(a, b) {
    if (a.hasDate && !b.hasDate) return -1;
    if (!a.hasDate && b.hasDate) return 1;
    if (a.hasDate && b.hasDate) return a.targetKun - b.targetKun;
    return 0;
  });

  return { items, kunlikKirim, tahlilOylar, qolgan: kassa };
}

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("ru-RU") + " so'm";
const fmtFull = (n: number) => Math.round(Math.abs(n)).toLocaleString("ru-RU");

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
  return now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");
}

function inputToSheetDate(input: string): string {
  const parts = input.split("-");
  if (parts.length < 3) return "";
  return parts[2] + "." + parts[1] + "." + parts[0];
}

function formatSummaInput(val: string): string {
  return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

type Period = "kun" | "hafta" | "oy" | "barchasi";
interface Row { sana: string; ism: string; filial: string; turi: string; summa: number; kirimChiqim: string; izoh: string; chiqimTuri: string; }
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
  const [taqsimOpen, setTaqsimOpen] = useState(false);
  const [tahlilOpen, setTahlilOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("https://sheets.googleapis.com/v4/spreadsheets/" + SHEET_ID + "/values/" + SHEET_NAME + "?key=" + API_KEY)
      .then(function(res) { if (!res.ok) throw new Error("API xatosi: " + res.status); return res.json(); })
      .then(function(data) {
        const allRows = data.values as string[][];
        const dataRows = allRows.slice(1);
        setRows(dataRows.filter(function(r) { return r.length >= 6 && r[0] && r[5]; }).map(function(r) {
          return {
            sana: r[0] || "", ism: r[1] || "", filial: r[2] || "", turi: r[4] || "",
            summa: parseSumma(r[5]), kirimChiqim: r[6] || "", izoh: r[7] || "",
            chiqimTuri: r[8] || "",
          };
        }));
      })
      .catch(function(e) { setError(e.message); })
      .finally(function() { setLoading(false); });
  };

  const fetchRejadagi = () => {
    setRejadagiLoading(true);
    fetch("https://sheets.googleapis.com/v4/spreadsheets/" + REJADAGI_SHEET_ID + "/values/Лист1?key=" + API_KEY)
      .then(function(res) { if (!res.ok) throw new Error(); return res.json(); })
      .then(function(data) {
        const allRows = (data.values || []) as string[][];
        const dataRows = allRows.slice(1);
        setRejadagi(
          dataRows
            .filter(function(r) { return r.length >= 3 && r[0] && r[3] !== "tolov qilindi"; })
            .map(function(r) {
              return {
                nomi: r[0] || "", sana: r[1] || "",
                summa: parseFloat((r[2] || "").replace(/\s/g, "")) || 0,
                status: r[3] || "rejada", izoh: r[4] || "",
              };
            })
        );
      })
      .catch(function() {})
      .finally(function() { setRejadagiLoading(false); });
  };

  useEffect(function() { fetchData(); fetchRejadagi(); }, []);

  async function submitForm() {
    if (!formIsm || !formSumma) { setFormResult("Ism va summani kiriting"); return; }
    setFormLoading(true); setFormResult(null);
    const summaNum = parseInt(formSumma.replace(/\s/g, ""));
    const finalSumma = formKirim === "Chiqim" ? -summaNum : summaNum;
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sana: inputToSheetDate(formSana), ism: formIsm, filial: formFilial, online_offline: formOnline, telefon: formTelefon, turi: formTuri, summa: finalSumma, kirim_chiqim: formKirim, izoh: formIzoh }),
      });
      setFormResult("Muvaffaqiyatli saqlandi!");
      setFormIsm(""); setFormSumma(""); setFormIzoh(""); setFormTelefon(""); setFormSana(todayInputFormat());
      setTimeout(function() { fetchData(); }, 2000);
    } catch { setFormResult("Xatolik yuz berdi"); }
    finally { setFormLoading(false); }
  }

  async function submitRejadagi() {
    if (!rejNomi || !rejSumma) { setRejResult("Nomi va summani kiriting"); return; }
    setRejLoading(true); setRejResult(null);
    try {
      await fetch(REJADAGI_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", nomi: rejNomi, sana: inputToSheetDate(rejSana), summa: parseInt(rejSumma.replace(/\s/g, "")), izoh: rejIzoh, status: "rejada" }),
      });
      setRejResult("Saqlandi!");
      setRejNomi(""); setRejSumma(""); setRejIzoh(""); setRejSana(todayInputFormat());
      setTimeout(function() { fetchRejadagi(); }, 2000);
    } catch { setRejResult("Xatolik"); }
    finally { setRejLoading(false); }
  }

  async function submitOnline() {
    if (!onlineIsm || !onlineSumma || !onlineTelefon) { setOnlineResult("Barcha maydonlarni toldiring"); return; }
    setOnlineLoading(true); setOnlineResult(null);
    try {
      await fetch(ONLINE_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ism: onlineIsm, telefon: onlineTelefon, summa: parseInt(onlineSumma.replace(/\s/g, "")), sana: inputToSheetDate(onlineSana) }),
      });
      setOnlineResult("Saqlandi!");
      setOnlineIsm(""); setOnlineTelefon(""); setOnlineSumma(""); setOnlineSana(todayInputFormat());
      setTimeout(function() { fetchData(); }, 2000);
    } catch { setOnlineResult("Xatolik yuz berdi"); }
    finally { setOnlineLoading(false); }
  }

  async function tolovQilindi(item: RejadagiRow, index: number) {
    setTolovLoading(index);
    try {
      await fetch(REJADAGI_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tolov_qilindi", nomi: item.nomi, sana: item.sana, summa: item.summa, izoh: item.izoh }),
      });
      setTimeout(function() { fetchRejadagi(); }, 2000);
    } catch {}
    finally { setTolovLoading(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span>Yuklanmoqda</span></div>;
  if (error) return <div className="flex items-center justify-center h-64 gap-3 text-danger"><AlertCircle className="h-5 w-5" /><span>Xatolik: {error}</span></div>;

  const now = new Date();
  const periodFiltered = rows.filter(function(r) {
    if (period === "barchasi") return true;
    const d = parseDate(r.sana);
    if (!d) return false;
    if (period === "kun") return d.toDateString() === now.toDateString();
    if (period === "hafta") return (now.getTime() - d.getTime()) / (1000*60*60*24) >= 0 && (now.getTime() - d.getTime()) / (1000*60*60*24) < 7;
    if (period === "oy") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalRevenue  = periodFiltered.filter(function(r) { return r.summa > 0; }).reduce(function(s, r) { return s + r.summa; }, 0);
  const totalExpenses = periodFiltered.filter(function(r) { return r.summa < 0; }).reduce(function(s, r) { return s + Math.abs(r.summa); }, 0);
  const totalProfit   = totalRevenue - totalExpenses;
  const margin        = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const novzaRevenue    = periodFiltered.filter(function(r) { return r.summa > 0 && r.filial === "Novza"; }).reduce(function(s, r) { return s + r.summa; }, 0);
  const novzaExpenses   = periodFiltered.filter(function(r) { return r.summa < 0 && r.filial === "Novza"; }).reduce(function(s, r) { return s + Math.abs(r.summa); }, 0);
  const novzaProfit     = novzaRevenue - novzaExpenses;
  const yunusobodRevenue  = periodFiltered.filter(function(r) { return r.summa > 0 && r.filial === "Yunusobod"; }).reduce(function(s, r) { return s + r.summa; }, 0);
  const yunusobodExpenses = periodFiltered.filter(function(r) { return r.summa < 0 && r.filial === "Yunusobod"; }).reduce(function(s, r) { return s + Math.abs(r.summa); }, 0);
  const yunusobodProfit   = yunusobodRevenue - yunusobodExpenses;

  const taqsim = taqsimla(rows, now);
  const yetarliSon = taqsim.items.filter(function(i) { return i.tolanganReal || i.foiz >= 100; }).length;
  const xatarliSon = taqsim.items.filter(function(i) { return !i.tolanganReal && i.foiz < 100 && i.hasDate && (i.kunQoldi <= 3 || i.kechikkan); }).length;

  const tableFiltered = periodFiltered.filter(function(r) {
    if (filterKirim === "Kirim" && r.summa < 0) return false;
    if (filterKirim === "Chiqim" && r.summa > 0) return false;
    if (filterFilial !== "Barchasi" && r.filial !== filterFilial) return false;
    if (filterFrom) { const d = parseDate(r.sana); const from = parseDate(inputToSheetDate(filterFrom)); if (d && from && d < from) return false; }
    if (filterTo) { const d = parseDate(r.sana); const to = parseDate(inputToSheetDate(filterTo)); if (d && to && d > to) return false; }
    return true;
  });

  const monthMap: Record<string, { revenue: number; expenses: number }> = {};
  periodFiltered.forEach(function(r) {
    const parts = r.sana.split(".");
    if (parts.length < 2) return;
    const key = UZ_MONTHS[parseInt(parts[1], 10) - 1] || r.sana;
    if (!monthMap[key]) monthMap[key] = { revenue: 0, expenses: 0 };
    if (r.summa > 0) monthMap[key].revenue += r.summa;
    else monthMap[key].expenses += Math.abs(r.summa);
  });
  const chartData = Object.entries(monthMap).map(function(entry) {
    const month = entry[0]; const v = entry[1];
    return { month: month, "Daromad": Math.round(v.revenue / 1000000), "Foyda": Math.round((v.revenue - v.expenses) / 1000000) };
  });

  const filialMap: Record<string, number> = {};
  periodFiltered.filter(function(r) { return r.summa < 0; }).forEach(function(r) {
    const k = r.filial || "Boshqa";
    filialMap[k] = (filialMap[k] || 0) + Math.abs(r.summa);
  });
  const totalExp = Object.values(filialMap).reduce(function(a, b) { return a + b; }, 0) || 1;
  const expenseBreakdown = Object.entries(filialMap).map(function(entry, i) {
    return { name: entry[0], value: Math.round((entry[1] / totalExp) * 100), color: EXPENSE_COLORS[i % EXPENSE_COLORS.length] };
  });

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
        {periods.map(function(p) {
          return (
            <button key={p.id} onClick={function() { setPeriod(p.id); }}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition", period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
              {p.label}
            </button>
          );
        })}
        <div className="ml-auto flex gap-2">
          <button onClick={function() { setShowOnlineForm(!showOnlineForm); setOnlineResult(null); if (showForm) setShowForm(false); if (showRejadagiForm) setShowRejadagiForm(false); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2", showOnlineForm ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {showOnlineForm ? <X className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {showOnlineForm ? "Yopish" : "Online to'lov"}
          </button>
          <button onClick={function() { setShowRejadagiForm(!showRejadagiForm); setRejResult(null); if (showForm) setShowForm(false); if (showOnlineForm) setShowOnlineForm(false); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2", showRejadagiForm ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {showRejadagiForm ? <X className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
            {showRejadagiForm ? "Yopish" : "Rejadagi xarajat"}
          </button>
          <button onClick={function() { setShowForm(!showForm); setFormResult(null); if (showRejadagiForm) setShowRejadagiForm(false); if (showOnlineForm) setShowOnlineForm(false); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2", showForm ? "bg-primary text-primary-foreground" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Yopish" : "Yangi yozuv"}
          </button>
        </div>
      </div>

      {showOnlineForm && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-4 w-4" />Online to'lov qo'shish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Ism Familya</label><input type="text" value={onlineIsm} onChange={function(e) { setOnlineIsm(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Telefon raqami</label><input type="tel" placeholder="+998 90 000 00 00" value={onlineTelefon} onChange={function(e) { setOnlineTelefon(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Summa (so'm)</label><input type="text" value={onlineSumma} onChange={function(e) { setOnlineSumma(formatSummaInput(e.target.value)); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Sana</label><input type="date" value={onlineSana} onChange={function(e) { setOnlineSana(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          </div>
          <button onClick={submitOnline} disabled={onlineLoading} className="px-6 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition disabled:opacity-50 inline-flex items-center gap-2">
            {onlineLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda</> : "Saqlash"}
          </button>
          {onlineResult && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium inline-block ml-3", onlineResult.startsWith("Saqlandi") ? "text-emerald-700" : "text-red-600")}>{onlineResult}</div>}
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" />Yangi kirim / chiqim</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Sana</label><input type="date" value={formSana} onChange={function(e) { setFormSana(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Ism Familya</label><input type="text" value={formIsm} onChange={function(e) { setFormIsm(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Telefon raqami</label><input type="tel" placeholder="+998 90 000 00 00" value={formTelefon} onChange={function(e) { setFormTelefon(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Summa (so'm)</label><input type="text" value={formSumma} onChange={function(e) { setFormSumma(formatSummaInput(e.target.value)); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Filial</label><Toggle left="Novza" right="Yunusobod" value={formFilial} onChange={setFormFilial} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Turi</label><Toggle left="Naqd" right="Karta" value={formTuri} onChange={setFormTuri} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Online / Offline</label><Toggle left="Offline" right="Online" value={formOnline} onChange={setFormOnline} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Kirim / Chiqim</label><Toggle left="Kirim" right="Chiqim" value={formKirim} onChange={setFormKirim} leftColor="bg-emerald-600 text-white" rightColor="bg-red-500 text-white" /></div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Izoh (ixtiyoriy)</label><input type="text" value={formIzoh} onChange={function(e) { setFormIzoh(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          </div>
          <button onClick={submitForm} disabled={formLoading} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-2">
            {formLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda</> : "Saqlash"}
          </button>
          {formResult && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium", formResult.startsWith("Muvaffaqiyatli") ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100")}>{formResult}</div>}
        </div>
      )}

      {showRejadagiForm && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><CalendarClock className="h-4 w-4" />Rejadagi xarajat qo'shish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Xarajat nomi</label><input type="text" placeholder="Ijara, Maosh..." value={rejNomi} onChange={function(e) { setRejNomi(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Sana / Oy</label><input type="date" value={rejSana} onChange={function(e) { setRejSana(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Summa (so'm)</label><input type="text" value={rejSumma} onChange={function(e) { setRejSumma(formatSummaInput(e.target.value)); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Izoh</label><input type="text" value={rejIzoh} onChange={function(e) { setRejIzoh(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          </div>
          <button onClick={submitRejadagi} disabled={rejLoading} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2">
            {rejLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda</> : "Saqlash"}
          </button>
          {rejResult && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium inline-block ml-3", rejResult.startsWith("Saqlandi") ? "text-emerald-700" : "text-red-600")}>{rejResult}</div>}
        </div>
      )}

      <div className={cn("rounded-2xl p-5 shadow-soft border mb-4", totalProfit < 0 ? "border-red-200 bg-gradient-to-br from-red-50 to-white" : "border-purple-100 bg-gradient-to-br from-purple-50 to-white")}>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className={cn("rounded-2xl p-5 shadow-soft border cursor-pointer transition", novzaProfit < 0 ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300" : "border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300")} onClick={function() { setModalFilial("Novza"); }}>
          <p className={cn("text-sm font-medium mb-2", novzaProfit < 0 ? "text-red-700" : "text-blue-700")}>Novza — Sof foyda</p>
          <p className={cn("text-2xl font-bold num", novzaProfit < 0 ? "text-red-600" : "text-blue-900")}>{novzaProfit < 0 ? "-" : ""}{fmt(novzaProfit)}</p>
          <p className={cn("text-xs mt-2", novzaProfit < 0 ? "text-red-500" : "text-blue-600")}>Batafsil ko'rish</p>
        </div>
        <div className={cn("rounded-2xl p-5 shadow-soft border cursor-pointer transition", yunusobodProfit < 0 ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300" : "border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300")} onClick={function() { setModalFilial("Yunusobod"); }}>
          <p className={cn("text-sm font-medium mb-2", yunusobodProfit < 0 ? "text-red-700" : "text-blue-700")}>Yunusobod — Sof foyda</p>
          <p className={cn("text-2xl font-bold num", yunusobodProfit < 0 ? "text-red-600" : "text-blue-900")}>{yunusobodProfit < 0 ? "-" : ""}{fmt(yunusobodProfit)}</p>
          <p className={cn("text-xs mt-2", yunusobodProfit < 0 ? "text-red-500" : "text-blue-600")}>Batafsil ko'rish</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft mb-6 overflow-hidden">
        <div onClick={function() { setTaqsimOpen(function(v) { return !v; }); }} className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition cursor-pointer">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Pul taqsimoti</span>
              <span onClick={function(e) { e.stopPropagation(); setTahlilOpen(function(v) { return !v; }); setTaqsimOpen(true); }} className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition cursor-pointer">
                <Info className="h-3 w-3" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {xatarliSon > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />{xatarliSon} xatar
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />{yetarliSon}/{taqsim.items.length} yopildi
              </span>
              <span className="text-xs text-muted-foreground">· ~{fmt(taqsim.kunlikKirim)}/kun</span>
            </div>
          </div>
          {taqsimOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>

        {taqsimOpen && tahlilOpen && (
          <div className="mx-5 mb-3 p-4 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900">
            <p className="font-semibold mb-2">Nima asosida taqsimlanyapti?</p>
            <p className="mb-2">Kassaning 14% sanasiz xarajatlarga teng taqsimlanadi. 86% sanali xarajatlarga kaskad usulida.</p>
            <p className="mb-1">🟢 To'q yashil = haqiqatda to'langan · 🟩 Och yashil = kassadan zaxiralangan</p>
            <p className="text-blue-700">🔴 Kechikmoqda = sana o'tib ketgan, hali to'lanmagan</p>
          </div>
        )}

        {taqsimOpen && (
          <div className="px-5 pb-5">
            <div className="space-y-2">
              {taqsim.items.map(function(v) {
                const isGreen = v.tolanganReal || v.foiz >= 100;
                const isXatar = !v.tolanganReal && v.foiz < 100 && v.hasDate && (v.kunQoldi <= 3 || v.kechikkan);
                const bgClass = isGreen
                  ? "border-emerald-200 bg-emerald-50"
                  : isXatar
                    ? "border-red-200 bg-red-50"
                    : "border-border bg-background";

                return (
                  <div key={v.id} className={cn("p-3 rounded-xl border", bgClass)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {isGreen
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          : <Clock className={cn("h-3.5 w-3.5 shrink-0", isXatar ? "text-red-500" : "text-muted-foreground")} />}
                        <span className={cn(
                          "font-medium text-sm truncate",
                          v.tolanganReal ? "line-through text-emerald-600" :
                          isGreen ? "text-emerald-700" : ""
                        )}>{v.nomi}</span>
                        {v.tolanganReal && <span className="text-xs text-emerald-600 font-semibold shrink-0 ml-1">To'landi</span>}
                        {!v.tolanganReal && isGreen && <span className="text-xs text-emerald-600 font-semibold shrink-0 ml-1">Kassada bor</span>}
                        {v.kechikkan && !v.tolanganReal && (
                          <span className="text-xs text-red-600 font-semibold shrink-0 ml-1 inline-flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" />Kechikmoqda
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {v.hasDate ? (v.targetKun === 31 ? "Oy oxiri" : v.targetKun + "-kun") : "Oy davomida"}
                          {v.hasDate && !v.kechikkan && " · " + v.kunQoldi + " kun qoldi"}
                          {v.hasDate && v.kechikkan && !v.tolanganReal && " · to'lanmagan"}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-secondary overflow-hidden mb-1">
                      <div className="h-full flex">
                        {v.foizReal > 0 && (
                          <div className="h-full bg-emerald-600 transition-all" style={{ width: v.foizReal + "%" }} />
                        )}
                        {v.foizKassa > 0 && (
                          <div className="h-full bg-emerald-300 transition-all" style={{ width: v.foizKassa + "%" }} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="num text-muted-foreground flex items-center gap-2">
                        {v.tolanganSumma > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-600" />
                            {fmtFull(v.tolanganSumma)}
                          </span>
                        )}
                        {v.toplangan > 0 && !v.tolanganReal && (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-300" />
                            {fmtFull(v.toplangan)}
                          </span>
                        )}
                        <span className="text-muted-foreground">/ {fmtFull(v.kerak)} so'm</span>
                      </span>
                      <span className={cn("font-semibold",
                        isGreen ? "text-emerald-600" :
                        isXatar ? "text-red-500" :
                        "text-muted-foreground")}>
                        {v.foiz}%{!isGreen ? " · " + fmtFull(v.kerak - v.tolanganSumma - v.toplangan) + " kerak" : " ✓"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Kassada qolgan pul (sof foyda)</span>
              <span className={cn("num font-bold text-sm", taqsim.qolgan > 0 ? "text-emerald-600" : "text-muted-foreground")}>{fmt(taqsim.qolgan)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Rejadagi xarajatlar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Joriy sof foyda: <span className={cn("font-semibold", totalProfit < 0 ? "text-red-500" : "")}>{totalProfit < 0 ? "-" : ""}{fmt(totalProfit)}</span></p>
          </div>
        </div>
        {rejadagiLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4"><Loader2 className="h-4 w-4 animate-spin" /><span>Yuklanmoqda</span></div>
        ) : rejadagi.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Rejadagi xarajatlar yo'q</p>
        ) : (
          <div className="space-y-2">
            {rejadagi.map(function(item, i) {
              const covered = totalProfit >= item.summa;
              return (
                <div key={i} className={cn("flex items-center justify-between p-4 rounded-xl border transition", covered ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                  <div className="flex items-center gap-3">
                    {covered ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Clock className="h-5 w-5 text-red-400 shrink-0" />}
                    <div>
                      <p className={cn("font-semibold text-sm", covered ? "text-emerald-900" : "text-red-900")}>{item.nomi}</p>
                      <p className={cn("text-xs mt-0.5", covered ? "text-emerald-600" : "text-red-500")}>{item.sana}{item.izoh ? " · " + item.izoh : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={cn("num font-bold text-sm", covered ? "text-emerald-700" : "text-red-600")}>{fmt(item.summa)}</p>
                    {covered && (
                      <button onClick={function() { tolovQilindi(item, i); }} disabled={tolovLoading === i} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap">
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
              <span className="num font-bold text-sm">{fmt(rejadagi.reduce(function(s, r) { return s + r.summa; }, 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Xarajatlardan keyin qoladi</span>
              <span className={cn("num font-bold text-sm", totalProfit - rejadagi.reduce(function(s, r) { return s + r.summa; }, 0) >= 0 ? "text-emerald-600" : "text-red-500")}>
                {totalProfit - rejadagi.reduce(function(s, r) { return s + r.summa; }, 0) < 0 ? "-" : ""}
                {fmt(totalProfit - rejadagi.reduce(function(s, r) { return s + r.summa; }, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {modalFilial && modalData && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-elevated w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{modalFilial} — Batafsil</h3>
              <button onClick={function() { setModalFilial(null); }} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center"><X className="h-4 w-4" /></button>
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
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={function(val) { return [val + " mln", ""]; }} />
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
                    {expenseBreakdown.map(function(e, i) { return <Cell key={i} fill={e.color} />; })}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={function(val) { return [val + "%", ""]; }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {expenseBreakdown.map(function(e) {
                  return (
                    <div key={e.name} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />{e.name}</span>
                      <span className="num font-medium">{e.value}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-4">
        <h3 className="font-semibold mb-4">Filtr</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Turi</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
              {["Barchasi", "Kirim", "Chiqim"].map(function(v) {
                return (
                  <button key={v} onClick={function() { setFilterKirim(v); }} className={cn("flex-1 py-2 px-2 transition border-r border-border last:border-0 text:xs", filterKirim === v ? (v === "Kirim" ? "bg-emerald-600 text-white" : v === "Chiqim" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground") : "bg-background text-muted-foreground hover:text-foreground")}>{v}</button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
              {["Barchasi", "Novza", "Yunusobod"].map(function(v) {
                return (
                  <button key={v} onClick={function() { setFilterFilial(v); }} className={cn("flex-1 py-2 px-2 transition border-r border-border last:border-0 text-xs", filterFilial === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>{v}</button>
                );
              })}
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Dan</label><input type="date" value={filterFrom} onChange={function(e) { setFilterFrom(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Gacha</label><input type="date" value={filterTo} onChange={function(e) { setFilterTo(e.target.value); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Tranzaksiyalar ({tableFiltered.length})</h3>
          {(filterKirim !== "Barchasi" || filterFilial !== "Barchasi" || filterFrom || filterTo) && (
            <button onClick={function() { setFilterKirim("Barchasi"); setFilterFilial("Barchasi"); setFilterFrom(""); setFilterTo(""); }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary">Filterni tozalash</button>
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
              {tableFiltered.slice().reverse().map(function(r, i) {
                return (
                  <tr key={i} className="hover:bg-secondary/60 transition">
                    <td className="py-3 num text-muted-foreground">{r.sana}</td>
                    <td className="py-3 font-medium">{r.ism}</td>
                    <td className="py-3 text-muted-foreground">{r.filial}</td>
                    <td className="py-3 text-muted-foreground">{r.turi}</td>
                    <td className={"py-3 text-right num font-semibold " + (r.summa >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {r.summa >= 0 ? "+" : "-"}{fmt(Math.abs(r.summa))}
                    </td>
                    <td className="py-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.izoh || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
