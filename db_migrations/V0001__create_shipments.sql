CREATE TABLE t_p33761989_shipment_photo_autom.shipments (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  date TEXT NOT NULL,
  items INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  amount TEXT NOT NULL DEFAULT '0 ₽',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);