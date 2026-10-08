# ORAQUI6 · El azar tiene historia

Observatorio de resultados del **Quini 6**, con interfaz de terminal financiera inspirada en [Smart Money Shell](https://smartmoney.sh/), mascota de Quini 6, radar de frecuencias, archivo documental de sorteos y generador recreativo de combinaciones.

**Sitio objetivo:** https://oraqui6.simondalmasso44.workers.dev/  
**Infraestructura:** Cloudflare Worker + Assets estáticos, sin base de datos ni API de pago.

## Funcionalidades

- **Último sorteo:** Tradicional, Segunda, Revancha y Siempre Sale, con fecha y fuente.
- **Archivo documental:** 394 registros externos entre 2023 y octubre de 2026 con fecha y cuatro modalidades. No se inventan IDs faltantes.
- **Radar 46:** recuentos históricos independientes desde 2008, con fecha de corte explícita.
- **Oráculo:** 6 números únicos con ponderación equilibrada, frecuentes, rezagados o azar uniforme.
- **Prueba retrospectiva:** walk-forward con ventana anterior de 60 sorteos, 120 pruebas como máximo y referencia uniforme de 36/46 ≈ 0,7826 aciertos por extracción.
- **Control de jugadas:** comparación retrospectiva, colección local y descarga CSV.

**Advertencia matemática:** existen exactamente \`C(46,6) = 9.366.819\` combinaciones. En cada extracción justa, todas conservan la misma probabilidad de 6/6. No existe un mecanismo demostrado para inferir cuál saldrá a partir de sus frecuencias anteriores. La prueba histórica no se debe ajustar usando información futura.

## Árbol

\`\`\`text
.github/workflows/ci.yml  → test + build dry-run
data/seed.json           → recortes verificables y fecha de corte
public/
  index.html             → terminal responsive
  style.css              → UI
  app.js                 → interfaz e interacciones
  math-browser.js        → motor matemático en navegador
  mascota.webp           → mascota del Quini 6
  data/history.json      → archivo externo documentado (394 sorteos)
src/
  archive.js             → validación y normalización del histórico
  math.js                → muestreo, frecuencias, backtest
  parser.js              → extracción defensiva de fuentes
  worker.js              → API /api/data y /api/health
tests/math.test.js       → regresiones
wrangler.jsonc           → única configuración de Cloudflare
package.json
\`\`\`

## Ejecutar

Node 22+:

\`\`\`bash
npm install
npm run typecheck
npm run check
npm run dev
\`\`\`

Deploy explícito, desde la cuenta Cloudflare autorizada:

\`\`\`bash
npm run deploy
\`\`\`

El CI solo comprueba y ejecuta un **dry-run**; no reemplaza un deploy real. Se valida producción leyendo \`/api/health\` y la home tras publicar. El Worker utiliza la cuenta Cloudflare \`b21fa81d12acb663798f9f7c51801955\`.

## Datos y fuente de verdad

1. [Lotería de Santa Fe (oficial)](https://www.loteriasantafe.gov.ar/quini-6-2/).
2. [Quini 6 Resultados: archivo](https://www.quini-6-resultados.com.ar/quini6/sorteos-anteriores.aspx).
3. [Quini 6 Resultados: frecuencias desde 2008](https://www.quini-6-resultados.com.ar/quini6/quini6estadisticas.aspx).
4. [LA NACION](https://www.lanacion.com.ar/loterias/quini-6/): contraste editorial.
5. Archivo adicional de [resultados-de-loteria.com](https://resultados-de-loteria.com/quini-6/resultados/2026), capturado el 08/10/2026.

Los datos externos son informativos; ante discrepancias prevalece la fuente oficial. Las solicitudes externas pueden fallar: la aplicación muestra entonces una instantánea y comunica el origen. **No afirmar histórico completo desde 1988**: existen diferentes ventanas y modalidades.

No afiliado a la Lotería de Santa Fe. Jugar compulsivamente es perjudicial para la salud. Solo mayores de 18 años.
