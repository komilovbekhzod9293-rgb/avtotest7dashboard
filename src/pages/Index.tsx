import { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function Login() {
  const [selectedRole, setSelectedRole] = useState<"boshliq" | "admin" | "ustoz" | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRoleSelect = (role: "boshliq" | "admin" | "ustoz") => {
    if (role === "boshliq") {
      setSelectedRole(role);
      setPassword("");
      setError("");
    } else {
      localStorage.setItem("role", role);
      window.location.href = "/";
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "4455") {
      localStorage.setItem("role", "boshliq");
      window.location.href = "/";
    } else {
      setError("Parol noto'g'ri");
      setPassword("");
    }
  };

  if (selectedRole === "boshliq") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Boshliq Kirish</h1>
            <p className="text-sm text-muted-foreground mb-6">Parolni kiriting</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Parol"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-sm text-red-500">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-foreground text-background py-2.5 rounded-lg font-medium hover:opacity-90 transition"
              >
                Kirish
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setPassword("");
                  setError("");
                }}
                className="w-full bg-secondary text-foreground py-2.5 rounded-lg font-medium hover:bg-secondary/80 transition"
              >
                Orqaga
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">AVTOTEST</h1>
          <p className="text-sm text-muted-foreground">Rol tanlang</p>
        </div>

        <div className="space-y-3">
          {/* Boshliq */}
          <button
            onClick={() => handleRoleSelect("boshliq")}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition",
              "text-left"
            )}
          >
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Boshliq</h2>
              <p className="text-xs text-muted-foreground">Parol bilan kirish</p>
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => handleRoleSelect("admin")}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition",
              "text-left"
            )}
          >
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <LogIn className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Admin</h2>
              <p className="text-xs text-muted-foreground">Bepul kirish</p>
            </div>
          </button>

          {/* Ustoz */}
          <button
            onClick={() => handleRoleSelect("ustoz")}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary transition",
              "text-left"
            )}
          >
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <LogIn className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground">Ustoz</h2>
              <p className="text-xs text-muted-foreground">Bepul kirish</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
