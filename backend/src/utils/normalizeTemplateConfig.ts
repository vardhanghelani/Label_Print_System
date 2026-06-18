import type { PageConfig } from '../types/index.js';
import { regenerateInterlockConfig } from '../types/index.js';

export function normalizeTemplateConfig(config: PageConfig): PageConfig {
  if (config.layoutType === 'jewellery-interlock' && config.geometry) {
    return regenerateInterlockConfig(config);
  }
  return config;
}
