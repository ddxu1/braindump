import { NextRequest, NextResponse } from 'next/server';

const TODOIST_TASKS_URL = 'https://api.todoist.com/api/v1/tasks';

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    apiKey?: string;
    content?: string;
    description?: string;
  };

  if (!body.apiKey?.trim()) {
    return NextResponse.json({ error: 'Missing Todoist API key' }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Missing task content' }, { status: 400 });
  }

  const response = await fetch(TODOIST_TASKS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${body.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      content: body.content,
      description: body.description || undefined,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json(
      { error: message || `Todoist request failed with ${response.status}` },
      { status: response.status }
    );
  }

  return NextResponse.json(await response.json(), { status: response.status });
}
