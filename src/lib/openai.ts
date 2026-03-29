const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY;
}

export function hasOpenAIKey() {
  return Boolean(getOpenAIKey());
}

type ResponsesContentItem = {
  type?: string;
  text?: string;
};

type ResponsesOutputItem = {
  type?: string;
  content?: ResponsesContentItem[];
};

type ResponsesPayload = {
  output_text?: string;
  output?: ResponsesOutputItem[];
};

function getTextFromResponsesPayload(payload: ResponsesPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  for (const outputItem of payload.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.type === "output_text" && contentItem.text?.trim()) {
        return contentItem.text.trim();
      }
    }
  }

  return null;
}

export async function extractTextFromImageWithOpenAI(base64Image: string, mimeType: string) {
  const apiKey = getOpenAIKey();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Extract the English passage from this image. Return only the passage text as plain text, preserving paragraph breaks."
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${base64Image}`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`OpenAI OCR request failed: ${payload}`);
  }

  const payload = (await response.json()) as ResponsesPayload;
  const text = getTextFromResponsesPayload(payload);

  if (!text) {
    throw new Error("OpenAI OCR response did not contain extracted text.");
  }

  return text;
}

export async function createStructuredOpenAIResponse<T>(
  input: Array<{
    role: "user" | "developer" | "system";
    content: Array<{
      type: "input_text" | "input_image";
      text?: string;
      image_url?: string;
    }>;
  }>,
  schema: object,
  schemaName: string
) {
  const apiKey = getOpenAIKey();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema
        }
      },
      input
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`OpenAI structured request failed: ${payload}`);
  }

  const payload = (await response.json()) as ResponsesPayload;
  const text = getTextFromResponsesPayload(payload);

  if (!text) {
    throw new Error("OpenAI structured response did not contain text output.");
  }

  return JSON.parse(text) as T;
}
