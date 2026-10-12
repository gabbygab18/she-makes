/**
 * Split a block of shop-written rich text into sections.
 *
 * The FAQ page and the product description are written the same way in
 * Shopify: a bold line, then what it covers, then the next bold line. Neither
 * uses real heading elements, and the product descriptions are not tidy —
 * they come out of a word processor, so a "heading" is usually a bold run
 * inside a paragraph that carries three more lines after a `<br>`:
 *
 *   <p><strong>Did you know?<br></strong><span …>We offer free local pickup…</span></p>
 *
 * Reading paragraph by paragraph gave one section holding the whole text,
 * which is how the gang-sheet page came out as a single card. So paragraphs
 * are cut at their line breaks first — however deeply nested those are — and
 * the structure is read line by line.
 *
 * A heading is a real heading element, or a line that is bold from end to end.
 * Everything after it, up to the next heading, belongs to it. Anything before
 * the first heading is returned as the intro, so nothing is dropped.
 */
const MAX_HEADING = 80;

/** Words that are abbreviations, not shouting. */
const ACRONYMS = /\b(dtf|uv|png|jpg|jpeg|svg|dpi|pdf|usa|faq|tat|cad|eta|rts|htv)\b/gi;

/** Names that keep their capitals once a shouted heading is cased down. "US"
 * only before "customers" — anywhere else "us" is the shop talking. */
const PROPER_CASE = {
    'us customers': 'US customers',
    'st. thomas': 'St. Thomas',
    canada: 'Canada',
    canadian: 'Canadian',
    london: 'London',
    ontario: 'Ontario',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    canva: 'Canva',
    shemakes: 'SHEmakes',
};
const PROPER = /\b(us customers|st\. thomas|canada|canadian|london|ontario|instagram|tiktok|facebook|canva|shemakes)\b/gi;

export function splitByHeadings(html) {
    if (!html) return { intro: '', items: [] };

    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');

    const intro = [];
    const items = [];

    toLines(doc.body.firstChild).forEach((node) => {
        // Emptiness is a question about the text, not the markup: the editor
        // leaves `<p><strong> </strong></p>` behind, which is 26 characters of
        // nothing. Counting it as content is what kept an empty row alive.
        if (isBlank(node)) return;

        if (isHeadingNode(node)) {
            items.push({ heading: node.textContent.trim(), body: '', text: '' });
            return;
        }

        const markup = node.nodeType === 1 ? node.outerHTML : node.textContent;

        if (!markup.trim()) return;

        if (items.length === 0) {
            intro.push(markup);
            return;
        }

        const last = items[items.length - 1];

        last.body += markup;
        last.text = `${last.text} ${node.textContent.trim()}`.trim();
    });

    // A bold line with nothing under it is not a section.
    //
    // The shop signs its FAQ off with "Instagram @shemakestransfers" and
    // "TikTok @shemakestransfers" in bold, and the editor leaves one more bold
    // line that is empty. Each of those became its own accordion row with
    // nothing inside — two rows that opened onto blank, and one row with no
    // label at all. They belong to the answer they were written under.
    const merged = [];
    let carried = '';

    items.forEach((item, index) => {
        const heading = carried ? `${carried} ${item.heading}`.trim() : item.heading;

        carried = '';

        if (item.body.trim() !== '') {
            merged.push({ heading: tidy(heading), body: item.body, text: item.text });
            return;
        }

        if (!heading) return;

        // Two bold lines in a row are one label split over two: "Step 1:" and
        // then what step one is. The first carries into the second rather than
        // becoming a card that opens onto nothing.
        const next = items[index + 1];

        if (next && next.body.trim() !== '') {
            carried = heading;
            return;
        }

        const line = `<p><strong>${escapeHtml(heading)}</strong></p>`;

        if (merged.length > 0) merged[merged.length - 1].body += line;
        else intro.push(line);
    });

    // Every heading being bodyless means the whole block is a list of bold
    // lines, and folding them all away would empty the page. Keep the original.
    return { intro: intro.join(''), items: merged.length > 0 ? merged : items };
}

/**
 * The top-level nodes, with every paragraph broken at its line breaks.
 *
 * Lists, images and real headings are left whole — only a paragraph hides a
 * heading behind a `<br>`.
 */
function toLines(root) {
    const out = [];

    Array.from(root.childNodes).forEach((node) => {
        const isParagraph = node.nodeType === 1 && node.tagName === 'P';

        if (!isParagraph || !node.querySelector('br')) {
            out.push(node);
            return;
        }

        splitAtBreaks(node).forEach((piece) => {
            if (piece !== null) out.push(piece);
        });
    });

    return out;
}

/**
 * Clone a node, cut at every `<br>` inside it, however deep.
 *
 * The pieces come back with `null` between them, so a break found three levels
 * down splits its ancestors too — which is the point: the break in
 * `<strong>Did you know?<br></strong>` has to end the bold line rather than
 * sit inside it.
 */
function splitAtBreaks(node) {
    if (node.nodeType !== 1) return [node.cloneNode(true)];
    if (node.tagName === 'BR') return [null];

    const pieces = [[]];

    Array.from(node.childNodes).forEach((child) => {
        splitAtBreaks(child).forEach((part) => {
            if (part === null) pieces.push([]);
            else pieces[pieces.length - 1].push(part);
        });
    });

    return pieces.flatMap((children, index) => {
        const clone = node.cloneNode(false);

        children.forEach((child) => clone.appendChild(child));

        return index === 0 ? [clone] : [null, clone];
    });
}

/** A real heading element, or a line that is bold from end to end. */
function isHeadingNode(node) {
    if (node.nodeType !== 1) return false;
    if (/^H[1-6]$/.test(node.tagName)) return true;
    if (node.tagName !== 'P') return false;

    const text = node.textContent.trim();

    if (!text) return false;

    // A heading is a short line, so a bold paragraph that runs on is a bold
    // paragraph — not a section title.
    if (text.length > MAX_HEADING) return false;

    // Bold from end to end, whatever the markup around it. Asking for a single
    // <strong> child missed most of the shop's headings, because theirs are
    // wrapped in coloured spans, italics and highlights.
    if (!node.querySelector('strong, b')) return false;

    const stripped = node.cloneNode(true);

    stripped.querySelectorAll('strong, b').forEach((bold) => bold.remove());

    return stripped.textContent.trim() === '';
}

/** Nothing to read and nothing to look at. */
function isBlank(node) {
    if (node.textContent.trim() !== '') return false;

    return node.nodeType !== 1 || !node.querySelector('img, svg, iframe, video, hr');
}

/**
 * The label as a label.
 *
 * The shop writes these as running copy — "QUICK TIPS:" shouted, a trailing
 * colon on half of them. Neither survives being set as a title, and neither
 * changes a word of what the shop wrote.
 */
function tidy(heading) {
    const trimmed = heading.replace(/[\s:：]+$/, '').trim();

    // Only a line that is shouting end to end gets cased down. A line that
    // mixes cases — "GAME CHANGER right here!" — was written that way on
    // purpose.
    const letters = trimmed.replace(/[^A-Za-z]/g, '');
    const shouting = letters.length > 2 && letters === letters.toUpperCase();

    if (!shouting) return trimmed;

    // Sentence case, as the shop asked: a capital to open each sentence and
    // nowhere else. Title Case On Every Word read as shouting by other means.
    const cased = trimmed
        .toLowerCase()
        .replace(/(^|[.?!]\s+)([a-z])/g, (match, before, letter) => before + letter.toUpperCase())
        .replace(/\bi\b/g, 'I');

    // Casing down a shouted line turns the trade's own words into nonsense —
    // "Dtf & Uv Care" — and places into common nouns. These keep the shop's
    // own capitals.
    return cased
        .replace(ACRONYMS, (word) => word.toUpperCase())
        .replace(PROPER, (word) => PROPER_CASE[word.toLowerCase()] ?? word);
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
