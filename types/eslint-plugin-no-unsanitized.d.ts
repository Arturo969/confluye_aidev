// El paquete no publica tipos; solo se usa su config recomendada en eslint.config.js.
declare module 'eslint-plugin-no-unsanitized' {
  import type { ESLint, Linter } from 'eslint';

  const plugin: ESLint.Plugin & { configs: { recommended: Linter.Config } };
  export default plugin;
}
