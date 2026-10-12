import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppMarkup } from '@/lib/useAppMarkup';
import { accent } from '@/lib/accent';

/**
 * The "Let customers speak for us" row, redrawn.
 *
 * Judge.me's Classic carousel lays each slide out as a 30% image beside a 70%
 * review, both inline-blocks. At the widths this design uses, the picture ends
 * up on top of the words — and Judge.me is retiring the Classic layout anyway.
 *
 * Same approach as the review list: wait for the app's markup, read it, draw
 * the shop's own cards, and hide the original. Nothing is re-fetched and no
 * token is involved; the reviews are already on the page.
 *
 * If the app never loads, or renames its classes, the carousel stays exactly
 * as it was. That is a worse-looking row, not a missing one.
 *
 * The row is swiped, not watched. It used to scroll itself — two copies of
 * the list under a CSS marquee — and a quote that will not hold still is a
 * quote nobody finishes. Scroll-snap does the job on a phone, where a flick
 * is the obvious thing to try; a mouse has no such instinct and the scrollbar
 * is hidden, so two arrows scroll it by one card and go dim at each end.
 *
 * The score and the review count are settings rather than something read off
 * the app: Judge.me prints its average in a badge this section cannot count
 * on being present, and a summary that silently disappears is worse than one
 * the shop types once a quarter.
 */
const ITEM = '.jdgm-carousel-item';

/**
 * The thumbnail, as Judge.me serves it.
 *
 * It requests a 56px file. Asking the CDN for a larger copy — either the
 * `_320x320` filename or `?width=320` — answers 200 but the image never
 * finishes loading in this context, and the cards came up blank. So the
 * original URL is used and the card shows it at the size it actually is.
 */
function thumb(image) {
    if (!image) return '';

    // The app lazy-loads: the real URL sits in data-src until it does.
    return image.getAttribute('data-src') || image.getAttribute('src') || '';
}

/** One of the app's slides, as this theme's card. */
function read(node) {
    const text = (selector) => node.querySelector(selector)?.textContent?.trim() ?? '';
    const image = node.querySelector('.jdgm-carousel-item__product-image');
    const scored = node.querySelector('[data-score]');
    const score = Number(scored?.getAttribute('data-score'));

    return {
        id:
            node.getAttribute('data-review-id') ||
            text('.jdgm-carousel-item__reviewer-name') + text('.jdgm-carousel-item__review-title'),
        rating: Number.isFinite(score) && score > 0 ? score : 5,
        title: text('.jdgm-carousel-item__review-title'),
        body: text('.jdgm-carousel-item__review-body'),
        name: text('.jdgm-carousel-item__reviewer-name'),
        // The app lazy-loads: the real URL sits in data-src until it does.
        image: thumb(image),
        alt: image?.getAttribute('alt') || '',
    };
}

/**
 * The shop's arrow. One glyph, turned around for the other direction, rather
 * than the two text arrows this used — `←` and `→` come from whatever face
 * is loaded and sat at a different weight from everything around them.
 */
function Arrow({ back = false }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            style={back ? { transform: 'rotate(180deg)' } : undefined}
        >
            <path d="M6 13h8.09l-3.3 3.29 1.42 1.42 5.7-5.71-5.7-5.71-1.42 1.42 3.3 3.29H6z" />
        </svg>
    );
}

export default function ReviewCarousel({
    eyebrow,
    heading = 'Let customers speak for us',
    rating = '',
    count = '',
    hint = '',
    cta = null,
    secondary = null,
}) {
    const items = useAppMarkup({
        selector: ITEM,
        read,
        rootClass: 'sm-has-review-carousel',
    });

    const rail = useRef(null);
    const [edges, setEdges] = useState({ start: true, end: true });

    // Which arrows are worth pressing. A rail shorter than its own width has
    // both ends at once, which is how a single review hides them both.
    const measure = useCallback(() => {
        const node = rail.current;

        if (!node) return;

        const max = node.scrollWidth - node.clientWidth;

        setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft >= max - 1 });
    }, []);

    useEffect(() => {
        measure();

        // The cards arrive from the app, so the rail's width changes after the
        // first paint, and again whenever the window does.
        window.addEventListener('resize', measure);

        return () => window.removeEventListener('resize', measure);
    }, [measure, items]);

    // One card and its gap, measured rather than assumed.
    const nudge = (direction) => {
        const node = rail.current;
        const card = node?.firstElementChild;

        if (!node || !card) return;

        const gap = parseFloat(getComputedStyle(node).columnGap) || 0;

        node.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
    };


    const slides = (items ?? []).filter((item) => item.body);

    if (slides.length === 0) return null;

    return (
        <section className="sm-section">
            <div className="sm-container">
                <div className="sm-reviews__head">
                    {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                    <h2 className="sm-heading sm-heading--md">{accent(heading)}</h2>

                    {/* The verdict before the evidence: a shopper deciding
                        whether to read any of this wants the number first. */}
                    {(rating || count) && (
                        <p className="sm-reviews__summary">
                            <span className="sm-reviews__stars" aria-hidden="true">{'★★★★★'}</span>
                            {rating && <span className="sm-reviews__average">{rating}</span>}
                            {count && <span className="sm-reviews__count">{count}</span>}
                        </p>
                    )}
                </div>

                <ul className="sm-reviews__rail" role="list" ref={rail} onScroll={measure}>
                    {slides.map((item) => (
                        <li className="sm-reviews__slide" key={item.id}>
                            <span className="sm-reviews__stars" aria-hidden="true">
                                {'★★★★★'.slice(0, Math.round(item.rating))}
                            </span>
                            <span className="visually-hidden">{item.rating} out of 5</span>

                            {item.title && <p className="sm-reviews__title">{item.title}</p>}
                            <p className="sm-reviews__body">{item.body}</p>

                            <div className="sm-reviews__by">
                                {/* Judge.me serves a 56px file, so it is shown small
                                    rather than blown up into a blur. Not lazy: the
                                    browser kept deferring these and the cards showed
                                    empty frames. */}
                                {item.image && <img src={item.image} alt={item.alt} />}

                                <div>
                                    {item.name && <p className="sm-reviews__name">{item.name}</p>}
                                    {item.alt && <p className="sm-reviews__product">{item.alt}</p>}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="sm-reviews__foot">
                    {!(edges.start && edges.end) && (
                        <div className="sm-reviews__arrows">
                            <button
                                type="button"
                                className="sm-reviews__arrow"
                                aria-label="Previous reviews"
                                disabled={edges.start}
                                onClick={() => nudge(-1)}
                            >
                                <Arrow back />
                            </button>
                            <button
                                type="button"
                                className="sm-reviews__arrow"
                                aria-label="More reviews"
                                disabled={edges.end}
                                onClick={() => nudge(1)}
                            >
                                <Arrow />
                            </button>
                        </div>
                    )}

                    {hint && slides.length > 1 && (
                        <p className="sm-reviews__hint">
                            {hint} <Arrow />
                        </p>
                    )}

                    <div className="sm-reviews__links">
                        {cta?.label && cta?.url && (
                            <a className="sm-link" href={cta.url}>
                                {cta.label} <Arrow />
                            </a>
                        )}
                        {secondary?.label && secondary?.url && (
                            <a className="sm-button sm-button--secondary sm-reviews__secondary" href={secondary.url}>
                                {secondary.label}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
