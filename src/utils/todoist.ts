import { StackItem } from '@/types';

export async function addTasksToTodoist(items: StackItem[], apiKey: string): Promise<void> {
  const token = apiKey.trim();
  if (!token) {
    throw new Error('Add a Todoist API key in Settings first.');
  }

  for (const item of items) {
    const response = await fetch('/api/todoist/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: token,
        content: item.text,
        description: item.context ?? undefined,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Todoist request failed with ${response.status}`);
    }
  }
}
