import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { accent } from '@/lib/accent';

/**
 * The hero: two doors, one decision.
 *
 * The statistics count up the first time they are scrolled to — the one piece
 * of behaviour here that Liquid cannot do, and the reason this is an island
 * rather than a template.
 */
function useCountUp(duration = 1600) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) return undefined;

        // Asked for no motion: show the finished figure and stop.
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (reduced || !('IntersectionObserver' in window)) {
            setValue(1);
            return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting || started.current) return;

                started.current = true;
                const start = performance.now();

                const tick = (now) => {
                    const progress = Math.min(1, (now - start) / duration);
                    // Ease out: the number settles rather than stopping dead.
                    const eased = 1 - Math.pow(1 - progress, 3);

                    setValue(eased);

                    if (progress < 1) requestAnimationFrame(tick);
                };

                requestAnimationFrame(tick);
            });
        }, { threshold: 0.4 });

        observer.observe(node);

        return () => observer.disconnect();
    }, [duration]);

    return [value, ref];
}

function Stat({ value, label, icon = '', note = '', url = '' }) {
    // Every figure counts up together, keeping its decimals: "1–2" rises as
    // a range, "4.9/5" as a score. The "/5" a score is out of stays put.
    const [progress, ref] = useCountUp();
    const shown = String(value ?? '').replace(/(\/?)(\d+(?:\.(\d+))?)/g, (whole, slash, n, dec = '') =>
        slash ? whole : (Number(n) * progress).toFixed(dec.length));

    return (
        <div className="sm-stats__cell" ref={ref}>
            {/* The whole cell is the link, not a word inside it: the figure is
                what people tap. */}
            {url && <a className="sm-stats__cover" href={url} aria-label={`${value} ${label}`.trim()} />}
            {icon && icon !== 'none' && (
                <span className="sm-stats__icon" aria-hidden="true"><Icon name={icon} size={20} /></span>
            )}

            <div className="sm-stats__text">
                {value && (
                    <dd className="sm-stats__value">
                        {shown}
                    </dd>
                )}
                {label && <dt className="sm-stats__label">{label}</dt>}
                {note && <p className="sm-stats__note">{note}</p>}
            </div>
        </div>
    );
}

/**
 * Play the hero video where it will not cost the shopper their data plan.
 *
 * A phone is not the problem — the file size is. So this asks the connection
 * rather than the screen: anyone on Data Saver, or on a 2G/3G-class link, gets
 * the poster image instead, and so does anyone who has asked for less motion.
 * Everywhere else, phones included, the video plays.
 *
 * `display: none` would still download it, which is why this decides before
 * the element exists.
 */
function useCanPlayVideo() {
    const [can, setCan] = useState(false);

    useEffect(() => {
        const still = window.matchMedia?.('(prefers-reduced-motion: reduce)');

        if (still?.matches) return undefined;

        // Not in every browser; absent means "no reason to hold back".
        const link = navigator.connection;
        const thin = link?.saveData === true || /^(slow-)?2g$|^3g$/.test(link?.effectiveType ?? '');

        if (thin) return undefined;

        setCan(true);

        return undefined;
    }, []);

    return can;
}

export default function Hero({
    image,
    video,
    pill,
    heading,
    body,
    primary,
    secondary,
    rating,
    ratingUrl = '',
    ratingHeading = '',
    stats = [],
}) {
    const canPlayVideo = useCanPlayVideo();

    // The score is a way to the reviews when the shop gives it somewhere to go.
    const ScoreTag = ratingUrl ? 'a' : 'p';

    return (
        <>
            <div className="sm-hero">
                {/* The video is decoration: muted, looping, and never the only
                    way to see anything. The image stays as its poster, so the
                    hero is complete before a single frame has loaded — and on a
                    phone the stylesheet hides the video outright, because it is
                    a 23MB download for a background. */}
                {video && canPlayVideo ? (
                    <video
                        className="sm-hero__video"
                        src={video}
                        poster={image || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                        tabIndex={-1}
                    />
                ) : null}

                {image && <img src={image} alt="" className="sm-hero__image" />}

                <div className="sm-hero__scrim" />
                <div className="sm-hero__scrim sm-hero__scrim--foot" />

                <div className="sm-container">
                    <div className="sm-hero__inner">
                        {pill && <span className="sm-hero__pill">{pill}</span>}
                        {heading && <h1 className="sm-hero__heading">{accent(heading)}</h1>}
                        {body && <p className="sm-hero__body">{body}</p>}

                        {(primary?.label || secondary?.label) && (
                            <div className="sm-hero__actions">
                                {primary?.label && (
                                    <a href={primary.url || '#'} className="sm-button sm-button--primary">
                                        {primary.label}
                                    </a>
                                )}
                                {secondary?.label && (
                                    <a href={secondary.url || '#'} className="sm-button sm-button--ghost-light">
                                        {secondary.label}
                                    </a>
                                )}
                            </div>
                        )}

                        {rating && (
                            // The shop's own band: who is speaking, five
                            // outlined stars, then the score — and the score
                            // is the link down to the reviews it counts.
                            <div className="sm-hero__rating sm-hero__rating--band">
                                {ratingHeading && <p className="sm-hero__rating-heading">{ratingHeading}</p>}
                                <span className="sm-hero__stars" aria-hidden="true">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <svg key={i} viewBox="0 0 24 24" fill="currentColor">
                                            <path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.6l-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z" />
                                        </svg>
                                    ))}
                                </span>
                                <ScoreTag className="sm-hero__rating-score" href={ratingUrl || undefined}>{rating}</ScoreTag>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {stats.length > 0 && (
                <div className="sm-stats">
                    <div className="sm-container">
                        <dl className="sm-stats__grid">
                            {stats.map((stat) => (
                                <Stat
                                    key={stat.label || stat.value}
                                    value={stat.value}
                                    label={stat.label}
                                    icon={stat.icon}
                                    note={stat.note}
                                    url={stat.url}
                                />
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </>
    );
}
