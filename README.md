# ORAQUI6 · Observatorio del azar

Proyecto independiente para el Quini 6 argentino. Interfaz terminal inspirada en smartmoney.sh. Cloudflare Workers + assets estáticos, sin base de datos ni dependencias de runtime.

Producción: https://oraqui6.simondalmasso44.workers.dev/

## Funciones
- Resultados actuales: Tradicional, Segunda, Revancha, Siempre Sale.
- 394 sorteos históricos iniciales (2023–2026, corte 2026-10-07); consulta actualizada al sitio de origen.
- Heatmap de bolillas 00–45, frecuencias hot/cold y ventanas 30/100/todas.
- Combinaciones sugeridas de seis números: uniforme criptográfica, balanceada, heurística histórica.
- Terminal: /azar, /equilibrio, /historico, /calientes, /frios.
- Selector y verificador de jugadas: persistencia local, sin enviar jugadas al servidor.
- Distinción explícita entre consulta actualizada y respaldo histórico.

## Matemática
C(46,6) = **9.366.819**. Una combinación tiene probabilidad **1/9.366.819** de acertar seis en un sorteo justo. Cada bolilla individual aparece con probabilidad 6/46. Rachas, atrasos y frecuencias NO predicen resultados en un sorteo independiente. Los tres modos del oráculo eligen combinaciones POTENCIALES, no combinaciones con ventaja demostrada.

## Fuentes
Oficial: https://www.loteriasantafe.gov.ar/quini-6-2/
Contraste: https://www.lanacion.com.ar/loterias/quini-6/
Archivo 2023–2026: https://resultados-de-loteria.com/quini-6/resultados/2026

El historial respaldo está en public/data/history.json. GET /api/history valida y combina el año actual con el archivo estático, o utiliza el archivo si no consigue refrescar. mode='actualizado' o mode='archivo' informa la situación. Cache edge ~10 minutos.
GET /api/health para salud. Si falla upstream, el sistema NUNCA fabrica datos.

## Desarrollo y despliegue
- Requiere Node 20+.
- Verificar: node --test
- Local: npx wrangler dev
- Cloudflare: npx wrangler deploy
- wrangler.jsonc fija Worker oraqui6 en la cuenta configurada.
- NO subir tokens ni credenciales. Se necesita OAuth válido o token Worker Scripts Edit.

## Avisos
Experimento no oficial y no afiliado a Lotería de Santa Fe. Titularidad de la mascota y marcas a sus respectivos dueños. Solo mayores de edad, juego responsable. Ley Provincial 12.991.
