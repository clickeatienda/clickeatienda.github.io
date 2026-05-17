/* ============================================
   COPYWRITING ENGINE — Clickea Tienda
   
   Generates high-converting sales copy for product
   landing pages. Uses product-specific data when
   available, falls back to category templates.
   ============================================ */

const PRODUCT_PAINS = [
  {
    keywords: ['humidificador', 'difusor', 'aroma', 'vapor'],
    hook: '¿Te despiertas cada mañana con la garganta seca, congestión o malestar respiratorio?',
    pain: 'El aire seco de tu habitación está afectando tu salud y la de tu familia. Causa irritación en las vías respiratorias, piel reseca y evita que descanses profundamente, dejándote agotado al día siguiente.',
    solution: 'El {name} mantiene el nivel de humedad ideal para que respires aire puro y fresco, protegiendo tu garganta y piel mientras disfrutas de un sueño reparador y profundo.',
  },
  {
    keywords: ['masajeador', 'masaje', 'cuello', 'espalda', 'terapia'],
    hook: '¿Vives con esa tensión constante en el cuello y la espalda que no te deja disfrutar tu día?',
    pain: 'El estrés y las largas horas de trabajo acumulan nudos de dolor que afectan tu postura y tu humor. Gastar en citas de spa es costoso y requiere tiempo que no tienes.',
    solution: 'El {name} lleva el alivio profesional a tu casa. Diseñado para disolver la tensión muscular en minutos, permitiéndote recuperar la movilidad y sentirte renovado sin gastar una fortuna.',
  },
  {
    keywords: ['smartwatch', 'reloj', 'inteligente', 't900', 'ultra'],
    hook: '¿Sientes que dependes demasiado de tu celular o te pierdes notificaciones importantes por estar ocupado?',
    pain: 'Sacar el celular en la calle es un riesgo y en el trabajo es una distracción. Además, no tener un control real de tu salud diaria te impide alcanzar tus metas físicas.',
    solution: 'El {name} te permite mantener el control total desde tu muñeca. Gestiona llamadas, mensajes y monitorea tu salud en tiempo real con elegancia y seguridad, sin necesidad de sacar tu teléfono.',
  },
  {
    keywords: ['aspiradora', 'aseo', 'limpieza', 'trapeador'],
    hook: '¿Sientes que pasas todo tu tiempo libre limpiando en lugar de disfrutar con tu familia?',
    pain: 'El polvo y la suciedad se acumulan más rápido de lo que puedes limpiar. Es una tarea agotadora que nunca termina y que te quita las horas más valiosas de tu día.',
    solution: 'El {name} simplifica tu vida con tecnología de limpieza eficiente. Recupera tus fines de semana y mantén tu hogar impecable con el mínimo esfuerzo.',
  },
  {
    keywords: ['cámara', 'seguridad', 'wifi', 'vigilancia'],
    hook: '¿Te preocupa dejar tu casa o tu negocio solo y no saber qué está pasando?',
    pain: 'La inseguridad es una realidad y la incertidumbre de no saber si tus seres queridos o tus bienes están seguros genera una ansiedad constante que no te deja tranquilo.',
    solution: 'El {name} te da ojos en tu hogar las 24 horas desde cualquier lugar del mundo. Protege lo que más quieres y recupera la tranquilidad de saber que todo está bajo control.',
  },
  {
    keywords: ['zapatos', 'tenis', 'calzado', 'ortopédico', 'sandalia'],
    hook: '¿Tus pies terminan destrozados y adoloridos después de un día normal de actividades?',
    pain: 'Usar calzado que no brinda el soporte adecuado causa dolores crónicos en pies, rodillas y espalda. No deberías tener que elegir entre lucir bien y caminar sin dolor.',
    solution: 'El {name} te permite caminar sobre las nubes con un diseño que prioriza tu ergonomía. Estilo y salud se unen para que puedas estar de pie todo el día sin una sola molestia.',
  },
  {
    keywords: ['cepillo', 'secador', 'pelo', 'cabello', 'keratina', 'plancha'],
    hook: '¿Pasas horas tratando de arreglar tu cabello solo para terminar con frizz y daño por calor?',
    pain: 'Ir a la peluquería es costoso y consume tiempo que no tienes. Además, usar secadores convencionales y planchas quema tu fibra capilar, dejándola opaca, quebradiza y sin vida cada mañana.',
    solution: 'El {name} combina potencia y cuidado en un solo paso. Seca, alisa y da volumen mientras protege tu cabello, dándote un acabado de salón en solo 10 minutos sin salir de casa.',
  }
];

const EMOTIONAL_BENEFITS = {
  general: [
    '✨ **Paz Mental Garantizada:** Deja de preocuparte por la calidad. Disfruta de un producto diseñado para durar y cumplir lo que promete.',
    '🕒 **Recupera tu Tiempo:** Automatiza y simplifica tus tareas diarias para que puedas enfocarte en lo que realmente importa.',
    '💪 **Confianza en cada Uso:** Siéntete seguro sabiendo que tienes lo mejor del mercado respaldando tus actividades diarias.'
  ],
  humidificador: [
    '🌙 **Noches de Descanso Real:** Olvídate de despertarte con sed o malestar. Respira profundo y despierta con energía renovada.',
    '🛡️ **Protección para tu Familia:** Crea un ambiente saludable que previene irritaciones y protege las vías respiratorias de los que más quieres.',
    '🧘 **Ambiente de Spa en Casa:** Convierte cualquier habitación en un refugio de paz y relajación inmediata.'
  ],
  masajeador: [
    '💆 **Adiós al Estrés Acumulado:** Libera la tensión de todo el día en solo 15 minutos, sin necesidad de salir de casa.',
    '⚡ **Vitalidad Instantánea:** Recupera la movilidad y la energía para seguir con tus proyectos sin el lastre del dolor muscular.',
    '💰 **Ahorro Inteligente:** Evita gastos recurrentes en terapias costosas con una solución profesional de un solo pago.'
  ],
  belleza: [
    '💖 **Acabado de Salón en Casa:** Siéntete segura y radiante todos los días con un look profesional hecho por ti misma en minutos.',
    '🕒 **Gana Tiempo Cada Mañana:** Simplifica tu rutina de belleza para que puedas disfrutar de tu café o dormir un poco más.',
    '🌿 **Cuidado y Salud Capilar:** Protege tu cabello mientras lo estilizas, manteniendo su brillo natural y fuerza original.'
  ]
};

const GENERAL_FAQS = [
  {
    question: '¿Es seguro comprar en esta página?',
    answer: '¡Absolutamente! Contamos con pago contra entrega. Es decir, tú pagas en efectivo SOLAMENTE cuando tienes el producto en tus manos. Cero riesgos.',
  },
  {
    question: '¿Cuánto tarda en llegar mi pedido?',
    answer: 'Nuestros envíos tardan entre 2 y 5 días hábiles a cualquier parte de Colombia. Trabajamos con transportadoras confiables como Servientrega, Envía e Inter Rapidísimo.',
  },
  {
    question: '¿El producto tiene garantía?',
    answer: 'Sí, todos nuestros productos cuentan con garantía directa por defectos de fábrica. Queremos que estés 100% satisfecho con tu compra.',
  },
];

/**
 * Helper to handle "Yes/No" values in benefit templates
 */
function sanitizeVal(val, fallback) {
  if (!val) return fallback;
  const v = val.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isPos = /^(si|yes|1|verdadero|true)$/i.test(v);
  if (isPos) return fallback;
  if (/^(no|false|0)$/i.test(v)) return null;
  return val;
}

/**
 * Generate a dynamic, product-specific Hook and Pain Point
 */
export function getSalesCopy(productName, features = [], category = 'general') {
  const nameLower = productName.toLowerCase();
  
  // 1. Try to find a specific pain by keyword
  const specificPain = PRODUCT_PAINS.find(p => 
    p.keywords.some(k => nameLower.includes(k))
  );

  if (specificPain) {
    return {
      hook: specificPain.hook,
      pain: specificPain.pain,
      solution: specificPain.solution.replace(/{name}/g, productName),
      featureHighlight: features.length > 0 ? `Todo esto es posible gracias a su sistema de ${features[0].split(':')[0].toLowerCase()}, diseñado para darte resultados reales.` : 'Diseñado bajo los más altos estándares para garantizar tu satisfacción.'
    };
  }

  // 2. Fallback to smarter specific generation
  const mainFeature = features.find(f => !/marca|modelo|ean|sku|condición/i.test(f)) || 'calidad superior';
  const [fName, fVal] = mainFeature.split(':').map(s => s.trim());
  
  return {
    hook: `¿Sigues lidiando con ${fName.toLowerCase()} que no te dan los resultados que esperas?`,
    pain: `Es frustrante cuando compras un producto y te das cuenta que su ${fName.toLowerCase()} es deficiente o simplemente no cumple su función. No solo pierdes dinero, sino que el problema inicial de no tener un ${productName.toLowerCase()} confiable sigue ahí, afectando tu rutina diaria y tu tranquilidad.`,
    solution: `El ${productName} llega para resolver esto definitivamente. Con su enfoque en ${fVal || fName.toLowerCase()}, te brinda la seguridad y eficiencia que otros productos omiten, permitiéndote disfrutar de un rendimiento profesional sin complicaciones directamente en tu casa.`,
    featureHighlight: `La clave está en su ${fName.toLowerCase()}, diseñada meticulosamente para ofrecerte la durabilidad y efectividad que realmente necesitas en Colombia.`
  };
}

/**
 * Generate long, creative benefits based on product features
 */
export function getCreativeBenefits(productName, features = []) {
  const nameLower = productName.toLowerCase();
  
  // 1. Scan and parse features into keys and values
  const validFeatures = (features || []).filter(f => {
    const l = f.toLowerCase();
    return !l.includes('marca') && !l.includes('modelo') && !l.includes('ean') && !l.includes('sku') && !l.includes('condición') && !l.includes('unidades');
  });

  const parsedFeatures = {};
  for (const f of validFeatures) {
    const parts = f.split(':');
    if (parts.length >= 2) {
      const k = parts[0].trim().toLowerCase();
      const v = parts.slice(1).join(':').trim();
      parsedFeatures[k] = v;
    }
  }

  // 2. Identify the core specification/feature categories present
  const hasFeature = (keyword) => {
    return Object.keys(parsedFeatures).some(k => {
      if (keyword.length <= 2) {
        const words = k.split(/[\s_/:-]+/);
        return words.includes(keyword);
      }
      return k.includes(keyword);
    });
  };
  const getFeatureVal = (keyword, fallback) => {
    const key = Object.keys(parsedFeatures).find(k => {
      if (keyword.length <= 2) {
        const words = k.split(/[\s_/:-]+/);
        return words.includes(keyword);
      }
      return k.includes(keyword);
    });
    return key ? parsedFeatures[key] : fallback;
  };

  // 3. Define the AIDA sequence
  const benefits = [];

  // --- STEP 1: A - ATENCIÓN / DOLOR ---
  let step1Title = "🔴 Adiós a la Limpieza Frustrante";
  let step1Desc = "Limpiar rincones difíciles, rieles o el auto ya no será una tarea agotadora.";
  
  if (nameLower.includes('humidificador') || hasFeature('vapor') || hasFeature('capacidad')) {
    step1Title = "🔴 Despídete del Aire Seco";
    step1Desc = "Evita levantarte con la garganta reseca o congestión a mitad de la noche.";
  } else if (nameLower.includes('masajeador') || hasFeature('masaje') || hasFeature('dolor') || hasFeature('velocidad')) {
    step1Title = "🔴 Dile Adiós al Dolor Muscular";
    step1Desc = "Libérate de la tensión acumulada y el estrés corporal del día de forma inmediata.";
  } else if (/(pelo|cabello|cepillo|secador|belleza|facial)/i.test(nameLower)) {
    step1Title = "🔴 Adiós al Cabello Dañado";
    step1Desc = "Olvídate de gastar una fortuna en salones para lucir un look impecable.";
  } else if (nameLower.includes('reloj') || nameLower.includes('smartwatch') || hasFeature('pantalla')) {
    step1Title = "🔴 Control Total en tu Muñeca";
    step1Desc = "No vuelvas a perder llamadas ni notificaciones importantes en tu día a día.";
  }
  benefits.push(`✅ **${step1Title}:** ${step1Desc}`);

  // --- STEP 2: I - INTERÉS / SOLUCIÓN TÉCNICA ---
  let step2Title = "⚡ Potencia y Succión Eficiente";
  let step2Desc = "Su motor de alto rendimiento arranca el polvo más difícil en segundos.";

  if (hasFeature('succión') || hasFeature('succion') || hasFeature('pa')) {
    const succ = getFeatureVal('succión', getFeatureVal('succion', getFeatureVal('pa', 'alta')));
    step2Title = `⚡ Succión de ${succ}`;
    step2Desc = `Arranca el polvo invisible y pelos de mascotas incrustados en una sola pasada.`;
  } else if (hasFeature('batería') || hasFeature('bateria') || hasFeature('mah')) {
    const bat = getFeatureVal('batería', getFeatureVal('bateria', getFeatureVal('mah', 'larga duración')));
    step2Title = `🔋 Batería de ${bat}`;
    step2Desc = `Disfruta de una autonomía constante para completar tus rutinas sin interrupciones.`;
  } else if (hasFeature('potencia') || hasFeature('w') || hasFeature('watts')) {
    const pot = getFeatureVal('potencia', getFeatureVal('w', getFeatureVal('watts', 'alto rendimiento')));
    step2Title = `⚡ Potencia Pro de ${pot}`;
    step2Desc = `Obtén resultados impecables en la mitad del tiempo gracias a su motor reforzado.`;
  } else if (hasFeature('capacidad') || hasFeature('litros') || hasFeature('ml')) {
    const cap = getFeatureVal('capacidad', getFeatureVal('litros', getFeatureVal('ml', 'gran tamaño')));
    step2Title = `📦 Capacidad de ${cap}`;
    step2Desc = `Su amplio depósito te permite completar tus tareas sin necesidad de vaciados constantes.`;
  } else if (hasFeature('material') || hasFeature('resistencia')) {
    const mat = getFeatureVal('material', getFeatureVal('resistencia', 'alta durabilidad'));
    step2Title = `💎 Material de ${mat}`;
    step2Desc = `Estructura ultra-resistente diseñada para soportar el uso diario más exigente.`;
  }
  benefits.push(`✅ **${step2Title}:** ${step2Desc}`);

  // --- STEP 3: D - DESEO / TRANSFORMACIÓN ---
  let step3Title = "✨ Hogar y Auto Impecables";
  let step3Desc = "Disfruta de espacios 100% higiénicos y recupera tu valioso tiempo libre.";

  if (nameLower.includes('humidificador') || nameLower.includes('difusor')) {
    step3Title = "✨ Descanso Profundo y Reparador";
    step3Desc = "Crea un oasis de bienestar en tu habitación para dormir mejor toda la noche.";
  } else if (nameLower.includes('masajeador') || nameLower.includes('terapia')) {
    step3Title = "✨ Bienestar y Alivio Inmediato";
    step3Desc = "Disfruta de una sesión de spa profesional en casa y renueva tus energías.";
  } else if (/(pelo|cabello|cepillo|secador|belleza|facial)/i.test(nameLower)) {
    step3Title = "✨ Cabello Radiante y Saludable";
    step3Desc = "Luce un peinado perfecto, sedoso y lleno de brillo con mínimo esfuerzo.";
  } else if (nameLower.includes('reloj') || nameLower.includes('smartwatch') || nameLower.includes('audifonos')) {
    step3Title = "✨ Estilo de Vida Inteligente";
    step3Desc = "Lleva un registro preciso de tu salud y mantente conectado con elegancia.";
  }
  benefits.push(`✅ **${step3Title}:** ${step3Desc}`);

  // --- STEP 4: A - ACCIÓN / CONFIANZA ---
  const step4Title = "🛡️ Compra 100% Cero Riesgo";
  const step4Desc = "Ordena hoy con envío gratis a toda Colombia y paga en efectivo al recibir en tu puerta.";
  benefits.push(`✅ **${step4Title}:** ${step4Desc}`);

  return benefits; // Max 5 benefits
}

export function getProductFaqs(name, features = [], category = 'general') {
  const nameLower = name.toLowerCase();
  const faqs = [];

  // ─── CATEGORY-SPECIFIC Q&A BANKS ───────────────────────────────────────────
  const CATEGORY_FAQS = {
    aspiradora: [
      {
        question: `¿El ${name} sirve para limpiar tanto el hogar como el auto?`,
        answer: `¡Sí! El ${name} está diseñado para uso versátil. Su boquilla compacta llega a los rincones más difíciles del auto, los rieles de las ventanas, los sofás y cualquier superficie de tu hogar con igual eficiencia.`
      },
      {
        question: `¿Es fácil vaciar y limpiar el depósito del ${name}?`,
        answer: `Totalmente. El depósito de polvo se desmonta en segundos con un solo clic, sin necesidad de herramientas. El filtro es lavable, por lo que solo debes enjuagarlo con agua y dejarlo secar para mantenerlo a punto.`
      },
      {
        question: `¿Cuánta autonomía tiene la batería del ${name}?`,
        answer: `La batería del ${name} está optimizada para cubrir tus sesiones de limpieza habituales. Se recarga rápidamente vía USB, por lo que siempre lo tendrás listo para la siguiente limpieza.`
      },
      {
        question: `¿Qué diferencia al ${name} de otros modelos del mercado?`,
        answer: `Su combinación de potencia de succión, portabilidad y accesorios incluidos lo hacen un equipo 3 en 1 sin rival en su rango de precio. No pagas por tecnología que no necesitas, sino por la que sí te soluciona el día a día.`
      },
      {
        question: `¿Hace mucho ruido el ${name} en funcionamiento?`,
        answer: `Su motor está diseñado para ser eficiente y silencioso comparado con las aspiradoras convencionales, lo que te permite usarlo sin molestar a las personas que descansan en el hogar.`
      }
    ],
    smartwatch: [
      {
        question: `¿El ${name} es compatible con mi celular Android o iPhone?`,
        answer: `Sí, el ${name} es compatible tanto con Android (5.0 en adelante) como con iOS (9.0 en adelante). La conexión se realiza vía Bluetooth de forma rápida y sencilla a través de su app dedicada.`
      },
      {
        question: `¿Qué funciones de salud monitorea el ${name}?`,
        answer: `El ${name} monitorea en tiempo real tu frecuencia cardíaca, nivel de oxígeno en sangre (SpO2), calidad del sueño y contador de pasos, dándote un panorama completo de tu bienestar cada día.`
      },
      {
        question: `¿El ${name} aguanta el agua y la lluvia?`,
        answer: `El ${name} cuenta con resistencia al agua para salpicaduras y sudor del día a día. Puedes usarlo sin preocupación en el gimnasio o bajo la lluvia, aunque no está diseñado para natación.`
      },
      {
        question: `¿Cuánto dura la batería del ${name} sin cargarlo?`,
        answer: `Con un uso normal de notificaciones y monitoreo de salud activo, el ${name} tiene una autonomía de varios días antes de necesitar recarga, superando a muchas marcas reconocidas.`
      },
      {
        question: `¿Puedo recibir notificaciones de WhatsApp y llamadas en el ${name}?`,
        answer: `¡Claro que sí! El ${name} muestra en pantalla las notificaciones de llamadas, mensajes y aplicaciones como WhatsApp, Instagram y más, para que no pierdas nada importante sin sacar el celular.`
      }
    ],
    masajeador: [
      {
        question: `¿El ${name} es seguro para personas con lesiones musculares?`,
        answer: `El ${name} está diseñado para uso personal de recuperación y relajación. Sin embargo, si tienes una lesión diagnosticada, te recomendamos consultar con tu médico antes de usarlo, como con cualquier dispositivo de terapia.`
      },
      {
        question: `¿En qué zonas del cuerpo puedo usar el ${name}?`,
        answer: `Puedes usarlo en cuello, hombros, espalda, pantorrillas, pies y brazos. Sus cabezales intercambiables están pensados para adaptarse a cada zona muscular con la presión ideal.`
      },
      {
        question: `¿Cuántos niveles de intensidad tiene el ${name}?`,
        answer: `El ${name} cuenta con múltiples velocidades de masaje para que puedas comenzar suave y aumentar la intensidad según tus necesidades. Desde una relajación profunda hasta una recuperación post-ejercicio intensa.`
      },
      {
        question: `¿Es silencioso el ${name} para usar en casa u oficina?`,
        answer: `Sí, su motor de baja vibración está optimizado para operar a niveles de ruido muy bajos, lo que te permite disfrutar de tu sesión de alivio sin interrumpir a nadie a tu alrededor.`
      },
      {
        question: `¿Qué tan rápido se siente el alivio al usar el ${name}?`,
        answer: `La mayoría de usuarios reportan una reducción notable en la tensión muscular a partir de los primeros 5-10 minutos de uso continuo. Para mejores resultados, se recomienda una sesión diaria de 15 minutos.`
      }
    ],
    humidificador: [
      {
        question: `¿Para qué tamaño de habitación es ideal el ${name}?`,
        answer: `El ${name} está optimizado para habitaciones de entre 15 y 30 metros cuadrados, siendo perfecto para dormitorios, salas pequeñas y oficinas, manteniendo el nivel de humedad ideal de forma constante.`
      },
      {
        question: `¿Qué tipo de agua debo usar en el ${name}?`,
        answer: `Te recomendamos usar agua fría desmineralizada o filtrada para prolongar la vida útil del dispositivo y evitar la acumulación de cal. Esto también asegura que el vapor emitido sea puro y limpio.`
      },
      {
        question: `¿El ${name} funciona de forma silenciosa durante la noche?`,
        answer: `¡Sí! El ${name} opera con un nivel de ruido ultra bajo, lo que lo hace ideal para usarlo mientras duermes. No interrumpe el descanso y trabaja silenciosamente toda la noche.`
      },
      {
        question: `¿Cuántas horas de funcionamiento continuo tiene el ${name}?`,
        answer: `Dependiendo de la configuración de niebla seleccionada, el ${name} puede funcionar de forma continua durante varias horas antes de necesitar recarga de agua, cubriendo toda una noche de sueño.`
      },
      {
        question: `¿El ${name} tiene luz nocturna o función de aromaterapia?`,
        answer: `El ${name} combina la humidificación con una suave luz ambiental y es compatible con aceites esenciales, transformando cualquier habitación en un verdadero spa de bienestar y relajación.`
      }
    ],
    belleza: [
      {
        question: `¿El ${name} daña el cabello o la piel con el uso frecuente?`,
        answer: `No. El ${name} incorpora tecnología de protección térmica que distribuye el calor de manera uniforme, evitando el sobrecalentamiento y los daños a la fibra capilar. Es seguro para uso diario.`
      },
      {
        question: `¿Cuánto tiempo tarda en calentar el ${name}?`,
        answer: `El ${name} alcanza su temperatura óptima de trabajo en menos de 60 segundos desde que lo enchufas, ahorrándote un tiempo valioso en tu rutina de belleza matutina.`
      },
      {
        question: `¿El ${name} sirve para todo tipo de cabello?`,
        answer: `Sí. El ${name} está diseñado para funcionar en cabello lacio, ondulado, rizado y afro, con configuraciones de temperatura ajustables para cada tipo de textura capilar.`
      },
      {
        question: `¿Qué resultados puedo esperar al usar el ${name} regularmente?`,
        answer: `Con el uso regular del ${name}, notarás un cabello más suave, brillante y con menos frizz. Lograrás acabados de salón profesional en casa en cuestión de minutos, sin gastar dinero en peluquería.`
      },
      {
        question: `¿El ${name} incluye garantía y qué cubre?`,
        answer: `Sí, el ${name} incluye garantía por defectos de fábrica. Si presentas algún inconveniente desde el primer uso, te lo reemplazamos sin costo adicional. Tu satisfacción está completamente garantizada.`
      }
    ]
  };

  // ─── FEATURE-BASED DYNAMIC QUESTIONS ────────────────────────────────────────
  const validFeatures = features.filter(f => !/marca|modelo|ean|sku|condición|unidades/i.test(f)).slice(0, 2);
  const featureFaqs = validFeatures.map(f => {
    const [k, v] = f.split(':').map(s => s.trim());
    return {
      question: `¿Cuál es el ${k.toLowerCase()} del ${name} y qué beneficio me da?`,
      answer: `El ${name} cuenta con un ${k.toLowerCase()} de ${v || 'alto rendimiento'}. Esto se traduce en un desempeño superior y más confiable en tu día a día, garantizando que la inversión valga cada peso.`
    };
  });

  // ─── SELECT CATEGORY BANK ────────────────────────────────────────────────────
  let bankKey = 'general';
  if (nameLower.includes('aspiradora') || nameLower.includes('limpieza') || nameLower.includes('polvo')) bankKey = 'aspiradora';
  else if (nameLower.includes('smartwatch') || nameLower.includes('reloj') || nameLower.includes('t900')) bankKey = 'smartwatch';
  else if (nameLower.includes('masajeador') || nameLower.includes('masaje')) bankKey = 'masajeador';
  else if (nameLower.includes('humidificador') || nameLower.includes('difusor') || nameLower.includes('vapor')) bankKey = 'humidificador';
  else if (/(pelo|cabello|cepillo|secador|plancha|belleza|facial)/i.test(nameLower)) bankKey = 'belleza';
  else if (category) {
    const catL = category.toLowerCase();
    if (catL.includes('limpieza')) bankKey = 'aspiradora';
    else if (catL.includes('tecnolog')) bankKey = 'smartwatch';
    else if (catL.includes('salud')) bankKey = 'masajeador';
    else if (catL.includes('belleza')) bankKey = 'belleza';
  }

  const categoryBank = CATEGORY_FAQS[bankKey] || [];
  const genericProductFaqs = [
    {
      question: `¿Por qué el ${name} es la mejor opción en Colombia?`,
      answer: `El ${name} combina tecnología de calidad con un precio accesible para el mercado colombiano. Pago contra entrega y envío gratis a todo el país lo hacen la opción más segura y conveniente para comprar.`
    },
    {
      question: `¿El ${name} es original o de imitación?`,
      answer: `El ${name} que vendemos en Clickea Tienda es 100% original. Trabajamos directamente con proveedores verificados para garantizar que recibas exactamente el producto que ves en la página, sin sorpresas.`
    },
    {
      question: `¿Qué pasa si el ${name} llega defectuoso?`,
      answer: `Cubrimos cualquier defecto de fábrica al 100%. Si el ${name} llega dañado o con algún problema desde fábrica, te reemplazamos el producto de inmediato. Tu satisfacción es nuestra prioridad.`
    }
  ];

  // ─── ASSEMBLE 5+ FAQS: category-specific + feature-based + generic ──────────
  const allSpecific = [...categoryBank, ...featureFaqs, ...genericProductFaqs];
  
  // Pick at least 5 unique questions
  for (const faq of allSpecific) {
    if (faqs.length >= 5) break;
    faqs.push(faq);
  }

  // Safety fallback – should never hit this, but just in case
  if (faqs.length < 3) {
    faqs.push(...genericProductFaqs.slice(0, 3 - faqs.length));
  }

  return faqs;
}

export function getFaqsHtml(specificFaqs = [], generalFaqs = GENERAL_FAQS) {
  const renderItem = (faq) => `
    <details style="background:#f8fafc; margin-bottom:8px; border-radius:10px; border:1px solid #e2e8f0; overflow:hidden;">
      <summary style="padding:14px 16px; font-weight:700; cursor:pointer; list-style:none; display:flex; justify-content:space-between; align-items:center; color:#0f172a; font-size:14px;">
        ${faq.question}
        <span style="color:#3b82f6; font-size:20px; transition:transform 0.3s ease; flex-shrink:0; margin-left:10px;">+</span>
      </summary>
      <div style="padding:0 16px 14px 16px; color:#475569; font-size:13px; line-height:1.6; border-top:1px solid #f1f5f9; margin-top:5px; padding-top:10px;">
        ${faq.answer}
      </div>
    </details>
  `;

  return `
    <style>
      details > summary::-webkit-details-marker { display: none; }
      details[open] summary span { transform: rotate(45deg); }
    </style>
    <div style="margin: 30px 15px;">
      <h3 style="font-size:20px; font-weight:800; margin-bottom:15px; color:#0f172a; text-align:center;">
        📦 Preguntas sobre tu pedido
      </h3>
      ${specificFaqs.map(renderItem).join('')}
      <div style="height:20px;"></div>
      <h3 style="font-size:20px; font-weight:800; margin-bottom:15px; color:#0f172a; text-align:center;">
        💬 Dudas Generales
      </h3>
      ${generalFaqs.map(renderItem).join('')}
    </div>
  `;
}
