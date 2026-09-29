import anyAscii from 'any-ascii';

/**
 * Matches the emoji names `anyAscii` produces, such as `:grinning:`
 *
 * @remarks
 * Nothing below U+2000 converts to this shape, so this can't match real text.
 */
const ASCII_EMOJI_NAME = /^:[a-z0-9_+-]+:$/;

/**
 * The invisible parts that hold emoji sequences together, plus the regional
 * indicators that make up flags.
 *
 * @remarks
 * Covers the zero width joiner, variation selectors, the keycap mark, the tag
 * characters used by some flags, and skin tone modifiers.
 *
 * `anyAscii` maps most of these to nothing and the flag tags to stray letters,
 * so converting them pulls sequences apart. A family emoji becomes three
 * separate people,  the Scotland flag renders as `gbsct`, etc.
 */
const EMOJI_GLUE =
  /[\u200d\u20e3\ufe0e\ufe0f]|[\u{e0020}-\u{e007f}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f3fb}-\u{1f3ff}]/u;

/**
 * Converts text to ASCII, skipping anything that would break BBCode or
 * flatten an emoji.
 *
 * @param s - the text to convert
 * @returns the converted text, with decorative brackets and emoji left alone
 *
 * @remarks
 * `anyAscii` turns decorative unicode brackets (「」【】［］) into real ASCII
 * brackets, which the bbcode parser then tries to convert, and turns emoji into
 * `:emoji:` equivalents. This skips those characters.
 *
 * Conversion runs per code point, which is safe because `anyAscii` translates
 * each code point independently of its neighbours.
 *
 * @example
 * ```ts
 * safeAnyAscii('「Héllo」'); // '「Hello」'  - decoration survives
 * safeAnyAscii('[b]𝓯𝓪𝓷𝓬𝔂[/b]'); // '[b]fancy[/b]' - real bbcode untouched
 * safeAnyAscii('👍🏽 café'); // '👍🏽 cafe' - emoji kept, accent folded
 * ```
 *
 * @see {@link https://github.com/Fchat-Horizon/Horizon/issues/497}
 */
export function safeAnyAscii(s: string): string {
  let out = '';

  for (const ch of s) {
    if (ch.codePointAt(0)! < 128 || EMOJI_GLUE.test(ch)) {
      out += ch;
      continue;
    }

    const converted = anyAscii(ch);

    out +=
      /[[\]]/.test(converted) || ASCII_EMOJI_NAME.test(converted)
        ? ch
        : converted;
  }

  return out;
}
