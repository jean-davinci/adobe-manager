-- Datos de ejemplo para desarrollo local (idempotente-ish: solo inserta si vacío)

insert into clientes_adobe
  (numero_pedido, nombre_cliente, email_cliente, telefono, plan_duracion, costo_servicio, email_adobe, "contraseña_adobe_encriptada", estado, fecha_renovacion_proxima)
select * from (values
  ('#0001','María Gómez','maria.gomez@gmail.com','+51987654321',1,44.90,'adobe.maria@davincilabs.pe','xK9pLm2','ACTIVO',(current_date + 12)),
  ('#0002','Carlos Ruiz','carlos.ruiz@gmail.com','+51912345678',12,289.90,'adobe.carlos@davincilabs.pe','aB3dEf7','ACTIVO',(current_date + 200)),
  ('#0003','Lucía Torres','lucia.torres@hotmail.com','+51998877665',3,124.90,'adobe.lucia@davincilabs.pe','zQ8wRt4','PENDIENTE_PAGO',(current_date + 3)),
  ('#0004','Diego Salas','diego.salas@gmail.com','+51955443322',6,199.90,'adobe.diego@davincilabs.pe','mN5kJh1','INACTIVO',(current_date - 5))
) as v(numero_pedido,nombre_cliente,email_cliente,telefono,plan_duracion,costo_servicio,email_adobe,contra,estado,fecha)
where not exists (select 1 from clientes_adobe);

insert into servicios_clientes
  (tipo_servicio, nombre_cliente, email, telefono, estado, monto, prioridad, fecha_entrega_esperada, descripcion, porcentaje_actual)
select * from (values
  ('TURNITIN','María Gómez','maria.gomez@gmail.com','+51987654321','COMPLETADO',12.00,'NORMAL',(current_date - 2),'Informe de similitud capítulo 1',100),
  ('IA_REDUCCION','Lucía Torres','lucia.torres@hotmail.com','+51998877665','EN_PROCESO',20.00,'ALTA',(current_date + 1),'Reducción de IA en marco teórico',45),
  ('ASESORIA','Diego Salas','diego.salas@gmail.com','+51955443322','PENDIENTE',350.00,'NORMAL',(current_date + 7),'Asesoría metodológica',0)
) as v(tipo_servicio,nombre_cliente,email,telefono,estado,monto,prioridad,fecha,descripcion,pct)
where not exists (select 1 from servicios_clientes);

insert into proyectos_tesis
  (nombre_alumno, carrera, curso_tesis, titulo_tesis, porcentaje_avance, j1_nota, j2_nota)
select * from (values
  ('Ana Mendoza','Comunicación','TESIS_I','Impacto de redes sociales en jóvenes',30,NULL::numeric,NULL::numeric),
  ('Pedro Castro','Comunicación','TESIS_II','Periodismo digital en el Perú',65,15.0,14.5)
) as v(nombre_alumno,carrera,curso_tesis,titulo_tesis,pct,j1,j2)
where not exists (select 1 from proyectos_tesis);
