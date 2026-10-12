import { useMemo, useState } from 'react';
import { accent } from '@/lib/accent';
import { splitByHeadings } from '@/lib/richtext';

/**
 * A page of rich text, turned into the accordion from the redesign.
 *
 * The shop writes its FAQ in Shopify's page editor as one long column: a bold
 * question, then the answer, then the next bold question. It reads as a wall,
 * which is what it looked like on the storefront.
 *
 * The parsing happens here rather than in Liquid because the browser already
 * has an HTML parser. Splitting tags with Liquid string filters would break on
 * the first nested `<strong>` — and this content is full of them.
 *
 * A heading is either a real heading element, or a paragraph whose entire
 * content is bold. Everything after it, up to the next heading, is its answer.
 * Anything before the first heading stays as an intro, so nothing is lost.
 */
export default function PageFaq({ title, eyebrow, html, cta }) {
    // The parser is shared with the product description: both are written
    // the same way, as bold lines with prose under them.
    const { intro, items } = useMemo(() => {
        const split = splitByHeadings(html);

        return { intro: split.intro, items: split.items.map((item) => ({ question: item.heading, answer: item.body })) };
    }, [html]);
    const [open, setOpen] = useState(0);

    // Nothing recognisable as a question: show the page as it was written
    // rather than an empty accordion.
    if (items.length === 0) {
        return (
            <div className="sm-section">
                <div className="sm-container">
                    <header className="sm-page__head">
                        {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                        <h1 className="sm-heading sm-heading--md">{accent(title)}</h1>
                    </header>
                    <div className="sm-prose rte" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            </div>
        );
    }

    return (
        <div className="sm-section sm-section--blush">
            <div className="sm-container sm-faq-page">
                <header className="sm-page__head">
                    {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                    <h1 className="sm-heading sm-heading--md">{accent(title)}</h1>
                    {intro && <div className="sm-prose rte" dangerouslySetInnerHTML={{ __html: intro }} />}
                </header>

                <ul className="sm-faq__list" role="list">
                    {items.map((item, index) => {
                        const isOpen = open === index;

                        return (
                            <li className={`sm-faq__item${isOpen ? ' is-open' : ''}`} key={item.question}>
                                <button
                                    type="button"
                                    className="sm-faq__question"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpen(isOpen ? null : index)}
                                >
                                    <span>{item.question}</span>
                                    <span className="sm-faq__marker" aria-hidden="true">
                                        <span className="sm-faq__bar" />
                                        <span className="sm-faq__bar sm-faq__bar--up" />
                                    </span>
                                </button>

                                <div className="sm-faq__panel" role="region" aria-hidden={!isOpen}>
                                    <div className="sm-faq__panel-inner">
                                        <div
                                            className="sm-faq__answer sm-prose rte"
                                            dangerouslySetInnerHTML={{ __html: item.answer }}
                                        />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {cta?.label && (
                    <div className="sm-page__cta sm-page__cta--photo">
                        {cta.image && (
                            <div className="sm-page__cta-media" aria-hidden="true">
                                <img src={cta.image} alt="" loading="lazy" />
                                <span className="sm-page__cta-scrim" />
                            </div>
                        )}

                        <div>
                            <h2 className="sm-heading sm-heading--md">{accent(cta.heading)}</h2>
                            {cta.body && <p className="sm-body">{cta.body}</p>}
                        </div>
                        <a href={cta.url || '#'} className="sm-button sm-button--primary">{cta.label}</a>
                    </div>
                )}
            </div>
        </div>
    );
}
