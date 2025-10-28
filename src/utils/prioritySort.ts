import { StackItem } from '@/types';

/**
 * Priority levels based on Eisenhower Matrix:
 * 1. Urgent && Important (Do First)
 * 2. Urgent only (Schedule)
 * 3. Important only (Delegate)
 * 4. Neither (Eliminate/Later)
 */
export function getPriorityLevel(item: StackItem): number {
  if (item.isUrgent && item.isImportant) return 1;
  if (item.isUrgent) return 2;
  if (item.isImportant) return 3;
  return 4;
}

export function getPriorityLabel(item: StackItem): string {
  const level = getPriorityLevel(item);
  switch (level) {
    case 1:
      return 'Do First';
    case 2:
      return 'Schedule';
    case 3:
      return 'Delegate';
    case 4:
      return 'Later';
    default:
      return '';
  }
}

export function sortByPriority(items: StackItem[]): StackItem[] {
  return [...items].sort((a, b) => {
    // Sort by priority level (lower number = higher priority)
    const priorityDiff = getPriorityLevel(a) - getPriorityLevel(b);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Maintain original order for items with same priority
    return a.order - b.order;
  });
}
