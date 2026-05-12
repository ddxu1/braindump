import { Output, StackItem, StreamItem } from '@/types';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNumberSignature(value: string): string {
  return (value.match(/\d+/g) ?? []).join('|');
}

function calculateTokenOverlap(str1: string, str2: string): number {
  const tokens1 = new Set(str1.split(' ').filter(Boolean));
  const tokens2 = new Set(str2.split(' ').filter(Boolean));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let shared = 0;
  tokens1.forEach(token => {
    if (tokens2.has(token)) {
      shared += 1;
    }
  });

  return (shared / Math.max(tokens1.size, tokens2.size)) * 100;
}

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
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (extractNumberSignature(s1) !== extractNumberSignature(s2)) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const editSimilarity = ((maxLength - distance) / maxLength) * 100;
  const tokenOverlap = calculateTokenOverlap(s1, s2);

  if (tokenOverlap < 50) {
    return Math.min(editSimilarity, tokenOverlap);
  }

  return (editSimilarity * 0.7) + (tokenOverlap * 0.3);
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

export interface InputMatch {
  source: 'input' | 'output';
  id: string;
  text: string;
  outputName?: string;
}

export function findInputMatches(
  inputItems: StreamItem[],
  outputs: Output[],
  threshold: number = 80
): Map<string, InputMatch> {
  const matches = new Map<string, InputMatch>();
  const inputDuplicates = findDuplicates(inputItems, threshold);

  inputDuplicates.forEach((originalId, duplicateId) => {
    const original = inputItems.find(item => item.id === originalId);
    if (original) {
      matches.set(duplicateId, {
        source: 'input',
        id: original.id,
        text: original.text,
      });
    }
  });

  const outputItems: Array<StackItem & { outputName: string }> = outputs.flatMap(output =>
    output.items.map(item => ({ ...item, outputName: output.name }))
  );

  for (const inputItem of inputItems) {
    if (matches.get(inputItem.id)?.source === 'input') continue;

    const outputMatch = outputItems.find(outputItem =>
      calculateSimilarity(inputItem.text, outputItem.text) >= threshold
    );

    if (outputMatch) {
      matches.set(inputItem.id, {
        source: 'output',
        id: outputMatch.id,
        text: outputMatch.text,
        outputName: outputMatch.outputName,
      });
    }
  }

  return matches;
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
