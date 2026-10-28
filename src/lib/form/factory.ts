import { createDemoSubmitter, parseDemoOptions } from './adapters/demo';
import type { FormSubmitter, SubmitterId } from './submitter';

export interface SubmitterConfig {
  adapter: SubmitterId;
  /** `location.search` de la página: solo lo usa el adaptador demo. */
  search: string;
  endpoint?: string;
}

/** Único punto que conoce los adaptadores (regla de dependencia de overview.md). */
export function createSubmitter(config: SubmitterConfig): FormSubmitter {
  if (config.adapter === 'demo') return createDemoSubmitter(parseDemoOptions(config.search));
  throw new Error(
    `El adaptador "${config.adapter}" aún no está implementado (pendiente T-031: proveedor real).`,
  );
}
