import anyAscii from 'any-ascii';

// what anyAscii turns emoji into, e.g. ':emoji:'. nothing below U+2000
// converts to this shape, so it can't match real text
const ASCII_EMOJI_NAME = /^:[a-z0-9_+-]+:$/;

// preserves emoji sequences (hands with skin tones, people variations, etc.)
const EMOJI_GLUE =
  /[\u200d\u20e3\ufe0e\ufe0f]|[\u{e0020}-\u{e007f}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f3fb}-\u{1f3ff}]/u;

// anyAscii turns decorative unicode brackets (「」【】［］) into real ASCII
// brackets, which the bbcode parser then tries to convert. emojis are also
// converted to :emoji: equivalents. this skips those characters
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
