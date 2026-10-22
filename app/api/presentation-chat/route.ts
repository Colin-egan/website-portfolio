import { NextRequest, NextResponse } from "next/server";
import { loadPresentationParts, readPresentationSettings } from "@/lib/portal/presentation";
import { DEFAULT_PROMPT } from "@/lib/portal/presentationShared";

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

  // Instructions, files and the on/off switch all come from the portal's
  // Presentation tab.
  const settings = await readPresentationSettings();
  if (!settings.chatEnabled) {
    return NextResponse.json({ error: "The chat is closed right now." }, { status: 503 });
  }
  const files = await loadPresentationParts();

  // The files ride in a leading exchange, since system instructions take text only.
  const reference =
    files.length > 0
      ? [
          {
            role: "user",
            parts: [{ text: "Reference material for this presentation:" }, ...files],
          },
          { role: "model", parts: [{ text: "Got it. I'll answer using this material." }] },
        ]
      : [];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: settings.systemPrompt.trim() || DEFAULT_PROMPT }] },
        contents: [
          ...reference,
          ...messages.slice(-MAX_MESSAGES).map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        ],
      }),
    }
  );

  if (!res.ok) {
    console.error("presentation-chat: Gemini error", res.status, await res.text());
    return NextResponse.json({ error: "The model is unavailable right now." }, { status: 502 });
  }

  const data = await res.json();
  const text: string =
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  return NextResponse.json({ text: text || "Sorry, I don't have an answer for that." });
}
