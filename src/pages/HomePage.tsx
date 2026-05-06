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

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "pending", label: "Ожидает" },
  { key: "transit", label: "В пути" },
  { key: "delivered", label: "Доставлено" },
];

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
  files: ShipmentFile[];
}

interface LocalUpload {
  photo: File | null;
  invoice: File | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
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
  status: string;
}

export default function HomePage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Upload modal
  const [localUploads, setLocalUploads] = useState<Record<string, LocalUpload>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeShipment, setActiveShipment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState<{ id: string; type: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  // New shipment modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<NewShipmentForm>({ id: "", client: "", date: TODAY, items: "", status: "pending" });
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState("");

  // View files modal
  const [viewShipment, setViewShipment] = useState<Shipment | null>(null);
  const [viewImg, setViewImg] = useState<string | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    const res = await fetch(SHIPMENTS_URL);
    const data = await res.json();
    setShipments(data.shipments || []);
    setLoading(false);
  };

  useEffect(() => { fetchShipments(); }, []);

  // Create shipment
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
        status: newForm.status,
      }),
    });
    const data = await res.json();
    setNewSaving(false);
    if (!res.ok) { setNewError(data.error || "Ошибка при создании"); return; }
    setShowNewModal(false);
    setNewForm({ id: "", client: "", date: TODAY, items: "", status: "pending" });
    fetchShipments();
  };

  // Upload files
  const handleFile = (shipmentId: string, type: "photo" | "invoice", file: File) => {
    setLocalUploads((prev) => ({
      ...prev,
      [shipmentId]: { ...(prev[shipmentId] || { photo: null, invoice: null }), [type]: file },
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
        body: JSON.stringify({ shipment_id: activeShipment, file_type: type, file_data: b64, file_name: file.name, content_type: file.type || "image/jpeg" }),
      });
    };
    await Promise.all([uploadFile(up.photo, "photo"), uploadFile(up.invoice, "invoice")]);
    setUploading(false);
    setShowUploadModal(false);
    fetchShipments();
  };

  const current = localUploads[activeShipment || ""] || { photo: null, invoice: null };

  const getShipmentDocs = (s: Shipment) => {
    const up = localUploads[s.id] || { photo: null, invoice: null };
    return {
      hasPhoto: s.files.some((f) => f.file_type === "photo") || !!up.photo,
      hasInvoice: s.files.some((f) => f.file_type === "invoice") || !!up.invoice,
    };
  };

  const filtered = filter === "all" ? shipments : shipments.filter((s) => s.status === filter);

  const stats = {
    total: shipments.length,
    transit: shipments.filter((s) => s.status === "transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-montserrat font-bold text-white">Отгрузки</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Все активные и завершённые</p>
        </div>
        <button
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all glow-orange-sm"
          onClick={() => { setNewError(""); setShowNewModal(true); }}
        >
          <Icon name="Plus" size={16} />
          Новая
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in delay-100">
        {[
          { label: "Всего", value: String(stats.total), icon: "Package", color: "text-primary", filterKey: "all" },
          { label: "В пути", value: String(stats.transit), icon: "Truck", color: "text-yellow-400", filterKey: "transit" },
          { label: "Доставлено", value: String(stats.delivered), icon: "CheckCircle", color: "text-green-400", filterKey: "delivered" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.filterKey ? "all" : s.filterKey)}
            className={`bg-card rounded-xl p-4 border transition-all text-left card-hover ${filter === s.filterKey ? "border-primary/50 glow-orange-sm" : "border-border"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon name={s.icon} size={16} className={s.color} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold font-montserrat ${s.color}`}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in delay-100">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Shipments list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-24" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Icon name="PackageOpen" size={32} className="mx-auto mb-3 opacity-30" />
            Нет отгрузок
          </div>
        ) : (
          filtered.map((s, i) => {
            const { hasPhoto, hasInvoice } = getShipmentDocs(s);
            const hasAll = hasPhoto && hasInvoice;
            return (
              <div
                key={s.id}
                className="bg-card border border-border rounded-xl p-4 card-hover animate-fade-in"
                style={{ animationDelay: `${0.05 + i * 0.05}s` }}
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
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* dots */}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${hasPhoto ? "bg-green-400" : "bg-border"}`} title="Фото" />
                      <span className={`w-2 h-2 rounded-full ${hasInvoice ? "bg-green-400" : "bg-border"}`} title="Счёт" />
                    </div>
                    {/* view or upload */}
                    {hasAll ? (
                      <button
                        onClick={() => setViewShipment(s)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all"
                      >
                        <Icon name="Eye" size={13} />
                        Смотреть
                      </button>
                    ) : (
                      <button
                        onClick={() => { setActiveShipment(s.id); setShowUploadModal(true); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
                      >
                        <Icon name="Upload" size={13} />
                        Загрузить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── VIEW FILES MODAL ── */}
      {viewShipment && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setViewShipment(null)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-montserrat font-bold text-white">Документы</h2>
                <p className="text-muted-foreground text-xs mt-0.5">{viewShipment.id} · {viewShipment.client}</p>
              </div>
              <button onClick={() => setViewShipment(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {(["photo", "invoice"] as const).map((type) => {
                const file = viewShipment.files.find((f) => f.file_type === type);
                const label = type === "photo" ? "Фото товара" : "Счёт / накладная";
                const icon = type === "photo" ? "Camera" : "FileText";
                return (
                  <div key={type}>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
                    {file ? (
                      <div
                        className="relative rounded-xl overflow-hidden bg-secondary cursor-pointer group"
                        onClick={() => setViewImg(file.url)}
                      >
                        <img src={file.url} alt={label} className="w-full h-40 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Icon name="ZoomIn" size={24} className="text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1">
                          <Icon name="ExternalLink" size={12} className="text-white" />
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-white text-xs" onClick={(e) => e.stopPropagation()}>Открыть</a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-secondary h-24 flex flex-col items-center justify-center gap-2">
                        <Icon name={icon} size={20} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Не загружено</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => { setViewShipment(null); setActiveShipment(viewShipment.id); setShowUploadModal(true); }}
                className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="Upload" size={14} />
                Заменить файлы
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN IMAGE ── */}
      {viewImg && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewImg(null)}
        >
          <img src={viewImg} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button onClick={() => setViewImg(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <Icon name="X" size={20} className="text-white" />
          </button>
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && activeShipment && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && !uploading && setShowUploadModal(false)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-montserrat font-bold text-white">Загрузка документов</h2>
                <p className="text-muted-foreground text-xs mt-0.5">{activeShipment}</p>
              </div>
              <button onClick={() => !uploading && setShowUploadModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Фото товара</label>
                <div
                  className={`upload-zone rounded-xl p-4 text-center cursor-pointer ${dragOver?.id === activeShipment && dragOver.type === "photo" ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver({ id: activeShipment, type: "photo" }); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, activeShipment, "photo")}
                  onClick={() => photoRef.current?.click()}
                >
                  <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
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
                      <span className="text-sm text-muted-foreground">Сфотографировать или выбрать</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice — только фото */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Счёт / накладная <span className="text-muted-foreground font-normal text-xs">(фото)</span></label>
                <div
                  className={`upload-zone rounded-xl p-4 text-center cursor-pointer ${dragOver?.id === activeShipment && dragOver.type === "invoice" ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver({ id: activeShipment, type: "invoice" }); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, activeShipment, "invoice")}
                  onClick={() => invoiceRef.current?.click()}
                >
                  <input ref={invoiceRef} type="file" accept="image/*" capture="environment" className="hidden"
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
                      <span className="text-sm text-muted-foreground">Сфотографировать счёт</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => !uploading && setShowUploadModal(false)} disabled={uploading}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors disabled:opacity-40">
                Отмена
              </button>
              <button onClick={handleAttach} disabled={!current.photo || !current.invoice || uploading}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-orange-sm flex items-center justify-center gap-2">
                {uploading ? (<><Icon name="Loader" size={14} className="animate-spin" />Загружаю...</>) : "Прикрепить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW SHIPMENT MODAL ── */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && !newSaving && setShowNewModal(false)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-montserrat font-bold text-white">Новая отгрузка</h2>
              <button onClick={() => !newSaving && setShowNewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Номер отгрузки *</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="ОТГ-2024-042" value={newForm.id} onChange={(e) => setNewForm((f) => ({ ...f, id: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Клиент *</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder='ООО «Название»' value={newForm.client} onChange={(e) => setNewForm((f) => ({ ...f, client: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Дата *</label>
                  <input className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="06 мая 2026" value={newForm.date} onChange={(e) => setNewForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Позиций</label>
                  <input type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="0" value={newForm.items} onChange={(e) => setNewForm((f) => ({ ...f, items: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Статус</label>
                <select className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  value={newForm.status} onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="pending">Ожидает</option>
                  <option value="transit">В пути</option>
                  <option value="delivered">Доставлено</option>
                </select>
              </div>
              {newError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={13} />{newError}
                </p>
              )}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => !newSaving && setShowNewModal(false)} disabled={newSaving}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/70 transition-colors disabled:opacity-40">
                Отмена
              </button>
              <button onClick={handleCreateShipment} disabled={newSaving}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 glow-orange-sm flex items-center justify-center gap-2">
                {newSaving ? (<><Icon name="Loader" size={14} className="animate-spin" />Создаю...</>) : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
