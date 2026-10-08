# ORAQUI6 · Números sugeridos para Quini 6

Terminal estadística del **Quini 6**, inspirada en [Smart Money Shell](https://smartmoney.sh/), con dos combinaciones sugeridas visibles en la portada: **Quini 6 normal** y **Siempre Sale**. Incluye una mascota robótica PNG transparente optimizada, resultados, radar, archivo y control de jugadas.

**Producción:** https://oraqui6.simondalmasso44.workers.dev/  
**Infraestructura:** Cloudflare Worker + Assets estáticos, con Cloudflare KV y sincronización oportunista después de los sorteos; sin cron adicional ni API de pago.

## Funcionalidades

- **Último sorteo:** Tradicional, Segunda, Revancha y Siempre Sale, con fecha y fuente.
- **Archivo documental:** registros externos validados desde julio de 2010 hasta octubre de 2026 con fecha y cuatro modalidades. No se inventan IDs faltantes.
- **Radar 46:** recuentos históricos independientes desde 2008, con fecha de corte explícita.
- **Oráculo en portada:** dos sugerencias separadas de 6 números únicos. La primera utiliza Tradicional / Segunda / Revancha; la segunda utiliza Siempre Sale. Ambos muestran criterios equilibrado, frecuentes, rezagados o azar uniforme.
- **Siempre Sale:** modalidad oficial que adjudica premios descendiendo el número de aciertos hasta encontrar ganadores; no es un sorteo independiente inventado.
- **Prueba retrospectiva:** walk-forward con ventana anterior de 60 sorteos, 120 pruebas como máximo y referencia uniforme de 36/46 ≈ 0,7826 aciertos por extracción.
- **Control de jugadas:** comparación retrospectiva, colección local y descarga CSV.

**Advertencia matemática:** existen exactamente `C(46,6) = 9.366.819` combinaciones. En cada extracción justa, todas conservan la misma probabilidad de 6/6. No existe un mecanismo demostrado para inferir cuál saldrá a partir de sus frecuencias anteriores. La prueba histórica no se debe ajustar usando información futura.

## Árbol

```text
.github/workflows/ci.yml  → test + build dry-run
data/seed.json           → recortes verificables y fecha de corte
public/
  index.html             → terminal responsive
  style.css              → UI
  app.js                 → interfaz e interacciones
  math-browser.js        → motor matemático en navegador
  mascota-robot.png       → mascota robótica proporcionada por el usuario, optimizada a 290 px (PNG con transparencia)
  mascota-topologica.svg → alternativa vectorial conservada
  mascota.webp           → recurso original de referencia conservado
  data/history.json      → archivo parcial de 1.668 sorteos (2010—2026)
src/
  archive.js             → validación y normalización del histórico
  math.js                → muestreo, frecuencias, backtest
  parser.js              → extracción defensiva de fuentes
  worker.js              → API /api/data, /api/health y KV
  year-source.js         → parser de fuente anual
  sync-window.js         → ventanas de consulta tras los sorteos
tests/*.test.js         → regresiones, HTML y mobile (24 pruebas)
wrangler.jsonc           → única configuración de Cloudflare
scripts/import-history.mjs  → importación histórica manual
package.json, package-lock.json
```

## Sincronización y costos

No se crean disparadores cron adicionales en Cloudflare. La cuenta Free ya tiene ocupados sus cinco cron. El primer acceso posterior a las ventanas de sorteos habituales (domingo y miércoles 23:15 hora argentina) puede activar una consulta asíncrona, registrada mediante un marcador temporal en KV para evitar repeticiones. Las visitas posteriores sólo leen datos almacenados y NO disparan scraping. Las dos fuentes independientes se consultan únicamente cuando aparece una nueva ventana; el proceso es de esfuerzo razonable, sin garantía de cobertura en vivo ni bloqueo perfecto contra accesos simultáneos. Si la fuente todavía no publicó un sorteo, la copia anterior permanece identificada por su fecha.

El archivo importado es parcial y tiene fechas verificables; no afirmar que incluye todos los concursos desde 1988. La fuente oficial prevalece ante discrepancias. El script `node scripts/import-history.mjs 2009 2026` permite una nueva importación, fuera de producción.

## Dirección visual

Primera pantalla = dos combinaciones y controles de generación, sin hero introductorio. Interfaz compacta tipo terminal (fondo negro, retícula, verde lima y cifras monoespaciadas). La mascota visible es una versión PNG con fondo transparente de la imagen proporcionada por el usuario; el SVG anterior se conserva como recurso alternativo. Sin promesas de IA ni de éxito estadístico.

## Ejecutar

Node 22+:

```bash
npm ci
npm run typecheck
npm run check
npm run dev
```

Deploy explícito, desde la cuenta Cloudflare autorizada:

```bash
npm run deploy
```

La publicación real se realiza mediante el Worker de Cloudflare y se comprueba por `/api/health`. GitHub Actions ejecuta pruebas y dry-run, pero no publica automáticamente. Se valida producción leyendo `/api/health` y la home tras publicar. El Worker utiliza la cuenta Cloudflare `b21fa81d12acb663798f9f7c51801955`.

## Datos y fuente de verdad

1. [Lotería de Santa Fe (oficial)](https://www.loteriasantafe.gov.ar/quini-6-2/).
2. [Quini 6 Resultados: archivo](https://www.quini-6-resultados.com.ar/quini6/sorteos-anteriores.aspx).
3. [Quini 6 Resultados: frecuencias desde 2008](https://www.quini-6-resultados.com.ar/quini6/quini6estadisticas.aspx).
4. [LA NACION](https://www.lanacion.com.ar/loterias/quini-6/): contraste editorial.
5. Archivo adicional de [resultados-de-loteria.com](https://resultados-de-loteria.com/quini-6/resultados/2026), capturado el 08/10/2026.

Los datos externos son informativos; ante discrepancias prevalece la fuente oficial. Las solicitudes externas pueden fallar: la aplicación muestra entonces una instantánea y comunica el origen. **No afirmar histórico completo desde 1988**: existen diferentes ventanas y modalidades.

No afiliado a la Lotería de Santa Fe. Jugar compulsivamente es perjudicial para la salud. Solo mayores de 18 años.

## Responsive / terminal

Diseño Mobile First a partir de 320 px: barra inferior con cinco destinos, selector de estrategias 2×2 en celulares angostos, números de seis columnas de ancho adaptable, controles táctiles de al menos 44 px, tabla de resultados reorganizada y mascota topológica compacta visible también en móvil. Modo escritorio: encabezado FEED, bandas de datos, filas densas, tipografía monoespaciada y separación cromática por modalidad. No se descargan fuentes externas ni recursos de interfaz de terceros. Los datos siguen usando el mecanismo de KV de bajo consumo ya desplegado.

## Estado verificado

- Portada con ambas jugadas y barra inferior responsive comprobada en el HTML/CSS desplegado.
- Pruebas de código, parsers y controles: **24/24 PASS**.
- `GET /api/health`: versión `0.4.1`.
- Archivo: **1.668 registros, 2010-07-11 a 2026-10-07** en el corte de implementación. No certifica completitud desde 1988.
- La validación responsive automatizada es estática; no reemplaza una inspección visual de dispositivos reales.

### Ajuste de mascota

El personaje se muestra a escala contenida, máximo 156 px de ancho en escritorio y 78 px en la barra compacta móvil. Se almacena localmente en `public/mascota-robot.png` (aprox. 69 KB), sin recursos remotos ni nuevas llamadas a Cloudflare fuera del tráfico normal de assets.
