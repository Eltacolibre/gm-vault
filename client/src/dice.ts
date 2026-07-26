/**
 * Dice notation parser and roller.
 *
 * Supported grammar (whitespace and case are ignored):
 *   expression := term (('+' | '-') term)*
 *   term       := [count]'d'sides['kh'n | 'kl'n]   e.g. d20, 2d6, 4d6kh3
 *               | integer                          e.g. +3
 */

export interface DiceTerm {
  sign: 1 | -1;
  kind: 'dice' | 'const';
  notation: string;
  /** All dice rolled for this term (empty for constants). */
  rolls: number[];
  /** Dice actually counted after kh/kl (equals rolls when no keep). */
  kept: number[];
  value: number;
}

export interface RollResult {
  notation: string;
  total: number;
  terms: DiceTerm[];
  breakdown: string;
}

export const MAX_DICE = 100;
export const MAX_SIDES = 1000;

const TERM_RE = /([+-])?(?:(\d*)d(\d+)(?:k([hl])(\d+))?|(\d+))/y;

export function rollDice(notation: string, rng: () => number = Math.random): RollResult {
  const src = notation.toLowerCase().replace(/\s+/g, '');
  if (!src) throw new Error('Empty formula');

  const terms: DiceTerm[] = [];
  let pos = 0;
  while (pos < src.length) {
    TERM_RE.lastIndex = pos;
    const m = TERM_RE.exec(src);
    if (!m) throw new Error(`Can't read formula near "${src.slice(pos)}"`);
    if (terms.length > 0 && !m[1]) {
      throw new Error(`Missing + or - before "${src.slice(pos)}"`);
    }
    pos = TERM_RE.lastIndex;
    const sign: 1 | -1 = m[1] === '-' ? -1 : 1;

    if (m[6] !== undefined) {
      const value = parseInt(m[6], 10);
      terms.push({ sign, kind: 'const', notation: m[6], rolls: [], kept: [], value });
      continue;
    }

    const count = m[2] ? parseInt(m[2], 10) : 1;
    const sides = parseInt(m[3], 10);
    if (count < 1 || count > MAX_DICE) {
      throw new Error(`Dice count must be 1-${MAX_DICE}`);
    }
    if (sides < 2 || sides > MAX_SIDES) {
      throw new Error(`Dice must have 2-${MAX_SIDES} sides`);
    }

    const rolls = Array.from({ length: count }, () => Math.floor(rng() * sides) + 1);
    let kept = rolls;
    if (m[4]) {
      const n = parseInt(m[5], 10);
      if (n < 1 || n > count) {
        throw new Error(`Keep count must be between 1 and ${count}`);
      }
      kept = [...rolls].sort((a, b) => (m[4] === 'h' ? b - a : a - b)).slice(0, n);
    }
    const value = kept.reduce((a, b) => a + b, 0);
    terms.push({
      sign,
      kind: 'dice',
      notation: `${count}d${sides}${m[4] ? `k${m[4]}${m[5]}` : ''}`,
      rolls,
      kept,
      value,
    });
  }

  const total = terms.reduce((acc, t) => acc + t.sign * t.value, 0);
  const breakdown = terms
    .map((t, i) => {
      const sign = t.sign < 0 ? '− ' : i > 0 ? '+ ' : '';
      if (t.kind === 'const') return `${sign}${t.value}`;
      const dice = t.rolls.join(', ');
      const keepNote = t.kept.length !== t.rolls.length ? ` → keep ${t.kept.join('+')}` : '';
      return `${sign}${t.notation} [${dice}]${keepNote}`;
    })
    .join(' ');

  return { notation: src, total, terms, breakdown };
}

/** True if the notation parses (without rolling anything user-visible). */
export function isValidNotation(notation: string): boolean {
  try {
    rollDice(notation, () => 0.5);
    return true;
  } catch {
    return false;
  }
}
