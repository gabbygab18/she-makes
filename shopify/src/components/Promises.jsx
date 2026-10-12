import Icon from './Icon';
import { accent } from '@/lib/accent';

/**
 * The four promises: free shipping, made here, guaranteed, real reviews.
 *
 * The copy, when the shop gives it one, sits beside the cards rather than
 * above them — four claims in a row read as a list to get through, and a
 * sentence holding them together turns the same four into the argument it is
 * making.
 */
export default function Promises({ items = [], eyebrow = '', heading = '', body = '' }) {
    if (items.length === 0) return null;

    return (
        <div className="sm-section">
            <div className="sm-container sm-promises">
                {(heading || body) && (
                    <div className="sm-promises__lead">
                        {eyebrow && <p className="sm-eyebrow">{eyebrow}</p>}
                        {heading && <h2 className="sm-heading sm-heading--md">{accent(heading)}</h2>}
                        {body && <p className="sm-body">{body}</p>}
                    </div>
                )}
                <ul className="sm-promises__grid">
                    {items.map((item) => {
                        // A promise with a link is the whole card: "Real reviews"
                        // should take you to the reviews.
                        const Wrap = item.url ? 'a' : 'div';

                        return (
                        <li className={`sm-promise${item.photo ? ' sm-promise--photo' : ''}`} key={item.title}>
                        <Wrap className="sm-promise__link" href={item.url || undefined}>
                            <span className="sm-promise__icon">
                                {/* An uploaded icon wins over the built-in glyph, so the
                                    shop is not limited to what this theme happens to ship. */}
                                {item.image
                                    ? <img src={item.image} alt={item.alt || ''} loading="lazy" />
                                    : <Icon name={item.icon} />}
                            </span>
                            <h3 className="sm-promise__title">{item.title}</h3>
                            <p className="sm-promise__body">{item.body}</p>
                            {item.photo && <img className="sm-promise__photo" src={item.photo} alt="" loading="lazy" />}
                        </Wrap>
                        </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
