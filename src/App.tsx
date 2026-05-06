import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";

type Page = "home" | "reports" | "profile";

const NAV = [
  { id: "home" as Page, label: "Главная", icon: "Package" },
  { id: "reports" as Page, label: "Отчёты", icon: "BarChart2" },
  { id: "profile" as Page, label: "Профиль", icon: "User" },
];

const AppContent = () => {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center glow-orange-sm">
            <Icon name="Truck" size={16} className="text-primary-foreground" />
          </div>
          <span className="font-bold font-montserrat text-white text-base tracking-tight">
            Отгрузка<span className="text-gradient">Про</span>
          </span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary hover:bg-secondary/70 transition-colors relative">
          <Icon name="Bell" size={16} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 pb-24 overflow-y-auto">
        {page === "home" && <HomePage />}
        {page === "reports" && <ReportsPage />}
        {page === "profile" && <ProfilePage />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-sm border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {NAV.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all ${
                  active ? "text-primary" : "text-muted-foreground hover:text-white"
                }`}
              >
                <div className={`relative transition-all ${active ? "scale-110" : ""}`}>
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-primary/20 scale-150 blur-sm" />
                  )}
                  <Icon name={item.icon} size={22} className="relative" />
                </div>
                <span className={`text-xs font-medium transition-colors ${active ? "text-primary" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <AppContent />
  </TooltipProvider>
);

export default App;
