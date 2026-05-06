import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

const SHIPMENTS = [
  {
    id: "ОТГ-2024-041",
    client: "ООО «Техносфера»",
    date: "05 мая 2026",
    items: 24,
    status: "delivered",
    statusLabel: "Доставлено",
    amount: "148 500 ₽",
    photo: null,
    invoice: null,
  },
  {
    id: "ОТГ-2024-040",
    client: "ИП Савельев А.Н.",
    date: "04 мая 2026",
    items: 6,
    status: "transit",
    statusLabel: "В пути",
    amount: "32 000 ₽",
    photo: null,
    invoice: null,
  },
  {
    id: "ОТГ-2024-039",
    client: "ЗАО «Промлайн»",
    date: "02 мая 2026",
    items: 50,
    status: "pending",
    statusLabel: "Ожидает",
    amount: "215 000 ₽",
    photo: null,
    invoice: null,
  },
];

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  transit: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  pending: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

interface UploadState {
  photo: File | null;
  invoice: File | null;
}

export default function HomePage() {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [showModal, setShowModal] = useState(false);
  const [activeShipment, setActiveShipment] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ id: string; type: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const handleOpenUpload = (shipmentId: string) => {
    setActiveShipment(shipmentId);
    setShowModal(true);
  };

  const handleFile = (shipmentId: string, type: "photo" | "invoice", file: File) => {
    setUploads((prev) => ({
      ...prev,
      [shipmentId]: {
        ...(prev[shipmentId] || { photo: null, invoice: null }),
        [type]: file,
      },
    }));
  };

  const handleDrop = (e: React.DragEvent, id: string, type: "photo" | "invoice") => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(id, type, file);
  };

  const current = uploads[activeShipment || ""] || { photo: null, invoice: null };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-white">Отгрузки</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Все активные и завершённые отгрузки</p>
        </div>
        <button
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all glow-orange-sm hover:glow-orange"
          onClick={() => alert("Создание отгрузки будет настроено")}
        >
          <Icon name="Plus" size={16} />
          Новая отгрузка
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in delay-100">
        {[
          { label: "Всего", value: "41", icon: "Package", color: "text-primary" },
          { label: "В пути", value: "7", icon: "Truck", color: "text-yellow-400" },
          { label: "Доставлено", value: "34", icon: "CheckCircle", color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border card-hover">
            <div className="flex items-center gap-2 mb-1">
              <Icon name={s.icon} size={16} className={s.color} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold font-montserrat ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Shipments list */}
      <div className="space-y-3">
        {SHIPMENTS.map((s, i) => {
          const up = uploads[s.id] || { photo: null, invoice: null };
          const hasAll = up.photo && up.invoice;
          return (
            <div
              key={s.id}
              className="bg-card border border-border rounded-xl p-4 card-hover animate-fade-in"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm font-montserrat">{s.id}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s.status]}`}
                    >
                      {s.statusLabel}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm mt-1 truncate">{s.client}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      {s.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Boxes" size={12} />
                      {s.items} поз.
                    </span>
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <Icon name="Banknote" size={12} />
                      {s.amount}
                    </span>
                  </div>
                </div>

                {/* Upload status + button */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${up.photo ? "bg-green-400" : "bg-border"}`}
                      title="Фото товара"
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${up.invoice ? "bg-green-400" : "bg-border"}`}
                      title="Счёт"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenUpload(s.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      hasAll
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                    }`}
                  >
                    <Icon name={hasAll ? "CheckCircle" : "Upload"} size={13} />
                    {hasAll ? "Загружено" : "Загрузить"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showModal && activeShipment && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-montserrat font-bold text-white">Загрузка документов</h2>
                <p className="text-muted-foreground text-xs mt-0.5">{activeShipment}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Фото товара
                </label>
                <div
                  className={`upload-zone rounded-xl p-4 text-center cursor-pointer ${
                    dragOver?.id === activeShipment && dragOver.type === "photo" ? "drag-over" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver({ id: activeShipment, type: "photo" }); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, activeShipment, "photo")}
                  onClick={() => photoRef.current?.click()}
                >
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(activeShipment, "photo", e.target.files[0])}
                  />
                  {current.photo ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Icon name="CheckCircle" size={18} />
                      <span className="text-sm font-medium">{current.photo.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon name="Camera" size={20} className="text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">Перетащите или нажмите</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Счёт / накладная
                </label>
                <div
                  className={`upload-zone rounded-xl p-4 text-center cursor-pointer ${
                    dragOver?.id === activeShipment && dragOver.type === "invoice" ? "drag-over" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver({ id: activeShipment, type: "invoice" }); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, activeShipment, "invoice")}
                  onClick={() => invoiceRef.current?.click()}
                >
                  <input
                    ref={invoiceRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(activeShipment, "invoice", e.target.files[0])}
                  />
                  {current.invoice ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Icon name="CheckCircle" size={18} />
                      <span className="text-sm font-medium">{current.invoice.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon name="FileText" size={20} className="text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">PDF или изображение</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={!current.photo || !current.invoice}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-orange-sm"
              >
                Прикрепить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}