-- Seed CRM (idempotente)
insert into respuestas_rapidas (trigger, texto)
select * from (values
  ('/informe', 'Hola 👋, tu informe ya está listo. Te lo comparto en este chat. 📄'),
  ('/bienvenida', '¡Bienvenido a Davinci Labs! 🎓 ¿En qué servicio te podemos ayudar hoy?'),
  ('/pago', 'Para confirmar tu pedido, realiza el pago al Yape 999-888-777 a nombre de Davinci Labs y envíame la captura. 🙏'),
  ('/precios', 'Nuestros precios: Turnitin S/.12 · Reducción IA S/.20 · Asesoría desde S/.350.')
) as v(trigger, texto)
where not exists (select 1 from respuestas_rapidas);

insert into contactos (nombre, telefono, email, etiquetas)
select * from (values
  ('María Gómez','+51987654321','maria.gomez@gmail.com', array['Afiliado','VIP']),
  ('Lucía Torres','+51998877665','lucia.torres@hotmail.com', array['Turnitin','En proceso']),
  ('Diego Salas','+51955443322','diego.salas@gmail.com', array['Nuevo'])
) as v(nombre,telefono,email,etiquetas)
where not exists (select 1 from contactos);

-- Conversación de ejemplo con Lucía
insert into mensajes (contacto_id, origen, contenido, leido, timestamp)
select c.id, v.origen, v.contenido, v.leido, now() - (v.mins || ' minutes')::interval
from contactos c
cross join (values
  ('CLIENTE','Hola, necesito un informe Turnitin para mi tesis', true, 60),
  ('OPERADOR','¡Hola Lucía! Claro, ¿me compartes el documento?', true, 58),
  ('CLIENTE','Sí, ahí te lo envío. ¿Cuánto demora?', false, 30),
  ('CLIENTE','¿Sigues ahí?', false, 5)
) as v(origen,contenido,leido,mins)
where c.telefono = '+51998877665'
  and not exists (select 1 from mensajes m where m.contacto_id = c.id);
