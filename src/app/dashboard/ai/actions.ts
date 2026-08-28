'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HUGGINGFACE_API_KEY || '',
});

const MODEL_NAME = 'deepseek-ai/DeepSeek-R1';

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

// Limpiador de etiquetas de razonamiento <think> y bloques markdown
function cleanDeepSeekReply(raw: string): string {
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  return cleaned.trim();
}

async function callDeepSeekR1(messages: { role: 'system' | 'user'; content: string }[]) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('Falta la variable HF_TOKEN en las variables de entorno');
  }

  const completion = await openai.chat.completions.create({
    model: MODEL_NAME,
    messages,
    temperature: 0.6,
    max_tokens: 1200,
  });

  const rawReply = completion.choices[0]?.message?.content || '';
  const cleaned = cleanDeepSeekReply(rawReply);

  // Intentar parsear el JSON limpio
  try {
    return JSON.parse(cleaned);
  } catch {
    // Extractor de emergencia si el modelo agrega texto alrededor del JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No se pudo estructurar el JSON de respuesta');
  }
}

// 1. Generador de Contenido Especializado (POST vs REEL)
export async function generateInstagramPost(input: GeneratePostInput) {
  try {
    const isReel = input.contentType === 'REEL';

    const systemPrompt = isReel
      ? `Eres un estratega senior de contenido viral para REELS de Instagram en LATAM.
Tu objetivo es retener a la audiencia en los primeros 3 segundos y lograr que comenten '${input.triggerKeyword.toUpperCase()}'.

INSTRUCCIÓN VITAL: Responde ÚNICAMENTE con un objeto JSON válido (sin explicaciones antes ni después):
{
  "hookVisual": "Texto en pantalla de alto contraste para los primeros 3 segundos del Reel",
  "audioHook": "Qué decir en off en los primeros 3 segundos (voz del creador)",
  "caption": "Copy corto y dinámico. Llamada a la acción contundente: 'Comenta ${input.triggerKeyword.toUpperCase()} y te enviamos el link de compra directo al DM'",
  "seoKeywords": ["palabra clave 1", "palabra clave local 2", "palabra clave 3", "palabra clave 4", "palabra clave 5"]
}`
      : `Eres un copywriter senior especializado en POSTS ESTÁTICOS Y CARRUSELES de Instagram en LATAM.
Tu objetivo es detener el scroll con un titular impactante, desarrollar los beneficios del producto y hacer que comenten '${input.triggerKeyword.toUpperCase()}'.

INSTRUCCIÓN VITAL: Responde ÚNICAMENTE con un objeto JSON válido (sin explicaciones antes ni después):
{
  "headline": "Titular magnético (Primera línea del post antes del 'ver más' o texto para la portada)",
  "caption": "Texto estructurado persuasivo con viñetas, beneficios claros y llamada a la acción: 'Comenta ${input.triggerKeyword.toUpperCase()} para enviarte el catálogo directo'",
  "seoKeywords": ["palabra clave 1", "palabra clave local 2", "palabra clave 3", "palabra clave 4", "palabra clave 5"]
}`;

    const userPrompt = `Tipo de contenido: ${isReel ? 'REEL' : 'POST'}
Producto: ${input.productName}
Nicho: ${input.niche}
Ciudad objetivo: ${input.targetCity}
Beneficio clave: ${input.keyBenefit}
Palabra clave para Auto-DM: ${input.triggerKeyword}`;

    const result = await callDeepSeekR1([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

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

INSTRUCCIÓN VITAL: Responde ÚNICAMENTE con un objeto JSON válido:
{
  "score": 85,
  "diagnosis": "Diagnóstico breve de 2 líneas sobre los errores actuales de la bio.",
  "optimizedBio": "Línea 1 con emoji\\nLínea 2 con emoji\\n👇 Compra directo aquí con Pago Móvil/Zelle:",
  "storyHighlightsIdeas": ["Catálogo", "Precios", "Clientes", "Envíos"]
}`;

    const userPrompt = `Biografía actual: "${input.currentBio || 'Sin biografía'}"
Nicho: ${input.niche}
Ciudad: ${input.city}`;

    const result = await callDeepSeekR1([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return { success: true, data: result };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al auditar perfil';
    return { success: false, error: msg };
  }
}