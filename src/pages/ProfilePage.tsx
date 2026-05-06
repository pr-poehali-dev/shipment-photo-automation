import Icon from "@/components/ui/icon";

const STATS = [
  { label: "Отгрузок", value: "41", icon: "Package" },
  { label: "Клиентов", value: "12", icon: "Users" },
  { label: "Фото загружено", value: "38", icon: "Camera" },
  { label: "Счетов загружено", value: "35", icon: "FileText" },
];

const ACTIVITY = [
  { text: "Загружено фото для ОТГ-2024-041", time: "2 часа назад", icon: "Camera" },
  { text: "Создана отгрузка ОТГ-2024-041", time: "5 часов назад", icon: "Plus" },
  { text: "Загружен счёт для ОТГ-2024-040", time: "1 день назад", icon: "FileText" },
  { text: "Статус ОТГ-2024-040 → В пути", time: "1 день назад", icon: "Truck" },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-5 relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center glow-orange-sm">
            <span className="text-2xl font-bold font-montserrat text-primary">АС</span>
          </div>
          <div>
            <h2 className="text-xl font-bold font-montserrat text-white">Алексей Савельев</h2>
            <p className="text-muted-foreground text-sm">Менеджер по отгрузкам</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-ring" />
              <span className="text-xs text-green-400">Онлайн</span>
            </div>
          </div>
          <button className="ml-auto bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors flex items-center gap-2">
            <Icon name="Pencil" size={14} />
            Редактировать
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Mail" size={14} className="text-primary" />
            a.saveliev@example.com
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Phone" size={14} className="text-primary" />
            +7 (900) 123-45-67
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Building2" size={14} className="text-primary" />
            ООО «ТрансЛогистик»
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="MapPin" size={14} className="text-primary" />
            Москва
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in delay-100">
        {STATS.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 card-hover">
            <Icon name={s.icon} size={18} className="text-primary mb-2" />
            <div className="text-2xl font-bold font-montserrat text-white">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity */}
      <div className="bg-card border border-border rounded-2xl animate-fade-in delay-200">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold font-montserrat text-white text-sm">Последние действия</h3>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">Все</button>
        </div>
        <div className="divide-y divide-border">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name={a.icon} size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{a.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}