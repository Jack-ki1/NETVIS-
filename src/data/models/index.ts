import { DEEP_LEARNING_MODELS } from './deep-learning';
import { MACHINE_LEARNING_MODELS } from './machine-learning';
import { ModelSchema } from '../../schemas';

export const MODELS = [...DEEP_LEARNING_MODELS, ...MACHINE_LEARNING_MODELS];

// Validate all models at startup
MODELS.forEach(m => {
  try {
    ModelSchema.parse(m);
  } catch (e) {
    console.error(`Invalid model data for ${m.key}:`, e);
  }
});
