import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { employees } from "@/data/mock";
import { Users, Clock, TrendingUp, Award, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hodimlar() {
  const avgEff = Math.round(employees.reduce((s, e) => s + e.efficiency, 0) / employees.length);
  const topPerformer = [...employees].sort((a, b) => b.efficiency - a.efficiency)[0];

  return (
    <div>
      <Header title="Hodimlar" subtitle="Davomat, samaradorlik va progress" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Jami hodimlar" value={String(employees.length)} hint="bugun ishda" icon={<Users className="h-4 w-4" />} />
        <StatCard label="O'rt. ish vaqti" value="9 soat 18 daq" delta={1.2} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="O'rt. samaradorlik" value={`${avgEff}%`} delta={3.4} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Eng yaxshi" value={topPerformer.name.split(" ")[0]} hint={`${topPerformer.efficiency}% samara`} icon={<Award className="h-4 w-4" />} />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Bugungi smena</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Kelish/ketish, samaradorlik va sotuvlar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="px-5 py-3 font-medium">Hodim</th>
                <th className="px-5 py-3 font-medium">Kelish</th>
                <th className="px-5 py-3 font-medium">Ketish</th>
                <th className="px-5 py-3 font-medium">Samaradorlik</th>
                <th className="px-5 py-3 font-medium text-right">Sotuv</th>
                <th className="px-5 py-3 font-medium text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((e) => (
                <tr key={e.name} className="hover:bg-secondary/60 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 num text-muted-foreground">{e.checkIn}</td>
                  <td className="px-5 py-3.5 num text-muted-foreground">{e.checkOut}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", e.efficiency >= 85 ? "bg-success" : e.efficiency >= 70 ? "bg-warning" : "bg-danger")}
                          style={{ width: `${e.efficiency}%` }}
                        />
                      </div>
                      <span className="text-xs num font-medium w-9">{e.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right num font-medium">{e.sales || "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={cn("inline-flex items-center gap-0.5 num text-xs font-medium", e.progress >= 0 ? "text-success" : "text-danger")}>
                      {e.progress >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(e.progress)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
