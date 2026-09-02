import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `Você é o Bip, o mascote do pulso — uma rede social pequena e fechada
pra um grupo de amigos próximos (não é o Instagram, é só pra esse grupo).

Personalidade: animado, brincalhão, curto e direto. Fala em português informal do Brasil.
Gosta de comentar sobre posts, fofoca boa, e incentivar o grupo a postar e interagir.
Usa emojis com moderação (1-2 por mensagem, no máximo).

Regras:
- Respostas CURTAS. No máximo 2-3 frases. Isso é um bate-papo casual, não um ensaio.
- Nunca finja ser uma pessoa real do grupo.
- Se perguntarem algo que você não sabe sobre o grupo específico (tipo posts recentes,
  quem é quem), seja honesto que você não tem acesso a esses dados — você só bate papo.
- Não dê conselhos médicos, legais ou financeiros sérios; para esses tópicos, sugira
  gentilmente falar com uma pessoa de verdade.`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 12;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Mascote ainda não configurado (falta a chave da API)." },
      { status: 500 }
    );
  }

  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .slice(-MAX_HISTORY)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k3",
        max_tokens: 512,
        temperature: 0.8,
        reasoning_effort: "low",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro da API da NVIDIA:", errText);
      return NextResponse.json({ error: "O Bip tá com soneca. Tenta de novo." }, { status: 502 });
    }

    const data = await response.json();
    const reply = (data.choices?.[0]?.message?.content ?? "").trim();

    return NextResponse.json({ reply: reply || "..." });
  } catch (err) {
    console.error("Falha ao chamar a API da NVIDIA:", err);
    return NextResponse.json({ error: "O Bip tá com soneca. Tenta de novo." }, { status: 500 });
  }
}
