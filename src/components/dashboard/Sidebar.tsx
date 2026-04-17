import { Phone, Wallet, GraduationCap, Users, Search, Settings } from "lucide-react";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";

export type SectionId = "sotuv" | "moliya" | "oquvchilar" | "hodimlar";

const items: { id: SectionId; label: string; icon: typeof Phone; sub: string }[] = [
  { id: "sotuv", label: "Sotuv Analizi", icon: Phone, sub: "Qo'ng'iroqlar va sotuvlar" },
  { id: "moliya", label: "Moliya", icon: Wallet, sub: "Daromad va xarajat" },
  { id: "oquvchilar", label: "O'quvchilar", icon: GraduationCap, sub: "Imtihon va davomat" },
  { id: "hodimlar", label: "Hodimlar", icon: Users, sub: "Davomat va samaradorlik" },
];

interface Props {
  active: SectionId;
  onChange: (id: SectionId) => void;
}

export function Sidebar({ active, onChange }: Props) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-6 pt-6 pb-8 border-b border-border">
        <img src={logo} alt="AVTOTEST7 logo" className="h-9 w-auto" />
      </div>

      <div className="px-4 pt-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Qidiruv..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground border border-transparent focus:border-border focus:outline-none transition"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 pt-6 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Bo'limlar</p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] mt-0.5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className={cn("text-xs mt-0.5 leading-tight", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {item.sub}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            A7
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Egasi</div>
            <div className="text-xs text-muted-foreground truncate">owner@avtotest7.uz</div>
          </div>
          <button className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
