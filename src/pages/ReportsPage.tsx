import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const SHIPMENTS_URL = "https://functions.poehali.dev/c127a43a-9fdb-44f6-9204-1ad54dc19e1b";

interface Shipment {
  id: string;
  client: string;
  date: string;
  items: number;
  status: string;
  files: { file_type: string }[];
}

export default function ReportsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllClients, setShowAllClients] = useState(false);

  useEffect(() => {
    fetch(SHIPMENTS_URL)
      .then((r) => r.json())
      .then((d) => { setShipments(d.shipments || []); setLoading(false); });
  }, []);

  const total = shipments.length;
  const transit = shipments.filter((s) => s.status === "transit").length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const pending = shipments.filter((s) => s.status === "pending").length;
  const withDocs = shipments.filter(
    (s) => s.files.some((f) => f.file_type === "photo") && s.files.some((f) => f.file_type === "invoice")
  ).length;
  const noDocs = total - withDocs;

  const clientMap: Record<string, number> = {};
  shipments.forEach((s) => { clientMap[s.client] = (clientMap[s.client] || 0) + 1; });
  const topClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  const visibleClients = showAllClients ? topClients : topClients.slice(0, 4);

  const monthMap: Record<string, number> = {};
  shipments.forEach((s) => {
    const parts = s.date.split(" ");
    const key = parts.length >= 2 ? parts.slice(0, 2).join(" ") : s.date;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const chartData = Object.entries(monthMap).slice(-5).map(([month, count]) => ({
    month: month.split(" ")[0].substring(0, 3),
    count,
  }));
  const maxCount = Math.max(...chartData.map((c) => c.count), 1);

  const handleExport = () => {
    const rows = [
      ["ID", "Клиент", "Дата", "Позиций", "Статус", "Фото", "Счёт"],
      ...shipments.map((s) => [
        s.id, s.client, s.date, String(s.items), s.status,
        s.files.some((f) => f.file_type === "photo") ? "Есть" : "Нет",
        s.files.some((f) => f.file_type === "invoice") ? "Есть" : "Нет",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `отгрузки_${new Date().toLocaleDateString("ru-RU")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-montserrat font-bold text-white">Отчёты</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Аналитика по всем отгрузкам</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in delay-100">
        {[
          { label: "Всего отгрузок", value: String(total), icon: "Package", color: "text-primary" },
          { label: "В пути", value: String(transit), icon: "Truck", color: "text-yellow-400" },
          { label: "Доставлено", value: String(delivered), icon: "CheckCircle", color: "text-green-400" },
          { label: "Без документов", value: String(noDocs), icon: "AlertCircle", color: noDocs > 0 ? "text-red-400" : "text-green-400" },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 card-hover">
            <Icon name={k.icon} size={16} className={`${k.color} mb-2`} />
            <div className={`text-2xl font-bold font-montserrat ${k.color}`}>{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Статусы */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in delay-150">
        <h3 className="font-bold font-montserrat text-white text-sm mb-4">Статусы отгрузок</h3>
        <div className="space-y-3">
          {[
            { label: "Ожидает", count: pending, color: "bg-orange-400" },
            { label: "В пути", count: transit, color: "bg-yellow-400" },
            { label: "Доставлено", count: delivered, color: "bg-green-400" },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-white font-medium">{row.count}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${row.color} transition-all`}
                  style={{ width: total > 0 ? `${Math.round((row.count / total) * 100)}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Документы */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in delay-200">
        <h3 className="font-bold font-montserrat text-white text-sm mb-4">Загрузка документов</h3>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(220,14%,18%)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(38,100%,54%)" strokeWidth="3"
                strokeDasharray={`${total > 0 ? Math.round((withDocs / total) * 100) : 0} 100`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold font-montserrat text-white">
                {total > 0 ? Math.round((withDocs / total) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">С документами</span>
              <span className="text-green-400 font-medium">{withDocs}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Без документов</span>
              <span className={noDocs > 0 ? "text-red-400 font-medium" : "text-muted-foreground"}>{noDocs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold font-montserrat text-white text-sm">По периодам</h3>
            <span className="text-xs text-muted-foreground">шт.</span>
          </div>
          <div className="flex items-end gap-3 h-32">
            {chartData.map((m, i) => {
              const isLast = i === chartData.length - 1;
              const pct = Math.max(Math.round((m.count / maxCount) * 100), 6);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{m.count}</span>
                  <div className="w-full flex items-end" style={{ height: "80px" }}>
                    <div className={`w-full rounded-t-lg ${isLast ? "bg-primary glow-orange" : "bg-secondary"}`}
                      style={{ height: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${isLast ? "text-primary" : "text-muted-foreground"}`}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top clients */}
      {topClients.length > 0 && (
        <div className="bg-card border border-border rounded-2xl animate-fade-in delay-300">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold font-montserrat text-white text-sm">Топ клиентов</h3>
            {topClients.length > 4 && (
              <button onClick={() => setShowAllClients((v) => !v)} className="text-xs text-primary hover:text-primary/80 transition-colors">
                {showAllClients ? "Свернуть" : "Все клиенты"}
              </button>
            )}
          </div>
          <div className="divide-y divide-border">
            {visibleClients.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary font-montserrat">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} отгрузок</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <button onClick={handleExport}
        className="w-full flex items-center justify-center gap-2 border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-xl py-3 text-sm font-semibold animate-fade-in delay-400">
        <Icon name="Download" size={16} />
        Скачать отчёт CSV
      </button>
    </div>
  );
}
