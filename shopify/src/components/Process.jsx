import { useState } from 'react';
import Icon from './Icon';
import { accent } from '@/lib/accent';

/**
 * Inside the shop.
 *
 * Hovering a panel expands it and the others give up their width — the
 * interaction is the whole reason this is React rather than a grid of Liquid
 * cards. Focus does the same thing, so a keyboard reaches every panel.
 */
export default function Process({ eyebrow, heading, body, items = [] }) {
    const [active, setActive] = useState(0);

    if (items.length === 0) return null;

    return (
        <div className="sm-section">
            <div className="sm-container">
                {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                {heading && <h2 className="sm-heading">{accent(heading)}</h2>}
                {body && <p className="sm-body">{body}</p>}

                <div className="sm-process__row">
                    {items.map((item, index) => (
                        <article
                            key={item.title}
                            className={`sm-process__panel${index === active ? ' is-active' : ''}`}
                            onMouseEnter={() => setActive(index)}
                            onFocus={() => setActive(index)}
                            tabIndex={0}
                        >
                            {item.image && <img src={item.image} alt="" className="sm-process__image" />}

                            <span className="sm-process__scrim" aria-hidden="true" />

                            <span className="sm-process__play" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </span>

                            <h3 className="sm-process__title">{item.title}</h3>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
