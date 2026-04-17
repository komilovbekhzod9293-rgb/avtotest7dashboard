import { useState } from "react";
import { Sidebar, type SectionId } from "@/components/dashboard/Sidebar";
import { SotuvAnalizi } from "@/components/sections/SotuvAnalizi";
import { Moliya } from "@/components/sections/Moliya";
import { Oquvchilar } from "@/components/sections/Oquvchilar";
import { Hodimlar } from "@/components/sections/Hodimlar";
import logo from "@/assets/logo.webp";
import { Phone, Wallet, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [active, setActive] = useState<SectionId>("sotuv");

  const mobileItems: { id: SectionId; icon: typeof Phone; label: string }[] = [
    { id: "sotuv", icon: Phone, label: "Sotuv" },
    { id: "moliya", icon: Wallet, label: "Moliya" },
    { id: "oquvchilar", icon: GraduationCap, label: "O'quvchi" },
    { id: "hodimlar", icon: Users, label: "Hodim" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar active={active} onChange={setActive} />

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
};

export default Index;
