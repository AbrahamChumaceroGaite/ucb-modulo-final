import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIGURACION, type Configuracion } from '@libs';
import { ModeloRiesgo, type FichaDelModelo } from '../../domain/entities/modelo-riesgo.entity';
import type { IModeloRiesgoRepository } from '../../domain/repositories/IModeloRiesgo.interface';
import { BosqueLightGbm, type NodoLightGbm } from '../../domain/services/bosque-lightgbm';
import { CalendarioOperativo, type DefinicionCalendario } from '../../domain/services/calendario-operativo';
import { COBERTURA_MAXIMA, VARIABLES } from '../../domain/services/caracteristicas';

/** Shape of `modelo_riesgo.json` as `ml/src/entrenar.py` writes it. */
interface ArtefactoDelModelo {
  version: string;
  entrenadoEl: string;
  variables: string[];
  umbral: number;
  recallObjetivo: number;
  coberturaMaxima: number;
  insumos: FichaDelModelo['insumos'];
  metricas: {
    prueba: FichaDelModelo['metricas'];
    particiones: FichaDelModelo['particiones'];
  };
  lightgbm: { objetivo: string; numArboles: number; arboles: NodoLightGbm[] };
}

/**
 * Loads the trained model from `MODELO_DIR` once, at startup.
 *
 * If the files are missing or out of step with this code, the service does
 * not start. A prediction service that boots without its model would answer
 * every request with an error, and the cause would be three layers away.
 */
@Injectable()
export class ModeloRiesgoArchivoRepository implements IModeloRiesgoRepository {
  private readonly modelo: ModeloRiesgo;

  constructor(@Inject(CONFIGURACION) configuracion: Configuracion) {
    const artefacto = leerJson<ArtefactoDelModelo>(configuracion.modeloDir, 'modelo_riesgo.json');
    const calendario = leerJson<DefinicionCalendario>(configuracion.modeloDir, 'calendario.json');

    // The features are built here in TypeScript; if training changed their
    // list or order, every prediction would be silently wrong.
    if (artefacto.variables.join(',') !== VARIABLES.join(',')) {
      throw new Error(
        `Las variables del modelo no coinciden con las que calcula la API.\nModelo: ${artefacto.variables.join(', ')}\nAPI: ${VARIABLES.join(', ')}`,
      );
    }
    if (artefacto.coberturaMaxima !== COBERTURA_MAXIMA) {
      throw new Error(`coberturaMaxima del modelo (${artefacto.coberturaMaxima}) ≠ la de la API (${COBERTURA_MAXIMA}).`);
    }
    if (artefacto.lightgbm.arboles.length !== artefacto.lightgbm.numArboles) {
      throw new Error('El archivo del modelo está incompleto: faltan árboles.');
    }

    this.modelo = new ModeloRiesgo(
      {
        version: artefacto.version,
        entrenadoEl: artefacto.entrenadoEl,
        umbral: artefacto.umbral,
        recallObjetivo: artefacto.recallObjetivo,
        insumos: artefacto.insumos,
        metricas: artefacto.metricas.prueba,
        particiones: artefacto.metricas.particiones,
      },
      new BosqueLightGbm(artefacto.lightgbm.arboles, artefacto.lightgbm.objetivo),
      new CalendarioOperativo(calendario),
    );
  }

  obtener(): ModeloRiesgo {
    return this.modelo;
  }
}

function leerJson<T>(carpeta: string, archivo: string): T {
  const ruta = join(carpeta, archivo);
  try {
    return JSON.parse(readFileSync(ruta, 'utf8')) as T;
  } catch (error) {
    throw new Error(`No se pudo leer ${ruta}. ¿Corriste «npm run modelo:actualizar»? (${String(error)})`);
  }
}
