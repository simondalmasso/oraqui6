# ORAQUI6 — Observatorio estadístico del Quini 6

Web independiente para visualizar resultados y frecuencias históricas de Quini 6 (Argentina), generar combinaciones exploratorias y comprobar una jugada contra el último concurso.

**Producción prevista:** https://oraqui6.simondalmasso44.workers.dev/  
**Plataforma:** Cloudflare Workers + Static Assets · Sin base de datos ni servicios pagos obligatorios.

## Funcionalidades

- Panel tipo terminal, responsive, inspirado en la estética de smartmoney.sh, con la mascota facilitada por el autor.
- Últimos resultados: Tradicional, Segunda, Revancha y Siempre Sale.
- Actualización del archivo reciente y estadística histórica con verificación estructural; instantánea inicial verificable si falla la fuente.
- Radar de 46 números con recuentos desde 2008 (fuente independiente).
- Generador de 6 números distintos con modos equilibrado, frecuentes, rezagados y azar uniforme.
- Comprobación de jugadas y colección local exportable a CSV.
- API: `GET /api/data` y `GET /api/health`.

## Limitación esencial

**En un sorteo justo, todas las combinaciones tienen la misma probabilidad de acertar 6 de 6: `1 / C(46, 6) = 1 / 9.366.819`.** Las frecuencias pasadas describen los datos; no predicen resultados independientes. Los nombres de estrategia son categorías exploratorias y no probabilidades estimadas.

La fuente histórica cubre estadísticas **desde 2008**, no todos los concursos desde 1988; no permite reconstruir el historial completo. Se debe distinguir siempre `live` de `snapshot`.

## Estructura

```
public/           Interfaz estática, JS, CSS y mascota
src/math.js       Matemática y validaciones
src/parser.js     Parsers defensivos del archivo y frecuencias
src/worker.js     API de Cloudflare y caché de 15 minutos
data/seed.json    Instantánea verificada 07/10/2026
tests/            Pruebas sin frameworks externos
wrangler.toml     Nombre del Worker y configuración de assets
.github/workflows/ci.yml   Validación y dry-run de build
```

## Desarrollo y despliegue

Requiere Node.js 22+:

```bash
npm install
npm run check
npm run typecheck
npm run dev
# previa autenticación en Cloudflare
npm run deploy
```

El `wrangler.toml` apunta expresamente al Worker `oraqui6`. **Un push a GitHub ejecuta CI, pero NO despliega automáticamente**: para eso hace falta conectar el proyecto a Cloudflare o configurar una automatización con credenciales mediante Secrets. No se incluyen tokens.

## Datos y procedencia

- Autoridad oficial: https://www.loteriasantafe.gov.ar/quini-6-2/
- Sorteos recientes: https://www.quini-6-resultados.com.ar/quini6/sorteos-anteriores.aspx
- Frecuencias desde 2008: https://www.quini-6-resultados.com.ar/quini6/quini6estadisticas.aspx
- Contraste informativo: https://www.lanacion.com.ar/loterias/quini-6/
- El extracto impreso oficial prevalece ante discrepancias.

ORAQUI6 no tiene afiliación con la Lotería de Santa Fe. Jugar compulsivamente es perjudicial para la salud. Solo mayores de 18 años.
