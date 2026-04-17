import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { students, teachers } from "@/data/mock";
import { GraduationCap, CalendarCheck, Trophy, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap = {
  active: { label: "O'qiyapti", cls: "bg-brand-soft text-brand" },
  passed: { label: "Topshirgan", cls: "bg-success-soft text-success" },
  warning: { label: "Diqqat", cls: "bg-warning-soft text-warning" },
} as const;

export function Oquvchilar() {
  const [teacher, setTeacher] = useState("Hammasi");
  const filtered = teacher === "Hammasi" ? students : students.filter((s) => s.teacher === teacher);
  const todayExam = students.filter((s) => s.exam === "today");
  const passed = students.filter((s) => s.status === "passed").length;
  const avgAttendance = Math.round(students.reduce((s, x) => s + x.attendance, 0) / students.length);

  return (
    <div>
      <Header title="O'quvchilar" subtitle="Imtihonlar, davomat va o'qish jarayoni" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Jami o'quvchilar" value={String(students.length * 18)} delta={4.2} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label="Bugun imtihonda" value={String(todayExam.length)} hint="2 o'tkazildi" icon={<CalendarCheck className="h-4 w-4" />} />
        <StatCard label="Bu oy topshirgan" value={String(passed * 6)} delta={11.3} icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="O'rt. davomat" value={`${avgAttendance}%`} delta={1.5} icon={<Activity className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">O'quvchilar ro'yxati</h3>
              <p className="text-xs text-muted-foreground mt-0.5">O'qituvchi bo'yicha filtrlash</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teachers.map((t) => (
                <button
                  key={t}
                  onClick={() => setTeacher(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                    teacher === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3 font-medium">Ism</th>
                  <th className="px-5 py-3 font-medium">Toifa</th>
                  <th className="px-5 py-3 font-medium">O'qituvchi</th>
                  <th className="px-5 py-3 font-medium text-right">Davomat</th>
                  <th className="px-5 py-3 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => {
                  const st = statusMap[s.status as keyof typeof statusMap];
                  return (
                    <tr key={s.id} className="hover:bg-secondary/60 transition">
                      <td className="px-5 py-3 font-medium">{s.name}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{s.category}</span></td>
                      <td className="px-5 py-3 text-muted-foreground">{s.teacher}</td>
                      <td className="px-5 py-3 text-right num font-medium">{s.attendance}%</td>
                      <td className="px-5 py-3"><span className={cn("inline-flex px-2 py-0.5 rounded-md text-xs font-medium", st.cls)}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold">Bugungi imtihon</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Davlat avtoinspeksiya</p>
          {todayExam.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bugun imtihon yo'q</p>
          ) : (
            <div className="space-y-3">
              {todayExam.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">Toifa {s.category} · {s.teacher}</div>
                  </div>
                  <span className="text-xs num font-medium text-foreground">{s.attendance}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
