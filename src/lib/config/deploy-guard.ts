// Guardia de despliegue (ADR-0003, SR-12): impide publicar producción sin un formulario que
// entregue solicitudes o con textos legales de relleno. Funciones puras; las usa la integración
// src/integrations/build-guard.ts.
import { DEMO_ADAPTER_MARKER } from '../form/markers';

export type DeployEnv = Record<string, string | undefined>;

export function assertDeployConfig(env: DeployEnv): void {
  if (env['SITE_ENV'] !== 'production') return;
  const problems: string[] = [];

  const adapter = env['PUBLIC_FORM_ADAPTER'] ?? 'demo';
  if (adapter === 'demo') {
    problems.push('PUBLIC_FORM_ADAPTER es "demo": el formulario no entregaría solicitudes.');
  }

  const endpoint = env['PUBLIC_FORM_ENDPOINT'] ?? '';
  if (!endpoint) {
    problems.push('Falta PUBLIC_FORM_ENDPOINT.');
  } else if (!endpoint.startsWith('https://') || !URL.canParse(endpoint)) {
    problems.push('PUBLIC_FORM_ENDPOINT debe ser una URL https://.');
  }

  if ((env['PUBLIC_CAPTCHA_PROVIDER'] ?? 'none') === 'none') {
    problems.push('PUBLIC_CAPTCHA_PROVIDER es "none": producción exige captcha (RF-09).');
  }

  if (problems.length > 0) {
    throw new Error(`Build de producción bloqueado:\n- ${problems.join('\n- ')}`);
  }
}

export interface DistFile {
  path: string;
  content: string;
}

// Corchetes en mayúsculas tipo [RUC] o [DOMICILIO], y TODO: marcadores de texto pendiente.
const PLACEHOLDER = /\[[A-ZÁÉÍÓÚÑ _]{2,}\]|\bTODO\b/;

export function findDistViolations(files: DistFile[]): string[] {
  const violations: string[] = [];
  for (const { path, content } of files) {
    if (content.includes(DEMO_ADAPTER_MARKER)) {
      violations.push(`${path}: contiene el adaptador demo del formulario.`);
    }
    if (path.endsWith('.html') && PLACEHOLDER.test(content)) {
      violations.push(`${path}: contiene un texto de relleno (placeholder o TODO).`);
    }
  }
  return violations;
}
