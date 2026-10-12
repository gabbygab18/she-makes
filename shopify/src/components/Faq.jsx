import { useMemo, useState } from 'react';
import { accent } from '@/lib/accent';
import { splitByHeadings } from '@/lib/richtext';

/**
 * The questions asked before a first order, answered on the page where they
 * are being asked.
 *
 * Several can be open at once — someone comparing turnaround against shipping
 * should not have the first answer close as they open the second.
 *
 * The marker is a plus that becomes a minus, and the panel animates open, so
 * this and the page accordion are visibly the same component. They were not:
 * this one kept a chevron long after the stylesheet had stopped drawing one.
 */
export default function Faq({ eyebrow, heading, body, items = [], cta, secondary, html = '', limit = 5 }) {
    const [open, setOpen] = useState([0]);

    // Given the FAQ page's content, the questions are that page's — split the
    // same way the FAQ page splits them, so the two can never drift. The
    // blocks stay as the fallback for a shop that would rather write a short
    // list here by hand.
    const shown = useMemo(() => {
        if (!html) return items;

        const fromPage = splitByHeadings(html).items.map((item) => ({
            question: item.heading,
            answer: item.body,
        }));

        return fromPage.length > 0 ? fromPage.slice(0, limit) : items;
    }, [html, items, limit]);

    if (shown.length === 0) return null;

    const toggle = (index) => {
        setOpen((current) =>
            current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
        );
    };

    return (
        <div className="sm-section">
            <div className="sm-container">
                <div className="sm-faq sm-faq--split">
                    <div className="sm-faq__head">
                        {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                        {heading && <h2 className="sm-heading">{accent(heading)}</h2>}
                        {body && <p className="sm-body">{body}</p>}

                    </div>

                    <div className="sm-faq__list">
                        {shown.map((item, index) => {
                            const isOpen = open.includes(index);

                            return (
                                <div className={`sm-faq__item${isOpen ? ' is-open' : ''}`} key={item.question}>
                                    <button
                                        type="button"
                                        className="sm-faq__question"
                                        aria-expanded={isOpen}
                                        aria-controls={`sm-faq-panel-${index}`}
                                        id={`sm-faq-button-${index}`}
                                        onClick={() => toggle(index)}
                                    >
                                        <span>{item.question}</span>
                                        <span className="sm-faq__marker" aria-hidden="true">
                                            <span className="sm-faq__bar" />
                                            <span className="sm-faq__bar sm-faq__bar--up" />
                                        </span>
                                    </button>

                                    <div
                                        className="sm-faq__panel"
                                        id={`sm-faq-panel-${index}`}
                                        role="region"
                                        aria-labelledby={`sm-faq-button-${index}`}
                                        aria-hidden={!isOpen}
                                    >
                                        <div className="sm-faq__panel-inner">
                                            <div
                                                className="sm-faq__answer"
                                                dangerouslySetInnerHTML={{ __html: item.answer }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* The way out comes after the questions, not before
                            them: read the answers first, then ask. */}
                        {(cta?.label || secondary?.label) && (
                            <div className="sm-faq__actions">
                                {cta?.label && (
                                    <a href={cta.url || '#'} className="sm-button sm-button--primary">{cta.label}</a>
                                )}
                                {secondary?.label && (
                                    <a href={secondary.url || '#'} className="sm-button sm-button--secondary">{secondary.label}</a>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
