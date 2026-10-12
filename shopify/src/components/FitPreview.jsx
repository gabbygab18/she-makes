import { useState } from 'react';

import { accent } from '@/lib/accent';

/**
 * "What size transfer do I need?" — the question the shop answers by hand
 * every week.
 *
 * Transfers are sold by the inch and shirts are not, so this gives back the
 * inches to order for a garment size, drawn at the real proportion of that
 * garment's chest. The shop's own guideline:
 *
 *   Baby 4–5", Toddler 5–6", Youth 7–8", Adult 10–11", Plus sized 12–13"
 *   Left chest 3–4", centre front 11"
 *
 * It is a proportion, not a mock-up of anyone's artwork — the honest thing to
 * show, and it needs no photography from the shop to be useful.
 */
function Tee({ width, children }) {
    return (
        <div className="sm-fit__tee" style={{ width }}>
            <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
                <path
                    d="M70 12 L40 26 L12 56 L34 78 L50 66 L50 208 L150 208 L150 66 L166 78 L188 56 L160 26 L130 12
                       C124 26 112 32 100 32 C88 32 76 26 70 12 Z"
                    fill="var(--sm-shell)"
                    stroke="var(--sm-line)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>

            {children}
        </div>
    );
}

export default function FitPreview({
    eyebrow = '',
    heading = '',
    body = '',
    garments = [],
    cta = null,
    note = '',
    blurb_heading: blurbHeading = '',
    blurb_body: blurbBody = '',
}) {
    const sizes = garments.filter((garment) => garment.chest > 0);

    // Opens where most orders sit: an adult tee, printed across the front.
    const [sizeIndex, setSizeIndex] = useState(() => {
        const adult = sizes.findIndex((garment) => /adult/i.test(garment.label));

        return adult === -1 ? Math.max(0, sizes.length - 1) : adult;
    });

    if (sizes.length === 0) return null;

    // One scale for everything on the stage: an inch is the same number of
    // pixels whichever garment is picked, so a 13" print on a plus-sized tee
    // is visibly bigger than an 8" print on a youth one. The widest garment
    // sets the scale, and the drawing is twice the chest wide because the
    // sleeves sit either side of the body.
    const widest = sizes.reduce((best, garment) => Math.max(best, garment.chest), 0);
    const stage = widest * 2;

    const size = sizes[Math.min(sizeIndex, sizes.length - 1)];

    // The garment's own guideline, front print: baby 4–5", adult 10–11", and
    // so on. A left chest print is the same 3–4" on any size, which is a line
    // of small print rather than a control of its own.
    const low = size.min;
    const high = size.max;
    const drawn = high;
    const range = low === high ? `${high}″` : `${low}–${high}″`;

    return (
        <div className="sm-section sm-fit">
            <div className="sm-container">
                <div className="sm-fit__head">
                    {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                    {heading && <h2 className="sm-heading sm-heading--md">{accent(heading)}</h2>}
                    {body && <p className="sm-body sm-fit__intro">{body}</p>}
                </div>

                <div className="sm-fit__grid">
                    <div className="sm-fit__stage">
                        <div className="sm-fit__scale">
                            <Tee width={`${(size.chest * 2 * 100) / stage}%`}>
                                <span
                                    className="sm-fit__print sm-fit__print--centre"
                                    style={{
                                        // Both are shares of the same stage, so the
                                        // print keeps its real size against the shirt.
                                        width: `${(drawn * 100) / (size.chest * 2)}%`,
                                        aspectRatio: '1 / 0.62',
                                    }}
                                >
                                    {drawn / size.chest > 0.3 && (
                                        <span className="sm-fit__print-size">{drawn}″</span>
                                    )}
                                </span>
                            </Tee>
                        </div>

                        <p className="sm-mono sm-fit__stage-note">
                            {size.label} &middot; print {range}
                        </p>
                    </div>

                    <div className="sm-fit__controls">
                        <fieldset className="sm-fit__field">
                            <legend className="sm-eyebrow">Pick a garment size</legend>

                            <div className="sm-fit__pills">
                                {sizes.map((garment, index) => (
                                    <button
                                        type="button"
                                        key={garment.label}
                                        className={`sm-pill${index === sizeIndex ? ' is-active' : ''}`}
                                        aria-pressed={index === sizeIndex}
                                        onClick={() => setSizeIndex(index)}
                                    >
                                        {garment.label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>



                        {note && <p className="sm-fit__note">{note}</p>}

                        {(blurbHeading || blurbBody) && (
                            <div className="sm-fit__blurb">
                                {blurbHeading && <p className="sm-fit__blurb-heading">{blurbHeading}</p>}
                                {blurbBody && <p className="sm-fit__blurb-body">{blurbBody}</p>}
                            </div>
                        )}

                        {cta?.label && (
                            <a className="sm-button sm-button--primary" href={cta.url || '#'}>
                                {cta.label}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
