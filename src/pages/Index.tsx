import { useState, useEffect } from "react";
import { Sidebar, type SectionId } from "@/components/dashboard/Sidebar";
import { SotuvAnalizi } from "@/components/sections/SotuvAnalizi";
import { Moliya } from "@/components/sections/Moliya";
import { Oquvchilar } from "@/components/sections/Oquvchilar";
import { Hodimlar } from "@/components/sections/Hodimlar";
import { Login } from "@/components/Login";
import logo from "@/assets/logo.webp";
import { AssistantChat } from "@/components/dashboard/AssistantChat";
import { Phone, Wallet, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "boshliq" | "admin" | "ustoz";

const Index = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [active, setActive] = useState<SectionId>("sotuv");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem("role") as Role | null;
    setRole(savedRole);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  // Agar rol yo'q bo'lsa - Login ko'rsatish
  if (!role) {
    return <Login />;
  }

  // Boshliq dashboard
  if (role === "boshliq") {
    const mobileItems: { id: SectionId; icon: typeof Phone; label: string }[] = [
      { id: "sotuv", icon: Phone, label: "Sotuv" },
      { id: "moliya", icon: Wallet, label: "Moliya" },
      { id: "oquvchilar", icon: GraduationCap, label: "O'quvchi" },
      { id: "hodimlar", icon: Users, label: "Hodim" },
    ];

    const contextLabel: Record<SectionId, string> = {
      sotuv: "Sotuv Analizi",
      moliya: "Moliya",
      oquvchilar: "O'quvchilar",
      hodimlar: "Hodimlar",
    };

    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar active={active} onChange={setActive} role={role} />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex items-center justify-between px-5 h-14 border-b border-border bg-card">
            <img src={logo} alt="AVTOTEST7" className="h-7" />
          </div>
          <main className="flex-1 px-5 md:px-8 py-8 pb-24 lg:pb-12 max-w-[1400px] w-full mx-auto">
            {active === "sotuv" && <SotuvAnalizi />}
            {active === "moliya" && <Moliya />}
            {active === "oquvchilar" && <Oquvchilar />}
            {active === "hodimlar" && <Hodimlar />}
          </main>
          <AssistantChat key={active} context={contextLabel[active]} />
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex">
            {mobileItems.map((it) => {
              const Icon = it.icon;
              const isActive = active === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setActive(it.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
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

  // Admin dashboard (pusta)
  if (role === "admin") {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar active={active} onChange={setActive} role={role} />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex items-center justify-between px-5 h-14 border-b border-border bg-card">
            <img src={logo} alt="AVTOTEST7" className="h-7" />
          </div>
          <main className="flex-1 px-5 md:px-8 py-8 pb-24 lg:pb-12 max-w-[1400px] w-full mx-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
                <p>Tez orada...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Ustoz dashboard (pusta)
  if (role === "ustoz") {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar active={active} onChange={setActive} role={role} />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex items-center justify-between px-5 h-14 border-b border-border bg-card">
            <img src={logo} alt="AVTOTEST7" className="h-7" />
          </div>
          <main className="flex-1 px-5 md:px-8 py-8 pb-24 lg:pb-12 max-w-[1400px] w-full mx-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <h1 className="text-2xl font-bold mb-2">Ustoz Panel</h1>
                <p>Tez orada...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
