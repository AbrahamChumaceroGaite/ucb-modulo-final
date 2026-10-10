import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '@libs/infrastructure';
import { RiskModel, type ModelCard } from '../../domain/entities/risk-model.entity';
import type { IRiskModelRepository } from '../../domain/repositories/IRiskModelRepository.interface';
import { FEATURES, MAX_COVERAGE_DAYS } from '../../domain/services/features';
import { LightGbmForest, type TreeNode } from '../../domain/services/lightgbm-forest';
import { OperatingCalendar, type CalendarDefinition } from '../../domain/services/operating-calendar';

/** Shape of `risk_model.json`, as `training/src/export.py` writes it. */
interface ModelArtifact {
  version: string;
  trainedAt: string;
  features: string[];
  threshold: number;
  targetRecall: number;
  maxCoverageDays: number;
  products: ModelCard['products'];
  metrics: { test: ModelCard['metrics']; partitions: ModelCard['partitions'] };
  lightgbm: { objective: string; treeCount: number; trees: TreeNode[] };
}

/** Loads `risk_model.json` and `calendar.json` from `MODEL_DIR` at startup; the API does not start if they do not match this code. */
@Injectable()
export class RiskModelFileRepository implements IRiskModelRepository {
  private readonly model: RiskModel;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    const artifact = readJson<ModelArtifact>(config.modelDir, 'risk_model.json');
    const calendar = readJson<CalendarDefinition>(config.modelDir, 'calendar.json');

    // Features are computed in TypeScript: their list and order must match training.
    if (artifact.features.join(',') !== FEATURES.join(',')) {
      throw new Error(
        `Las variables del modelo no coinciden con las que calcula la API.\nModelo: ${artifact.features.join(', ')}\nAPI: ${FEATURES.join(', ')}`,
      );
    }
    if (artifact.maxCoverageDays !== MAX_COVERAGE_DAYS) {
      throw new Error(`maxCoverageDays del modelo (${artifact.maxCoverageDays}) ≠ el de la API (${MAX_COVERAGE_DAYS}).`);
    }
    if (artifact.lightgbm.trees.length !== artifact.lightgbm.treeCount) {
      throw new Error('El archivo del modelo está incompleto: faltan árboles.');
    }

    this.model = new RiskModel(
      {
        version: artifact.version,
        trainedAt: artifact.trainedAt,
        threshold: artifact.threshold,
        targetRecall: artifact.targetRecall,
        products: artifact.products,
        metrics: artifact.metrics.test,
        partitions: artifact.metrics.partitions,
      },
      new LightGbmForest(artifact.lightgbm.trees, artifact.lightgbm.objective),
      new OperatingCalendar(calendar),
    );
  }

  get(): RiskModel {
    return this.model;
  }
}

function readJson<T>(folder: string, file: string): T {
  const path = join(folder, file);
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    throw new Error(`No se pudo leer ${path}. ¿Corriste «npm run model:update»? (${String(error)})`);
  }
}
