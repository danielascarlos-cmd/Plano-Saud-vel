
export default async function handler(req, res) {
  // Configuração de CORS (opcional para Vercel, mas boa prática)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientData } = req.body;
  
  if (!patientData) {
    return res.status(400).json({ error: 'Dados do paciente não fornecidos.' });
  }

  const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY não configurada no servidor.' });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    let result;
    const responseText = await response.text();
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Resposta da API do Gemini não é um JSON válido: ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: ${result.error?.message || JSON.stringify(result)}`);
    }
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error("Nenhum plano foi gerado pela IA.");
    }

    let textContent = result.candidates[0].content.parts[0].text;
    
    // Extração robusta de JSON (encontra o primeiro { e o último })
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      textContent = jsonMatch[0];
    } else {
      throw new Error("A IA não retornou um formato JSON válido.");
    }

    try {
      const jsonResult = JSON.parse(textContent);
      return res.status(200).json(jsonResult);
    } catch (e) {
      console.error('Falha ao parsear JSON da IA:', textContent);
      throw new Error("Erro ao processar o plano gerado pela IA. Tente novamente.");
    }

  } catch (error) {
    console.error('Erro na geração do plano:', error);
    // Garante que o erro sempre seja um JSON válido
    res.status(500).json({ 
      error: error.message,
      details: "Verifique se o servidor de backend está rodando corretamente (vercel dev)."
    });
  }
}
