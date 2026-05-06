import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SHIPMENTS_URL = "https://functions.poehali.dev/c127a43a-9fdb-44f6-9204-1ad54dc19e1b";
const UPLOAD_URL = "https://functions.poehali.dev/8a90c56a-f9fd-41e5-9f8f-c13a91c80dfc";

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  transit: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  pending: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  delivered: "Доставлено",
  transit: "В пути",
  pending: "Ожидает",
};

interface ShipmentFile {
  file_type: "photo" | "invoice";
  url: string;
  file_name: string;
}

interface Shipment {
  id: string;
  client: string;
  date: string;
  items: number;
  status: string;
  amount: string;
  files: ShipmentFile[];
}

interface LocalUpload {
  photo: File | null;
  invoice: File | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TODAY = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

interface NewShipmentForm {
  id: string;
  client: string;
  date: string;
  items: string;
  amount: string;
  status: string;
}

export default function HomePage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [localUploads, setLocalUploads] = useState<Record<string, LocalUpload>>({});
  const [showModal, setShowModal] = useState(false);
  const [activeShipment, setActiveShipment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState<{ id: string; type: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<NewShipmentForm>({ id: "", client: "", date: TODAY, items: "", amount: "", status: "pending" });
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState("");

  const fetchShipments = async () => {
    setLoading(true);
    const res = await fetch(SHIPMENTS_URL);
    const data = await res.json();
    setShipments(data.shipments || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCreateShipment = async () => {
    if (!newForm.id.trim() || !newForm.client.trim() || !newForm.date.trim()) {
      setNewError("Заполните номер, клиента и дату");
      return;
    }
    setNewSaving(true);
    setNewError("");
    const res = await fetch(SHIPMENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newForm.id.trim(),
        client: newForm.client.trim(),
        date: newForm.date.trim(),
        items: parseInt(newForm.items) || 0,
        amount: newForm.amount.trim() || "0 ₽",
        status: newForm.status,
      }),
    });
    const data = await res.json();
    setNewSaving(false);
    if (!res.ok) {
      setNewError(data.error || "Ошибка при создании");
      return;
    }
    setShowNewModal(false);
    setNewForm({ id: "", client: "", date: TODAY, items: "", amount: "", status: "pending" });
    fetchShipments();
  };

  const handleOpenUpload = (shipmentId: string) => {
    setActiveShipment(shipmentId);
    setShowModal(true);
  };

  const handleFile = (shipmentId: string, type: "photo" | "invoice", file: File) => {
    setLocalUploads((prev) => ({
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

  const handleAttach = async () => {
    if (!activeShipment) return;
    const up = localUploads[activeShipment];
    if (!up?.photo || !up?.invoice) return;

    setUploading(true);
    const uploadFile = async (file: File, type: "photo" | "invoice") => {
      const b64 = await fileToBase64(file);
      await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment_id: activeShipment,
          file_type: type,
          file_data: b64,
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        }),
      });
    };

    await Promise.all([uploadFile(up.photo, "photo"), uploadFile(up.invoice, "invoice")]);
    setUploading(false);
    setShowModal(false);
    fetchShipments();
  };

  const current = localUploads[activeShipment || ""] || { photo: null, invoice: null };

  const stats = {
    total: shipments.length,
    transit: shipments.filter((s) => s.status === "transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  const getShipmentDocs = (s: Shipment) => {
    const hasServerPhoto = s.files.some((f) => f.file_type === "photo");
    const hasServerInvoice = s.files.some((f) => f.file_type === "invoice");
    const up = localUploads[s.id] || { photo: null, invoice: null };
    return {
      hasPhoto: hasServerPhoto || !!up.photo,
      hasInvoice: hasServerInvoice || !!up.invoice,
    };
  };

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
          onClick={() => { setNewError(""); setShowNewModal(true); }}
        >
          <Icon name="Plus" size={16} />
          Новая отгрузка
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in delay-100">
        {[
          { label: "Всего", value: String(stats.total), icon: "Package", color: "text-primary" },
          { label: "В пути", value: String(stats.transit), icon: "Truck", color: "text-yellow-400" },
          { label: "Доставлено", value: String(stats.delivered), icon: "CheckCircle", color: "text-green-400" },
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
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-24" />
          ))
        ) : (
          shipments.map((s, i) => {
            const { hasPhoto, hasInvoice } = getShipmentDocs(s);
            const hasAll = hasPhoto && hasInvoice;
            return (
              <div
                key={s.id}
                className="bg-card border border-border rounded-xl p-4 card-hover animate-fade-in"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm font-montserrat">{s.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s.status] || "bg-secondary text-secondary-foreground border-border"}`}>
                        {STATUS_LABELS[s.status] || s.status}
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

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${hasPhoto ? "bg-green-400" : "bg-border"}`} title="Фото товара" />
                      <span className={`w-2 h-2 rounded-full ${hasInvoice ? "bg-green-400" : "bg-border"}`} title="Счёт" />
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
          })
        )}
      </div>

      {/* Upload Modal */}
      {showModal && activeShipment && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && !uploading && setShowModal(false)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-montserrat font-bold text-white">Загрузка документов</h2>
                <p className="text-muted-foreground text-xs mt-0.5">{activeShipment}</p>
              </div>
              <button
                onClick={() => !uploading && setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Фото товара</label>
                <div
                  className={`upload-zone rounded-xl p-4 text-center cursor-pointer ${dragOver?.id === activeShipment && dragOver.type === "photo" ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver({ id: activeShipment, type: "photo" }); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, activeShipment, "photo")}
                  onClick={() => photoRef.current?.click()}
                >
                  <input ref={photoRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(activeShipment, "photo", e.target.files[0])} />
                  {current.photo ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Icon name="CheckCircle" size={18} />
                      <span className="text-sm font-medium truncate max-w-[200px]">{current.photo.name}</span>
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
                <label className="block text-sm font-medium text-white mb-2">Счёт / накладная</label>
                <div
                  className={`upload-zone rounded-xl p-4 text-center cursor-pointer ${dragOver?.id === activeShipment && dragOver.type === "invoice" ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver({ id: activeShipment, type: "invoice" }); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, activeShipment, "invoice")}
                  onClick={() => invoiceRef.current?.click()}
                >
                  <input ref={invoiceRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(activeShipment, "invoice", e.target.files[0])} />
                  {current.invoice ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Icon name="CheckCircle" size={18} />
                      <span className="text-sm font-medium truncate max-w-[200px]">{current.invoice.name}</span>
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
                onClick={() => !uploading && setShowModal(false)}
                disabled={uploading}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors disabled:opacity-40"
              >
                Отмена
              </button>
              <button
                onClick={handleAttach}
                disabled={!current.photo || !current.invoice || uploading}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-orange-sm flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Icon name="Loader" size={14} className="animate-spin" />
                    Загружаю...
                  </>
                ) : (
                  "Прикрепить"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Shipment Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && !newSaving && setShowNewModal(false)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-montserrat font-bold text-white">Новая отгрузка</h2>
              <button
                onClick={() => !newSaving && setShowNewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Номер отгрузки *</label>
                <input
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="ОТГ-2024-042"
                  value={newForm.id}
                  onChange={(e) => setNewForm((f) => ({ ...f, id: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Клиент *</label>
                <input
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="ООО «Название»"
                  value={newForm.client}
                  onChange={(e) => setNewForm((f) => ({ ...f, client: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Дата *</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="06 мая 2026"
                    value={newForm.date}
                    onChange={(e) => setNewForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Позиций</label>
                  <input
                    type="number"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="0"
                    value={newForm.items}
                    onChange={(e) => setNewForm((f) => ({ ...f, items: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Сумма</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="0 ₽"
                    value={newForm.amount}
                    onChange={(e) => setNewForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Статус</label>
                  <select
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    value={newForm.status}
                    onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="pending">Ожидает</option>
                    <option value="transit">В пути</option>
                    <option value="delivered">Доставлено</option>
                  </select>
                </div>
              </div>
              {newError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={13} />
                  {newError}
                </p>
              )}
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => !newSaving && setShowNewModal(false)}
                disabled={newSaving}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors disabled:opacity-40"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateShipment}
                disabled={newSaving}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 glow-orange-sm flex items-center justify-center gap-2"
              >
                {newSaving ? (
                  <>
                    <Icon name="Loader" size={14} className="animate-spin" />
                    Создаю...
                  </>
                ) : (
                  "Создать"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}