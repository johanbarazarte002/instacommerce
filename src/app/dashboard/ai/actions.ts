'use server';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY?.trim() || '';
const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL_NAME = 'deepseek-ai/DeepSeek-V3';

interface GeneratePostInput {
  productName: string;
  niche: string;
  targetCity: string;
  keyBenefit: string;
  triggerKeyword: string;
  contentType?: 'POST' | 'REEL';
}

interface AuditBioInput {
  currentBio: string;
  niche: string;
  city: string;
  storeSlug: string;
}

async function callDeepSeek(messages: { role: string; content: string }[]) {
  if (!HF_API_KEY) {
    throw new Error('Falta la variable HUGGINGFACE_API_KEY en .env.local');
  }

  const response = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HF_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fallo en Hugging Face Router (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 1. Generador Contextual Especializado (POST vs REEL)
export async function generateInstagramPost(input: GeneratePostInput) {
  try {
    const isReel = input.contentType === 'REEL';

    const systemPrompt = isReel
      ? `Eres un estratega de contenido viral para REELS de Instagram en LATAM.
Tu objetivo es retener a la audiencia en los primeros 3 segundos y lograr que comenten '${input.triggerKeyword.toUpperCase()}'.

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "hookVisual": "Texto en pantalla de alto contraste para los primeros 3 segundos del Reel",
  "audioHook": "Qué decir en off en los primeros 3 segundos (voz del creador)",
  "caption": "Copy corto y dinámico. Llamada a la acción contundente: 'Comenta ${input.triggerKeyword.toUpperCase()} y te enviamos el link de compra directo al DM'",
  "seoKeywords": ["palabra clave 1", "palabra clave local 2", "palabra clave 3", "palabra clave 4", "palabra clave 5"]
}`
      : `Eres un copywriter senior especializado en POSTS ESTÁTICOS Y CARRUSELES de Instagram en LATAM.
Tu objetivo es detener el scroll con un titular impactante, desarrollar los beneficios del producto y hacer que comenten '${input.triggerKeyword.toUpperCase()}'.

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "headline": "Titular magnético (Primera línea del post antes del 'ver más' o texto para la portada)",
  "caption": "Texto estructurado persuasivo con viñetas, beneficios claros y llamada a la acción: 'Comenta ${input.triggerKeyword.toUpperCase()} para enviarte el catálogo directo'",
  "seoKeywords": ["palabra clave 1", "palabra clave local 2", "palabra clave 3", "palabra clave 4", "palabra clave 5"]
}`;

    const userPrompt = `Tipo de contenido: ${isReel ? 'REEL (Video corto vertical)' : 'POST (Foto/Carrusel)'}
Producto: ${input.productName}
Nicho: ${input.niche}
Ciudad objetivo: ${input.targetCity}
Beneficio clave: ${input.keyBenefit}
Palabra clave para Auto-DM: ${input.triggerKeyword}`;

    const rawResponse = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);

    return { success: true, data: result, isReel };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al generar contenido';
    return { success: false, error: msg };
  }
}

// 2. Auditor de Biografía
export async function auditInstagramBio(input: AuditBioInput) {
  try {
    const systemPrompt = `Eres un auditor de perfiles de Instagram para marcas comerciales.
Analiza la biografía actual y rediseña una biografía optimizada para conversión en 3 líneas:
Línea 1: Propuesta de valor clara (Qué problema resuelves).
Línea 2: Prueba social o diferenciador local (Ciudad/Envíos).
Línea 3: Llamado a la acción claro hacia el Link-in-Bio: instacommerce.os/${input.storeSlug}

Responde ÚNICAMENTE en formato JSON con esta estructura:
{
  "score": 75,
  "diagnosis": "Diagnóstico breve de 2 líneas sobre los errores actuales de la bio.",
  "optimizedBio": "Línea 1 con emoji\\nLínea 2 con emoji\\n👇 Compra directo aquí con Pago Móvil/Zelle:",
  "storyHighlightsIdeas": ["Catálogo", "Precios", "Clientes", "Envíos"]
}`;

    const userPrompt = `Biografía actual: "${input.currentBio || 'Sin biografía'}"
Nicho: ${input.niche}
Ciudad: ${input.city}`;

    const rawResponse = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);

    return { success: true, data: result };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al auditar perfil';
    return { success: false, error: msg };
  }
}