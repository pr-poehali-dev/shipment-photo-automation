INSERT INTO t_p33761989_shipment_photo_autom.shipments (id, client, date, items, status, amount)
SELECT id, client, date, items, status, amount FROM (
  SELECT '&#1054;&#1058;&#1043;-2024-041' AS id, '&#1054;&#1054;&#1054; &#1058;&#1077;&#1093;&#1085;&#1086;&#1089;&#1092;&#1077;&#1088;&#1072;' AS client, '05 &#1084;&#1072;&#1103; 2026' AS date, 24 AS items, 'delivered' AS status, '148 500 &#8381;' AS amount
  UNION ALL
  SELECT '&#1054;&#1058;&#1043;-2024-040', '&#1048;&#1055; &#1057;&#1072;&#1074;&#1077;&#1083;&#1100;&#1077;&#1074; &#1040;.&#1053;.', '04 &#1084;&#1072;&#1103; 2026', 6, 'transit', '32 000 &#8381;'
  UNION ALL
  SELECT '&#1054;&#1058;&#1043;-2024-039', '&#1047;&#1040;&#1054; &#1055;&#1088;&#1086;&#1084;&#1083;&#1072;&#1081;&#1085;', '02 &#1084;&#1072;&#1103; 2026', 50, 'pending', '215 000 &#8381;'
) v
WHERE NOT EXISTS (SELECT 1 FROM t_p33761989_shipment_photo_autom.shipments LIMIT 1);