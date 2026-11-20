// ============================================================
// CATÁLOGO AMPLIADO (revisión 1, nov 2026)
// Se añade a los datos existentes SIN borrar nada (por id o por nombre).
// Precios orientativos de mercado: revísalos con nuestro proveedor.
// ============================================================
const CATALOG_REV = 4;

// Revisión 3: nombres antiguos del ejemplo que llevaban cantidades dentro (solo cambia el nombre)
// Rev4: descripciones de la biblioteca sin medidas de otra obra + 2 partidas de retirada a tamaño de una estancia
const DESC_UPDATES_REV4 = {
  'Picado de azulejos y levantado de solado actual': ['Picado mecánico de revestimientos en baño/cocina (~41,5 m²) y solado (~62,4 m²).', 'Picado mecánico de revestimientos de pared y levantado del solado existente, con carga de escombro a sacos.'],
  'Alisado de paredes con yeso/emplaste': ['Mano de obra de tendido de yeso, plaste y lijado fino (~120 m² netos a 2,50 m).', 'Mano de obra de tendido de yeso, plaste y lijado fino de paredes, listas para pintar.']
};
const LIBRARY_REV4 = [
  { chapterName: '1. Trabajos Previos y Demoliciones', name: 'Retirada de sanitarios y mueble de un baño', desc: 'Desmontaje y retirada de inodoro, bidet, lavabo/mueble, espejo y accesorios de un baño, con corte y anulación de tomas.', unit: 'ud', phase: 1, mode: 'own', hoursPerUnit: 5, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, matRecipe: [{ matId: 'm_saco_esc', factor: 8 }] },
  { chapterName: '1. Trabajos Previos y Demoliciones', name: 'Retirada de muebles y electrodomésticos de cocina', desc: 'Desmontaje y retirada de muebles altos y bajos, encimera, fregadero y electrodomésticos de una cocina.', unit: 'ud', phase: 1, mode: 'own', hoursPerUnit: 7, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, matRecipe: [{ matId: 'm_saco_esc', factor: 12 }] }
];
const NAME_UPDATES_REV3 = {
  'Montaje de 48 mecanismos (enchufes, TV, red)': 'Montaje de mecanismos (enchufes, TV, red)',
  'Instalación 28 focos LED empotrados y lámparas': 'Instalación de focos LED empotrados y lámparas',
  'Mano de obra preinstalación A/A (4 estancias)': 'Mano de obra preinstalación A/A (por estancia)',
  'Instalación y puesta en marcha 4 Splits A/A': 'Instalación y puesta en marcha de split A/A',
  'Colocación de 6 puertas de paso interiores': 'Colocación de puerta de paso interior',
  'Montaje y vestido de los 3 armarios empotrados': 'Montaje y vestido de armario empotrado',
  'Montaje mobiliario de cocina (~3,27 ml) + fregadero': 'Montaje de mobiliario de cocina + fregadero',
  'Colocación 5 ventanas PVC con persiana (salón + 3 dorm.)': 'Colocación de ventanas PVC con persiana (salón y dormitorios)'
};

// Revisión 2 (20 nov 2026): precios con IVA comprobados en Obramat / Leroy Merlin.
// Formato: id: [precio antiguo, precio nuevo]. Solo se cambia si el precio sigue siendo el antiguo
// (si lo hemos editado, se respeta). Los marcados "est." son estimaciones por comparación.
const PRICE_UPDATES_REV2 = {
  m_arena: [1.05, 1.25], m_cemento: [4.3, 4.9], m_mortero: [2.05, 2.8], m_autoniv: [14.5, 12],
  m_cola_c2te: [7.6, 7.95], m_yeso: [1.85, 2.9], m_plaste: [16.5, 12.5],
  m_pladur_std: [6.2, 8.4], m_pladur_h1: [10.9, 11.5], m_perfil_pyl: [5.8, 2.6],
  m_imprimacion: [42, 45], m_pintura_int: [52, 42], m_pintura_hum: [28, 35], m_pintura_ext: [68, 55],
  m_tubo_pex: [3.2, 2.6], m_termo: [260, 190], m_ducha: [155, 140], m_mampara: [245, 220],
  m_inodoro: [165, 190], m_mueble_bano: [290, 260], m_corrugado: [34, 28], m_split_aa: [440, 380],
  m_vent_120x115: [285, 350], m_vent_120x135: [365, 405], m_vent_100x115: [185, 300] /* est. */,
  m_balc_140x229: [625, 750] /* est. */, m_puerta_acor: [790, 850], m_puerta_lac: [195, 160],
  m_montante48: [4.2, 2.5], m_lana_min: [4.5, 3.0], m_laminado: [16, 12.9]
};

const EXTRA_MATERIALS = [
  { id: 'm_ladrillo_hd', cat: 'Albañilería y Agarre', name: 'Ladrillo hueco doble 24×11,5×7 cm', unit: 'ud', price: 0.35, roundUp: true },
  { id: 'm_mortero_rep', cat: 'Albañilería y Agarre', name: 'Saco Mortero reparación / tapagrietas 25 kg', unit: 'ud', price: 12.5, roundUp: true },
  { id: 'm_malla_fv', cat: 'Albañilería y Agarre', name: 'Rollo malla fibra de vidrio antifisuras (50 m²)', unit: 'ud', price: 38, roundUp: true },
  { id: 'm_carton_prot', cat: 'Albañilería y Agarre', name: 'Rollo cartón ondulado + plástico protección zonas comunes', unit: 'ud', price: 22, roundUp: true },
  { id: 'm_montante48', cat: 'Yeso, Pladur y Pintura', name: 'Montante / canal 48 mm tabiquería pladur (3 m)', unit: 'ud', price: 4.2, roundUp: true },
  { id: 'm_lana_min', cat: 'Yeso, Pladur y Pintura', name: 'Lana mineral 45-50 mm aislamiento térmico-acústico', unit: 'm²', price: 4.5, roundUp: true },
  { id: 'm_esmalte', cat: 'Yeso, Pladur y Pintura', name: 'Bote esmalte sintético carpintería / rejas 4 L', unit: 'ud', price: 38, roundUp: true },
  { id: 'm_perfil_remate', cat: 'Suelos y Azulejos', name: 'Perfil remate / cantonera aluminio alicatado 2,5 m', unit: 'ud', price: 6.5, roundUp: true },
  { id: 'm_laminado', cat: 'Suelos y Azulejos', name: 'Suelo laminado AC5 / vinílico SPC clic', unit: 'm²', price: 16, roundUp: true },
  { id: 'm_base_lam', cat: 'Suelos y Azulejos', name: 'Base aislante para suelo flotante', unit: 'm²', price: 1.6, roundUp: true },
  { id: 'm_rodapie_mdf', cat: 'Suelos y Azulejos', name: 'Rodapié MDF lacado blanco 7 cm', unit: 'ml', price: 3.2, roundUp: true },
  { id: 'm_sumidero', cat: 'Fontanería y Baño', name: 'Sumidero lineal ducha de obra acero inox 70 cm', unit: 'ud', price: 85, roundUp: true },
  { id: 'm_kit_conex', cat: 'Fontanería y Baño', name: 'Lote conexión sanitario: llaves escuadra, latiguillos y válvula', unit: 'ud', price: 22, roundUp: true },
  { id: 'm_banera', cat: 'Fontanería y Baño', name: 'Bañera acrílica 160-170 cm + desagüe', unit: 'ud', price: 210, roundUp: true },
  { id: 'm_extractor', cat: 'Electricidad y Clima', name: 'Extractor baño silencioso Ø100 + tubo y rejilla', unit: 'ud', price: 55, roundUp: true },
  { id: 'm_videoportero', cat: 'Electricidad y Clima', name: 'Videoportero / telefonillo de vivienda (monitor)', unit: 'ud', price: 120, roundUp: true },
  { id: 'm_salida_humos', cat: 'Ventanas, Puertas y Cocina', name: 'Tubo salida humos campana Ø120 + rejilla exterior', unit: 'ud', price: 35, roundUp: true },
  { id: 'm_vierteaguas', cat: 'Ventanas, Puertas y Cocina', name: 'Vierteaguas / alféizar porcelánico o mármol', unit: 'ml', price: 28, roundUp: true },
  { id: 'm_mosquitera', cat: 'Ventanas, Puertas y Cocina', name: 'Mosquitera enrollable aluminio a medida', unit: 'ud', price: 75, roundUp: true }
];

const EXTRA_TOOLS = [
  { id: 't_x_casco', phase: 0, scope: 'person', name: 'Casco de seguridad + rodilleras de gel (alicatado y solado)' },
  { id: 't_x_botiquin', phase: 0, scope: 'team', name: 'Botiquín de primeros auxilios + extintor portátil 6 kg' },
  { id: 't_x_cuadro', phase: 0, scope: 'team', name: 'Cuadro eléctrico portátil de obra con diferencial' },
  { id: 't_x_escalera', phase: 0, scope: 'team', name: 'Escalera de tijera + 2 borriquetas con tablones' },
  { id: 't_x_manual', phase: 0, scope: 'official', name: 'Caja herramienta manual: martillo, destornilladores, alicates, llaves Allen' },
  { id: 't_x_laser', phase: 0, scope: 'team', name: 'Medidor láser de distancias + nivel láser de líneas (replanteo)' },
  { id: 't_x_proteccion', phase: 0, scope: 'team', name: 'Rollos de cartón y plástico para proteger suelos y zonas comunes' },
  { id: 't_x_sable', phase: 1, scope: 'team', name: 'Sierra sable + palanca / pata de cabra + mazo 2 kg' },
  { id: 't_x_sds', phase: 2, scope: 'team', name: 'Martillo perforador SDS + brocas largas + corona 68 mm para cajas' },
  { id: 't_x_prueba', phase: 2, scope: 'team', name: 'Bomba de prueba hidráulica con manómetro (prueba de presión)' },
  { id: 't_x_comprobador', phase: 2, scope: 'official', name: 'Comprobador de instalaciones (tierra y diferenciales) para el boletín' },
  { id: 't_x_detector', phase: 2, scope: 'team', name: 'Detector de tuberías y cables (antes de taladrar o rozar)' },
  { id: 't_x_alzaplacas', phase: 3, scope: 'team', name: 'Elevador de placas de pladur (alzaplacas) para techos' },
  { id: 't_x_tiralineas', phase: 3, scope: 'official', name: 'Bota de marcar (tiralíneas) + cepillo y cuchilla de pladur' },
  { id: 't_x_nivelacion', phase: 4, scope: 'team', name: 'Kit de nivelación de baldosas (clips + cuñas + alicate)' },
  { id: 't_x_agua', phase: 4, scope: 'team', name: 'Cortadora eléctrica al agua (porcelánico grueso e ingletes)' },
  { id: 't_x_laminado', phase: 7, scope: 'team', name: 'Kit suelo laminado: taco de golpeo, tiracuñas y cuñas de dilatación' }
];

// Partidas nuevas para la biblioteca (se añaden si no existe una con el mismo nombre)
const EXTRA_LIBRARY = [
  // Trabajos previos
  { chapterName: 'Trabajos Previos y Demoliciones', name: 'Protección de zonas comunes, ascensor y suelos', desc: 'Protección con cartón y plástico de portal, ascensor, escalera y suelos que se conservan.', unit: 'PA', phase: 1, mode: 'own', hoursPerUnit: 4, matRecipe: [{ matId: 'm_carton_prot', factor: 2 }, { matId: 'm_cinta_plast', factor: 1 }] },
  { chapterName: 'Trabajos Previos y Demoliciones', name: 'Demolición de tabique de ladrillo', desc: 'Derribo de tabiquería interior y carga de escombro a sacos.', unit: 'm²', phase: 1, mode: 'own', hoursPerUnit: 0.6, matRecipe: [{ matId: 'm_saco_esc', factor: 1.5 }] },
  { chapterName: 'Trabajos Previos y Demoliciones', name: 'Desmontaje de falso techo de escayola existente', desc: 'Retirada de techo de escayola o placa y carga de escombro.', unit: 'm²', phase: 1, mode: 'own', hoursPerUnit: 0.35, matRecipe: [{ matId: 'm_saco_esc', factor: 0.8 }] },
  { chapterName: 'Trabajos Previos y Demoliciones', name: 'Desmontaje de bañera y alicatado perimetral', desc: 'Retirada de bañera existente y picado de su alicatado.', unit: 'ud', phase: 1, mode: 'own', hoursPerUnit: 4, matRecipe: [{ matId: 'm_saco_esc', factor: 8 }] },
  { chapterName: 'Trabajos Previos y Demoliciones', name: 'Retirada de instalaciones eléctricas y de fontanería antiguas', desc: 'Desmontaje de cableado, cajas, tuberías y desagües que se sustituyen.', unit: 'PA', phase: 1, mode: 'own', hoursPerUnit: 8, matRecipe: [{ matId: 'm_saco_esc', factor: 6 }] },
  // Albañilería y pladur
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Tabique de ladrillo hueco doble', desc: 'Levantado de tabique de ladrillo hueco doble recibido con mortero, aplomado y nivelado.', unit: 'm²', phase: 3, mode: 'own', hoursPerUnit: 0.9, matRecipe: [{ matId: 'm_ladrillo_hd', factor: 34 }, { matId: 'm_mortero', factor: 1.2 }] },
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Tabique de pladur con aislamiento (placa a dos caras)', desc: 'Estructura de 48 mm, placa de 13 mm a cada cara, lana mineral interior y juntas tratadas.', unit: 'm²', phase: 3, mode: 'own', hoursPerUnit: 0.75, matRecipe: [{ matId: 'm_pladur_std', factor: 0.74 }, { matId: 'm_montante48', factor: 0.6 }, { matId: 'm_lana_min', factor: 1.05 }, { matId: 'm_pasta_cinta', factor: 0.08 }, { matId: 'm_torn_pyl', factor: 0.03 }] },
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Trasdosado de pladur con aislamiento', desc: 'Trasdosado autoportante en muros de fachada con lana mineral y placa de 13 mm.', unit: 'm²', phase: 3, mode: 'own', hoursPerUnit: 0.55, matRecipe: [{ matId: 'm_pladur_std', factor: 0.37 }, { matId: 'm_montante48', factor: 0.6 }, { matId: 'm_lana_min', factor: 1.05 }, { matId: 'm_pasta_cinta', factor: 0.05 }, { matId: 'm_torn_pyl', factor: 0.02 }] },
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Reparación de grietas con malla y mortero', desc: 'Abierto de grieta, malla de fibra de vidrio y mortero de reparación.', unit: 'ml', phase: 3, mode: 'own', hoursPerUnit: 0.4, matRecipe: [{ matId: 'm_malla_fv', factor: 0.01 }, { matId: 'm_mortero_rep', factor: 0.15 }] },
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Cajeado de bajantes y tuberías', desc: 'Forrado de bajante o tubería vista con pladur hidrófugo sobre perfilería.', unit: 'ud', phase: 3, mode: 'own', hoursPerUnit: 3, matRecipe: [{ matId: 'm_pladur_h1', factor: 1 }, { matId: 'm_perfil_pyl', factor: 2 }, { matId: 'm_pasta_cinta', factor: 0.2 }] },
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Recibido de premarcos y cercos', desc: 'Colocación y aplomado de premarco de puerta o ventana.', unit: 'ud', phase: 3, mode: 'own', hoursPerUnit: 0.75, matRecipe: [{ matId: 'm_yeso', factor: 0.5 }, { matId: 'm_espuma_pu', factor: 0.3 }] },
  { chapterName: 'Albañilería, Yeso, Pladur y Nivelación', name: 'Formación de ducha de obra con sumidero lineal', desc: 'Formación de pendientes, sumidero lineal e impermeabilización completa antes de solar.', unit: 'ud', phase: 4, mode: 'own', hoursPerUnit: 10, matRecipe: [{ matId: 'm_sumidero', factor: 1 }, { matId: 'm_imperm', factor: 4 }, { matId: 'm_mortero', factor: 4 }] },
  // Suelos y revestimientos
  { chapterName: 'Alicatados y Suelos', name: 'Colocación de perfiles de remate y cantoneras', desc: 'Perfiles de aluminio en esquinas de alicatado y encuentros de suelo.', unit: 'ml', phase: 4, mode: 'own', hoursPerUnit: 0.15, matRecipe: [{ matId: 'm_perfil_remate', factor: 0.42 }] },
  { chapterName: 'Alicatados y Suelos', name: 'Suelo laminado o vinílico SPC flotante', desc: 'Colocación flotante sobre base aislante, con cortes y juntas de dilatación.', unit: 'm²', phase: 7, mode: 'own', hoursPerUnit: 0.3, matRecipe: [{ matId: 'm_laminado', factor: 1.08 }, { matId: 'm_base_lam', factor: 1.05 }] },
  { chapterName: 'Alicatados y Suelos', name: 'Colocación de rodapié MDF lacado', desc: 'Rodapié de MDF a juego con carpintería, pegado y clavado.', unit: 'ml', phase: 8, mode: 'own', hoursPerUnit: 0.12, matRecipe: [{ matId: 'm_rodapie_mdf', factor: 1.08 }] },
  { chapterName: 'Alicatados y Suelos', name: 'Colocación de vierteaguas o alféizar', desc: 'Recibido de vierteaguas con pendiente y goterón.', unit: 'ml', phase: 3, mode: 'own', hoursPerUnit: 0.6, matRecipe: [{ matId: 'm_vierteaguas', factor: 1 }, { matId: 'm_cola_c2te', factor: 0.1 }] },
  // Pintura
  { chapterName: 'Pintura Interior y Exterior', name: 'Esmaltado de rejas, barandillas o carpintería metálica', desc: 'Lijado, imprimación antióxido y dos manos de esmalte sintético.', unit: 'm²', phase: 8, mode: 'own', hoursPerUnit: 0.5, matRecipe: [{ matId: 'm_esmalte', factor: 0.05 }, { matId: 'm_lija', factor: 0.3 }] },
  { chapterName: 'Pintura Interior y Exterior', name: 'Lacado de puerta de paso existente (dos caras)', desc: 'Lijado, imprimación y lacado de puerta y marco por las dos caras.', unit: 'ud', phase: 5, mode: 'own', hoursPerUnit: 3, matRecipe: [{ matId: 'm_esmalte', factor: 0.25 }, { matId: 'm_lija', factor: 2 }] },
  // Fontanería
  { chapterName: 'Fontanería y Montaje de Baño', name: 'Prueba de estanqueidad y presión de la instalación', desc: 'Prueba hidráulica con manómetro antes de tapar rozas.', unit: 'PA', phase: 2, mode: 'own', hoursPerUnit: 2, matRecipe: [] },
  { chapterName: 'Fontanería y Montaje de Baño', name: 'Montaje de bañera con conexiones', desc: 'Nivelado, conexión de desagüe y grifería, sellado perimetral.', unit: 'ud', phase: 6, mode: 'own', hoursPerUnit: 6, matRecipe: [{ matId: 'm_banera', factor: 1 }, { matId: 'm_kit_conex', factor: 1 }, { matId: 'm_silic_tef', factor: 0.5 }] },
  { chapterName: 'Fontanería y Montaje de Baño', name: 'Conexión de salida de humos de campana', desc: 'Tubo de extracción hasta el exterior o shunt, con rejilla.', unit: 'ud', phase: 7, mode: 'own', hoursPerUnit: 2, matRecipe: [{ matId: 'm_salida_humos', factor: 1 }] },
  // Electricidad
  { chapterName: 'Electricidad e Iluminación', name: 'Instalación de extractor de baño con salida', desc: 'Extractor silencioso con conducto y rejilla (ventilación exigida por el CTE).', unit: 'ud', phase: 6, mode: 'own', hoursPerUnit: 2, matRecipe: [{ matId: 'm_extractor', factor: 1 }] },
  { chapterName: 'Electricidad e Iluminación', name: 'Punto de luz sencillo o conmutado', desc: 'Línea, caja, interruptor o conmutadores y portalámparas.', unit: 'ud', phase: 2, mode: 'sub', subCost: 32, subMarginPct: 15, subDays: 0.1, subIncludesMat: false, hoursPerUnit: 0, matRecipe: [{ matId: 'm_mecanismo', factor: 1 }] },
  { chapterName: 'Electricidad e Iluminación', name: 'Instalación de videoportero / telefonillo', desc: 'Sustitución o instalación de monitor de vivienda y conexión.', unit: 'ud', phase: 6, mode: 'sub', subCost: 60, subMarginPct: 15, subDays: 0.5, subIncludesMat: false, hoursPerUnit: 0, matRecipe: [{ matId: 'm_videoportero', factor: 1 }] },
  { chapterName: 'Electricidad e Iluminación', name: 'Boletín eléctrico (CIE) y legalización en la Junta de Andalucía', desc: 'Certificado de instalación eléctrica por instalador autorizado y registro.', unit: 'PA', phase: 8, mode: 'sub', subCost: 220, subMarginPct: 10, subDays: 0, subIncludesMat: true, hoursPerUnit: 0, matRecipe: [] },
  // Carpintería exterior
  { chapterName: 'Carpintería Exterior', name: 'Instalación de mosquitera enrollable', desc: 'Mosquitera de aluminio a medida en ventana o balconera.', unit: 'ud', phase: 8, mode: 'sub', subCost: 25, subMarginPct: 15, subDays: 0.2, subIncludesMat: false, hoursPerUnit: 0, matRecipe: [{ matId: 'm_mosquitera', factor: 1 }] },
  // Trámites
  { chapterName: 'Trámites y Gestión', name: 'Tramitación de declaración responsable / licencia de obra', desc: 'Gestión ante el Ayuntamiento. Tasas e ICIO a cargo del cliente salvo pacto.', unit: 'PA', phase: 1, mode: 'sub', subCost: 180, subMarginPct: 0, subDays: 0, subIncludesMat: true, hoursPerUnit: 0, matRecipe: [] },
  { chapterName: 'Trámites y Gestión', name: 'Permiso de ocupación de vía pública para contenedor', desc: 'Solicitud y tasa municipal para colocar el contenedor en la calle.', unit: 'PA', phase: 1, mode: 'sub', subCost: 90, subMarginPct: 0, subDays: 0, subIncludesMat: true, hoursPerUnit: 0, matRecipe: [] }
];

// Correcciones de recetas del ejemplo original (solo si la receta sigue EXACTAMENTE igual)
function fixLegacyRecipes(state) {
  let fixes = 0;
  const same = (rec, ref) => rec && rec.length === ref.length && ref.every((r, i) => rec[i] && rec[i].matId === r[0] && Number(rec[i].factor) === r[1]);
  (state.projects || []).forEach(p => (p.items || []).forEach(it => {
    // Ventanas: la receta ponía 3+1+1 ventanas POR UNIDAD (con 5 ud salían 25 ventanas)
    if (same(it.matRecipe, [['m_vent_120x115', 3], ['m_vent_100x115', 1], ['m_vent_120x135', 1], ['m_espuma_pu', 1]]) && Number(it.qty) > 1) {
      const q = Number(it.qty);
      it.matRecipe = [{ matId: 'm_vent_120x115', factor: r2(3 / q) }, { matId: 'm_vent_100x115', factor: r2(1 / q) }, { matId: 'm_vent_120x135', factor: r2(1 / q) }, { matId: 'm_espuma_pu', factor: 1 }];
      fixes++;
    }
    // Pintura: el consumo era casi el doble del real (≈10 m²/L por mano, 2 manos)
    if (same(it.matRecipe, [['m_imprimacion', 0.015], ['m_pintura_int', 0.03], ['m_cinta_plast', 0.025], ['m_lija', 0.1]])) {
      it.matRecipe = [{ matId: 'm_imprimacion', factor: 0.008 }, { matId: 'm_pintura_int', factor: 0.015 }, { matId: 'm_cinta_plast', factor: 0.025 }, { matId: 'm_lija', factor: 0.1 }];
      fixes++;
    }
    if (same(it.matRecipe, [['m_pintura_int', 0.025], ['m_pintura_hum', 0.035]])) {
      it.matRecipe = [{ matId: 'm_pintura_int', factor: 0.013 }, { matId: 'm_pintura_hum', factor: 0.015 }];
      fixes++;
    }
  }));
  return fixes;
}

// Añade lo nuevo una sola vez. Devuelve un resumen para avisar al usuario.
function applyCatalogRev(state) {
  const rev = Number(state.catalogRev) || 0;
  if (rev >= CATALOG_REV) return null;
  const res = { mats: 0, tools: 0, lib: 0, fixes: 0, prices: 0 };
  if (rev < 1) applyRev1(state, res);
  if (rev < 3) {
    const ren = it => { const n = NAME_UPDATES_REV3[it.name]; if (n) { it.name = n; res.names = (res.names || 0) + 1; } };
    (state.projects || []).forEach(p => (p.items || []).forEach(ren));
    (state.templates || []).forEach(t => (t.items || []).forEach(ren));
  }
  if (rev < 2) {
    (state.materialsCatalog || []).forEach(m => {
      const u = PRICE_UPDATES_REV2[m.id];
      if (u && Math.abs(Number(m.price) - u[0]) < 0.001) { m.price = u[1]; res.prices++; }
    });
  }
  if (rev < 4 && Array.isArray(state.itemLibrary)) {
    state.itemLibrary.forEach(l => { const u = DESC_UPDATES_REV4[l.name]; if (u && l.desc === u[0]) { l.desc = u[1]; res.fixes++; } });
    LIBRARY_REV4.forEach((e, n) => {
      if (!state.itemLibrary.some(l => normTxt(l.name) === normTxt(e.name))) {
        state.itemLibrary.push({ id: 'lib_rev4_' + n, updatedAt: Date.now(), ...JSON.parse(JSON.stringify(e)) }); res.lib++;
      }
    });
  }
  state.catalogRev = CATALOG_REV;
  return res;
}

function applyRev1(state, res) {
  if (!Array.isArray(state.materialsCatalog)) state.materialsCatalog = [];
  EXTRA_MATERIALS.forEach(m => { if (!state.materialsCatalog.some(x => x.id === m.id)) { state.materialsCatalog.push({ ...m }); res.mats++; } });
  if (!Array.isArray(state.toolsCatalog)) state.toolsCatalog = [];
  EXTRA_TOOLS.forEach(t => { if (!state.toolsCatalog.some(x => x.id === t.id)) { state.toolsCatalog.push({ ...t }); res.tools++; } });
  if (Array.isArray(state.itemLibrary)) {
    EXTRA_LIBRARY.forEach(e => {
      if (state.itemLibrary.some(l => normTxt(l.name) === normTxt(e.name))) return;
      state.itemLibrary.push(libEntryFromItem({ subCost: 0, subMarginPct: 15, subDays: 1, subIncludesMat: false, ...e }, e.chapterName));
      res.lib++;
    });
  }
  res.fixes = fixLegacyRecipes(state);
}
