import { accent } from '@/lib/accent';

/**
 * The picture-review wall.
 *
 * Full bleed on purpose: the row runs off both edges so it reads as a stream
 * of finished garments rather than a row of cards in a box. Rendered twice so
 * the loop has no seam; the copy is hidden from assistive technology.
 */
export default function Gallery({ heading, body, photos = [], speed = 60, cta }) {
    if (photos.length === 0) return null;

    return (
        <div className="sm-section">
            <div className="sm-container sm-gallery__head">
                {heading && <h2 className="sm-heading">{accent(heading)}</h2>}
                {body && <p className="sm-body">{body}</p>}
            </div>

            <div className="sm-marquee" style={{ '--sm-marquee-duration': `${speed}s` }}>
                <div className="sm-marquee__track">
                    {[false, true].map((isClone) => (
                        <ul className="sm-marquee__list" key={String(isClone)} aria-hidden={isClone || undefined}>
                            {photos.map((photo, index) => (
                                <li className="sm-marquee__item" key={`${photo}-${index}`}>
                                    <img src={photo} alt="" loading="lazy" />
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </div>

            {cta?.label && (
                <div className="sm-container sm-gallery__cta">
                    <a href={cta.url || '#'} className="sm-button sm-button--primary">{cta.label}</a>
                </div>
            )}
        </div>
    );
}
