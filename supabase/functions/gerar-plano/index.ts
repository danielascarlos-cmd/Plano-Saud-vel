import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

Deno.serve(async (req: Request) => {
  // CORS headers para permitir chamadas do frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Lidar com requisições OPTIONS (pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { patientData } = await req.json();

    const prompt = `Você é um nutricionista profissional.
Gere um plano alimentar semanal com base nos dados abaixo.

⚠️ Regras:
- Responda APENAS em JSON válido
- Não use markdown
- Não escreva explicações
- Respeite restrições e alergias

Dados do paciente:
${JSON.stringify(patientData)}

Formato obrigatório:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["", "", "", "", ""],
        "lanche_manha": ["", "", "", "", ""],
        "almoco": ["", "", "", "", ""],
        "lanche_tarde": ["", "", "", "", ""],
        "jantar": ["", "", "", "", ""]
      }
    }
  ]
}

Regras:
- gerar 7 dias
- 5 opções por refeição
- evitar repetição
- usar alimentos comuns no Brasil`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // Garantir que o Gemini retorne apenas o JSON
          response_mime_type: "application/json",
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Gemini: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("Nenhum plano foi gerado pela IA.");
    }

    const textContent = result.candidates[0].content.parts[0].text;
    
    return new Response(textContent, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Erro na função:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
