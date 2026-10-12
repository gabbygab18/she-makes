/**
 * Headings are set in two faces: Satoshi for the sentence, Playfair for the
 * part being emphasised.
 *
 * Which part is the shop's decision, not the theme's, so it is marked in the
 * text itself with asterisks — the same convention the Liquid snippet uses:
 *
 *   Ready to scale your business with *websites and automation?*
 *
 * An unclosed asterisk leaves the text exactly as typed rather than swallowing
 * the rest of the heading, because a typo in the theme editor should not eat
 * half a headline.
 */
export function accent(text) {
    if (typeof text !== 'string' || !text.includes('*')) return text;

    const parts = text.split('*');

    // An odd number of asterisks means one is unclosed.
    if (parts.length % 2 === 0) return text;

    return parts.map((part, index) =>
        index % 2 === 1
            ? <em className="sm-heading__accent" key={index}>{part}</em>
            : part,
    );
}
