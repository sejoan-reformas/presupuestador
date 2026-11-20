const STORAGE_KEY = 'reformasProApp_v1';

const ROADMAP_PHASES = [
  { id: 1, name: 'Fase 1: Trabajos Previos y Demoliciones', desc: 'Protección, retirada de mobiliario/sanitarios, picado de alicatados y suelos, y desescombro.' },
  { id: 2, name: 'Fase 2: Rozas e Instalaciones Ocultas', desc: 'Apertura de rozas, tuberías de fontanería Wirsbo/PEX y desagües PVC, cableado eléctrico y preinstalación A/A.' },
  { id: 3, name: 'Fase 3: Albañilería, Pladur y Ventanas', desc: 'Tapado de rozas, maestreado, nivelación de suelos, instalación de ventanas exteriores y falsos techos de pladur.' },
  { id: 4, name: 'Fase 4: Revestimientos (Alicatados y Solados)', desc: 'Alicatado de baño y cocina, solado porcelánico general de la vivienda y pavimento antideslizante en terraza.' },
  { id: 5, name: 'Fase 5: Yesos, Alisados y 1ª Mano Pintura', desc: 'Alisado/emplastecido de paredes, lijado fino, imprimación y primera mano de pintura en techos y paredes.' },
  { id: 6, name: 'Fase 6: Equipos, Sanitarios e Iluminación', desc: 'Plato de ducha, mampara, inodoro, mueble lavabo, termo, griferías, mecanismos eléctricos, focos LED y splits A/A.' },
  { id: 7, name: 'Fase 7: Carpintería Interior y Cocina', desc: 'Puertas de paso, rodapiés, reforma de armarios empotrados, muebles de cocina, encimera y electrodomésticos.' },
  { id: 8, name: 'Fase 8: Remates, Puerta Entrada y Limpieza', desc: 'Puerta acorazada de entrada, mano final y repasos de pintura, sellados y limpieza general profunda.' }
];

const DEFAULT_MATERIALS_CATALOG = [
  { id: 'm_arena', cat: 'Albañilería y Agarre', name: 'Saco Arena común / fina 25 kg', unit: 'ud', price: 1.05, roundUp: true },
  { id: 'm_cemento', cat: 'Albañilería y Agarre', name: 'Saco Cemento gris 25 kg', unit: 'ud', price: 4.30, roundUp: true },
  { id: 'm_mortero', cat: 'Albañilería y Agarre', name: 'Saco Mortero seco M7.5 25 kg', unit: 'ud', price: 2.05, roundUp: true },
  { id: 'm_autoniv', cat: 'Albañilería y Agarre', name: 'Saco Mortero autonivelante 25 kg', unit: 'ud', price: 14.50, roundUp: true },
  { id: 'm_cola_c2te', cat: 'Albañilería y Agarre', name: 'Saco Cemento cola flexible C2TE 25 kg', unit: 'ud', price: 7.60, roundUp: true },
  { id: 'm_borada', cat: 'Albañilería y Agarre', name: 'Saco Mortero de juntas (borada) 5 kg', unit: 'ud', price: 8.50, roundUp: true },
  { id: 'm_crucetas', cat: 'Albañilería y Agarre', name: 'Bolsa crucetas / cuñas nivelación', unit: 'ud', price: 6.50, roundUp: true },
  { id: 'm_imperm', cat: 'Albañilería y Agarre', name: 'Impermeabilizante líquido / lámina ducha y terraza', unit: 'm²', price: 12.00, roundUp: false },
  { id: 'm_saco_esc', cat: 'Albañilería y Agarre', name: 'Saco escombro rafia resistente', unit: 'ud', price: 0.85, roundUp: true },

  { id: 'm_yeso', cat: 'Yeso, Pladur y Pintura', name: 'Saco Yeso controlado / manual 17 kg', unit: 'ud', price: 1.85, roundUp: true },
  { id: 'm_plaste', cat: 'Yeso, Pladur y Pintura', name: 'Saco/Cubo Plaste alisado fino 15-20 kg', unit: 'ud', price: 16.50, roundUp: true },
  { id: 'm_lija', cat: 'Yeso, Pladur y Pintura', name: 'Pliego / Disco de lija (grano medio y fino)', unit: 'ud', price: 0.90, roundUp: true },
  { id: 'm_pladur_std', cat: 'Yeso, Pladur y Pintura', name: 'Placa Pladur estándar 13 mm (3 m²)', unit: 'ud', price: 6.20, roundUp: true },
  { id: 'm_pladur_h1', cat: 'Yeso, Pladur y Pintura', name: 'Placa Pladur hidrófuga verde H1 (3 m²)', unit: 'ud', price: 10.90, roundUp: true },
  { id: 'm_perfil_pyl', cat: 'Yeso, Pladur y Pintura', name: 'Perfil metálico pladur 3 m (maestra/canal)', unit: 'ud', price: 5.80, roundUp: true },
  { id: 'm_pasta_cinta', cat: 'Yeso, Pladur y Pintura', name: 'Pasta de juntas + cinta papel pladur (kit)', unit: 'ud', price: 18.00, roundUp: true },
  { id: 'm_torn_pyl', cat: 'Yeso, Pladur y Pintura', name: 'Caja 1000 tornillos pladur + varillas/tacos', unit: 'ud', price: 11.00, roundUp: true },
  { id: 'm_imprimacion', cat: 'Yeso, Pladur y Pintura', name: 'Bote Imprimación fijadora 15 L', unit: 'ud', price: 42.00, roundUp: true },
  { id: 'm_pintura_int', cat: 'Yeso, Pladur y Pintura', name: 'Bote Pintura plástica mate lavable 15 L', unit: 'ud', price: 52.00, roundUp: true },
  { id: 'm_pintura_hum', cat: 'Yeso, Pladur y Pintura', name: 'Bote Pintura antimoho techo baño/cocina 4 L', unit: 'ud', price: 28.00, roundUp: true },
  { id: 'm_pintura_ext', cat: 'Yeso, Pladur y Pintura', name: 'Bote Pintura exterior fachada/terraza 15 L', unit: 'ud', price: 68.00, roundUp: true },
  { id: 'm_cinta_plast', cat: 'Yeso, Pladur y Pintura', name: 'Lote cinta carrocero, plástico suelo y rodillos', unit: 'ud', price: 24.00, roundUp: true },

  { id: 'm_azulejo', cat: 'Suelos y Azulejos', name: 'Azulejo / revestimiento pared (gama media)', unit: 'm²', price: 18.00, roundUp: false },
  { id: 'm_porcel_int', cat: 'Suelos y Azulejos', name: 'Suelo porcelánico rectificado interior', unit: 'm²', price: 21.00, roundUp: false },
  { id: 'm_rodapie', cat: 'Suelos y Azulejos', name: 'Rodapié porcelánico a juego', unit: 'ml', price: 4.50, roundUp: false },
  { id: 'm_porcel_ext', cat: 'Suelos y Azulejos', name: 'Gres porcelánico antideslizante exterior C3', unit: 'm²', price: 24.00, roundUp: false },

  { id: 'm_tubo_pex', cat: 'Fontanería y Baño', name: 'Tubería PEX / multicapa Wirsbo-Uponor + coquilla', unit: 'ml', price: 3.20, roundUp: true },
  { id: 'm_acces_pex', cat: 'Fontanería y Baño', name: 'Lote codos, anillos expansión Wirsbo y llaves corte', unit: 'ud', price: 145.00, roundUp: true },
  { id: 'm_tubo_pvc', cat: 'Fontanería y Baño', name: 'Tubo PVC desagües 40/50/110 mm + codos', unit: 'ml', price: 3.80, roundUp: true },
  { id: 'm_peg_pvc', cat: 'Fontanería y Baño', name: 'Bote Pegamento PVC rápido 500 ml + limpiador', unit: 'ud', price: 11.50, roundUp: true },
  { id: 'm_silic_tef', cat: 'Fontanería y Baño', name: 'Lote silicona antimoho, teflón y masilla', unit: 'ud', price: 18.00, roundUp: true },
  { id: 'm_termo', cat: 'Fontanería y Baño', name: 'Termo eléctrico 80-100 L bajo consumo', unit: 'ud', price: 260.00, roundUp: true },
  { id: 'm_ducha', cat: 'Fontanería y Baño', name: 'Plato de ducha resina antideslizante + válvula', unit: 'ud', price: 155.00, roundUp: true },
  { id: 'm_mampara', cat: 'Fontanería y Baño', name: 'Mampara de ducha cristal templado 6 mm', unit: 'ud', price: 245.00, roundUp: true },
  { id: 'm_inodoro', cat: 'Fontanería y Baño', name: 'Inodoro completo con cisterna y tapa caída suave', unit: 'ud', price: 165.00, roundUp: true },
  { id: 'm_bidet', cat: 'Fontanería y Baño', name: 'Bidet compacto + grifo (sujeto a espacio)', unit: 'ud', price: 135.00, roundUp: true },
  { id: 'm_mueble_bano', cat: 'Fontanería y Baño', name: 'Mueble de baño con lavabo y espejo', unit: 'ud', price: 290.00, roundUp: true },
  { id: 'm_grif_bano', cat: 'Fontanería y Baño', name: 'Grifería termostática ducha + monomando lavabo', unit: 'ud', price: 165.00, roundUp: true },
  { id: 'm_grif_coc', cat: 'Fontanería y Baño', name: 'Grifo fregadero cocina caño alto', unit: 'ud', price: 75.00, roundUp: true },

  { id: 'm_cuadro_elec', cat: 'Electricidad y Clima', name: 'Cuadro eléctrico completo + diferenciales + magnetotérmicos', unit: 'ud', price: 245.00, roundUp: true },
  { id: 'm_corrugado', cat: 'Electricidad y Clima', name: 'Rollo tubo corrugado libre halógenos (100 m)', unit: 'ud', price: 34.00, roundUp: true },
  { id: 'm_cable', cat: 'Electricidad y Clima', name: 'Rollo cable 1,5 / 2,5 / 6 mm libre halógenos (100 m)', unit: 'ud', price: 48.00, roundUp: true },
  { id: 'm_cajas_elec', cat: 'Electricidad y Clima', name: 'Lote cajas registro/mecanismos, cinta aislante y bornas', unit: 'ud', price: 55.00, roundUp: true },
  { id: 'm_mecanismo', cat: 'Electricidad y Clima', name: 'Mecanismo completo (enchufe, interruptor, TV o red)', unit: 'ud', price: 8.50, roundUp: true },
  { id: 'm_foco_led', cat: 'Electricidad y Clima', name: 'Foco LED empotrable extraplano + driver', unit: 'ud', price: 9.50, roundUp: true },
  { id: 'm_split_aa', cat: 'Electricidad y Clima', name: 'Equipo Aire Acondicionado Split Inverter A++', unit: 'ud', price: 440.00, roundUp: true },
  { id: 'm_kit_frigo', cat: 'Electricidad y Clima', name: 'Tubo frigorífico aislado + desagüe A/A (por estancia)', unit: 'ud', price: 65.00, roundUp: true },

  { id: 'm_vent_60x50', cat: 'Ventanas, Puertas y Cocina', name: 'Ventana PVC baño 60×50 oscilobatiente traslúcida', unit: 'ud', price: 145.00, roundUp: true },
  { id: 'm_vent_100x115', cat: 'Ventanas, Puertas y Cocina', name: 'Ventana PVC 100×115 RPT bajo emisivo + persiana', unit: 'ud', price: 185.00, roundUp: true },
  { id: 'm_vent_120x115', cat: 'Ventanas, Puertas y Cocina', name: 'Ventana PVC 120×115 RPT bajo emisivo + persiana', unit: 'ud', price: 285.00, roundUp: true },
  { id: 'm_vent_120x135', cat: 'Ventanas, Puertas y Cocina', name: 'Ventana PVC 120×135 RPT bajo emisivo + persiana', unit: 'ud', price: 365.00, roundUp: true },
  { id: 'm_vent_basica', cat: 'Ventanas, Puertas y Cocina', name: 'Ventana PVC 120×115 básica SIN protección térmica', unit: 'ud', price: 155.00, roundUp: true },
  { id: 'm_balc_140x229', cat: 'Ventanas, Puertas y Cocina', name: 'Puerta balconera PVC 140×229 RPT bajo emisivo + persiana', unit: 'ud', price: 625.00, roundUp: true },
  { id: 'm_espuma_pu', cat: 'Ventanas, Puertas y Cocina', name: 'Bote espuma poliuretano + sellador ventanas', unit: 'ud', price: 9.50, roundUp: true },
  { id: 'm_puerta_acor', cat: 'Ventanas, Puertas y Cocina', name: 'Puerta de entrada acorazada/blindada completa', unit: 'ud', price: 790.00, roundUp: true },
  { id: 'm_puerta_lac', cat: 'Ventanas, Puertas y Cocina', name: 'Puerta interior block maciza lacada blanca + manilla', unit: 'ud', price: 195.00, roundUp: true },
  { id: 'm_puerta_eco', cat: 'Ventanas, Puertas y Cocina', name: 'Puerta interior block melamina blanca económica + manilla', unit: 'ud', price: 85.00, roundUp: true },
  { id: 'm_armario', cat: 'Ventanas, Puertas y Cocina', name: 'Kit frente e interior completo armario empotrado', unit: 'ud', price: 650.00, roundUp: true },
  { id: 'm_cocina_mueb', cat: 'Ventanas, Puertas y Cocina', name: 'Mobiliario cocina altos/bajos + fregadero (por ml)', unit: 'ml', price: 680.00, roundUp: false },
  { id: 'm_encimera', cat: 'Ventanas, Puertas y Cocina', name: 'Encimera cuarzo compacto o porcelánico (NO granito)', unit: 'ml', price: 320.00, roundUp: false },
  { id: 'm_electrod', cat: 'Ventanas, Puertas y Cocina', name: 'Lote electrodomésticos básicos (placa, horno, campana, frigo, lavavajillas)', unit: 'ud', price: 1950.00, roundUp: true }
];

const DEFAULT_TOOLS_CATALOG = [
  { id: 't_epi_botas', phase: 0, scope: 'person', name: 'Botas de seguridad, guantes anticorte y gafas de protección' },
  { id: 't_epi_masc', phase: 0, scope: 'person', name: 'Mascarillas polvo FFP2 y protección auditiva' },
  { id: 't_mano_cut', phase: 0, scope: 'person', name: 'Cúter profesional con cuchillas + flexómetro 5m + lápiz' },
  { id: 't_alargadera', phase: 0, scope: 'team', name: 'Enrollacables industrial 25m + foco LED portátil con trípode' },

  { id: 't_demo_mart', phase: 1, scope: 'team', name: 'Martillo demoledor / picador eléctrico + punteros y cinceles' },
  { id: 't_demo_rad', phase: 1, scope: 'team', name: 'Radial / Amoladora grande 230mm con disco diamante' },
  { id: 't_demo_carr', phase: 1, scope: 'team', name: 'Carretilla de obra + palas + escobón' },
  { id: 't_demo_cap', phase: 1, scope: 'person', name: 'Capazos / espuertas de goma + maceta y cortafríos' },

  { id: 't_inst_roza', phase: 2, scope: 'team', name: 'Rozadora eléctrica + aspirador industrial con filtro HEPA' },
  { id: 't_inst_wirs', phase: 2, scope: 'team', name: 'Máquina expandidora Wirsbo (Uponor PEX) + cabezales 16/20/25mm' },
  { id: 't_inst_tij', phase: 2, scope: 'team', name: 'Tijera cortatubos Wirsbo / PEX + cortatubos PVC y escariador' },
  { id: 't_inst_pol', phase: 2, scope: 'official', name: 'Polímetro (multímetro) + buscapolos + pelacables + guía pasacables' },
  { id: 't_inst_ten', phase: 2, scope: 'team', name: 'Tenaza crimpadora de terminales + nivel láser de líneas' },

  { id: 't_alb_bat', phase: 3, scope: 'team', name: 'Batidor mezclador eléctrico + varilla + gavetas de goma' },
  { id: 't_alb_reg', phase: 3, scope: 'team', name: 'Regla aluminio 2m + nivel burbuja + rodillo púas autonivelante' },
  { id: 't_alb_pyl', phase: 3, scope: 'official', name: 'Atornillador pladur con tope + tijera corta-chapa + serrucho pladur' },
  { id: 't_alb_pist', phase: 3, scope: 'team', name: 'Pistola espuma poliuretano + sargentos fijación ventanas' },

  { id: 't_ali_rubi', phase: 4, scope: 'team', name: 'Cortadora manual cerámica gran formato (Rubí) + ventosa' },
  { id: 't_ali_rad', phase: 4, scope: 'team', name: 'Amoladora 115/125mm con disco fino porcelánico + coronas diamante' },
  { id: 't_ali_llan', phase: 4, scope: 'official', name: 'Llana dentada (8/10mm) + maza goma blanca + tenaza alicatador' },
  { id: 't_ali_bor', phase: 4, scope: 'person', name: 'Llana goma borada + cubo con rodillos y esponjas' },

  { id: 't_pin_llan', phase: 5, scope: 'official', name: 'Llana de yesero + espátulas anchas (15/25cm) + mezclador' },
  { id: 't_pin_lij', phase: 5, scope: 'team', name: 'Lijadora de pared (jirafa) o tacos de lija manuales' },
  { id: 't_pin_rod', phase: 5, scope: 'person', name: 'Alargo telescópico + rodillo antigota + brochas recorte + cubeta' },

  { id: 't_rem_tal', phase: 6, scope: 'team', name: 'Taladro percutor/atornillador + brocas pared, metal y cerámica' },
  { id: 't_rem_llav', phase: 6, scope: 'official', name: 'Llaves fijas/vaso + llave inglesa + llave grifa + pistola silicona' },
  { id: 't_rem_aa', phase: 6, scope: 'team', name: 'Bomba de vacío + manómetro + abocardador (si instala A/A propio)' },

  { id: 't_car_ing', phase: 7, scope: 'team', name: 'Sierra ingletadora + sierra calar + cepillo eléctrico y formones' },
  { id: 't_car_sar', phase: 7, scope: 'team', name: 'Sargentos / gatos de apriete + escuadras de carpintero' },

  { id: 't_lim_kit', phase: 8, scope: 'person', name: 'Rascavidrios con cuchillas + bayetas microfibra + escoba/fregona' },
  { id: 't_lim_asp', phase: 8, scope: 'team', name: 'Aspirador polvo/agua para limpieza fina de entrega' }
];

function createDefaultFuengirolaProject() {
  return {
    id: 'proj_fuengirola_v4',
    title: 'Piso Fuengirola (Mano Obra + Mat. Separados)',
    code: 'PRES-2026-001',
    date: todayLocalStr(),
    startDate: todayLocalStr(new Date(Date.now() + 7 * 86400000)),
    ivaPct: 10,
    paymentFreq: 'semanal',
    client: {
      name: 'Cliente - Piso Fuengirola',
      nif: '',
      phone: '',
      email: '',
      projectAddress: 'Fuengirola (Málaga) — ~58 m² útiles + 4,4 m² terraza (altura 2,50 m)'
    },
    crew: {
      officials: 1, workers: 2, officialDailyWage: 90, officialMonthlySS: 580,
      workerDailyWage: 65, workerMonthlySS: 460, vehicles: 1, kmRoundTrip: 64,
      costPerKm: 0.30, mealPerPersonDay: 16.50, parallelSavingsDays: 2,
      ownMarginPct: 24, includeOverhead: true, distributeExpenses: true
    },
    images: [],
    extraMaterials: [],
    materialOverrides: {},
    invoices: [],
    checkedTools: {},
    chapters: [
      { id: 'c1', name: '1. Trabajos Previos y Demoliciones', isOptional: false },
      { id: 'c2', name: '2. Albañilería, Yeso, Pladur y Nivelación', isOptional: false },
      { id: 'c3', name: '3. Mano de Obra Alicatados y Suelos Porcelánicos', isOptional: false },
      { id: 'c4', name: '4. Mano de Obra Pintura Interior y Exterior', isOptional: false },
      { id: 'c5', name: '5. Mano de Obra Fontanería y Montaje de Baño', isOptional: false },
      { id: 'c6', name: '6. Mano de Obra Electricidad e Iluminación', isOptional: false },
      { id: 'c10', name: '7. Instalación Cocina, Encimera y Limpieza Final', isOptional: false },
      { id: 'c7', name: '8. EXTRA OPCIONAL — Instalación Climatización (A/A)', isOptional: true },
      { id: 'c8', name: '9. EXTRA OPCIONAL — Instalación Ventanas PVC y Puerta Entrada', isOptional: true },
      { id: 'c9', name: '10. EXTRA OPCIONAL — Montaje 6 Puertas y 3 Armarios', isOptional: true }
    ],
    items: [
      { id: 'i1', chapterId: 'c1', phase: 1, active: true, name: 'Retirada de muebles, electrodomésticos y sanitarios', desc: 'Mano de obra de desmontaje y retirada de enseres y sanitarios antiguos.', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 18, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_saco_esc', factor: 40 }] },
      { id: 'i2', chapterId: 'c1', phase: 1, active: true, name: 'Picado de azulejos y levantado de solado actual', desc: 'Picado mecánico de revestimientos en baño/cocina (~41,5 m²) y solado (~62,4 m²).', unit: 'm²', qty: 104, mode: 'own', hoursPerUnit: 0.50, subCost: 0, subMarginPct: 12, subDays: 2, subIncludesMat: false, measures: [{label:'Alicatado baño+cocina',a:41.5,b:1,res:41.5},{label:'Solado+terraza',a:62.5,b:1,res:62.5}], matRecipe: [{ matId: 'm_saco_esc', factor: 1.2 }] },
      { id: 'i3', chapterId: 'c1', phase: 1, active: true, name: 'Desmontaje de carpinterías viejas', desc: 'Retirada de puertas interiores, marcos, frentes de armario y ventanas viejas.', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 12, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [] },
      { id: 'i4', chapterId: 'c1', phase: 1, active: true, name: 'Contenedores y gestión de escombros a vertedero', desc: 'Servicio externo de contenedores y canon de vertedero autorizado (el permiso de vía pública se presupuesta aparte).', unit: 'PA', qty: 1, mode: 'sub', hoursPerUnit: 0, subCost: 980, subMarginPct: 12, subDays: 0, subIncludesMat: true, measures: [], matRecipe: [] },

      { id: 'i5', chapterId: 'c2', phase: 3, active: true, name: 'Regularización/maestreado previo en baño y cocina', desc: 'Mano de obra de raseo con mortero tras picado antes de alicatar.', unit: 'm²', qty: 41.5, mode: 'own', hoursPerUnit: 0.50, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_mortero', factor: 0.55 }, { matId: 'm_arena', factor: 0.35 }, { matId: 'm_cemento', factor: 0.12 }] },
      { id: 'i6', chapterId: 'c2', phase: 5, active: true, name: 'Alisado de paredes con yeso/emplaste', desc: 'Mano de obra de tendido de yeso, plaste y lijado fino (~120 m² netos a 2,50 m).', unit: 'm²', qty: 120, mode: 'own', hoursPerUnit: 0.65, subCost: 0, subMarginPct: 12, subDays: 3, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_yeso', factor: 0.45 }, { matId: 'm_plaste', factor: 0.12 }, { matId: 'm_lija', factor: 0.25 }] },
      { id: 'i7', chapterId: 'c2', phase: 3, active: true, name: 'Colocación falso techo pladur estándar (zonas secas)', desc: 'Montaje de estructura metálica, atornillado de placas y encintado Q2/Q3.', unit: 'm²', qty: 48.3, mode: 'own', hoursPerUnit: 0.80, subCost: 0, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_pladur_std', factor: 0.37 }, { matId: 'm_perfil_pyl', factor: 0.9 }, { matId: 'm_pasta_cinta', factor: 0.06 }, { matId: 'm_torn_pyl', factor: 0.04 }, { matId: 'm_lija', factor: 0.2 }] },
      { id: 'i8', chapterId: 'c2', phase: 3, active: true, name: 'Colocación falso techo pladur hidrófugo (baño/cocina)', desc: 'Montaje de techo con placa verde antihumedad H1.', unit: 'm²', qty: 9.7, mode: 'own', hoursPerUnit: 0.90, subCost: 0, subMarginPct: 15, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_pladur_h1', factor: 0.38 }, { matId: 'm_perfil_pyl', factor: 1.0 }, { matId: 'm_pasta_cinta', factor: 0.08 }] },
      { id: 'i9', chapterId: 'c2', phase: 3, active: true, name: 'Nivelación y recrecido de solera vivienda', desc: 'Mano de obra de nivelación previa al pavimento porcelánico.', unit: 'm²', qty: 58, mode: 'own', hoursPerUnit: 0.50, subCost: 0, subMarginPct: 12, subDays: 1.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_autoniv', factor: 0.25 }, { matId: 'm_mortero', factor: 0.3 }] },
      { id: 'i10', chapterId: 'c2', phase: 2, active: true, name: 'Ayudas de albañilería a gremios (rozas y tapado)', desc: 'Apertura de rozas y tapado con mortero/yeso para fontanería y electricidad.', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 36, subCost: 0, subMarginPct: 12, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_yeso', factor: 10 }, { matId: 'm_mortero', factor: 8 }, { matId: 'm_arena', factor: 6 }] },

      { id: 'i11', chapterId: 'c3', phase: 4, active: true, name: 'Mano de obra alicatado completo baño', desc: 'Colocación y rejuntado de azulejo en baño de suelo a techo.', unit: 'm²', qty: 18, mode: 'own', hoursPerUnit: 1.05, subCost: 0, subMarginPct: 12, subDays: 1.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_azulejo', factor: 1.10 }, { matId: 'm_cola_c2te', factor: 0.22 }, { matId: 'm_borada', factor: 0.15 }, { matId: 'm_crucetas', factor: 0.15 }] },
      { id: 'i12', chapterId: 'c3', phase: 4, active: true, name: 'Mano de obra alicatado completo cocina', desc: 'Colocación y rejuntado de azulejo en paredes de cocina.', unit: 'm²', qty: 23.5, mode: 'own', hoursPerUnit: 1.00, subCost: 0, subMarginPct: 12, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_azulejo', factor: 1.10 }, { matId: 'm_cola_c2te', factor: 0.22 }, { matId: 'm_borada', factor: 0.15 }, { matId: 'm_crucetas', factor: 0.15 }] },
      { id: 'i13', chapterId: 'c3', phase: 4, active: true, name: 'Mano de obra solado porcelánico salón, pasillo y dorm.', desc: 'Colocación y rejuntado de pavimento porcelánico rectificado.', unit: 'm²', qty: 48.3, mode: 'own', hoursPerUnit: 0.95, subCost: 0, subMarginPct: 12, subDays: 3, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_porcel_int', factor: 1.10 }, { matId: 'm_cola_c2te', factor: 0.25 }, { matId: 'm_borada', factor: 0.12 }, { matId: 'm_crucetas', factor: 0.15 }] },
      { id: 'i14', chapterId: 'c3', phase: 7, active: true, name: 'Colocación de rodapié porcelánico', desc: 'Corte y pegado de rodapié perimetral.', unit: 'ml', qty: 48, mode: 'own', hoursPerUnit: 0.30, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_rodapie', factor: 1.10 }, { matId: 'm_cola_c2te', factor: 0.06 }] },
      { id: 'i15', chapterId: 'c3', phase: 4, active: true, name: 'Mano de obra solado porcelánico baño y cocina', desc: 'Colocación de pavimento en zonas húmedas.', unit: 'm²', qty: 9.7, mode: 'own', hoursPerUnit: 1.05, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_porcel_int', factor: 1.10 }, { matId: 'm_cola_c2te', factor: 0.25 }] },
      { id: 'i16', chapterId: 'c3', phase: 4, active: true, name: 'Impermeabilización y solado exterior terraza', desc: 'Aplicación impermeabilizante y colocación gres antideslizante C3.', unit: 'm²', qty: 4.4, mode: 'own', hoursPerUnit: 1.40, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_imperm', factor: 1.1 }, { matId: 'm_porcel_ext', factor: 1.10 }, { matId: 'm_cola_c2te', factor: 0.3 }] },

      { id: 'i17', chapterId: 'c4', phase: 5, active: true, name: 'Mano de obra pintura paredes interiores', desc: 'Protección, imprimación selladora y 2 manos de pintura plástica lisa.', unit: 'm²', qty: 120, mode: 'own', hoursPerUnit: 0.28, subCost: 0, subMarginPct: 12, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_imprimacion', factor: 0.008 }, { matId: 'm_pintura_int', factor: 0.015 }, { matId: 'm_cinta_plast', factor: 0.025 }, { matId: 'm_lija', factor: 0.1 }] },
      { id: 'i18', chapterId: 'c4', phase: 5, active: true, name: 'Mano de obra pintura techos (antimoho baño/cocina)', desc: '2 manos de pintura blanca en techos.', unit: 'm²', qty: 58, mode: 'own', hoursPerUnit: 0.30, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_pintura_int', factor: 0.013 }, { matId: 'm_pintura_hum', factor: 0.015 }] },
      { id: 'i19', chapterId: 'c4', phase: 8, active: true, name: 'Mano de obra pintura exterior terraza', desc: 'Saneado previo y 2 manos de pintura exterior en paredes y techo de terraza.', unit: 'm²', qty: 18.9, mode: 'own', hoursPerUnit: 0.40, subCost: 0, subMarginPct: 12, subDays: 0.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_pintura_ext', factor: 0.055 }, { matId: 'm_lija', factor: 0.25 }] },

      { id: 'i20', chapterId: 'c5', phase: 2, active: true, name: 'Instalación red fontanería Wirsbo/PEX y desagües PVC', desc: 'Solo mano de obra de tendido completo de tuberías agua fría/caliente y desagües.', unit: 'PA', qty: 1, mode: 'sub', hoursPerUnit: 24, subCost: 1350, subMarginPct: 15, subDays: 2.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_tubo_pex', factor: 35 }, { matId: 'm_acces_pex', factor: 1 }, { matId: 'm_tubo_pvc', factor: 18 }, { matId: 'm_peg_pvc', factor: 2 }, { matId: 'm_silic_tef', factor: 2 }] },
      { id: 'i21', chapterId: 'c5', phase: 6, active: true, name: 'Montaje y conexión de termo eléctrico', desc: 'Fijación a pared, válvulas y puesta en marcha.', unit: 'ud', qty: 1, mode: 'own', hoursPerUnit: 4, subCost: 0, subMarginPct: 12, subDays: 0.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_termo', factor: 1 }] },
      { id: 'i22', chapterId: 'c5', phase: 6, active: true, name: 'Colocación plato de ducha y montaje de mampara', desc: 'Nivelación plato, sellado antimoho y montaje mampara cristal.', unit: 'ud', qty: 1, mode: 'own', hoursPerUnit: 8, subCost: 0, subMarginPct: 12, subDays: 0.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_ducha', factor: 1 }, { matId: 'm_mampara', factor: 1 }, { matId: 'm_imperm', factor: 3 }, { matId: 'm_silic_tef', factor: 1 }] },
      { id: 'i23', chapterId: 'c5', phase: 6, active: true, name: 'Montaje sanitarios, mueble lavabo y griferías baño', desc: 'Instalación inodoro, bidet*, mueble lavabo + espejo y grifos (*sujeto a espacio).', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 10, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_inodoro', factor: 1 }, { matId: 'm_bidet', factor: 1 }, { matId: 'm_mueble_bano', factor: 1 }, { matId: 'm_grif_bano', factor: 1 }] },
      { id: 'i24', chapterId: 'c5', phase: 6, active: true, name: 'Conexión tomas lavadora, lavavajillas y fregadero', desc: 'Montaje de desagües y grifería en cocina.', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 4, subCost: 0, subMarginPct: 12, subDays: 0.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_grif_coc', factor: 1 }] },

      { id: 'i25', chapterId: 'c6', phase: 2, active: true, name: 'Instalación cuadro eléctrico nuevo y cableado general', desc: 'Solo mano de obra de montaje de cuadro REBT y tirada completa de líneas.', unit: 'PA', qty: 1, mode: 'sub', hoursPerUnit: 24, subCost: 1300, subMarginPct: 15, subDays: 2.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_cuadro_elec', factor: 1 }, { matId: 'm_corrugado', factor: 2 }, { matId: 'm_cable', factor: 4 }, { matId: 'm_cajas_elec', factor: 2 }] },
      { id: 'i26', chapterId: 'c6', phase: 6, active: true, name: 'Montaje de mecanismos (enchufes, TV, red)', desc: 'Colocación y conexionado de mecanismos en toda la vivienda.', unit: 'ud', qty: 48, mode: 'sub', hoursPerUnit: 0.7, subCost: 34, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_mecanismo', factor: 1 }] },
      { id: 'i27', chapterId: 'c6', phase: 6, active: true, name: 'Instalación de focos LED empotrados y lámparas', desc: 'Apertura en pladur y conexión de luminarias LED.', unit: 'ud', qty: 28, mode: 'sub', hoursPerUnit: 0.4, subCost: 15, subMarginPct: 15, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_foco_led', factor: 1 }] },

      { id: 'i37', chapterId: 'c10', phase: 7, active: true, name: 'Montaje de mobiliario de cocina + fregadero', desc: 'Solo mano de obra de montaje y nivelación de muebles altos/bajos.', unit: 'ml', qty: 3.27, mode: 'sub', hoursPerUnit: 16, subCost: 260, subMarginPct: 14, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_cocina_mueb', factor: 1 }] },
      { id: 'i38', chapterId: 'c10', phase: 7, active: true, name: 'Colocación encimera cuarzo/porcelánico (NO granito)', desc: 'Medición e instalación de encimera con huecos placa/fregadero.', unit: 'ml', qty: 3.27, mode: 'sub', hoursPerUnit: 0, subCost: 95, subMarginPct: 15, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_encimera', factor: 1 }] },
      { id: 'i40', chapterId: 'c10', phase: 7, active: true, name: 'Instalación lote electrodomésticos de cocina', desc: 'Colocación y conexión de placa, horno, campana, frigorífico y lavavajillas.', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 8, subCost: 0, subMarginPct: 12, subDays: 0.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_electrod', factor: 1 }] },
      { id: 'i39', chapterId: 'c10', phase: 8, active: true, name: 'Limpieza general profunda de fin de obra', desc: 'Limpieza integral de cristales, suelos, baño y cocina para entrega.', unit: 'PA', qty: 1, mode: 'own', hoursPerUnit: 16, subCost: 0, subMarginPct: 12, subDays: 1, subIncludesMat: false, measures: [], matRecipe: [] },

      { id: 'i28', chapterId: 'c7', phase: 2, active: true, name: 'Mano de obra preinstalación A/A (por estancia)', desc: 'Tendido de líneas frigoríficas y desagües empotrados.', unit: 'ud', qty: 4, mode: 'sub', hoursPerUnit: 4, subCost: 190, subMarginPct: 15, subDays: 1.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_kit_frigo', factor: 1 }] },
      { id: 'i29', chapterId: 'c7', phase: 6, active: true, name: 'Instalación y puesta en marcha de split A/A', desc: 'Solo mano de obra de montaje, vacío y carga/prueba.', unit: 'ud', qty: 4, mode: 'sub', hoursPerUnit: 3, subCost: 220, subMarginPct: 12, subDays: 1.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_split_aa', factor: 1 }] },

      { id: 'i31', chapterId: 'c8', phase: 3, active: true, name: 'Colocación ventana PVC 120×115 con persiana', desc: 'Solo mano de obra de montaje, nivelación y sellado.', unit: 'ud', qty: 3, mode: 'sub', hoursPerUnit: 0, subCost: 165, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_vent_120x115', factor: 1 }, { matId: 'm_espuma_pu', factor: 1 }] },
      { id: 'i31b', chapterId: 'c8', phase: 3, active: true, name: 'Colocación ventana PVC 100×115 con persiana', desc: 'Solo mano de obra de montaje, nivelación y sellado.', unit: 'ud', qty: 1, mode: 'sub', hoursPerUnit: 0, subCost: 165, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_vent_100x115', factor: 1 }, { matId: 'm_espuma_pu', factor: 1 }] },
      { id: 'i31c', chapterId: 'c8', phase: 3, active: true, name: 'Colocación ventana PVC 120×135 con persiana', desc: 'Solo mano de obra de montaje, nivelación y sellado.', unit: 'ud', qty: 1, mode: 'sub', hoursPerUnit: 0, subCost: 165, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_vent_120x135', factor: 1 }, { matId: 'm_espuma_pu', factor: 1 }] },
      { id: 'i32', chapterId: 'c8', phase: 3, active: true, name: 'Colocación ventana PVC baño', desc: 'Instalación de ventana oscilobatiente en baño.', unit: 'ud', qty: 1, mode: 'sub', hoursPerUnit: 0, subCost: 95, subMarginPct: 15, subDays: 0, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_vent_60x50', factor: 1 }] },
      { id: 'i33', chapterId: 'c8', phase: 3, active: true, name: 'Colocación puerta balconera salida a terraza', desc: 'Montaje de carpintería balconera con persiana y sellado.', unit: 'ud', qty: 1, mode: 'sub', hoursPerUnit: 0, subCost: 210, subMarginPct: 15, subDays: 0, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_balc_140x229', factor: 1 }, { matId: 'm_espuma_pu', factor: 1 }] },
      { id: 'i34', chapterId: 'c8', phase: 8, active: true, name: 'Colocación puerta de entrada acorazada', desc: 'Instalación y remates de puerta principal acorazada.', unit: 'ud', qty: 1, mode: 'sub', hoursPerUnit: 0, subCost: 290, subMarginPct: 15, subDays: 0.5, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_puerta_acor', factor: 1 }] },

      { id: 'i35', chapterId: 'c9', phase: 7, active: true, name: 'Colocación de puerta de paso interior', desc: 'Solo mano de obra de montaje de premarcos, hojas, tapajuntas y manillas.', unit: 'ud', qty: 6, mode: 'sub', hoursPerUnit: 4, subCost: 115, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_puerta_lac', factor: 1 }] },
      { id: 'i36', chapterId: 'c9', phase: 7, active: true, name: 'Montaje y vestido de armario empotrado', desc: 'Solo mano de obra de montaje de frentes e interiores en los 3 dormitorios.', unit: 'ud', qty: 3, mode: 'sub', hoursPerUnit: 8, subCost: 350, subMarginPct: 15, subDays: 2, subIncludesMat: false, measures: [], matRecipe: [{ matId: 'm_armario', factor: 1 }] }
    ]
  };
}

function getDefaultState() {
  return {
    version: 4,
    company: {
      name: 'Reformas Integrales Costa del Sol',
      cif: 'B-00000000',
      phone: '600 000 000',
      email: 'presupuestos@tuempresa.es',
      address: 'Málaga Capital',
      iban: 'ES00 0000 0000 00 0000000000',
      logoBase64: '',
      workDaysPerMonth: 21,
      hoursPerDay: 8,
      monthlyGestoria: 150,
      monthlyInsurance: 90,
      monthlyOtherOverhead: 180,
      invNormalPrefix: 'F-2026-',
      invNormalNext: 1,
      invRectPrefix: 'R-2026-',
      invRectNext: 1,
      conditions: '• Validez del presente presupuesto de Mano de Obra: 30 días naturales.\n• LOS MATERIALES SON AJENOS A LA MANO DE OBRA: los elige y abona el cliente aparte, disponiendo la empresa de adelantos previos (provisión de fondos) antes de encargar o retirar cada pedido de los proveedores.\n• Propuesta sujeta a visita técnica de comprobación.\n• No incluye tasas municipales ni licencia de obra (ICIO), que correrán a cargo de la propiedad.\n• Garantía de ejecución de trabajos: 2 años conforme a normativa vigente.'
    },
    materialsCatalog: JSON.parse(JSON.stringify(DEFAULT_MATERIALS_CATALOG)),
    toolsCatalog: JSON.parse(JSON.stringify(DEFAULT_TOOLS_CATALOG)),
    currentProjectId: 'proj_fuengirola_v4',
    projects: [createDefaultFuengirolaProject()]
  };
}