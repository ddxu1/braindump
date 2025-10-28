import { StreamItem } from '@/types';

/**
 * Calculates Levenshtein distance between two strings
 * Used for fuzzy string matching to detect duplicates
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates similarity percentage between two strings
 * Returns a value between 0 (completely different) and 100 (identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return similarity;
}

/**
 * Finds potential duplicates for each stream item
 * Returns a map of item IDs to their duplicate IDs
 */
export function findDuplicates(
  items: StreamItem[],
  threshold: number = 80
): Map<string, string> {
  const duplicates = new Map<string, string>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const similarity = calculateSimilarity(items[i].text, items[j].text);

      if (similarity >= threshold) {
        // Mark the newer item as a duplicate of the older one
        duplicates.set(items[j].id, items[i].id);
      }
    }
  }

  return duplicates;
}

/**
 * Groups items by their duplicate relationships
 * Returns an array of duplicate groups
 */
export function groupDuplicates(items: StreamItem[]): StreamItem[][] {
  const duplicateMap = findDuplicates(items);
  const groups = new Map<string, StreamItem[]>();

  items.forEach(item => {
    const duplicateOfId = duplicateMap.get(item.id);

    if (duplicateOfId) {
      // This item is a duplicate
      if (!groups.has(duplicateOfId)) {
        const original = items.find(i => i.id === duplicateOfId);
        if (original) {
          groups.set(duplicateOfId, [original]);
        }
      }
      groups.get(duplicateOfId)?.push(item);
    } else {
      // Check if this item is the original of any duplicates
      const hasDuplicates = Array.from(duplicateMap.values()).includes(item.id);
      if (hasDuplicates && !groups.has(item.id)) {
        groups.set(item.id, [item]);
      }
    }
  });

  return Array.from(groups.values());
}
