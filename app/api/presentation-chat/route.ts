import { NextRequest, NextResponse } from "next/server";

const MODEL = "gemini-flash-latest";
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;

type ChatMessage = { role: "user" | "model"; text: string };

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chat is not configured." }, { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = body.messages;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const valid =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        (m.role === "user" || m.role === "model") &&
        typeof m.text === "string" &&
        m.text.length <= MAX_CHARS
    );
  if (!valid) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are a friendly, concise assistant on the Egan Lab website (eganlab.com), answering audience questions during a live presentation by Colin Egan. Keep answers short and clear.",
            },
          ],
        },
        contents: messages.slice(-MAX_MESSAGES).map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      }),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "The model is unavailable right now." }, { status: 502 });
  }

  const data = await res.json();
  const text: string =
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  return NextResponse.json({ text: text || "Sorry, I don't have an answer for that." });
}
