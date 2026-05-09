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
      // Admin va Ustoz uchun parol kerak yo'q
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Boshliq Kirish</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Parolni kiriting
            </p>

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
                <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">AVTOTEST</h1>
          <p className="text-muted-foreground">Rol tanlab oching</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Boshliq */}
          <button
            onClick={() => handleRoleSelect("boshliq")}
            className={cn(
              "p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4",
              "bg-card border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20"
            )}
          >
            <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Lock className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Boshliq</h2>
              <p className="text-xs text-muted-foreground mt-1">Parol bilan kirish</p>
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => handleRoleSelect("admin")}
            className={cn(
              "p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4",
              "bg-card border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20"
            )}
          >
            <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Admin</h2>
              <p className="text-xs text-muted-foreground mt-1">Bepul kirish</p>
            </div>
          </button>

          {/* Ustoz */}
          <button
            onClick={() => handleRoleSelect("ustoz")}
            className={cn(
              "p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4",
              "bg-card border-border hover:border-primary hover:shadow-lg hover:shadow-primary/20"
            )}
          >
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Ustoz</h2>
              <p className="text-xs text-muted-foreground mt-1">Bepul kirish</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
