export interface AICleanupResult {
  items: AICleanedItem[];
  duplicateGroups: AIDuplicateGroup[];
}

export interface AICleanedItem {
  originalId: string;
  cleanedText: string;
  changed: boolean;
}

export interface AIDuplicateGroup {
  primaryId: string;
  duplicateIds: string[];
  reason: string;
}

interface GrokInputItem {
  id: string;
  text: string;
  context: string | null;
}

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = 'grok-4-1-fast-thinking';

const SYSTEM_PROMPT = `You are an assistant that cleans up brain-dump notes.

You will receive a JSON array of note items, each with an "id", "text", and optional "context".

Your job:
1. Rewrite each note's text so it is clearer, grammatically correct, and concise — preserve the user's intent and information. Keep proper nouns and technical terms intact. Do NOT invent details. If a note is already clear, keep it unchanged.
2. Identify groups of notes that refer to the same underlying task or thought (semantic duplicates, not just exact matches). Pick one as the "primary" and list the others as duplicates of it. A single note that has no duplicates does NOT need to be in a duplicate group.

Return ONLY valid JSON matching this exact schema, with no surrounding prose, no markdown fencing:

{
  "items": [
    { "originalId": "<id>", "cleanedText": "<rewritten text>", "changed": <boolean> }
  ],
  "duplicateGroups": [
    { "primaryId": "<id>", "duplicateIds": ["<id>", ...], "reason": "<short explanation>" }
  ]
}

Every input id MUST appear exactly once in "items". "changed" is true only if cleanedText differs from the original text.`;

export async function cleanupWithGrok(
  items: GrokInputItem[],
  apiKey: string,
  model: string = DEFAULT_MODEL,
): Promise<AICleanupResult> {
  if (!apiKey) {
    throw new Error('Missing Grok API key. Add one in Settings.');
  }
  if (items.length === 0) {
    return { items: [], duplicateGroups: [] };
  }

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(items) },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Grok returned no content');
  }

  let parsed: AICleanupResult;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Grok response was not valid JSON');
  }

  if (!Array.isArray(parsed.items)) {
    throw new Error('Grok response missing "items" array');
  }
  if (!Array.isArray(parsed.duplicateGroups)) {
    parsed.duplicateGroups = [];
  }

  return parsed;
}
