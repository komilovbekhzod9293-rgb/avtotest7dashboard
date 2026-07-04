import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Loader2, AlertCircle, Plus, X, Search, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPABASE_URL = "https://ziqzprosgzevkdfwyotl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcXpwcm9zZ3pldmtkZnd5b3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MDAzMCwiZXhwIjoyMDgxOTE2MDMwfQ.vv56u5cQ0VToYDhyYGpbt2phr7PAwAbmtheY2h25yyQ";
const WEBHOOK = "https://n8n.srv1215497.hstgr.cloud/webhook/admin";
const ADD_WEBHOOK = "https://n8n.srv1215497.hstgr.cloud/webhook/add";

function formatDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSumma(val: string): string {
  return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function todayInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

interface Phone {
  id: number;
  telefon_raqami: string;
  created_at: string;
  device_id: string | null;
  last_seen: string | null;
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

export function OnlineDostup() {
  const [phones, setPhones]   = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState("");

  // Форма добавления
  const [showAdd,    setShowAdd]    = useState(false);
  const [addIsm,     setAddIsm]     = useState("");
  const [addPhone,   setAddPhone]   = useState("");
  const [addSumma,   setAddSumma]   = useState("");
  const [addSana,    setAddSana]    = useState(todayInput());
  const [addTuri,    setAddTuri]    = useState("Offline");
  const [addFilial,  setAddFilial]  = useState("Novza");
  const [addLoading, setAddLoading] = useState(false);
  const [addResult,  setAddResult]  = useState<string | null>(null);

  // Редактирование
  const [editPhone,    setEditPhone]    = useState<Phone | null>(null);
  const [editNewPhone, setEditNewPhone] = useState("");
  const [editLoading,  setEditLoading]  = useState(false);
  const [editResult,   setEditResult]   = useState<string | null>(null);

  // Удаление
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPhones = () => {
    setLoading(true);
    fetch(`${SUPABASE_URL}/rest/v1/allowed_phones?select=*&order=created_at.desc`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    })
      .then(r => { if (!r.ok) throw new Error(`Xatolik: ${r.status}`); return r.json(); })
      .then(data => setPhones(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPhones(); }, []);

  async function submitAdd() {
    if (!addPhone) { setAddResult("❌ Telefon raqamini kiriting"); return; }
    setAddLoading(true); setAddResult(null);
    try {
      await fetch(ADD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:  "give_access",
          ism:     addIsm,
          telefon: addPhone,
          summa:   addSumma.replace(/\s/g, ""),
          sana:    addSana,
          turi:    addTuri,
          filial:  addFilial,
        }),
      });
      setAddResult("✅ Saqlandi!");
      setAddIsm(""); setAddPhone(""); setAddSumma(""); setAddSana(todayInput());
      setTimeout(() => fetchPhones(), 2000);
    } catch { setAddResult("❌ Xatolik yuz berdi"); }
    finally { setAddLoading(false); }
  }

  async function submitEdit() {
    if (!editPhone || !editNewPhone) return;
    setEditLoading(true); setEditResult(null);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:      "edit_phone",
          id:          editPhone.id,
          old_telefon: editPhone.telefon_raqami,
          new_telefon: editNewPhone,
        }),
      });
      setEditResult("✅ Saqlandi!");
      setEditPhone(null);
      setTimeout(() => fetchPhones(), 2000);
    } catch { setEditResult("❌ Xatolik"); }
    finally { setEditLoading(false); }
  }

  async function submitDelete(id: number) {
    setDeleteId(id); setDeleteLoading(true);
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_phone", id }),
      });
      setTimeout(() => fetchPhones(), 2000);
    } catch {}
    finally { setDeleteLoading(false); setDeleteId(null); }
  }

  const digits = (s: string) => s.replace(/\D/g, "");

  const displayed = phones.filter(p =>
    search ? digits(p.telefon_raqami).includes(digits(search)) : true
  );

  const searchResult = search
    ? phones.find(p => digits(p.telefon_raqami).includes(digits(search)))
    : null;

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

  return (
    <div>
      <Header title="Online Dostup" subtitle="Ruxsat berilgan telefon raqamlari" />

      {/* Кнопка добавить */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setShowAdd(!showAdd); setAddResult(null); }}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2 ml-auto",
            showAdd ? "bg-primary text-primary-foreground" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Yopish" : "Raqam qo'shish"}
        </button>
      </div>

      {/* Форма добавления */}
      {showAdd && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" />Yangi raqam qo'shish
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ism Familiya</label>
              <input type="text" value={addIsm} onChange={e => setAddIsm(e.target.value)}
                placeholder="Abdullayev Jasur"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Telefon raqami</label>
              <input type="tel" value={addPhone} onChange={e => setAddPhone(e.target.value)}
                placeholder="901234567"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To'lov summasi (so'm)</label>
              <input type="text" value={addSumma} onChange={e => setAddSumma(formatSumma(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To'lov sanasi</label>
              <input type="date" value={addSana} onChange={e => setAddSana(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Turi</label>
              <Toggle left="Offline" right="Online" value={addTuri} onChange={setAddTuri} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Filial</label>
              <Toggle left="Novza" right="Yunusobod" value={addFilial} onChange={setAddFilial} />
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
      )}

      {/* Поиск */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Telefon raqami bo'yicha qidirish..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm" />
      </div>

      {/* Результат поиска */}
      {search && (
        <div className={cn("mb-4 px-4 py-3 rounded-xl border text-sm font-medium inline-flex items-center gap-2",
          searchResult
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
            : "bg-red-500/10 border-red-500/30 text-red-600")}>
          {searchResult ? "✅ Bu raqam bazada mavjud" : "❌ Bu raqam bazada yo'q"}
        </div>
      )}

      {/* Таблица */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Ruxsat berilgan raqamlar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{phones.length} ta raqam</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Berilgan sana</th>
                <th className="px-4 py-3 font-medium">Oxirgi kirish</th>
                <th className="px-4 py-3 font-medium">Device ID</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">Raqamlar topilmadi</td></tr>
              ) : displayed.map((p, i) => (
                <tr key={p.id} className="hover:bg-secondary/40 transition">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{p.telefon_raqami}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {p.last_seen ? (
                      <span className="text-emerald-600">{formatDate(p.last_seen)}</span>
                    ) : (
                      <span className="text-muted-foreground">Hali kirmagan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {p.device_id ? p.device_id.slice(0, 16) + "..." : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditPhone(p); setEditNewPhone(p.telefon_raqami); setEditResult(null); }}
                        className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => submitDelete(p.id)}
                        disabled={deleteLoading && deleteId === p.id}
                        className="h-8 w-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-500 transition">
                        {deleteLoading && deleteId === p.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка редактирования */}
      {editPhone && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Raqamni tahrirlash</h3>
              <button onClick={() => setEditPhone(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Yangi telefon raqami</label>
                <input type="tel" value={editNewPhone} onChange={e => setEditNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={submitEdit} disabled={editLoading}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2">
                  {editLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda…</> : "Saqlash"}
                </button>
                <button onClick={() => setEditPhone(null)}
                  className="px-6 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition">
                  Bekor
                </button>
              </div>
              {editResult && (
                <p className={cn("text-sm font-medium",
                  editResult.startsWith("✅") ? "text-emerald-600" : "text-red-500")}>
                  {editResult}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
