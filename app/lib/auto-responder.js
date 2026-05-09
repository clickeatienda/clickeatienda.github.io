/* ============================================
   AUTO-RESPONSE BOT — Clickea Tienda
   Handles customer questions automatically
   with human-like Colombian Spanish responses
   ============================================ */

/**
 * Knowledge base for automatic responses
 * Tone: Cercano, juvenil, simpático, como MercadoLibre
 */
const FAQ_DATABASE = [
  {
    keywords: ["envío", "envio", "cuanto tarda", "cuánto tarda", "demora", "llega", "tiempo entrega", "días"],
    response: "¡Hola! 😊 Tu pedido llega en 2-5 días hábiles a cualquier ciudad de Colombia 📦🇨🇴 ¡Y el envío es 100% GRATIS! 🚚✨",
    category: "shipping",
  },
  {
    keywords: ["gratis", "costo envío", "costo envio", "cobran envío", "precio envio"],
    response: "¡Sí! El envío es totalmente GRATIS a toda Colombia 🇨🇴🎉 No te cobramos ni un peso extra 💯",
    category: "shipping",
  },
  {
    keywords: ["pago", "como pago", "cómo pago", "tarjeta", "efectivo", "nequi", "daviplata", "transferencia"],
    response: "¡Super fácil! 💵 Pagas cuando el pedido llega a la puerta de tu casa. Es pago contra entrega, no necesitas tarjeta ni transferencia 😎 Solo recibes y pagas al mensajero 🏠✅",
    category: "payment",
  },
  {
    keywords: ["devolver", "devolución", "devolucion", "no me gustó", "cambiar", "garantía", "garantia"],
    response: "¡Tranqui! 🙌 Si por alguna razón no quedas satisfecho, puedes solicitar una devolución. Escríbenos con tu número de pedido y te ayudamos al toque 📱💬",
    category: "returns",
  },
  {
    keywords: ["seguro", "confiable", "estafa", "real", "legítimo", "legitimo", "confiar"],
    response: "¡100% seguro! ✅ Clickea Tienda es una tienda verificada. Miles de colombianos ya han comprado con nosotros 🛒 Además, ¡pagas SOLO cuando recibes tu producto en las manos! 💵 Cero riesgo 😌",
    category: "trust",
  },
  {
    keywords: ["pedido", "seguimiento", "tracking", "rastreo", "donde está", "donde esta", "mi paquete"],
    response: "¡Claro! 📦 Pásame tu número de pedido o el nombre con el que hiciste la compra y te doy el estado al instante 🔍",
    category: "tracking",
  },
  {
    keywords: ["precio", "cuesta", "cuanto vale", "cuánto vale", "valor"],
    response: "¡Los precios están en la página de cada producto! 🏷️ Recuerda que siempre incluyen envío gratis 🚚 ¿Hay algún producto en especial que te interese? 😊",
    category: "pricing",
  },
  {
    keywords: ["hola", "buenas", "buenos días", "buenas tardes", "buenas noches", "hi", "hey"],
    response: "¡Holaaa! 👋😊 Bienvenido/a a Clickea Tienda 🛒✨ ¿En qué te puedo ayudar hoy?",
    category: "greeting",
  },
  {
    keywords: ["gracias", "genial", "perfecto", "listo", "vale", "ok"],
    response: "¡Con mucho gusto! 🤗 Si necesitas algo más, aquí estamos para ti 24/7 💙 ¡Feliz compra! 🛒✨",
    category: "closing",
  },
  {
    keywords: ["whatsapp", "número", "numero", "contacto", "teléfono", "telefono", "llamar"],
    response: "¡Claro! 📱 Puedes escribirnos por aquí o visitarnos en nuestra tienda: clickeatienda.myshopify.com 🛒 ¡Estamos para servirte! 💙",
    category: "contact",
  },
  {
    keywords: ["colombia", "ciudad", "envían", "envian", "llegan", "cobertura", "mi ciudad"],
    response: "¡Enviamos a TODA Colombia! 🇨🇴🎉 Ciudades principales, pueblos, ¡a todas partes! El envío siempre es gratis 🚚💨",
    category: "coverage",
  },
  {
    keywords: ["tiene", "tienen", "hay", "busco", "necesito", "quiero"],
    response: "¡Tenemos de todo! 🛒✨ Visita nuestra tienda para ver todo el catálogo: clickeatienda.myshopify.com 📱 ¡Seguro encuentras lo que buscas! ¿Qué tipo de producto necesitas? 🤔",
    category: "catalog",
  },
];

/**
 * Escalation message when bot can't answer
 */
const ESCALATION_RESPONSE = "¡Buena pregunta! 🤔 Deja que te paso con un asesor que te puede ayudar mejor. Un momentito por favor 🙏💙";

/**
 * Find the best matching response for a message
 * @param {string} message - Customer message
 * @returns {object} { response, wasAutoReplied, category }
 */
export function findResponse(message) {
  const normalized = message.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents for matching
    .trim();

  let bestMatch = null;
  let bestScore = 0;

  for (const faq of FAQ_DATABASE) {
    let score = 0;
    for (const keyword of faq.keywords) {
      const normalizedKeyword = keyword.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(normalizedKeyword)) {
        score += normalizedKeyword.length; // Longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  // Require minimum match score (at least one meaningful keyword)
  if (bestScore >= 3 && bestMatch) {
    return {
      response: bestMatch.response,
      wasAutoReplied: true,
      needsHumanReview: false,
      category: bestMatch.category,
      confidence: Math.min(bestScore / 10, 1),
    };
  }

  // Can't answer → escalate to human
  return {
    response: ESCALATION_RESPONSE,
    wasAutoReplied: false,
    needsHumanReview: true,
    category: "unknown",
    confidence: 0,
  };
}

/**
 * Process a batch of incoming messages
 * @param {Array} messages - Array of { id, text, platform, customerName }
 * @returns {Array} Responses
 */
export function processMessages(messages) {
  return messages.map(msg => {
    const result = findResponse(msg.text);
    return {
      messageId: msg.id,
      customerName: msg.customerName,
      platform: msg.platform,
      originalMessage: msg.text,
      ...result,
    };
  });
}
