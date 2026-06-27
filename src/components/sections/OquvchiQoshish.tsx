import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WEBHOOK = "https://n8n.srv1215497.hstgr.cloud/webhook/davomat";

const VAQTLAR = ["10:00","13:00","15:00","19:00","21:00"];

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function toSheetDate(input: string): string {
  const p = input.split("-");
  if (p.length < 3) return input;
  return `${p[2]}.${p[1]}.${p[0]}`;
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

export function OquvchiQoshish() {
  const [addIsm,     setAddIsm]     = useState("");
  const [addTel,     setAddTel]     = useState("");
  const [addFilial,  setAddFilial]  = useState("Novza");
  const [addSmena,   setAddSmena]   = useState("10:00");
  const [addDars,    setAddDars]    = useState(todayInput());
  const [addLoading, setAddLoading] = useState(false);
  const [addResult,  setAddResult]  = useState<string | null>(null);

  async function submitAdd() {
    if (!addIsm || !addTel) { setAddResult("❌ Ism va telefonni kiriting"); return; }
    setAddLoading(true); setAddResult(null);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:                 "add_student",
          ism:                    addIsm,
          telefon:                addTel,
          filial:                 addFilial,
          smena:                  addSmena,
          dars_kuni:              toSheetDate(addDars),
          dars_boshlanish_sanasi: toSheetDate(addDars),
        }),
      });
      setAddResult("✅ Saqlandi!");
      setAddIsm(""); setAddTel(""); setAddDars(todayInput());
    } catch { setAddResult("❌ Xatolik"); }
    finally { setAddLoading(false); }
  }

  return (
    <div>
      <Header title="O'quvchi qo'shish" subtitle="Yangi o'quvchini darsga qo'shish" />

      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <h3 className="font-semibold mb-4">Yangi o'quvchi qo'shish</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ism Familiya</label>
            <input type="text" value={addIsm} onChange={e => setAddIsm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
            <input type="tel" value={addTel} onChange={e => setAddTel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
            <Toggle left="Novza" right="Yunusobod" value={addFilial} onChange={setAddFilial} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Smena</label>
            <select value={addSmena} onChange={e => setAddSmena(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
              {VAQTLAR.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dars boshlanish kuni</label>
            <input type="date" value={addDars} onChange={e => setAddDars(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
        </div>
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
    </div>
  );
}
