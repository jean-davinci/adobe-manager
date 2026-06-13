-- ============================================================
-- Davinci Labs — Informes automáticos (resultados del análisis)
-- ============================================================

alter table documentos add column if not exists cliente_telefono     text;
alter table documentos add column if not exists porcentaje_ia        int;
alter table documentos add column if not exists porcentaje_similitud int;
alter table documentos add column if not exists porcentaje_original  int;
alter table documentos add column if not exists screenshot_ia        text;
alter table documentos add column if not exists screenshot_similitud text;
alter table documentos add column if not exists notas_informe        text;
alter table documentos add column if not exists drive_informe_url    text;
alter table documentos add column if not exists procesado_en         timestamptz;
