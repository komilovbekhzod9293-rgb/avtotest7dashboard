import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Loader2, AlertCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SHEET_DAVO = "14nKtubJjuMJhQ9NQO8ORIfFGYAbBVKYrKDZpB96vc6Q";
const API_KEY    = "AIzaSyB4kyYep05877BBpI9Rfv0SNcFhHVGBF5E";
const RANGE_DAVO = "%D0%9B%D0%B8%D1%81%D1%821!A:I";

const VAQTLAR = ["10:00","13:00","15:00","19:00","21:00"];

function todayStr(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}.${String(now.getMonth()+1).padStart(2,"0")}.${now.getFullYear()}`;
}

function sameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
         a.getMonth() === b.getMonth() &&
         a.getFullYear() === b.getFullYear();
}

interface DavRow {
  ism:                  string;
  telefon:              string;
  filial:               string;
  smena:                string;
  sana:                 string;
  holat:                string;
  imtihon:              string;
  pravaOldi:            string;
  darsBoshlanishSanasi: string;
}

interface Student {
  ism:                  string;
  telefon:              string;
  filial:               string;
  smena:                string;
  pravaOldi:            string;
  imtihon:              string;
  darsBoshlanishSanasi: string;
  rows:                 DavRow[];
}

type Tab = "davomat" | "jadval";

export function Oquvchilar() {
  const [allRows,  setAllRows]  = useState<DavRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<Tab>("davomat");
  const [search,   setSearch]   = useState("");
  const [filterSmena,  setFilterSmena]  = useState("Barchasi");
  const [filterFilial, setFilterFilial] = useState("Barchasi");
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [showImtihon,   setShowImtihon]   = useState(false);
  const [imtihonFilter, setImtihonFilter] = useState("Ertaga");

  const fetchAll = () => {
    setLoading(true);
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_DAVO}/values/${RANGE_DAVO}?key=${API_KEY}`)
      .then(r => { if (!r.ok) throw new Error(`Xatolik: ${r.status}`); return r.json(); })
      .then(data => {
        const rows: string[][] = data.values ?? [];
        const parsed: DavRow[] = rows.slice(1)
          .filter(r => r[0])
          .map(r => ({
            ism:                  r[0] ?? "",
            telefon:              r[1] ?? "",
            filial:               r[2] ?? "",
            smena:                r[3] ?? "",
            sana:                 r[4] ?? "",
            holat:                r[5] ?? "",
            imtihon:              r[6] ?? "",
            pravaOldi:            r[7] ?? "",
            darsBoshlanishSanasi: r[8] ?? "",
          }));
        setAllRows(parsed);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  function buildStudents(rows: DavRow[]): Student[] {
    const map: Record<string, Student> = {};
    rows.forEach(r => {
      if (!map[r.telefon]) {
        map[r.telefon] = {
          ism:                  r.ism,
          telefon:              r.telefon,
          filial:               r.filial,
          smena:                r.smena,
          pravaOldi:            r.pravaOldi,
          imtihon:              r.imtihon,
          darsBoshlanishSanasi: r.darsBoshlanishSanasi,
          rows:                 [],
        };
      }
      if (r.pravaOldi)            map[r.telefon].pravaOldi            = r.pravaOldi;
      if (r.imtihon)              map[r.telefon].imtihon              = r.imtihon;
      if (r.darsBoshlanishSanasi) map[r.telefon].darsBoshlanishSanasi = r.darsBoshlanishSanasi;
      if (r.sana)                 map[r.telefon].rows.push(r);
    });
    return Object.values(map);
  }

  const allStudents    = buildStudents(allRows);
  const activeStudents = allStudents.filter(s =>
    !s.pravaOldi || s.pravaOldi.trim().toLowerCase() !== "oldi"
  );

  function isMarkedToday(telefon: string): string | null {
    const today = todayStr();
    const rec = allRows.find(r => r.telefon === telefon && r.sana === today);
    return rec ? rec.holat : null;
  }

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

  const bySmena: Record<string, Student[]> = {};
  activeStudents.forEach(s => {
    const key = s.smena || "Noma'lum";
    if (!bySmena[key]) bySmena[key] = [];
    bySmena[key].push(s);
  });
  const sortedSmenas = VAQTLAR.filter(v => bySmena[v]).concat(
    Object.keys(bySmena).filter(k => !VAQTLAR.includes(k))
  );

  const totalToday = activeStudents.filter(s => isMarkedToday(s.telefon)).length;

  const filteredStudents = allStudents.filter(s => {
    const q = search.toLowerCase();
    if (q && !s.ism.toLowerCase().includes(q) && !s.telefon.includes(q)) return false;
    if (filterSmena  !== "Barchasi" && s.smena  !== filterSmena)  return false;
    if (filterFilial !== "Barchasi" && s.filial !== filterFilial) return false;
    return true;
  });

  const now      = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const dayAfter = new Date(now); dayAfter.setDate(now.getDate() + 2);
  const targetDay = imtihonFilter === "Ertaga" ? tomorrow : dayAfter;
  const upcomingImtihon = activeStudents.filter(s => {
    if (!s.imtihon) return false;
    const parts = s.imtihon.split(".");
    if (parts.length < 3) return false;
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return sameDay(d, targetDay);
  });

  return (
    <div>
      <Header title="O'quvchilar" subtitle="Davomat va jadval" />

      {/* Yaqin imtihonlar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setShowImtihon(!showImtihon)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2",
              showImtihon ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20")}>
            Yaqin imtihonlar
            {upcomingImtihon.length > 0 && (
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold",
                showImtihon ? "bg-white/30 text-white" : "bg-amber-500 text-white")}>
                {upcomingImtihon.length}
              </span>
            )}
          </button>
          {showImtihon && (
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
              <button onClick={() => setImtihonFilter("Ertaga")}
                className={cn("px-3 py-1.5 transition",
                  imtihonFilter === "Ertaga" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
                Ertaga
              </button>
              <button onClick={() => setImtihonFilter("Indinga")}
                className={cn("px-3 py-1.5 transition border-l border-border",
                  imtihonFilter === "Indinga" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
                Indinga
              </button>
            </div>
          )}
        </div>
        {showImtihon && (
          upcomingImtihon.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">
              {imtihonFilter === "Ertaga" ? "Ertaga" : "Indinga"} imtihon yo'q
            </p>
          ) : (
            <div className="bg-card rounded-2xl border border-amber-500/20 overflow-hidden">
              {upcomingImtihon.map((s, i) => (
                <div key={s.telefon}
                  className={cn("flex items-center gap-3 px-4 py-3",
                    i !== upcomingImtihon.length - 1 && "border-b border-border")}>
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center font-semibold text-sm shrink-0 text-amber-600">
                    {s.ism.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{s.ism}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.smena} · {s.filial} · {s.imtihon}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium border border-amber-500/20">
                    {imtihonFilter === "Ertaga" ? "Ertaga" : "Indinga"}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("davomat")}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
            tab === "davomat" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
          Davomat
        </button>
        <button onClick={() => setTab("jadval")}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition",
            tab === "jadval" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
          Jadval
        </button>
      </div>

      {/* DAVOMAT — только просмотр */}
      {tab === "davomat" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Bugun keldi: <span className="font-semibold text-foreground">{totalToday}</span> / {activeStudents.length}
            </p>
          </div>
          {sortedSmenas.length === 0 ? (
            <p className="text-center py-16 text-sm text-muted-foreground">O'quvchilar yo'q</p>
          ) : sortedSmenas.map(smena => {
            const list = bySmena[smena] ?? [];
            return (
              <div key={smena} className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-sm">{smena} smena</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">{list.length} ta</span>
                </div>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {list.map((s, i) => {
                    const markedToday = isMarkedToday(s.telefon);
                    const davRows     = s.rows.filter(r => r.sana);
                    return (
                      <div key={s.telefon}
                        className={cn("flex items-center gap-3 px-4 py-3 transition",
                          i !== list.length - 1 && "border-b border-border",
                          markedToday === "Bor"  ? "bg-emerald-500/5" :
                          markedToday === "Yo'q" ? "bg-red-500/5" : "")}>
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm shrink-0 text-foreground">
                          {s.ism.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{s.ism}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <div className="flex gap-1 cursor-pointer" onClick={() => setDetailStudent(s)}>
                              {davRows.map((d, idx) => (
                                <div key={idx}
                                  className={cn("h-2 w-2 rounded-full",
                                    d.holat === "Bor" ? "bg-emerald-500" : "bg-red-400")}
                                  title={`${idx+1}-kun: ${d.holat} (${d.sana})`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{davRows.length} kun · {s.filial}</span>
                            {s.imtihon && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                                Imtihon: {s.imtihon}
                              </span>
                            )}
                            {markedToday && (
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                                markedToday === "Bor" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>
                                Bugun: {markedToday}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {markedToday ? (
                            <span className={cn("text-xs px-3 py-1.5 rounded-lg font-medium",
                              markedToday === "Bor" ? "bg-emerald-600 text-white" : "bg-red-500 text-white")}>
                              ✓ {markedToday}
                            </span>
                          ) : (
                            <span className="text-xs px-3 py-1.5 rounded-lg font-medium bg-secondary text-muted-foreground">
                              Belgilanmagan
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JADVAL — только просмотр */}
      {tab === "jadval" && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Ism yoki telefon..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm" />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Barchasi", ...VAQTLAR].map(v => (
              <button key={v} onClick={() => setFilterSmena(v)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition border",
                  filterSmena === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            {["Barchasi", "Novza", "Yunusobod"].map(f => (
              <button key={f} onClick={() => setFilterFilial(f)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition border",
                  filterFilial === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                {f}
              </button>
            ))}
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Barcha o'quvchilar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredStudents.length} ta</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50 border-b border-border">
                    <th className="px-4 py-3 font-medium">Ism Familiya</th>
                    <th className="px-4 py-3 font-medium">Telefon</th>
                    <th className="px-4 py-3 font-medium">Filial</th>
                    <th className="px-4 py-3 font-medium">Smena</th>
                    <th className="px-4 py-3 font-medium">Dars boshlandi</th>
                    <th className="px-4 py-3 font-medium">Davomat</th>
                    <th className="px-4 py-3 font-medium">Kun</th>
                    <th className="px-4 py-3 font-medium">Imtihon</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">Topilmadi</td></tr>
                  ) : filteredStudents.map((s, i) => {
                    const davRows = s.rows.filter(r => r.sana);
                    const borSoni = davRows.filter(d => d.holat === "Bor").length;
                    return (
                      <tr key={i} className="hover:bg-secondary/40 transition">
                        <td className="px-4 py-3 font-medium">{s.ism}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.telefon}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border",
                            s.filial === "Novza"
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-700 border-purple-500/20")}>
                            {s.filial}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.smena}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{s.darsBoshlanishSanasi || "—"}</td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => setDetailStudent(s)}>
                          <div className="flex gap-1">
                            {davRows.map((d, idx) => (
                              <div key={idx}
                                className={cn("h-2.5 w-2.5 rounded-full hover:scale-125 transition-transform",
                                  d.holat === "Bor" ? "bg-emerald-500" : "bg-red-400")}
                                title={`${idx+1}-kun: ${d.holat}`}
                              />
                            ))}
                            {davRows.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{davRows.length}</span>
                          <span className="text-muted-foreground text-xs"> kun</span>
                          {borSoni > 0 && <span className="ml-1 text-xs text-emerald-600">({borSoni} bor)</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{s.imtihon || "—"}</td>
                        <td className="px-4 py-3">
                          {s.pravaOldi?.toLowerCase() === "oldi" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Prava oldi</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">O'qiyapti</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Модалка посещаемости */}
      {detailStudent && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-semibold">{detailStudent.ism}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detailStudent.smena} · {detailStudent.filial}
                </p>
                {detailStudent.darsBoshlanishSanasi && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dars boshlanish sanasi: <span className="font-medium text-foreground">{detailStudent.darsBoshlanishSanasi}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setDetailStudent(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {detailStudent.rows.filter(r => r.sana).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Davomat yo'q</p>
              ) : detailStudent.rows.filter(r => r.sana).map((d, idx) => (
                <div key={idx} className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-xl border",
                  d.holat === "Bor" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground w-10">{idx+1}-kun</span>
                    <span className="text-sm font-medium">{d.sana}</span>
                  </div>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                    d.holat === "Bor" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>
                    {d.holat || "—"}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-border mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Jami: {detailStudent.rows.filter(r => r.sana).length} kun</span>
                <span className="text-emerald-600 font-medium">
                  Bor: {detailStudent.rows.filter(r => r.holat === "Bor").length} kun
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
