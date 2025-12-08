import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating tips for user:", user.id);

    // Fetch user's transactions with categories
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount, type, category:categories(name)")
      .eq("user_id", user.id)
      .eq("type", "expense");

    if (txError) {
      console.error("Error fetching transactions:", txError);
      throw txError;
    }

    // Fetch bank transactions
    const { data: bankTransactions, error: bankTxError } = await supabase
      .from("bank_transactions")
      .select("amount, category")
      .eq("user_id", user.id);

    if (bankTxError) {
      console.error("Error fetching bank transactions:", bankTxError);
    }

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};

    // Process manual transactions
    transactions?.forEach((tx: any) => {
      const categoryName = tx.category?.name || "Outros";
      const amount = Math.abs(Number(tx.amount));
      spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + amount;
    });

    // Process bank transactions (expenses are negative)
    bankTransactions?.forEach((tx: any) => {
      if (tx.amount < 0) {
        const categoryName = tx.category || "Transações Bancárias";
        const amount = Math.abs(tx.amount);
        spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + amount;
      }
    });

    // Sort categories by spending
    const sortedCategories = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const totalSpending = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);

    console.log("Spending by category:", sortedCategories);
    console.log("Total spending:", totalSpending);

    // If no spending data, return generic tips
    if (sortedCategories.length === 0 || totalSpending === 0) {
      return new Response(JSON.stringify({
        tips: [
          {
            category: "Geral",
            percentage: 0,
            amount: 0,
            tips: [
              "Comece registrando suas despesas para entender para onde vai seu dinheiro",
              "Defina um orçamento mensal para cada categoria de gastos",
              "Crie uma reserva de emergência com 3 a 6 meses de despesas"
            ]
          }
        ],
        summary: "Adicione algumas transações para receber dicas personalizadas baseadas nos seus gastos."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI
    const spendingContext = sortedCategories
      .map(([cat, amount]) => `${cat}: R$ ${amount.toFixed(2)} (${((amount / totalSpending) * 100).toFixed(1)}%)`)
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um consultor financeiro brasileiro especializado em finanças pessoais. 
Analise os gastos do usuário e forneça dicas práticas e personalizadas para economizar dinheiro.

Regras:
- Forneça 3 dicas específicas para cada categoria principal de gastos
- As dicas devem ser práticas, acionáveis e aplicáveis ao contexto brasileiro
- Use linguagem simples e direta
- Considere alternativas de baixo custo disponíveis no Brasil
- Inclua estimativas de economia quando possível

Responda APENAS em JSON válido no seguinte formato:
{
  "tips": [
    {
      "category": "Nome da Categoria",
      "tips": ["Dica 1", "Dica 2", "Dica 3"]
    }
  ],
  "summary": "Resumo geral de 1-2 frases sobre a situação financeira"
}`;

    const userPrompt = `Analise meus gastos e me dê dicas para economizar:

Gastos por categoria (do maior para o menor):
${spendingContext}

Total de gastos: R$ ${totalSpending.toFixed(2)}`;

    console.log("Calling AI with prompt:", userPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response:", aiResponse);

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from AI response
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback response
      parsedContent = {
        tips: sortedCategories.slice(0, 3).map(([cat, amount]) => ({
          category: cat,
          percentage: ((amount / totalSpending) * 100).toFixed(1),
          amount: amount,
          tips: [
            `Revise seus gastos com ${cat} e identifique itens não essenciais`,
            `Pesquise alternativas mais baratas para ${cat}`,
            `Estabeleça um limite mensal para ${cat}`
          ]
        })),
        summary: "Analise suas maiores categorias de gastos para encontrar oportunidades de economia."
      };
    }

    // Enrich tips with spending data
    const enrichedTips = parsedContent.tips.map((tip: any) => {
      const categoryData = sortedCategories.find(([cat]) => 
        cat.toLowerCase() === tip.category.toLowerCase()
      );
      return {
        ...tip,
        amount: categoryData ? categoryData[1] : 0,
        percentage: categoryData ? ((categoryData[1] / totalSpending) * 100).toFixed(1) : "0"
      };
    });

    return new Response(JSON.stringify({
      ...parsedContent,
      tips: enrichedTips,
      spendingData: sortedCategories.map(([category, amount]) => ({
        category,
        amount,
        percentage: ((amount / totalSpending) * 100).toFixed(1)
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating tips:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao gerar dicas" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
