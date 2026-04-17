import { Bell, Calendar } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: Props) {
  const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
  return (
    <header className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-card border border-border text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="num">{today}</span>
        </div>
        <button className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>
      </div>
    </header>
  );
}
