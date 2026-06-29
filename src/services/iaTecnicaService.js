import { supabase } from '../lib/supabase.js';

const MELHORAR_TEXTO_FUNCTION = 'melhorar-texto-tecnico';

export async function melhorarTextoTecnicoOS({ texto, contexto = {} }) {
  const cleanTexto = String(texto || '').trim();
  if (!cleanTexto) throw new Error('Informe o texto técnico antes de acionar a IA.');

  const { data, error } = await supabase.functions.invoke(MELHORAR_TEXTO_FUNCTION, {
    body: {
      texto: cleanTexto,
      contexto
    }
  });

  if (error) throw new Error(error.message || 'IA indisponível no momento.');

  const melhorado = data?.texto_melhorado || data?.texto || data?.resultado;
  if (!String(melhorado || '').trim()) {
    throw new Error('A IA não retornou um texto válido.');
  }

  return String(melhorado).trim();
}
