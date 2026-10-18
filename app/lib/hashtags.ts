export type Hashtag = { start: number; end: number; name: string };
type Range = { start: number; end: number };

export function parseHashtags(text: string): Hashtag[] {
  const result: Hashtag[] = [];
  for (const match of text.matchAll(/(^|\s)#([\p{L}\p{M}\p{N}_]+)/gu)) {
    const start = match.index + match[1].length;
    result.push({
      start,
      end: start + match[2].length + 1,
      name: match[2].normalize("NFKC").toLowerCase(),
    });
  }
  return result;
}

export function cardTags(text: string): string[] {
  return [...new Set(parseHashtags(text).map((tag) => tag.name))];
}

// Subtract token intervals without changing the text or its UTF-16 offsets.
export function protectHashtags(text: string, ranges: Range[]): Range[] {
  return parseHashtags(text).reduce<Range[]>((remaining, tag) =>
    remaining.flatMap((range) => {
      if (range.end <= tag.start || range.start >= tag.end) return [range];
      return [
        ...(range.start < tag.start ? [{ start: range.start, end: tag.start }] : []),
        ...(range.end > tag.end ? [{ start: tag.end, end: range.end }] : []),
      ];
    }), ranges);
}

export function filterByTags<T extends { text: string }>(cards: T[], selected: string[]): T[] {
  if (!selected.length) return cards;
  return cards.filter((card) => {
    const tags = new Set(cardTags(card.text));
    return selected.every((tag) => tags.has(tag));
  });
}
