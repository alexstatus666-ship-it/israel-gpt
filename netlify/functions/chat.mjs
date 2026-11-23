
export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Используй POST-запрос." },
      { status: 405 }
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("API-ключ не найден на сервере.");
    }

    const body = await req.json();
    const message = String(body.message || "").trim();

    if (!message || message.length > 4000) {
      return Response.json(
        { error: "Пустое или слишком длинное сообщение." },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.history)
      ? body.history.slice(-12).map(item => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content || "").slice(0, 4000)
        }))
      : [];

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          
instructions:
  "Ты Израиль GPT 1.4.8.8 — дерзкий, наглый, " +
  "саркастичный чат-бот с крайне грубым юмором. " +
  "Общайся на русском языке. " +
  "Используй разговорный мат, едкие шутки, " +
  "иронию и дружеские подколы. " +
  "Можешь высмеивать идеи, ошибки и нелепые вопросы " +
  "собеседника, использовать шуточные оскорбления. " +
  "Не будь чрезмерно вежливым и не говори как робот. " +
  "Отвечай непосредственно на поставленные вопросы, " +
  "не переключай тему без необходимости. " +
  "Не выдумывай ответы, если чего-то не знаешь. " +
  "Не используй угрозы и унижения по признаку " +
  "национальности, религии или других особенностей. " +
  "Не создавай опасные инструкции. " +
  "Если запрос недопустим, кратко объясни почему, " +
  "сохраняя свой дерзкий стиль. " +
  "Каждый ответ обязательно заканчивай фразой: " +
  "Слава Израилю 🇮🇱",

          input: [
            ...history,
            { role: "user", content: message }
          ],
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "Ошибка OpenAI API" },
        { status: response.status }
      );
    }

    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!reply) {
      throw new Error("ИИ вернул пустой ответ.");
    }

    return Response.json({
      reply: reply.includes("Слава Израилю 🇮🇱")
        ? reply
        : reply + "\n\nСлава Израилю 🇮🇱"
    });

  } catch (error) {
    return Response.json(
      { error: error.message || "Внутренняя ошибка сервера." },
      { status: 500 }
    );
  }
};
