import { NavLink } from "react-router-dom";
import { Home, BookMarked, Flame, Trophy, User, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/words", label: "Words", icon: BookMarked },
  { to: "/quiz", label: "Quiz", icon: Brain },
  { to: "/streaks", label: "Streaks", icon: Flame },
  { to: "/achievements", label: "Trophies", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-40"
    style={{
      backgroundColor: "hsl(var(--background-secondary, var(--background)))",
      borderTop: "1px solid hsl(var(--primary) / 0.35)",
    }}
  >
    <div className="mx-auto max-w-md flex justify-between px-2 pt-2 pb-3">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center gap-1 py-2 transition-colors press",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
