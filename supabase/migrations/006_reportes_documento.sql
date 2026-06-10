-- Reportes de plataformas (iVerificate IA / Canvas similitud) por documento.
alter table documentos add column if not exists reporte_ia_url        text;
alter table documentos add column if not exists reporte_similitud_url text;
