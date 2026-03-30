const OPENAI_API_URL = "https://api.openai.com/v1/responses";

type OCRStructuredPayload = {
  itemNumber: string | null;
  instruction: string | null;
  passageText: string;
  glossaryNotes: string[];
  choices: Array<{
    label: string | null;
    text: string;
  }>;
};

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
                "Extract the full visible problem text from this Korean CSAT English question image. Include the item number, the Korean instruction sentence if visible, the English passage, any glossary notes, and all answer choices. Preserve line breaks where helpful. Keep choice labels such as ① ② ③ ④ ⑤ if visible. Return plain text only."
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

export async function extractStructuredProblemFromImageWithOpenAI(
  base64Image: string,
  mimeType: string
) {
  const result = await createStructuredOpenAIResponse<OCRStructuredPayload>(
    [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Extract the visible content from this Korean CSAT English question image as structured data. Return the item number digits if visible, the Korean instruction sentence if visible, the English passage only in passageText, glossary notes as an array, and answer choices as a five-item array when visible. Preserve blank underscores in the passage. Do not omit answer choices if they are shown below the passage."
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64Image}`
          }
        ]
      }
    ],
    {
      type: "object",
      additionalProperties: false,
      properties: {
        itemNumber: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        instruction: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        passageText: { type: "string" },
        glossaryNotes: {
          type: "array",
          items: { type: "string" }
        },
        choices: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: {
                anyOf: [{ type: "string" }, { type: "null" }]
              },
              text: { type: "string" }
            },
            required: ["label", "text"]
          }
        }
      },
      required: ["itemNumber", "instruction", "passageText", "glossaryNotes", "choices"]
    },
    "ocr_problem_result"
  );

  return result;
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

export async function detectItemNumberFromImageWithOpenAI(
  base64Image: string,
  mimeType: string
) {
  const result = await createStructuredOpenAIResponse<{
    itemNumber: string | null;
  }>(
    [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Look at this Korean CSAT English problem image and extract only the visible item number. Return digits only in itemNumber. If you cannot confidently find one, return null."
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64Image}`
          }
        ]
      }
    ],
    {
      type: "object",
      additionalProperties: false,
      properties: {
        itemNumber: {
          anyOf: [
            {
              type: "string"
            },
            {
              type: "null"
            }
          ]
        }
      },
      required: ["itemNumber"]
    },
    "item_number_detection"
  );

  return result.itemNumber?.replace(/[^0-9]/g, "") || null;
}
