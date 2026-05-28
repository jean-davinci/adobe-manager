export type Foto = {
  id: string;
  colaborador: string;
  src: string;
};

export type Dia = {
  fecha: string;
  dia: number;
  diaSemana: string;
  fotos: Foto[];
};

export type Mes = {
  slug: string;
  nombre: string;
  anio: number;
  lema: string;
  dias: Dia[];
};

const img = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/1200`;

export const MESES: Mes[] = [
  {
    slug: 'mayo-2026',
    nombre: 'Mayo',
    anio: 2026,
    lema: 'Un mes donde el talento se vuelve evidencia',
    dias: [
      {
        fecha: '2026-05-04',
        dia: 4,
        diaSemana: 'Lunes',
        fotos: [
          { id: 'm5-4-1', colaborador: 'Camila Rojas', src: img('camila-rojas-1') },
          { id: 'm5-4-2', colaborador: 'Daniel Vega', src: img('daniel-vega-1') },
          { id: 'm5-4-3', colaborador: 'Lucía Mendoza', src: img('lucia-mendoza-1') },
        ],
      },
      {
        fecha: '2026-05-09',
        dia: 9,
        diaSemana: 'Sábado',
        fotos: [
          { id: 'm5-9-1', colaborador: 'Mateo Salinas', src: img('mateo-salinas-1') },
          { id: 'm5-9-2', colaborador: 'Andrea Quispe', src: img('andrea-quispe-1') },
        ],
      },
      {
        fecha: '2026-05-15',
        dia: 15,
        diaSemana: 'Viernes',
        fotos: [
          { id: 'm5-15-1', colaborador: 'Sebastián Flores', src: img('sebastian-flores-1') },
          { id: 'm5-15-2', colaborador: 'Valeria Castro', src: img('valeria-castro-1') },
          { id: 'm5-15-3', colaborador: 'Renato Aguirre', src: img('renato-aguirre-1') },
          { id: 'm5-15-4', colaborador: 'Paula Núñez', src: img('paula-nunez-1') },
        ],
      },
      {
        fecha: '2026-05-21',
        dia: 21,
        diaSemana: 'Jueves',
        fotos: [
          { id: 'm5-21-1', colaborador: 'Jeanpier Senmache', src: img('jeanpier-1') },
          { id: 'm5-21-2', colaborador: 'Diana Pacheco', src: img('diana-pacheco-1') },
          { id: 'm5-21-3', colaborador: 'Bruno Espinoza', src: img('bruno-espinoza-1') },
        ],
      },
    ],
  },
  {
    slug: 'abril-2026',
    nombre: 'Abril',
    anio: 2026,
    lema: 'Donde cada idea se convirtió en impulso',
    dias: [
      {
        fecha: '2026-04-03',
        dia: 3,
        diaSemana: 'Viernes',
        fotos: [
          { id: 'm4-3-1', colaborador: 'Ariana López', src: img('ariana-lopez-1') },
          { id: 'm4-3-2', colaborador: 'Iván Romero', src: img('ivan-romero-1') },
        ],
      },
      {
        fecha: '2026-04-12',
        dia: 12,
        diaSemana: 'Domingo',
        fotos: [
          { id: 'm4-12-1', colaborador: 'Camila Rojas', src: img('camila-rojas-2') },
          { id: 'm4-12-2', colaborador: 'Sofía Bravo', src: img('sofia-bravo-1') },
          { id: 'm4-12-3', colaborador: 'Mateo Salinas', src: img('mateo-salinas-2') },
        ],
      },
      {
        fecha: '2026-04-22',
        dia: 22,
        diaSemana: 'Miércoles',
        fotos: [
          { id: 'm4-22-1', colaborador: 'Renato Aguirre', src: img('renato-aguirre-2') },
          { id: 'm4-22-2', colaborador: 'Valeria Castro', src: img('valeria-castro-2') },
          { id: 'm4-22-3', colaborador: 'Diego Carrillo', src: img('diego-carrillo-1') },
        ],
      },
    ],
  },
  {
    slug: 'marzo-2026',
    nombre: 'Marzo',
    anio: 2026,
    lema: 'El mes en que confirmamos por qué hacemos lo que hacemos',
    dias: [
      {
        fecha: '2026-03-07',
        dia: 7,
        diaSemana: 'Sábado',
        fotos: [
          { id: 'm3-7-1', colaborador: 'Lucía Mendoza', src: img('lucia-mendoza-2') },
          { id: 'm3-7-2', colaborador: 'Daniel Vega', src: img('daniel-vega-2') },
        ],
      },
      {
        fecha: '2026-03-18',
        dia: 18,
        diaSemana: 'Miércoles',
        fotos: [
          { id: 'm3-18-1', colaborador: 'Andrea Quispe', src: img('andrea-quispe-2') },
          { id: 'm3-18-2', colaborador: 'Sebastián Flores', src: img('sebastian-flores-2') },
          { id: 'm3-18-3', colaborador: 'Paula Núñez', src: img('paula-nunez-2') },
        ],
      },
      {
        fecha: '2026-03-29',
        dia: 29,
        diaSemana: 'Domingo',
        fotos: [
          { id: 'm3-29-1', colaborador: 'Diana Pacheco', src: img('diana-pacheco-2') },
          { id: 'm3-29-2', colaborador: 'Bruno Espinoza', src: img('bruno-espinoza-2') },
        ],
      },
    ],
  },
];
