import { z } from 'zod';

/**
 * El error tal como lo manda Spring. Verificado en `GlobalExceptionHandler`:
 * `record ErrorResponse(int codigo, String tipo, String mensaje, OffsetDateTime timestamp)`.
 */
const errorApiSchema = z.object({
  codigo: z.number(),
  tipo: z.string(),
  mensaje: z.string(),
  timestamp: z.string(),
});


/**
 * Error de la API, con el mensaje del backend intacto.
 *
 * El frontend **no reescribe** mensajes de error del servidor: el backend ya
 * los escribe en español y sabe por qué falló. Reescribirlos aquí produce dos
 * versiones del mismo problema.
 */
export class ApiError extends Error {
  readonly codigo: number;
  readonly tipo: string;

  constructor(codigo: number, tipo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.codigo = codigo;
    this.tipo = tipo;
  }

  get esNoEncontrado(): boolean {
    return this.codigo === 404;
  }

  get esNoAutorizado(): boolean {
    return this.codigo === 401 || this.codigo === 403;
  }

  get esConflicto(): boolean {
    return this.codigo === 409;
  }

  /**
   * Construye el error desde una respuesta.
   *
   * Si el cuerpo no tiene la forma esperada —un 502 del proxy, por ejemplo— se
   * usa el estado HTTP. Nunca se deja pasar un error sin mensaje legible.
   */
  static async desdeRespuesta(respuesta: Response): Promise<ApiError> {
    try {
      const cuerpo = errorApiSchema.safeParse(await respuesta.json());
      if (cuerpo.success) {
        return new ApiError(cuerpo.data.codigo, cuerpo.data.tipo, cuerpo.data.mensaje);
      }
    } catch {
      // Cuerpo vacío o no-JSON: se cae al genérico de abajo.
    }
    return new ApiError(respuesta.status, 'HttpError', mensajePorEstado(respuesta.status));
  }
}

function mensajePorEstado(estado: number): string {
  if (estado === 401) return 'Tu sesión terminó. Vuelve a entrar.';
  if (estado === 403) return 'No tienes permiso para hacer esto.';
  if (estado === 404) return 'No encontramos lo que buscabas.';
  if (estado >= 500) return 'El servidor tuvo un problema. Inténtalo otra vez.';
  return 'No se pudo completar la operación.';
}

/** Mensaje presentable de cualquier fallo, sin dejar nunca la pantalla muda. */
export function mensajeDe(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return 'Sin conexión con el servidor.';
  return 'Ocurrió algo inesperado. Inténtalo otra vez.';
}
