import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import {
  Loader2, AlertCircle, Plus, X,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_ID  = "1StqPMbH2IWX_722F9MVp92gKOGitlTuUBVYrtZ7GUvI";
const API_KEY   = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const RANGE     = "%D0%9B%D0%B8%D1%81%D1%821!A:R";
const WEBHOOK   = "https://n8n.srv1215497.hstgr.cloud/webhook/admin";

const DEFAULT_HODIMLAR = [
  "Rayhon","Ziyoda","Jamshid","Dilshod",
  "Firdavs","Shamsiddin","Muslima","Diyor","Odil","Zarnigor","Begzod"
];

const VAQTLAR = ["10:00","13:00","15:00","19:00","21:00"];

type Period = "bugun" | "hafta" | "oy" | "barchasi";

interface Client {
  rowIndex:    number;
  nomer:       string;
  ism:         string;
  telefon:     string;
  filial:      string;
  darsKuni:    string;
  tolovKuni:   string;
  darsVaqti:   string;
  tolov:       string;
  tolandi:     string;
  qarzi:       string;
  tolovBekor:  string;
  nazariyS:    string;
  nazariy:     string;
  amaliyS:     string;
  amaliy:      string;
  hodim:       string;
}

function formatSumma(val: string): string {
  return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseSummaForEdit(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d,]/g, "");
  const intPart = cleaned.split(",")[0];
  if (!intPart || intPart === "0") return "";
  return formatSumma(intPart);
}

function parseClientDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function toSheetDate(input: string): string {
  const parts = input.split("-");
  if (parts.length < 3) return input;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function toInputDate(sheet: string): string {
  const cleaned = sheet.trim().replace(/,/g, ".");
  const parts = cleaned.split(".");
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  return "";
}

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function filterByPeriod(clients: Client[], period: Period): Client[] {
  if (period === "barchasi") return clients;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now).getTime();
  return clients.filter(c => {
    const d = parseClientDate(c.darsKuni);
    if (!d) return false;
    if (period === "bugun") return startOfDay(d).getTime() === todayStart;
    if (period === "hafta") {
      const diff = (now.getTime() - d.getTime()) / (1000*60*60*24);
      return diff >= 0 && diff < 7;
    }
    if (period === "oy") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function Toggle({ left, right, value, onChange }: {
  left: string; right: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
      <button onClick={() => onChange(left)} className={cn("flex-1 py-2 px-3 transition", value === left ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>{left}</button>
      <button onClick={() => onChange(right)} className={cn("flex-1 py-2 px-3 transition border-l border-border", value === right ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>{right}</button>
    </div>
  );
}

export function Baza() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [period,  setPeriod]  = useState<Period>("barchasi");
  const [search,  setSearch]  = useState("");
  const [filterFilial, setFilterFilial] = useState("Barchasi");
  const [hodimlar, setHodimlar] = useState<string[]>(() => {
    const saved = localStorage.getItem("hodimlar");
    return saved ? JSON.parse(saved) : DEFAULT_HODIMLAR;
  });

  const [showAdd,      setShowAdd]      = useState(false);
  const [addLoading,   setAddLoading]   = useState(false);
  const [addResult,    setAddResult]    = useState<string | null>(null);
  const [addIsm,       setAddIsm]       = useState("");
  const [addTelefon,   setAddTelefon]   = useState("");
  const [addFilial,    setAddFilial]    = useState("Novza");
  const [addDarsKuni,  setAddDarsKuni]  = useState(todayInput());
  const [addTolovKuni, setAddTolovKuni] = useState(todayInput());
  const [addDarsVaqti, setAddDarsVaqti] = useState("10:00");
  const [addTolov,     setAddTolov]     = useState("");
  const [addTolandi,   setAddTolandi]   = useState("");
  const [addQarzi,     setAddQarzi]     = useState("");
  const [addHodim,     setAddHodim]     = useState("Rayhon");
  const [addOnline,    setAddOnline]    = useState("Offline");

  const [showHodimMgr, setShowHodimMgr] = useState(false);
  const [newHodimName, setNewHodimName] = useState("");

  const [editClient,     setEditClient]     = useState<Client | null>(null);
  const [editLoading,    setEditLoading]    = useState(false);
  const [editResult,     setEditResult]     = useState<string | null>(null);
  const [editIsm,        setEditIsm]        = useState("");
  const [editTelefon,    setEditTelefon]    = useState("");
  const [editFilial,     setEditFilial]     = useState("Novza");
  const [editDarsKuni,   setEditDarsKuni]   = useState("");
  const [editTolovKuni,  setEditTolovKuni]  = useState("");
  const [editDarsVaqti,  setEditDarsVaqti]  = useState("");
  const [editTolov,      setEditTolov]      = useState("");
  const [editTolandi,    setEditTolandi]    = useState("");
  const [editQarzi,      setEditQarzi]      = useState("");
  const [editHodim,      setEditHodim]      = useState("");
  const [editTolovBekor, setEditTolovBekor] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`)
      .then(r => { if (!r.ok) throw new Error(`API xatosi: ${r.status}`); return r.json(); })
      .then(data => {
        const rows: string[][] = data.values ?? [];
        const parsed: Client[] = rows.slice(1)
          .filter(r => r.length >= 2 && r[1])
          .map((r, i) => ({
            rowIndex:   i + 2,
            nomer:      r[0]  ?? "",
            ism:        r[1]  ?? "",
            telefon:    r[2]  ?? "",
            filial:     r[3]  ?? "",
            darsKuni:   r[4]  ?? "",
            tolovKuni:  r[5]  ?? "",
            darsVaqti:  r[6]  ?? "",
            tolov:      r[7]  ?? "",
            tolandi:    r[8]  ?? "",
            qarzi:      r[9]  ?? "",
            tolovBekor: r[10] ?? "",
            nazariyS:   r[11] ?? "",
            nazariy:    r[12] ?? "",
            amaliyS:    r[13] ?? "",
            amaliy:     r[14] ?? "",
            hodim:      r[17] ?? "",
          }));
        setClients(parsed);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  function openEdit(c: Client) {
    setEditClient(c);
    setEditIsm(c.ism);
    setEditTelefon(c.telefon);
    setEditFilial(c.filial || "Novza");
    setEditDarsKuni(toInputDate(c.darsKuni));
    setEditTolovKuni(toInputDate(c.tolovKuni));
    setEditDarsVaqti(c.darsVaqti || "10:00");
    setEditTolov(parseSummaForEdit(c.tolov));
    setEditTolandi(parseSummaForEdit(c.tolandi));
    setEditQarzi(parseSummaForEdit(c.qarzi));
    setEditHodim(c.hodim || hodimlar[0]);
    setEditTolovBekor(c.tolovBekor?.toLowerCase() === "bekor");
    setEditResult(null);
  }

  async function submitAdd() {
    if (!addIsm || !addTelefon) { setAddResult("❌ Ism va telefonni kiriting"); return; }
    setAddLoading(true); setAddResult(null);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:     "add",
          ism:        addIsm,
          telefon:    addTelefon,
          filial:     addFilial,
          dars_kuni:  toSheetDate(addDarsKuni),
          tolov_kuni: toSheetDate(addTolovKuni),
          dars_vaqti: addDarsVaqti,
          tolov:      addTolov.replace(/\s/g, ""),
          tolandi:    addTolandi.replace(/\s/g, ""),
          qarzi:      addQarzi.replace(/\s/g, ""),
          hodim:      addHodim,
          online:     addOnline,
        }),
      });
      setAddResult("✅ Muvaffaqiyatli saqlandi!");
      setAddIsm(""); setAddTelefon(""); setAddTolov("");
      setAddTolandi(""); setAddQarzi("");
      setAddDarsKuni(todayInput()); setAddTolovKuni(todayInput());
      setTimeout(() => fetchData(), 2000);
    } catch { setAddResult("❌ Xatolik yuz berdi"); }
    finally { setAddLoading(false); }
  }

  async function submitEdit() {
    if (!editClient) return;
    setEditLoading(true); setEditResult(null);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:  "change",
          ism:     editClient.ism,
          telefon: editClient.telefon,
          row:     editClient.rowIndex,
          changes: {
            ism:         { old: editClient.ism,        new: editIsm },
            telefon:     { old: editClient.telefon,    new: editTelefon },
            filial:      { old: editClient.filial,     new: editFilial },
            dars_kuni:   { old: editClient.darsKuni,   new: toSheetDate(editDarsKuni) },
            tolov_kuni:  { old: editClient.tolovKuni,  new: toSheetDate(editTolovKuni) },
            dars_vaqti:  { old: editClient.darsVaqti,  new: editDarsVaqti },
            tolov:       { old: editClient.tolov,      new: editTolov.replace(/\s/g,"") },
            tolandi:     { old: editClient.tolandi,    new: editTolandi.replace(/\s/g,"") },
            qarzi:       { old: editClient.qarzi,      new: editQarzi.replace(/\s/g,"") },
            hodim:       { old: editClient.hodim,      new: editHodim },
            tolov_bekor: { old: editClient.tolovBekor, new: editTolovBekor ? "Bekor" : "" },
          },
        }),
      });
      setEditResult("✅ Saqlandi!");
      setEditClient(null);
      setTimeout(() => fetchData(), 2000);
    } catch { setEditResult("❌ Xatolik yuz berdi"); }
    finally { setEditLoading(false); }
  }

  function saveNewHodim() {
    if (!newHodimName.trim()) return;
    const updated = [...hodimlar, newHodimName.trim()];
    setHodimlar(updated);
    localStorage.setItem("hodimlar", JSON.stringify(updated));
    setNewHodimName("");
  }

  function removeHodim(name: string) {
    const updated = hodimlar.filter(h => h !== name);
    setHodimlar(updated);
    localStorage.setItem("hodimlar", JSON.stringify(updated));
  }

  const PERIODS: { id: Period; label: string }[] = [
    { id: "bugun",    label: "Bugun"    },
    { id: "hafta",    label: "Hafta"    },
    { id: "oy",       label: "Oy"       },
    { id: "barchasi", label: "Barchasi" },
  ];

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

  const periodFiltered = filterByPeriod(clients, period);
  const displayed = periodFiltered.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.ism.toLowerCase().includes(q) && !c.telefon.includes(q)) return false;
    if (filterFilial !== "Barchasi" && c.filial !== filterFilial) return false;
    return true;
  });

  return (
    <div>
      <Header title="Baza" subtitle="Mijozlar bazasi" />

      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
              period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {p.label}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={() => { setShowAdd(!showAdd); setAddResult(null); }}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
              showAdd ? "bg-primary text-primary-foreground" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdd ? "Yopish" : "Yangi mijoz"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" />Yangi mijoz qo'shish
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ism Familiya</label>
              <input type="text" value={addIsm} onChange={e => setAddIsm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Telefon Raqami</label>
              <input type="tel" value={addTelefon} onChange={e => setAddTelefon(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
              <Toggle left="Novza" right="Yunusobod" value={addFilial} onChange={setAddFilial} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dars Kuni</label>
              <input type="date" value={addDarsKuni} onChange={e => setAddDarsKuni(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To'lov Kuni</label>
              <input type="date" value={addTolovKuni} onChange={e => setAddTolovKuni(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dars Vaqti</label>
              <select value={addDarsVaqti} onChange={e => setAddDarsVaqti(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {VAQTLAR.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To'lov (so'm)</label>
              <input type="text" value={addTolov} onChange={e => setAddTolov(formatSumma(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To'landi (so'm)</label>
              <input type="text" value={addTolandi} onChange={e => setAddTolandi(formatSumma(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Qarzi (so'm)</label>
              <input type="text" value={addQarzi} onChange={e => setAddQarzi(formatSumma(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Online / Offline</label>
              <Toggle left="Offline" right="Online" value={addOnline} onChange={setAddOnline} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center justify-between">
                <span>Hodim</span>
                <button onClick={() => setShowHodimMgr(!showHodimMgr)}
                  className="text-xs text-primary hover:underline">
                  {showHodimMgr ? "Yopish" : "Boshqarish"}
                </button>
              </label>
              <select value={addHodim} onChange={e => setAddHodim(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {hodimlar.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {showHodimMgr && (
            <div className="bg-secondary rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold mb-3">Hodimlarni boshqarish</h4>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Yangi hodim ismi" value={newHodimName}
                  onChange={e => setNewHodimName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                <button onClick={saveNewHodim}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  Qo'shish
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hodimlar.map(h => (
                  <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1 bg-background border border-border rounded-full text-sm">
                    {h}
                    <button onClick={() => removeHodim(h)} className="text-muted-foreground hover:text-red-500 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={submitAdd} disabled={addLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 inline-flex items-center gap-2">
            {addLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
          </button>
          {addResult && (
            <span className={cn("ml-3 text-sm font-medium",
              addResult.startsWith("✅") ? "text-emerald-600" : "text-red-500")}>
              {addResult}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Ism yoki telefon..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm" />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
          {["Barchasi", "Novza", "Yunusobod"].map(f => (
            <button key={f} onClick={() => setFilterFilial(f)}
              className={cn("px-4 py-2 transition border-r border-border last:border-0",
                filterFilial === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Mijozlar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{displayed.length} ta mijoz</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Ism Familiya</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Filial</th>
                <th className="px-4 py-3 font-medium">Dars Kuni</th>
                <th className="px-4 py-3 font-medium">To'lov Kuni</th>
                <th className="px-4 py-3 font-medium">Vaqt</th>
                <th className="px-4 py-3 font-medium">To'lov</th>
                <th className="px-4 py-3 font-medium">To'landi</th>
                <th className="px-4 py-3 font-medium">Qarzi</th>
                <th className="px-4 py-3 font-medium">Hodim</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-16 text-center text-muted-foreground text-sm">Ma'lumot topilmadi</td></tr>
              ) : displayed.map((c, i) => (
                <tr key={i} className="hover:bg-secondary/40 transition cursor-pointer" onClick={() => openEdit(c)}>
                  <td className="px-4 py-3 text-muted-foreground">{c.nomer}</td>
                  <td className="px-4 py-3 font-medium text-primary hover:underline">{c.ism}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.telefon}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border",
                      c.filial === "Novza"
                        ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                        : "bg-purple-500/10 text-purple-700 border-purple-500/20")}>
                      {c.filial}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.darsKuni}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.tolovKuni}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.darsVaqti}</td>
                  <td className="px-4 py-3 font-medium">{c.tolov}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{c.tolandi}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">{c.qarzi}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.hodim}</td>
                  <td className="px-4 py-3">
                    {c.tolovBekor?.toLowerCase() === "bekor" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">Bekor</span>
                    ) : c.qarzi && c.qarzi !== "р.0,00" && c.qarzi !== "0" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">Qarz</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">To'langan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editClient && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-semibold">{editClient.ism}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{editClient.telefon}</p>
              </div>
              <button onClick={() => setEditClient(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ism Familiya</label>
                <input type="text" value={editIsm} onChange={e => setEditIsm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
                <input type="tel" value={editTelefon} onChange={e => setEditTelefon(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
                <Toggle left="Novza" right="Yunusobod" value={editFilial} onChange={setEditFilial} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dars Vaqti</label>
                <select value={editDarsVaqti} onChange={e => setEditDarsVaqti(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  {VAQTLAR.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dars Kuni</label>
                <input type="date" value={editDarsKuni} onChange={e => setEditDarsKuni(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To'lov Kuni</label>
                <input type="date" value={editTolovKuni} onChange={e => setEditTolovKuni(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To'lov</label>
                <input type="text" value={editTolov} onChange={e => setEditTolov(formatSumma(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To'landi</label>
                <input type="text" value={editTolandi} onChange={e => setEditTolandi(formatSumma(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Qarzi</label>
                <input type="text" value={editQarzi} onChange={e => setEditQarzi(formatSumma(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hodim</label>
                <select value={editHodim} onChange={e => setEditHodim(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  {hodimlar.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setEditTolovBekor(!editTolovBekor)}
                    className={cn("w-10 h-6 rounded-full transition relative cursor-pointer",
                      editTolovBekor ? "bg-red-500" : "bg-secondary border border-border")}>
                    <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      editTolovBekor ? "left-5" : "left-1")} />
                  </div>
                  <span className="text-sm font-medium">To'lov Bekor</span>
                </label>
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center gap-3">
              <button onClick={submitEdit} disabled={editLoading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2">
                {editLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
              </button>
              <button onClick={() => setEditClient(null)}
                className="px-6 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition">
                Bekor qilish
              </button>
              {editResult && (
                <span className={cn("text-sm font-medium",
                  editResult.startsWith("✅") ? "text-emerald-600" : "text-red-500")}>
                  {editResult}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
