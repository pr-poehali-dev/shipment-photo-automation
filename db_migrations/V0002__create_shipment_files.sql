CREATE TABLE t_p33761989_shipment_photo_autom.shipment_files (
  id SERIAL PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);