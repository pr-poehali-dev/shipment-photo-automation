import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const SHIPMENTS_URL = "https://functions.poehali.dev/c127a43a-9fdb-44f6-9204-1ad54dc19e1b";

const PROFILE_KEY = "shipment_pro_profile";

interface Profile {
  name: string;
  role: string;
  email: string;
  phone: string;
  company: string;
  city: string;
}

const DEFAULT_PROFILE: Profile = {
  name: "Имя Фамилия",
  role: "Менеджер по отгрузкам",
  email: "email@example.com",
  phone: "+7 (900) 000-00-00",
  company: 'ООО «Компания»',
  city: "Город",
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "??";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    } catch { return DEFAULT_PROFILE; }
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Profile>(profile);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const [stats, setStats] = useState({ total: 0, clients: 0, photos: 0, invoices: 0 });
  const [activity, setActivity] = useState<{ text: string; icon: string }[]>([]);

  useEffect(() => {
    fetch(SHIPMENTS_URL)
      .then((r) => r.json())
      .then((d) => {
        const shipments = d.shipments || [];
        const clients = new Set(shipments.map((s: { client: string }) => s.client)).size;
        const photos = shipments.filter((s: { files: { file_type: string }[] }) => s.files.some((f) => f.file_type === "photo")).length;
        const invoices = shipments.filter((s: { files: { file_type: string }[] }) => s.files.some((f) => f.file_type === "invoice")).length;
        setStats({ total: shipments.length, clients, photos, invoices });

        const items: { text: string; icon: string }[] = [];
        shipments.slice(0, 10).forEach((s: { id: string; status: string; files: { file_type: string }[] }) => {
          if (s.files.some((f) => f.file_type === "photo")) items.push({ text: `Загружено фото для ${s.id}`, icon: "Camera" });
          if (s.files.some((f) => f.file_type === "invoice")) items.push({ text: `Загружен счёт для ${s.id}`, icon: "FileText" });
          items.push({ text: `Отгрузка ${s.id} — ${s.status === "delivered" ? "Доставлено" : s.status === "transit" ? "В пути" : "Ожидает"}`, icon: "Package" });
        });
        setActivity(items.slice(0, 20));
      });
  }, []);

  const handleSave = () => {
    setProfile(form);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(form));
    setEditing(false);
  };

  const visibleActivity = showAllActivity ? activity : activity.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center glow-orange-sm shrink-0">
            <span className="text-xl font-bold font-montserrat text-primary">{getInitials(profile.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold font-montserrat text-white truncate">{profile.name}</h2>
            <p className="text-muted-foreground text-sm truncate">{profile.role}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-green-400">Онлайн</span>
            </div>
          </div>
          <button
            onClick={() => { setForm(profile); setEditing(true); }}
            className="shrink-0 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors flex items-center gap-1.5"
          >
            <Icon name="Pencil" size={14} />
            Изменить
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            { icon: "Mail", value: profile.email },
            { icon: "Phone", value: profile.phone },
            { icon: "Building2", value: profile.company },
            { icon: "MapPin", value: profile.city },
          ].map((f) => (
            <div key={f.icon} className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Icon name={f.icon} size={14} className="text-primary shrink-0" />
              <span className="truncate">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in delay-100">
        {[
          { label: "Отгрузок", value: String(stats.total), icon: "Package" },
          { label: "Клиентов", value: String(stats.clients), icon: "Users" },
          { label: "Фото загружено", value: String(stats.photos), icon: "Camera" },
          { label: "Счетов загружено", value: String(stats.invoices), icon: "FileText" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 card-hover">
            <Icon name={s.icon} size={18} className="text-primary mb-2" />
            <div className="text-2xl font-bold font-montserrat text-white">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity */}
      {activity.length > 0 && (
        <div className="bg-card border border-border rounded-2xl animate-fade-in delay-200">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold font-montserrat text-white text-sm">Последние действия</h3>
            {activity.length > 4 && (
              <button onClick={() => setShowAllActivity((v) => !v)} className="text-xs text-primary hover:text-primary/80 transition-colors">
                {showAllActivity ? "Свернуть" : "Все"}
              </button>
            )}
          </div>
          <div className="divide-y divide-border">
            {visibleActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name={a.icon} size={14} className="text-primary" />
                </div>
                <p className="text-sm text-white truncate">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setEditing(false)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-montserrat font-bold text-white">Редактировать профиль</h2>
              <button onClick={() => setEditing(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {([
                { key: "name", label: "Имя и фамилия", placeholder: "Иван Иванов" },
                { key: "role", label: "Должность", placeholder: "Менеджер" },
                { key: "email", label: "Email", placeholder: "email@example.com" },
                { key: "phone", label: "Телефон", placeholder: "+7 (900) 000-00-00" },
                { key: "company", label: "Компания", placeholder: 'ООО «Компания»' },
                { key: "city", label: "Город", placeholder: "Москва" },
              ] as { key: keyof Profile; label: string; placeholder: string }[]).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors">
                Отмена
              </button>
              <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all glow-orange-sm">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
