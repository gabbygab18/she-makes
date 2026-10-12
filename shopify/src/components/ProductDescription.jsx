import { useMemo, useState } from 'react';
import { splitByHeadings } from '@/lib/richtext';

/**
 * The product description, as cards.
 *
 * The shop writes it as one long column — a bold line, a paragraph, another
 * bold line — which on a product page is a wall between the buy button and
 * everything under it. Same parse as the FAQ page: the bold lines are headings
 * in everything but markup, so each becomes a card.
 *
 * The copy is not rewritten. Summarising here would mean editing the shop's own
 * product text, across every product, with no way for them to review it. What
 * this does instead is show the first part of a long card and let the reader
 * open the rest — the length is still theirs to change.
 *
 * Nothing recognisable as a heading means the description is left exactly as it
 * was written.
 */
/**
 * Each section is a row that opens in place.
 *
 * Clamping to a height with a "Read more" meant the card grew past the fold
 * every time it was opened, in a column a third of the page wide. A row that
 * opens where it sits, across the full width, needs no scrolling back.
 *
 * Same accordion as the FAQ — one component to learn, not two.
 */
function Row({ item, startOpen, index }) {
    const [open, setOpen] = useState(startOpen);

    // What the section says, in one line, while it is shut. Long enough to
    // tell two sections apart and short enough not to be the section itself.
    const preview = (item.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 110);

    return (
        <li className={`sm-faq__item${open ? ' is-open' : ''}`}>
            <button
                type="button"
                className="sm-faq__question"
                aria-expanded={open}
                onClick={() => setOpen((was) => !was)}
            >
                <span className="sm-spec__label">
                    <span className="sm-spec__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <span className="sm-spec__heading-text">
                        {item.heading}
                        {preview && !open && (
                            <span className="sm-spec__preview">{preview}{item.text.length > 110 ? '…' : ''}</span>
                        )}
                    </span>
                </span>
                <span className="sm-faq__marker" aria-hidden="true">
                    <span className="sm-faq__bar" />
                    <span className="sm-faq__bar sm-faq__bar--up" />
                </span>
            </button>

            <div className="sm-faq__panel" role="region" aria-hidden={!open}>
                <div className="sm-faq__panel-inner">
                    <div
                        className="sm-faq__answer sm-prose rte"
                        dangerouslySetInnerHTML={{ __html: item.body }}
                    />
                </div>
            </div>
        </li>
    );
}

export default function ProductDescription({ html, heading }) {
    const { intro, items } = useMemo(() => {
        const split = splitByHeadings(html);

        return {
            intro: split.intro,
            // Carry the plain text along so the card can tell whether it is
            // long enough to be worth collapsing.
            items: split.items,
        };
    }, [html]);

    // A description with no bold lines in it is still a description: it gets
    // the same card as everything else, open, rather than becoming loose prose
    // on a page where every other product shows cards.
    const rows = items.length > 0
        ? items
        : [{ heading: heading || 'Product details', body: html, text: '' }];

    if (!html || !html.trim()) return null;

    return (
        <section className="sm-product__description">
            {heading && items.length > 0 && (
                <h2 className="sm-heading sm-heading--md sm-spec__title">{heading}</h2>
            )}

            {/* With no headings the intro *is* the description, and the card
                below already holds it — rendering both printed it twice. */}
            {intro && items.length > 0 && (
                <div className="sm-prose rte sm-spec__intro" dangerouslySetInnerHTML={{ __html: intro }} />
            )}

            <ul className="sm-faq__list sm-spec__list" role="list">
                {rows.map((item, index) => (
                    <Row item={item} startOpen={index === 0} index={index} key={item.heading} />
                ))}
            </ul>
        </section>
    );
}
