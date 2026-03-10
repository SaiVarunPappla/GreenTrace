import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { activities, totalEmissions, categoryBreakdown } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI sustainability analyst for GreenTrace India, an enterprise ESG platform. 
You analyze carbon footprint data for Indian employees and provide:
1. End-of-year emissions forecast based on current trends
2. Financial waste analysis in Indian Rupees (₹)
3. Actionable recommendations specific to Indian context (metros, auto-rickshaws, vegetarian diet benefits, solar potential)
4. Department-level insights

Use these Indian-specific factors:
- Average fuel cost: ₹105/litre petrol, ₹92/litre diesel
- Electricity cost: ₹8/kWh average
- Grid carbon intensity: 0.82 kg CO2/kWh
- Carbon offset cost: ₹1,250/tonne CO2 in India
- Average Indian employee commute: 15km one-way

Always respond with valid JSON using this exact structure:
{
  "yearEndForecast": { "totalKg": number, "monthlyAvgKg": number },
  "financialWaste": { "weeklyINR": number, "monthlyINR": number, "yearlyINR": number, "breakdown": string },
  "recommendations": [{ "title": string, "impact": string, "savingsINR": number }],
  "riskLevel": "low" | "medium" | "high",
  "summary": string
}`;

    const userPrompt = `Analyze this employee's carbon data:
- Total emissions so far: ${totalEmissions} kg CO2
- Number of activities logged: ${activities}
- Category breakdown: Transport: ${categoryBreakdown?.transport || 0} kg, Diet: ${categoryBreakdown?.diet || 0} kg, Utilities: ${categoryBreakdown?.utility || 0} kg

Provide a prediction and financial waste analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide carbon emissions analysis and predictions",
              parameters: {
                type: "object",
                properties: {
                  yearEndForecast: {
                    type: "object",
                    properties: {
                      totalKg: { type: "number" },
                      monthlyAvgKg: { type: "number" },
                    },
                    required: ["totalKg", "monthlyAvgKg"],
                  },
                  financialWaste: {
                    type: "object",
                    properties: {
                      weeklyINR: { type: "number" },
                      monthlyINR: { type: "number" },
                      yearlyINR: { type: "number" },
                      breakdown: { type: "string" },
                    },
                    required: ["weeklyINR", "monthlyINR", "yearlyINR", "breakdown"],
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        impact: { type: "string" },
                        savingsINR: { type: "number" },
                      },
                      required: ["title", "impact", "savingsINR"],
                    },
                  },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  summary: { type: "string" },
                },
                required: ["yearEndForecast", "financialWaste", "recommendations", "riskLevel", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;

    if (toolCall?.function?.arguments) {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!analysis) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-emissions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
