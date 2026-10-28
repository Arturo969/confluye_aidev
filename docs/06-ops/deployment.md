# Despliegue — confluye

- Entornos: dev / staging / prod
- Artefacto: (imagen Docker, paquete, binario, app store, firmware)
- Pipeline: `.github/workflows/ci.yml`
- Configuración por entorno (variables): ver `.env.example`
- Estrategia: (rolling / blue-green / canary)
- **Rollback**: pasos exactos y tiempo objetivo
- Migraciones de BD: orden y reversibilidad
