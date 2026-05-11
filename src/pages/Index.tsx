import { useState, useEffect } from "react";
import { Sidebar, type SectionId } from "@/components/dashboard/Sidebar";
import { SotuvAnalizi } from "@/components/sections/SotuvAnalizi";
import { Moliya } from "@/components/sections/Moliya";
import { Oquvchilar } from "@/components/sections/Oquvchilar";
import { Hodimlar } from "@/components/sections/Hodimlar";
import { Baza } from "@/components/sections/Baza";
import { OnlineDostup } from "@/components/sections/OnlineDostup";
import { Ustoz } from "@/components/sections/Ustoz";
import { Login } from "@/components/Login";
import logo from "@/assets/logo.webp";
import { AssistantChat } from "@/components/dashboard/AssistantChat";
import { Phone, Wallet, GraduationCap, Users, LogOut, Database, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "boshliq" | "admin" | "ustoz";
type AdminSection = "baza" | "online";

const Index = () => {
  const [role, setRole]                 = useState<Role | null>(null);
  const [active, setActive]             = useState<SectionId>("sotuv");
  const [adminSection, setAdminSection] = useState<AdminSection>("baza");
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem("role") as Role | null;
    setRole(savedRole);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    setRole(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">Yuklanmoqda...</div>
    </div>
  );

  if (!role) return <Login />;

  // ── BOSHLIQ ──────────────────────────────────────────
  if (role === "boshliq") {
    const mobileItems: { id: SectionId; icon: typeof Phone; label: string }[] = [
      { id: "sotuv",      icon: Phone,        label: "Sotuv"    },
      { id: "moliya",     icon: Wallet,        label: "Moliya"   },
      { id: "oquvchilar", icon: GraduationCap, label: "O'quvchi" },
      { id: "hodimlar",   icon: Users,         label: "Hodim"    },
    ];
    const contextLabel: Record<SectionId, string> = {
      sotuv:      "Sotuv Analizi",
      moliya:     "Moliya",
      oquvchilar: "O'quvchilar",
      hodimlar:   "Hodimlar",
    };
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar active={active} onChange={setActive} onLogout={handleLogout} />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex items-center justify-between px-5 h-14 border-b border-border bg-card">
            <img src={logo} alt="AVTOTEST7" className="h-7" />
          </div>
          <main className="flex-1 px-5 md:px-8 py-8 pb-24 lg:pb-12 max-w-[1400px] w-full mx-auto">
            {active === "sotuv"      && <SotuvAnalizi />}
            {active === "moliya"     && <Moliya />}
            {active === "oquvchilar" && <Oquvchilar />}
            {active === "hodimlar"   && <Hodimlar />}
          </main>
          <AssistantChat key={active} context={contextLabel[active]} />
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex">
            {mobileItems.map((it) => {
              const Icon = it.icon;
              const isActive = active === it.id;
              return (
                <button key={it.id} onClick={() => setActive(it.id)}
                  className={cn("flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                    isActive ? "text-primary" : "text-muted-foreground")}>
                  <Icon className="h-5 w-5" />
                  {it.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  // ── ADMIN ─────────────────────────────────────────────
  if (role === "admin") {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
          <div className="px-5 py-5 border-b border-border">
            <img src={logo} alt="AVTOTEST7" className="h-7" />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            <button onClick={() => setAdminSection("baza")}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left",
                adminSection === "baza" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
              <Database className="h-4 w-4 shrink-0" />
              <div><div>Baza</div><div className="text-xs opacity-70">Mijozlar bazasi</div></div>
            </button>
            <button onClick={() => setAdminSection("online")}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left",
                adminSection === "online" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
              <Wifi className="h-4 w-4 shrink-0" />
              <div><div>Online Dostup</div><div className="text-xs opacity-70">Ruxsat berilgan raqamlar</div></div>
            </button>
          </nav>
          <div className="px-3 py-4 border-t border-border">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition">
              <LogOut className="h-4 w-4" />Chiqish
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex items-center justify-between px-5 h-14 border-b border-border bg-card">
            <img src={logo} alt="AVTOTEST7" className="h-7" />
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-secondary text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <main className="flex-1 px-5 md:px-8 py-8 pb-24 lg:pb-12 max-w-[1400px] w-full mx-auto">
            {adminSection === "baza"   && <Baza />}
            {adminSection === "online" && <OnlineDostup />}
          </main>
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex">
            <button onClick={() => setAdminSection("baza")}
              className={cn("flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                adminSection === "baza" ? "text-primary" : "text-muted-foreground")}>
              <Database className="h-5 w-5" />Baza
            </button>
            <button onClick={() => setAdminSection("online")}
              className={cn("flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                adminSection === "online" ? "text-primary" : "text-muted-foreground")}>
              <Wifi className="h-5 w-5" />Online
            </button>
          </nav>
        </div>
      </div>
    );
  }

  // ── USTOZ ─────────────────────────────────────────────
  if (role === "ustoz") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-5">
          <img src={logo} alt="AVTOTEST7" className="h-7" />
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 transition text-foreground">
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
        <main className="flex-1 px-5 md:px-8 py-8 max-w-[1400px] w-full mx-auto">
          <Ustoz />
        </main>
      </div>
    );
  }

  return null;
};

export default Index;
