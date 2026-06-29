import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { texto, contexto = {} } = await req.json();
    const cleanTexto = String(texto || '').trim();

    if (!cleanTexto) {
      return json({ error: 'Texto técnico obrigatório.' }, 400);
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return json({ error: 'OPENAI_API_KEY não configurada.' }, 500);
    }

    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini';
    const openai = new OpenAI({ apiKey });
    const prompt = [
      'Reescreva o texto técnico abaixo em português do Brasil.',
      'Mantenha o sentido original informado pelo técnico.',
      'Não invente serviços, medições, materiais, datas, causas ou evidências.',
      'Use linguagem profissional, objetiva e adequada para relatório operacional de manutenção de EBAP.',
      'Se o texto estiver informal, transforme em relato técnico claro.',
      'Retorne somente o texto reescrito, sem título e sem comentários adicionais.',
      '',
      `Contexto: ${JSON.stringify(contexto)}`,
      '',
      `Texto do técnico: ${cleanTexto}`
    ].join('\n');

    const result = await openai.responses.create({
      model,
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 700
    });

    const textoMelhorado = extractText(result);
    if (!textoMelhorado) {
      return json({ error: 'A IA não retornou texto.' }, 502);
    }

    return json({ texto_melhorado: textoMelhorado });
  } catch (error) {
    const status = typeof error?.status === 'number' ? error.status : 500;
    return json({ error: error?.message || 'Falha ao melhorar texto técnico.' }, status);
  }
});

function extractText(result: any) {
  if (typeof result?.output_text === 'string') return result.output_text.trim();

  const parts = [];
  for (const item of result?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && content?.text) parts.push(content.text);
      if (content?.type === 'text' && content?.text) parts.push(content.text);
    }
  }

  return parts.join('\n').trim();
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
