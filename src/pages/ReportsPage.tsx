import Icon from "@/components/ui/icon";

const MONTHLY = [
  { month: "Янв", count: 18, amount: 420 },
  { month: "Фев", count: 22, amount: 510 },
  { month: "Мар", count: 15, amount: 380 },
  { month: "Апр", count: 30, amount: 720 },
  { month: "Май", count: 41, amount: 890 },
];

const max = Math.max(...MONTHLY.map((m) => m.amount));

const TOP_CLIENTS = [
  { name: "ООО «Техносфера»", shipments: 12, amount: "384 000 ₽" },
  { name: "ЗАО «Промлайн»", shipments: 9, amount: "280 000 ₽" },
  { name: "ИП Савельев А.Н.", shipments: 7, amount: "168 000 ₽" },
  { name: "ООО «Горизонт»", shipments: 5, amount: "115 000 ₽" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-montserrat font-bold text-white">Отчёты</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Аналитика за текущий год</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in delay-100">
        {[
          { label: "Выручка (май)", value: "890 000 ₽", delta: "+24%", icon: "TrendingUp", up: true },
          { label: "Отгрузок (май)", value: "41", delta: "+37%", icon: "Package", up: true },
          { label: "Ср. чек", value: "21 700 ₽", delta: "+8%", icon: "Banknote", up: true },
          { label: "Без документов", value: "3", delta: "–2", icon: "AlertCircle", up: false },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 card-hover">
            <div className="flex items-center justify-between mb-2">
              <Icon name={k.icon} size={16} className={k.up ? "text-primary" : "text-red-400"} />
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  k.up
                    ? "bg-green-500/15 text-green-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {k.delta}
              </span>
            </div>
            <div className="text-xl font-bold font-montserrat text-white">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in delay-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold font-montserrat text-white text-sm">Выручка по месяцам</h3>
          <span className="text-xs text-muted-foreground">тыс. ₽</span>
        </div>
        <div className="flex items-end gap-3 h-36">
          {MONTHLY.map((m, i) => {
            const isLast = i === MONTHLY.length - 1;
            const height = Math.round((m.amount / max) * 100);
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{m.amount}</span>
                <div className="w-full relative" style={{ height: `${height}%` }}>
                  <div
                    className={`w-full h-full rounded-t-lg transition-all ${
                      isLast
                        ? "bg-primary glow-orange"
                        : "bg-secondary hover:bg-secondary/70"
                    }`}
                    style={{ minHeight: 8 }}
                  />
                </div>
                <span className={`text-xs font-medium ${isLast ? "text-primary" : "text-muted-foreground"}`}>
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-card border border-border rounded-2xl animate-fade-in delay-300">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold font-montserrat text-white text-sm">Топ клиентов</h3>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">Все клиенты</button>
        </div>
        <div className="divide-y divide-border">
          {TOP_CLIENTS.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary font-montserrat">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.shipments} отгрузок</p>
              </div>
              <span className="text-sm font-semibold text-primary font-montserrat">{c.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        className="w-full flex items-center justify-center gap-2 border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-xl py-3 text-sm font-semibold animate-fade-in delay-400"
        onClick={() => alert("Экспорт будет настроен")}
      >
        <Icon name="Download" size={16} />
        Экспортировать отчёт
      </button>
    </div>
  );
}
