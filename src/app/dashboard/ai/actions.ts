'use server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'deepseek/deepseek-chat:free'; // DeepSeek-V3 Gratuito

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

function cleanJsonString(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function callOpenRouter(messages: { role: string; content: string }[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Falta la variable OPENROUTER_API_KEY en las variables de entorno');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'InstaCommerce OS',
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
    throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return cleanJsonString(content);
}

// 1. Generador Contextual Especializado (POST vs REEL)
export async function generateInstagramPost(input: GeneratePostInput) {
  try {
    const isReel = input.contentType === 'REEL';

    const systemPrompt = isReel
      ? `Eres un estratega de contenido viral para REELS de Instagram en LATAM.
Tu objetivo es retener a la audiencia en los primeros 3 segundos y lograr que comenten '${input.triggerKeyword.toUpperCase()}'.

Responde ÚNICAMENTE en formato JSON plano (sin texto introductorio ni markdown adicional) con esta estructura:
{
  "hookVisual": "Texto en pantalla de alto contraste para los primeros 3 segundos del Reel",
  "audioHook": "Qué decir en off en los primeros 3 segundos (voz del creador)",
  "caption": "Copy corto y dinámico. Llamada a la acción contundente: 'Comenta ${input.triggerKeyword.toUpperCase()} y te enviamos el link de compra directo al DM'",
  "seoKeywords": ["palabra clave 1", "palabra clave local 2", "palabra clave 3", "palabra clave 4", "palabra clave 5"]
}`
      : `Eres un copywriter senior especializado en POSTS ESTÁTICOS Y CARRUSELES de Instagram en LATAM.
Tu objetivo es detener el scroll con un titular impactante, desarrollar los beneficios del producto y hacer que comenten '${input.triggerKeyword.toUpperCase()}'.

Responde ÚNICAMENTE en formato JSON plano (sin texto introductorio ni markdown adicional) con esta estructura:
{
  "headline": "Titular magnético (Primera línea del post antes del 'ver más' o portada)",
  "caption": "Texto estructurado persuasivo con viñetas, beneficios claros y llamada a la acción: 'Comenta ${input.triggerKeyword.toUpperCase()} para enviarte el catálogo directo'",
  "seoKeywords": ["palabra clave 1", "palabra clave local 2", "palabra clave 3", "palabra clave 4", "palabra clave 5"]
}`;

    const userPrompt = `Tipo de contenido: ${isReel ? 'REEL' : 'POST'}
Producto: ${input.productName}
Nicho: ${input.niche}
Ciudad objetivo: ${input.targetCity}
Beneficio clave: ${input.keyBenefit}
Palabra clave para Auto-DM: ${input.triggerKeyword}`;

    const rawResponse = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const result = JSON.parse(rawResponse);
    return { success: true, data: result, isReel };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al generar contenido';
    return { success: false, error: msg };
  }
}

// 2. Auditor de Biografía
export async function auditInstagramBio(input: AuditBioInput) {
  try {
    const systemPrompt = `Eres un auditor de perfiles de Instagram para marcas comerciales en LATAM.
Analiza la biografía actual y rediseña una biografía optimizada para conversión en 3 líneas:
Línea 1: Propuesta de valor clara (Qué problema resuelves).
Línea 2: Prueba social o diferenciador local (Ciudad/Envíos).
Línea 3: Llamado a la acción claro hacia el Link-in-Bio: instacommerce.os/${input.storeSlug}

Responde ÚNICAMENTE en formato JSON plano con esta estructura:
{
  "score": 85,
  "diagnosis": "Diagnóstico breve de 2 líneas sobre los errores actuales de la bio.",
  "optimizedBio": "Línea 1 con emoji\\nLínea 2 con emoji\\n👇 Compra directo aquí con Pago Móvil/Zelle:",
  "storyHighlightsIdeas": ["Catálogo", "Precios", "Clientes", "Envíos"]
}`;

    const userPrompt = `Biografía actual: "${input.currentBio || 'Sin biografía'}"
Nicho: ${input.niche}
Ciudad: ${input.city}`;

    const rawResponse = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const result = JSON.parse(rawResponse);
    return { success: true, data: result };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al auditar perfil';
    return { success: false, error: msg };
  }
}