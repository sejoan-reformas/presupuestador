// ============================================================
// AYUDAS "i" — TODOS LOS TEXTOS EN UN SOLO SITIO
// Uso en HTML:  <i class="info-icon" data-help="clave">i</i>
// Uso en JS:    helpIcon('clave')
// t = texto (un \n hace salto de línea) · m = apartado del manual (opcional)
// Para cambiar una explicación, cámbiala aquí y vale para toda la app.
// ============================================================
const AYUDA = {
  // ---------- Cabecera ----------
  drive: { t: 'Nuestros datos en el Drive de la empresa, iguales en el portátil y en la tablet.\n☁️ Sincronizado: todo al día.\n🔌 Sin internet: se guarda en este aparato y se manda solo cuando vuelva.\n🔑 Google pide confirmar cada hora: pulsa y elige la cuenta de la empresa.\nSi un mismo presupuesto se cambia a la vez en los dos aparatos, guardamos las dos versiones: nunca se pierde nada.', m: 'man-empezar' },
  carpeta: { t: 'Dónde se guardan nuestros datos.\n✅ Se guarda solo en D:\\Presupuestador_PRO\\datos, con una copia por día.\n🔓 Pulsa y da permiso.\nÁbrelo siempre con "Abrir Presupuestador.bat".', m: 'man-empezar' },
  deshacer: { t: 'Vuelve atrás el último cambio, hasta 30 pasos (atajo Ctrl+Z). ↷ o Ctrl+Y lo rehace.\nNo deshace facturas emitidas: esas se corrigen con un abono.', m: 'man-empezar' },
  zoom: { t: 'Agranda o achica todo el programa. Pulsa el % para volver al 100%. Cada ordenador recuerda el suyo.' },
  barraPresupuestos: { t: 'El desplegable cambia de presupuesto (el icono es su estado).\n📊 Mis presupuestos: todos con su importe y lo pendiente de cobrar.\n+ Nuevo Cliente: crea uno.\nDuplicar: copia el abierto, sin facturas.', m: 'man-nuevo' },

  // ---------- 1. Cliente y obra ----------
  nombrePres: { t: 'Solo para nosotros: el nombre con el que lo encontramos en la lista de arriba. El cliente no lo ve.' },
  numPres: { t: 'El número que sale en el PDF. Se pone solo y nunca se repite. Cámbialo solo si llevamos otra numeración.' },
  fechaPres: { t: 'Fecha del presupuesto. Sale en el PDF y en el recuadro de aceptación.' },
  clienteNombre: { t: 'Nombre y apellidos, o razón social si es una empresa, tal como debe salir en el presupuesto y en la factura.' },
  clienteDni: { t: 'Opcional en el presupuesto, pero obligatorio para hacerle una factura. Pídelo pronto.' },
  clienteTel: { t: 'Para tenerlo a mano. Si lo rellenas, sale en los datos del cliente del PDF.' },
  clienteDir: { t: 'Dónde se hace la obra (no hace falta que sea donde vive el cliente). Sale en el PDF y en la hoja de aceptación.' },
  iva: { t: '10%: reforma en la vivienda de un particular, terminada hace más de 2 años, y si el material que ponemos nosotros no pasa del 40% del precio.\n21%: locales, oficinas, obra para una empresa, o si no se cumple lo anterior.\nAnte la duda, pregunta a la gestoría.', m: 'man-cliente' },
  estado: { t: 'En qué punto está: 📝 Borrador → 📨 Enviado → ✅ Aceptado o ❌ Rechazado. Se guarda la fecha de cada cambio.\nAl imprimir nos pregunta si lo hemos enviado, y al hacer una factura pasa solo a Aceptado.', m: 'man-cliente' },
  plantilla: { t: 'Guarda los capítulos, las partidas y el equipo de este presupuesto con un nombre ("Baño completo", "Cocina") para empezar así el próximo.', m: 'man-nuevo' },
  vistas: { t: '☰ Compacta: una línea por partida; pulsa el nombre o ▸ para ver y editar todo.\n▤ Detallada: todas abiertas, para repasar las descripciones.\nSe recuerda la última que usaste.', m: 'man-partidas' },

  // ---------- 1. Capítulos y columnas ----------
  capituloTipo: { t: '📌 En Base: suma al precio del presupuesto.\n✨ Extra opcional: sale aparte al final del PDF y NO suma. El cliente marca si lo quiere en la hoja de aceptación.\nPulsa el botón para cambiar.', m: 'man-partidas' },
  colIncl: { t: 'SÍ: entra en el presupuesto.\nNO: se queda guardada pero no cuenta ni sale en el PDF. Sirve para probar sin borrar.' },
  colPartida: { t: 'Pulsa el nombre o ▸ para ver y editar todo: descripción, fase, receta… Pasa el ratón por encima para leer la descripción entera.' },
  colMedicion: { t: 'Cuántas unidades del trabajo: m², metros, piezas…\nPara sumar paredes o habitaciones usa la calculadora 📐 del detalle.' },
  colEjecucion: { t: '👷 Propio: lo hace nuestro equipo; el precio sale de las horas.\n🔧 Subc.: lo hace otra empresa; el precio sale de lo que nos cobra más nuestro recargo.' },
  colRendimiento: { t: 'Propio: horas que tarda UNA persona en hacer UNA unidad. Ej.: alicatar 1 m² ≈ 0,5 h. Si ponemos el doble, sale el doble de caro.\nSubcontrata: lo que nos cobra el subcontratista por unidad, sin IVA.' },
  colDias: { t: 'Días de trabajo que lleva la partida con el equipo de la pestaña «Equipo y gastos». Con ellos se hacen el calendario y el reparto de furgoneta y comidas.' },
  colPrecio: { t: 'Lo que paga el cliente por la partida, sin IVA. Incluye sueldos, Seguridad Social, furgoneta, comidas, gastos fijos y nuestro beneficio.\nPasa el ratón para ver el precio por unidad.' },

  // ---------- 1. Detalle de una partida ----------
  fase: { t: 'En qué momento de la obra se hace (demolición, instalaciones, acabados…). Con eso se ordenan el calendario y la lista de herramientas.' },
  unidad: { t: 'm² = superficie (suelos, paredes)\nml = metro lineal (rodapié, tubería)\nud = pieza (enchufe, puerta)\nPA = partida alzada: un precio cerrado por el trabajo entero\nh = por horas', m: 'man-glosario' },
  descripcion: { t: 'Lo que el cliente lee en el PDF. Di qué incluye y qué no; así se evitan discusiones.\nEj.: "Incluye retirada de escombro a contenedor. No incluye material."' },
  costeInterno: { t: 'Lo que nos cuesta a nosotros hacerla: sueldos y Seguridad Social de esas horas. Lo que hay entre esto y el precio cubre gastos y beneficio.' },
  receta: { t: 'Qué materiales gasta este trabajo POR CADA unidad. Ej.: por 1 m² de alicatado, 0,22 sacos de cola.\nCon las recetas se calcula la lista de materiales de la pestaña «Materiales».', m: 'man-materiales' },
  subCost: { t: 'Lo que nos cobra el subcontratista por cada unidad, sin IVA.' },
  subRecargo: { t: 'Lo que nosotros le sumas por gestionarlo y responder de su trabajo. Lo habitual es un 10-15%.' },
  subDias: { t: 'Cuántos días está el subcontratista en la obra. Solo sirve para el calendario; no cambia el precio.' },
  soloMO: { t: '🧱 Solo MO: él pone la mano de obra; el material va a la lista y lo compra el cliente.\n📦 Lo pone él: su precio ya incluye el material.' },
  calculadora: { t: 'Para medir sumando: una línea por pared o habitación (largo × alto). "Aplicar" pone el total en la medición.' },
  precioUd: { t: 'El precio de la partida dividido entre la medición. Es el "Precio Ud." que ve el cliente en el PDF.' },
  biblioteca: { t: 'Guarda esta partida, con sus horas, precios y receta, para añadirla en segundos a cualquier presupuesto. Si ya hay una con el mismo nombre, nos pregunta si la actualizas.', m: 'man-partidas' },
  desdeBiblioteca: { t: 'Escribe una palabra (alicatado, pladur…), pon a la derecha la medición y pulsa "+ Añadir". Entra con sus horas y su receta.', m: 'man-partidas' },
  horasUd: { t: 'Horas que tarda UNA persona en hacer UNA unidad. Ej.: alicatar 1 m² ≈ 0,5 h; desmontar un inodoro ≈ 1 h.' },

  // ---------- 2. Materiales ----------
  listaMateriales: { t: 'Los materiales que salen de las recetas de cada partida, separados en elementos a elegir y material de obra. Podemos cambiar las cantidades a mano.', m: 'man-materiales' },
  materialSuelto: { t: 'Para cosas que no salen de ninguna receta: un grifo concreto, un rollo de cinta, un mueble…' },
  catalogo: { t: 'Precios de tienda CON IVA (Obramat y Leroy Merlin, revisados en nov 2026). Cámbialos cuando veas otros: valen para todos los presupuestos.' },
  precioCatalogo: { t: 'Precio con IVA por unidad de venta: saco, bote, rollo, pieza…' },

  // ---------- 3. Equipo y gastos ----------
  precioCobrais: { t: 'La mano de obra que cobramos al cliente, sin IVA. Los materiales van aparte (los paga el cliente) y se muestran para saber el total que verá.' },
  cadaUnoMes: { t: 'Sueldos brutos de todo el equipo + el beneficio de la empresa, repartido a partes iguales y dividido por los meses que dura la obra.\nEs bruto: falta la S.S. del trabajador, el IRPF y los impuestos de la empresa. No incluye las comidas.' },
  hastaDonde: { t: 'Para negociar: el precio mínimo para no perder dinero y el mínimo para que cada uno cobre nuestro objetivo al mes.\nSi lo terminamos antes, cada día menos es dinero que no se gasta.' },
  competencia: { t: 'Pon por separado la mano de obra y los materiales que pide la otra empresa (si no los separa, estímalo). Se compara mano de obra con mano de obra: es lo único que decide lo que ganamos.' },
  notasPresupuesto: { t: 'Libreta de este presupuesto: cada nota con su fecha (lo que dijo el cliente, cambios, avisos…). Las de la visita entran solas. Son internas: no salen en el PDF.' },
  otrosPagosMes: { t: 'Otros pagos que hace la empresa cada mes por esta persona: alquiler de su habitación, dietas fijas, etc. Se reparten entre los días laborables como la S.S. y cuentan como coste de la obra.' },
  quienVa: { t: 'Marca las personas que trabajan en esta obra. Su sueldo y su S.S. salen de «Datos de cálculo»: aquí no se escriben.' },
  kmObra: { t: 'Kilómetros de ida y vuelta al día hasta esta obra. La furgoneta se calcula con el € por km de «Datos de cálculo».' },
  ajustePlazo: { t: 'La app calcula el plazo con las horas, las esperas de secado y el tiempo improductivo. Si conocemos la obra y sabemos que tardaremos más o menos, ajústalo aquí: cambia el coste y el plazo del PDF.' },
  socio: { t: 'Márcalo si es socio de la empresa. Sirve para separar lo que cobran los socios de lo que cobran los trabajadores.' },
  furgoFijo: { t: 'Si sabemos lo que nos cuesta la furgoneta al día (gasoil, seguro, desgaste…), ponlo aquí y la app no usa los kilómetros. Déjalo vacío para calcularlo por km.' },
  gamaMateriales: { t: 'Básica: lo más sencillo que cumple bien (como hacen otras empresas en sus presupuestos). Media: un 54 % más cara. Alta: casi el triple de la básica.\nSolo cambia el precio de los elementos a elegir; el cliente decide al final.' },
  liquido: { t: 'Aproximado. Del sueldo se resta la S.S. del trabajador (6,5 %) y un IRPF medio (12 %): queda el 81,5 %. Del beneficio, el Impuesto de Sociedades de microempresa (19 %) y el de dividendos (19 %) si se reparte: queda el 65,6 %.\nCada caso depende de cómo estemos dados de alta: confírmalo con la gestoría y ajusta los % en «Empresa».' },
  objetivoMes: { t: 'Lo que queremos llevaros cada uno al mes (bruto), sumando sueldo y beneficio. La pantalla de Precio nos avisa si un presupuesto queda por debajo.' },
  variaciones: { t: 'Texto que sale en el PDF explicando al cliente, con claridad, qué cosas pueden cambiar el precio o el plazo (lo que no se ve hasta abrir) y que siempre se le avisa antes.' },
  preciosMinimos: { t: 'Los mínimos y las esperas que usa la app para calcular precios y plazos. Si los cambiamos, cambian todos los presupuestos.' },
  factorRealidad: { t: 'Las horas por unidad de la biblioteca son "de libro". Este número las multiplica para que se parezcan a lo que tardamos de verdad (montar, proteger, subir material, limpiar, repasar).\n1,3 = un 30 % más. Calibrado para que el piso de Fuengirola salga en unos 2,5 meses.' },
  tarifaMinima: { t: 'Lo mínimo que queremos cobrar por cada hora de cada persona del equipo, con todo dentro. Si un presupuesto queda por debajo, sale aviso en rojo en «Equipo y gastos».' },
  minimoTrabajo: { t: 'Ningún trabajo, por pequeño que sea, baja de esta mano de obra. Ej.: medio día de oficial y peón = 250 €. Si no llega, se añade una línea "Mínimo de servicio".' },
  minimoPartida: { t: 'Ninguna partida propia cuenta menos de estas horas, aunque el cálculo dé menos. Ej.: pintar un techo pequeño no son 40 €.' },
  minimoSub: { t: 'Ninguna subcontrata (electricista, fontanero…) baja de esta cantidad: es lo mínimo que cobra cualquiera por venir.' },
  coordinacion: { t: 'El trabajo que no se ve: presupuestos, compras, gestoría, coordinar gremios, medios auxiliares. Sale en el PDF como "Medios auxiliares, gestión y coordinación de obra".' },
  improductivo: { t: 'Tiempo que se pierde y no es trabajo: recogidas, esperar material, que el cliente decida, la comunidad… Se suma al plazo y al coste.\nOrientativo: obra grande 10 %, baño o cocina suelta 15–20 %, más si el cliente vive dentro o no hay ascensor.' },
  equipoTodoPlazo: { t: 'Marcado: el equipo está en esta obra hasta acabar, así que se pagan TODOS los días del plazo (también las esperas).\nDesmarcado: en las esperas nos vamos a otro trabajo, y solo se cuentan las horas de trabajo.' },
  esperas: { t: 'Días laborables que hay que esperar después de cada tipo de trabajo antes de seguir: secado del yeso, fraguado de la solera, impermeabilización… Cada fase espera lo que pida su trabajo más lento.' },
  matElegir: { t: 'Lo que el cliente elige a su gusto: plato, mampara, sanitarios, azulejo, grifos, ventanas, puertas, cocina… Sale en la lista para elegir y comprar.' },
  matObra: { t: 'Lo técnico que no se ve: sacos, cola, pladur, tubos, cable… Normalmente lo compramos nosotros, aunque lo pague el cliente.' },
  quienCompra: { t: 'Lo paga siempre el cliente. Aquí decimos quién va a la tienda: él, o nosotros (y él nos lo paga aparte de la mano de obra, con provisión de fondos).\nEn cada línea podemos hacer una excepción.' },
  listaCompra: { t: 'Imprime los elementos a elegir ordenados por dependencia (Baño 1, Cocina…), con cantidades y una columna para apuntar el modelo y la tienda.\nPara dársela al cliente o ir a comprar con él.' },
  margenMaterial: { t: 'Lo que sumamos al precio del material cuando lo compramos nosotros. 0 = a precio de coste.\nNo cambia la mano de obra.' },
  tipoMaterial: { t: 'A elegir o de obra. Si lo cambiamos, cambia en todas las obras.' },
  visitas: { t: 'Toma de datos en casa del cliente: dependencias, medidas, trabajos, notas y fotos. Luego lo conviertes en presupuesto con un botón.', m: 'man-visitas' },
  dependencias: { t: 'Cada parte de la vivienda: Baño 1, Cocina, Habitación 2… Pulsa una para rellenarla. Se numeran solas.' },
  medidasVisita: { t: 'Largo, ancho y alto en metros. La app calcula suelo, techo, paredes y perímetro.\nSi solo vamos a hacer el suelo, el alto puede quedar como está.' },
  huecos: { t: 'Lo que hay que restar de las paredes: puertas y ventanas, en m².\nEj.: una puerta 0,8 × 2 = 1,6 m².' },
  trabajosVisita: { t: 'Pulsa los trabajos que van. La cantidad sale sola de las medidas (📐 suelo, paredes…). Si escribimos otra cantidad, queda ✋ a mano.' },
  fotosVisita: { t: 'Haz fotos de cómo está (Antes), durante y al terminar (Después). Cada foto lleva grabada la fecha y la hora: sirve como prueba ante cualquier duda.' },
  convertirVisita: { t: 'Crea un presupuesto nuevo con todos los trabajos marcados. Si un trabajo está en varias dependencias, sale una sola partida con una línea por dependencia.' },
  notasVisita: { t: 'Lo que apuntaste en la visita. Podemos corregirlo aquí; no sale en el PDF del cliente.' },
  personasEquipo: { t: 'La gente con la que trabajas, cada uno con su sueldo por día. Se usa en la pestaña «Días y pagos» para llevar los días y los pagos de cada obra.', m: 'man-pagos' },
  puestoHabitual: { t: 'Lo que hace normalmente. Cada día de obra podemos cambiarlo (un día de peón, otro de pintor, otro de gerente…).' },
  sueldoPersona: { t: 'Lo que cobra esta persona por cada jornada completa. Media jornada = la mitad.\nEj.: 60 € × 5 días = 300 € a la semana.' },
  personaActiva: { t: 'Desmárcalo si ya no trabaja con nosotros: deja de salir en los días nuevos, pero sus cuentas antiguas se conservan.' },
  calendarioObra: { t: 'Desde el inicio de la obra (pestaña «Plan de obra») hasta el fin previsto. Cada día dice cuántas personas fueron.\nPulsa un día para apuntar quién vino.', m: 'man-pagos' },
  cuentasPersona: { t: 'Por cada persona: los días que ha trabajado, lo que le corresponde, lo acordado, lo cobrado y, en grande, lo que le debemos.', m: 'man-pagos' },
  pagosLista: { t: 'Todo el dinero dado a la gente en esta obra, con su fecha. Desde aquí imprimes el "Recibí" para que lo firmen.' },
  staffResumen: { t: 'Compara lo que pusiste para sueldos en el presupuesto con lo que de verdad se paga. Lo que sobra queda para la sociedad.' },
  jornada: { t: 'Completa = un día entero de sueldo. Media = medio día (por ejemplo un sábado por la mañana).' },
  deQueTrabajo: { t: 'Lo que hizo ese día: peón, pintor, electricista, gerente… Es solo para saberlo: lo que cobra sale de su sueldo por día.' },
  importePago: { t: 'Lo que le das. Sale ya puesto lo que le debemos; cámbialo si le das otra cantidad (un anticipo, por ejemplo).' },
  equipoObra: { t: 'Las personas que van a esta obra, por puestos. Con − y + decimos cuántas de cada uno.\nCon esto la app sabe cuántas horas se trabajan al día y cuánto cuestan.', m: 'man-equipo' },
  personasPuesto: { t: 'Cuántas personas de este puesto trabajan a la vez en esta obra. Más gente = menos días, pero el mismo coste por hora.' },
  sueldoDia: { t: 'Lo que cobra una persona de este puesto por día trabajado (bruto, sin la Seguridad Social de empresa).\nSi lo cambiamos aquí, solo vale para esta obra (sale ✏️ propio).' },
  ssMes: { t: 'Lo que pagamos al mes de Seguridad Social por cada persona de este puesto. La app lo reparte entre los días laborables del mes (pestaña «Empresa»).' },
  tipoPuesto: { t: 'Oficial: trabaja y lleva herramientas de oficial.\nAyudante/peón: trabaja.\nSupervisa: un encargado que va a ratos; cuesta dinero pero no suma horas ni comidas.' },
  puestoNombre: { t: 'El nombre del puesto tal como queremos verlo: Oficial, Peón, Electricista, Encargado…' },
  puestosEmpresa: { t: 'Nuestra lista de puestos con su sueldo normal. En cada obra (pestaña «Equipo y gastos») elegimos cuántos van de cada uno.\nNo se puede borrar un puesto que esté en uso.', m: 'man-equipo' },
  puestosDefecto: { t: 'Deja solo Oficial (90 €/día, 580 € S.S.) y Peón (65 €/día, 460 € S.S.). Sirve por si nos arrepentimos de los cambios.\nLas obras con sueldo propio ✏️ lo conservan.' },
  entradaPct: { t: 'Lo que pide el cliente al aceptar el presupuesto, en % del total de mano de obra con IVA. Lo normal es un 25%.\nEl resto se reparte en pagos iguales.' },
  oficiales: { t: 'Cuántos oficiales trabajan a la vez en la obra. Más gente = menos días, pero el precio por hora es el mismo.' },
  peones: { t: 'Cuántos peones o ayudantes trabajan a la vez en la obra.' },
  sueldoOf: { t: 'Lo que cobra un oficial por día trabajado (bruto, sin la Seguridad Social de empresa).' },
  ssOf: { t: 'Lo que pagamos al mes de Seguridad Social por cada oficial. Se reparte entre los días laborables del mes.' },
  sueldoOb: { t: 'Lo que cobra un peón por día trabajado (bruto, sin la Seguridad Social de empresa).' },
  ssOb: { t: 'Lo que pagamos al mes de Seguridad Social por cada peón. Se reparte entre los días laborables del mes.' },
  furgonetas: { t: 'Cuántas furgonetas van cada día a la obra.' },
  km: { t: 'Kilómetros de ida y vuelta por furgoneta y día. Ej.: obra a 15 km = 30.' },
  costeKm: { t: 'Gasoil y desgaste por kilómetro. Una cifra habitual es 0,30 €/km.' },
  comida: { t: 'Lo que pagamos de comida por persona y día. Pon 0 si cada uno se la paga.' },
  paralelo: { t: 'Si unas tareas se hacen a la vez que otras, resta aquí esos días para no cobrar dos veces furgoneta y comidas.\nEj.: 3 = tres días menos de esos gastos.' },
  recargo: { t: 'Nuestra ganancia, sumada sobre lo que nos cuesta. Ojo: un 24% sobre el coste es un 19,4% del precio final.\nAbajo, en el desglose, vemos las dos cifras.' },
  periodicidad: { t: 'Cada cuánto cobramos lo que queda después de la entrada: cada semana (los viernes) o cada quincena. Sale en el PDF.' },
  chkGastosFijos: { t: 'Mete en el coste de cada día nuestra parte de gestoría, seguro y otros gastos fijos (pestaña «Empresa»). Déjala marcada.' },
  chkRepercutir: { t: 'Cobra al cliente, dentro del precio, la furgoneta, las comidas y los gastos fijos. Si la desmarcas los pagamos nosotros, y sale un aviso rojo con cuánto.' },
  desglose: { t: 'La verdad de la obra, solo para nosotros: lo que nos cuesta, lo que cobramos y lo que nos queda limpio. Nunca sale en el PDF.' },

  // ---------- 4, 5, 6 ----------
  herramientas: { t: 'Qué hay que llevar según las fases de la obra.\n"1 por persona": se multiplica por los que vamos. "Por oficial": una por oficial. "Equipo": una para todos.\nMarca lo que ya va en la furgoneta.' },
  cantidadHerramienta: { t: '"Por persona" (guantes, gafas), "por oficial" (llana, nivel) o "equipo compartido" (radial, aspirador). La cantidad se calcula sola con el equipo.' },
  planos: { t: 'Fotos o croquis de la obra. Marca "Incluir en PDF" para que salgan en el presupuesto.\nLas fotos ocupan sitio: sube solo las necesarias.' },
  roadmap: { t: 'Calendario automático por fases, con los días de cada partida. Las fases largas se solapan un poco con la siguiente (≈10%), como pasa en una obra real.' },
  fechaInicio: { t: 'Primer día de obra. Cuenta de lunes a viernes y salta los festivos de la pestaña «Empresa» para darte la fecha de entrega.' },

  // ---------- 7. Facturas ----------
  facturas: { t: 'Durante la obra: facturas de anticipo o semanales.\nAl acabar: la factura final, que descuenta sola los anticipos.\n¿Una factura mal? "Abonar (R-)" la anula y luego sacas la buena.', m: 'man-facturas' },
  conceptoFactura: { t: 'Lo que pone la factura. Ej.: "Pago semana 2 – alicatado baño".' },
  importeFactura: { t: 'Importe SIN IVA; el IVA lo suma el programa. "Poner 25%" lo calcula sobre el presupuesto base.' },
  fechaFactura: { t: 'La fecha legal de la factura. Normalmente, hoy.' },
  motivoAbono: { t: 'Por qué se anula. Ej.: "Error en el importe". Sale escrito en el abono.' },
  imprimir: { t: 'En la ventana que se abre, en "Destino" elige "Guardar como PDF". Márgenes: predeterminados. Escala: 100%.', m: 'man-pdf' },

  // ---------- 9. Empresa ----------
  logo: { t: 'La imagen de nuestra empresa para la cabecera de presupuestos y facturas. Mejor un PNG con fondo transparente.' },
  razonSocial: { t: 'El nombre legal de nuestra empresa, o el nuestro si somos autónomos, tal como figura en Hacienda.' },
  cif: { t: 'Obligatorio en las facturas: sin él no son válidas. En los presupuestos no hace falta.' },
  contacto: { t: 'Sale en la cabecera del PDF para que el cliente nos localice.' },
  dirFiscal: { t: 'La dirección que tenemos dada de alta en Hacienda. Obligatoria en las facturas.' },
  iban: { t: 'Nuestra cuenta para que nos paguen. Sale en las facturas.' },
  series: { t: 'Hacienda exige numerar las facturas seguidas, sin saltos ni repeticiones, y los abonos en una serie aparte (R-). En enero el año cambia solo y se empieza por el 001.', m: 'man-empresa' },
  siguienteNum: { t: 'El próximo número que se usará. Cámbialo solo si vienes de otro programa: pon el siguiente al último que hicimos.' },
  diasMes: { t: 'Días que trabajamos al mes, normalmente 21. Sirve para repartir por día los gastos fijos y la Seguridad Social.' },
  horasJornada: { t: 'Horas de trabajo de un día. Con 8 h, una partida de 16 horas-persona son 2 días de una persona, o 1 día de dos.' },
  gastoFijo: { t: 'Lo que pagamos al mes por esto. Se reparte por día de obra para que cada presupuesto pague su parte.' },
  festivos: { t: 'El calendario de obra salta estos días. Vienen los oficiales de Málaga capital 2026 y 2027.\nUna línea por festivo: dd/mm/aaaa y el nombre. Si la obra es en otro pueblo, cambia los dos locales.' },
  condiciones: { t: 'El texto legal del final del presupuesto: validez, forma de pago, qué no incluye, garantías… Se escribe una vez y vale para todos.' },
  bibliotecaGestion: { t: 'Nuestras partidas guardadas, con horas, precios y receta. Se guardan con 📚 en cada partida y se usan desde "+ Añadir Partida". Borrar aquí no afecta a los presupuestos ya hechos.', m: 'man-partidas' },
  copias: { t: 'Con la carpeta conectada se hacen solas, una por día, en datos\\copias.\n"Descargar copia" saca un archivo para guardarlo fuera (pendrive, correo).\n"Restaurar" sustituye TODO por lo de la copia.', m: 'man-copias' },

  // ---------- 10. Horas reales ----------
  horasReales: { t: 'Apunta las horas reales de cada trabajo para saber si vamos como presupuestaste y afinar los próximos presupuestos.', m: 'man-horas' },
  rhTotal: { t: 'Horas-persona reales acumuladas en la partida. 2 personas × 8 h = 16.' },
  rhHoy: { t: 'Escribe las horas de hoy y pulsa Enter o +: se suman al total.' },
  rhDesviacion: { t: '≈ En lo previsto: dentro de ±10%.\n▲ Más lento: nos está costando más horas.\n▼ Más rápido: menos horas de las previstas.' },
  rhHudReal: { t: 'Horas reales ÷ medición. Con "📚 Enseñar" se guarda en nuestra biblioteca para que el próximo presupuesto salga con el dato real.' },
  rhBeneficio: { t: 'El beneficio previsto menos lo que cuestan las horas de más (sueldos, furgoneta y comidas), o más lo que ahorras si vamos más rápido.' },

  // ---------- Ventanas emergentes ----------
  medirTotal: { t: 'La suma de todas las líneas. Al pulsar "Aplicar" se pone en la medición de la partida. Las líneas se guardan, así podemos volver y corregir una pared.' },
  misPresupuestos: { t: 'Pulsa un recuadro de arriba para ver solo ese estado. El estado se cambia en el desplegable de cada fila.\n"Pendiente" es lo aceptado que falta por facturar.\n"Abrir" nos lleva al presupuesto.', m: 'man-nuevo' },
  nombreNuevo: { t: 'Se usa como nombre del presupuesto y del cliente. Luego podemos cambiar los dos en la pestaña «Partidas».' },
  capituloDestino: { t: 'En qué capítulo del presupuesto aparecerá la partida.' },
  partidaNueva: { t: 'Rellena el nombre, la unidad y la medición. Las horas por unidad son lo más importante para que el precio salga bien.\nSi la vamos a repetir en otras obras, guárdala luego en nuestra biblioteca con 📚.' },
  matCategoria: { t: 'Solo sirve para ordenar el catálogo y la lista de materiales.' },
  matUnidad: { t: 'Cómo se compra: ud = saco, bote, rollo o pieza; m² = por superficie (azulejo, laminado); ml = por metro (rodapié, cable).' },
  cantidadExtra: { t: 'Cuánto hace falta, en la unidad del material que se ve a la derecha (sacos, botes, piezas…).' },
  faseHerramienta: { t: 'Saldrá en la lista cuando la obra tenga trabajos de esta fase. "General / EPIs" sale siempre.' },

  // ---------- Nuevo presupuesto ----------
  comoEmpezar: { t: '📄 En blanco: solo capítulos; añadimos las partidas desde nuestra biblioteca.\n🏠 Ejemplo: todas las del piso de Fuengirola.\n⭐ Plantilla: las que guardaste.', m: 'man-nuevo' }
};

function helpIcon(key) {
  return AYUDA[key] ? `<i class="info-icon" data-help="${key}" tabindex="0" role="button" aria-label="Ayuda">i</i>` : '';
}
function helpText(el) {
  if (el.dataset.help && AYUDA[el.dataset.help]) return AYUDA[el.dataset.help];
  if (el.dataset.info) return { t: el.dataset.info };
  return null;
}
function goToManual(anchor) {
  hideHelp();
  switchTab('manual');
  setTimeout(() => { const a = document.getElementById(anchor); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}

// ---- Globo de ayuda: ratón, clic/toque y teclado (Tab + Enter). Esc lo cierra. ----
let helpHideTimer = null, helpPinned = false;
function showHelp(el, pin) {
  const h = helpText(el);
  if (!h) return;
  const tip = document.getElementById('floatingTooltip');
  clearTimeout(helpHideTimer);
  helpPinned = !!pin;
  tip.innerHTML = esc(h.t).replace(/\n/g, '<br>') +
    (h.m ? `<div class="tip-man"><button type="button" class="tip-man-btn" onclick="goToManual('${h.m}')">→ Ver en el manual</button></div>` : '');
  tip.style.display = 'block';
  const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
  let top = r.bottom + 8, left = r.left - 10;
  if (left + t.width > window.innerWidth - 12) left = window.innerWidth - t.width - 12;
  if (left < 12) left = 12;
  if (top + t.height > window.innerHeight - 12) top = r.top - t.height - 8;
  tip.style.top = top + 'px'; tip.style.left = left + 'px';
}
function hideHelp() { helpPinned = false; const tip = document.getElementById('floatingTooltip'); if (tip) tip.style.display = 'none'; }
function scheduleHide() { clearTimeout(helpHideTimer); helpHideTimer = setTimeout(() => { if (!helpPinned) hideHelp(); }, 250); }

document.addEventListener('mouseover', e => {
  const icon = e.target.closest('.info-icon');
  if (icon) { showHelp(icon, false); return; }
  if (e.target.closest('#floatingTooltip')) clearTimeout(helpHideTimer);
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('.info-icon') || e.target.closest('#floatingTooltip')) scheduleHide();
});
document.addEventListener('click', e => {
  const icon = e.target.closest('.info-icon');
  if (icon) { e.preventDefault(); e.stopPropagation(); showHelp(icon, true); return; }
  if (!e.target.closest('#floatingTooltip')) hideHelp();
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideHelp(); return; }
  const icon = e.target.closest && e.target.closest('.info-icon');
  if (icon && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showHelp(icon, true); }
});
// Las "i" que estén en el HTML se pueden alcanzar con Tab
document.querySelectorAll('.info-icon').forEach(i => { i.setAttribute('tabindex', '0'); i.setAttribute('role', 'button'); i.setAttribute('aria-label', 'Ayuda'); });
