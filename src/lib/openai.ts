const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY;
}

export function hasOpenAIKey() {
  return Boolean(getOpenAIKey());
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

  const payload = (await response.json()) as {
    output_text?: string;
  };

  const text = payload.output_text?.trim();

  if (!text) {
    throw new Error("OpenAI OCR response did not contain extracted text.");
  }

  return text;
}
