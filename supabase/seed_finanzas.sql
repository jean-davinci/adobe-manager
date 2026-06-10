-- Seeder de finanzas: ~3 meses de transacciones de ejemplo.
-- Idempotente: solo siembra si la tabla está vacía.

insert into proveedores (nombre, servicio, costo_por_uso, umbral_alerta)
select * from (values
  ('Turnitin Perú', 'Pasadas Turnitin oficial', 8.00, 500.00),
  ('GPTZero/IA Detect', 'Detección de IA', 3.50, 300.00),
  ('Adobe Mayorista', 'Licencias Creative Cloud', 25.00, 1000.00)
) as v(nombre, servicio, costo_por_uso, umbral_alerta)
where not exists (select 1 from proveedores);

-- Transacciones generadas a lo largo de los últimos ~90 días
insert into transacciones (tipo, categoria, monto, moneda, descripcion, cliente_nombre, fecha)
select
  case when random() < 0.62 then 'INGRESO' else 'EGRESO' end::tipo_tx as tipo,
  (array['Turnitin Pasada','Afiliado','Servicio Adicional','Proveedor Turnitin','Proveedor IA','Gasto Operativo'])[1 + floor(random()*6)::int] as categoria,
  round((10 + random()*340)::numeric, 2) as monto,
  'PEN',
  'Movimiento de ejemplo',
  (array['María Gómez','Carlos Ruiz','Lucía Torres','Diego Salas','Ana Mendoza',NULL])[1 + floor(random()*6)::int],
  (current_date - (floor(random()*90)::int))
from generate_series(1, 120)
where not exists (select 1 from transacciones);
