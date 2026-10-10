import { diaDeLaSemana, textoDe } from './fecha';

/**
 * Holidays and university vacations, known in advance.
 *
 * Built from `calendario.json`, exported by `ml/src/calendario.py`. Training
 * and inference read the same file, so "is this a class day" can never mean
 * two different things.
 */
export interface DefinicionCalendario {
  anioMinimo: number;
  anioMaximo: number;
  feriados: string[];
  vacaciones: { desde: string; hasta: string }[];
}

export class CalendarioOperativo {
  private readonly feriados: ReadonlySet<string>;

  constructor(private readonly definicion: DefinicionCalendario) {
    this.feriados = new Set(definicion.feriados);
  }

  get anioMinimo(): number {
    return this.definicion.anioMinimo;
  }

  get anioMaximo(): number {
    return this.definicion.anioMaximo;
  }

  cubre(fecha: string): boolean {
    const anio = Number(fecha.slice(0, 4));
    return anio >= this.definicion.anioMinimo && anio <= this.definicion.anioMaximo;
  }

  esDiaDeClases(dia: number): boolean {
    const texto = textoDe(dia);
    return diaDeLaSemana(dia) < 5 && !this.feriados.has(texto) && !this.esVacacion(texto);
  }

  /** Share of class days in the closed interval [desde, hasta]. */
  proporcionDeClases(desde: number, hasta: number): number {
    if (hasta < desde) return 0;
    const total = hasta - desde + 1;
    let clases = 0;
    for (let dia = desde; dia <= hasta; dia += 1) {
      if (this.esDiaDeClases(dia)) clases += 1;
    }
    return clases / total;
  }

  private esVacacion(texto: string): boolean {
    const clave = texto.slice(5);
    return this.definicion.vacaciones.some(({ desde, hasta }) => desde <= clave && clave <= hasta);
  }
}

