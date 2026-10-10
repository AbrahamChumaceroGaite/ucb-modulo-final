import { z } from 'zod';
import { cantidad } from '@/shared/lib/validation';

/**
 * Qué es una evaluación de riesgo de un lote. Leído de `EvaluacionResponse` en
 * `ml-api/src/contexts/prediccion_vencimiento/application/types/
 * evaluacion.types.ts`, campo a campo (regla §9.1.c).
 *
 * ## De dónde sale cada cosa
 *
 * - **Los datos del lote** (fechas, cantidades, consumo) son lo que se mandó al
 *   evaluar. El servicio no los inventa ni los completa.
 * - **La respuesta del modelo** (`probabilidad`, `nivel`, `enRiesgo`) la
 *   calculó LightGBM en el momento de registrar la evaluación y queda
 *   congelada: si el modelo se reentrena, una evaluación vieja sigue diciendo lo
 *   que dijo entonces, y `versionModelo` dice con qué modelo.
 * - **`reglaDeCobertura`** es la línea base: el mismo lote juzgado con la regla
 *   simple de «al ritmo de la semana, ¿se termina antes de vencer?». Viene
 *   para que la pantalla compare, no para decidir. `null` es «sin consumo
 *   registrado, no puede juzgar» y **no** es «sin riesgo».
 * - **`sobranteEstimado`** es la aritmética de esa regla, en unidades: cuánto
 *   quedaría el día que vence. Tampoco es salida del modelo.
 */
const nivelSchema = z.enum(['alto', 'vigilar', 'bajo']);

export const evaluacionSchema = z.object({
  id: z.string(),
  codigoInsumo: z.string(),
  insumo: z.string(),
  categoria: z.string(),
  unidad: z.string(),
  fechaIngreso: z.string(),
  fechaVencimiento: z.string(),
  fechaRevision: z.string(),
  cantidadInicial: z.number(),
  cantidadRestante: z.number(),
  stockPorDelante: z.number(),
  consumo7d: z.number(),
  consumo28d: z.number().nullable(),
  diasParaVencer: z.number(),
  probabilidad: z.number(),
  umbral: z.number(),
  nivel: nivelSchema,
  enRiesgo: z.boolean(),
  reglaDeCobertura: z.boolean().nullable(),
  diasCobertura: z.number().nullable(),
  sobranteEstimado: z.number().nullable(),
  versionModelo: z.string(),
  origen: z.enum(['inventario', 'manual']),
  registradaEl: z.string(),
});

export type Evaluacion = z.infer<typeof evaluacionSchema>;
export type NivelDeRiesgo = z.infer<typeof nivelSchema>;

/**
 * La ficha del modelo: `GET /modelo-riesgo`.
 *
 * Se enseña en la pantalla porque una predicción sin su tasa de acierto al
 * lado se lee como una certeza, y no lo es.
 */
const metricasSchema = z.object({
  recall: z.number(),
  precision: z.number(),
  accuracy: z.number(),
  f1: z.number(),
  avisoAnticipado2Dias: z.number(),
});

const insumoSchema = z.object({
  codigo: z.string(),
  nombre: z.string(),
  categoria: z.string(),
  unidad: z.string(),
  vidaUtilDias: z.number(),
});

export const modeloRiesgoSchema = z.object({
  version: z.string(),
  entrenadoEl: z.string(),
  umbral: z.number(),
  recallObjetivo: z.number(),
  calendario: z.object({ anioMinimo: z.number(), anioMaximo: z.number() }),
  insumos: z.array(insumoSchema),
  metricas: z.object({ modelo: metricasSchema, regla: metricasSchema }),
});

export type ModeloRiesgo = z.infer<typeof modeloRiesgoSchema>;
export type InsumoDelModelo = z.infer<typeof insumoSchema>;

/**
 * Lo que se manda al evaluar: `RegistrarEvaluacionDto`, con los mismos
 * nombres para que no haya traducción en el borde.
 *
 * Las reglas que cruzan campos se repiten aquí para avisar **antes** de
 * enviar, pero quien decide es el servicio: si alguna diverge, gana su
 * mensaje, que el formulario enseña tal cual (regla §2.4).
 */
const fecha = (que: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Elige la fecha de ${que}`);

export const registrarEvaluacionSchema = z
  .object({
    codigoInsumo: z.string().min(1, 'Elige el insumo'),
    fechaIngreso: fecha('ingreso'),
    fechaVencimiento: fecha('vencimiento'),
    fechaRevision: fecha('revisión'),
    cantidadInicial: z.number({ error: 'Debe ser un número' }).positive('Tiene que ser mayor que cero'),
    cantidadRestante: z
      .number({ error: 'Debe ser un número' })
      .positive('Si no queda nada, no hay riesgo que evaluar'),
    stockPorDelante: cantidad,
    consumo7d: cantidad,
    consumo28d: cantidad.nullable(),
  })
  .superRefine((valores, contexto) => {
    if (valores.cantidadRestante > valores.cantidadInicial) {
      contexto.addIssue({
        code: 'custom',
        path: ['cantidadRestante'],
        message: 'No puede quedar más de lo que se compró',
      });
    }
    // `AAAA-MM-DD` ordena igual como texto que como fecha.
    if (valores.fechaVencimiento <= valores.fechaIngreso) {
      contexto.addIssue({
        code: 'custom',
        path: ['fechaVencimiento'],
        message: 'Tiene que ser posterior al ingreso',
      });
    }
    if (valores.fechaRevision < valores.fechaIngreso) {
      contexto.addIssue({
        code: 'custom',
        path: ['fechaRevision'],
        message: 'No puede ser antes del ingreso',
      });
    }
    if (valores.fechaRevision > valores.fechaVencimiento) {
      contexto.addIssue({
        code: 'custom',
        path: ['fechaRevision'],
        message: 'El lote ya venció en esta fecha: eso es merma, no riesgo',
      });
    }
  });

export type RegistrarEvaluacion = z.infer<typeof registrarEvaluacionSchema>;
