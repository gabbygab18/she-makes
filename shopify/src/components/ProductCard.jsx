import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { money, discount } from '@/lib/money';
import { addItem, announceCartChange, changeLine } from '@/lib/cart';
import { useCartLine } from '@/lib/cartLines';
import { lockScroll, releaseScroll, unlockScroll } from '@/lib/scrollLock';

/**
 * One product card, wherever products are listed.
 *
 * It lived inside CollectionGrid, so the homepage strip had a hand-written
 * Liquid copy of it — and that copy had no add to cart at all. One component
 * for the strip, the browse grid and search is what stops that happening
 * again.
 */

/**
 * Add straight from the card, and change what is already in the bag.
 *
 * A button across the foot of the card rather than a disc on the artwork: the
 * disc was the one control on the card and the hardest thing on it to find,
 * and it could only ever add. Once the line is in the cart the same button
 * becomes its quantity — bin, count, plus — so a shopper can put a second one
 * in, or take it back out, without opening the drawer or the product page.
 *
 * One size adds immediately; several opens the sizes right there, so choosing
 * never costs a page load.
 *
 * The sheet is portalled onto <body>. Rendered inside the card it would be
 * trapped in whatever stacking context the grid builds around it — the same
 * thing that put the review form under the page dimmer.
 */
export function QuickAdd({ product, currency }) {
    const [state, setState] = useState('idle');
    const [open, setOpen] = useState(false);

    const sizes = product.variants ?? [];
    const needsChoice = product.variantCount > 1 && sizes.length > 1;

    // What is in the bag for this product. A product with sizes has a line per
    // size, so the card follows the one that was added.
    const [addedId, setAddedId] = useState(null);
    const watchedId = addedId ?? (needsChoice ? null : product.variantId);
    const inBag = useCartLine(watchedId);

    // Escape closes the sheet, and the page must not scroll behind it.
    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', onKey);
        lockScroll();

        return () => {
            document.removeEventListener('keydown', onKey);
            unlockScroll();
        };
    }, [open]);

    const add = async (variantId) => {
        setState('busy');

        try {
            const cart = await addItem(variantId, 1);

            // This is what opens the drawer, so the shopper sees what landed.
            announceCartChange(cart);
            setAddedId(variantId);
            setOpen(false);
            setState('done');
            setTimeout(() => setState('idle'), 2000);
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 3000);
        }
    };

    const onClick = (event) => {
        // The whole card is a link; adding must not follow it.
        event.preventDefault();
        event.stopPropagation();

        if (!product.available || state === 'busy') return;

        if (needsChoice) {
            setOpen(true);
            return;
        }

        add(product.variantId);
    };

    const label = !product.available
        ? `${product.title} is sold out`
        : needsChoice
            ? `Choose a size for ${product.title}`
            : `Add ${product.title} to cart`;

    // Short enough to sit beside the button; the full sentence stays on
    // aria-label for anyone listening rather than looking.
    // One label on every card. "Choose a size" told the shopper what the next
    // screen would ask before they had asked for anything, and put two
    // different buttons in one row of four. The sheet still opens for a
    // product with sizes — it is the same action, said the same way.
    const tip = !product.available
        ? 'Sold out'
        : state === 'done'
            ? 'Added'
            : 'Add to cart';

    /** Set this line to a new quantity; 0 removes it. */
    const setQuantity = async (next) => {
        if (!inBag || state === 'busy') return;

        setState('busy');

        try {
            const cart = await changeLine(inBag.line, Math.max(0, next));

            announceCartChange(cart);
            if (next <= 0) setAddedId(null);
            setState('idle');
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 3000);
        }
    };

    const stop = (event) => {
        // The whole card is a link; these controls must not follow it.
        event.preventDefault();
        event.stopPropagation();
    };

    if (inBag && product.available) {
        return (
            <div className="sm-cartqty" onClick={stop}>
                <button
                    type="button"
                    className="sm-cartqty__step"
                    onClick={(event) => {
                        stop(event);
                        setQuantity(inBag.quantity - 1);
                    }}
                    disabled={state === 'busy'}
                    aria-label={inBag.quantity === 1 ? `Remove ${product.title} from cart` : `One fewer ${product.title}`}
                >
                    <Icon name={inBag.quantity === 1 ? 'trash' : 'minus'} size={16} />
                </button>

                <span className="sm-cartqty__count" aria-live="polite">{inBag.quantity}</span>

                <button
                    type="button"
                    className="sm-cartqty__step"
                    onClick={(event) => {
                        stop(event);
                        setQuantity(inBag.quantity + 1);
                    }}
                    disabled={state === 'busy'}
                    aria-label={`One more ${product.title}`}
                >
                    <Icon name="plus" size={16} />
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                className={`sm-cartbtn${state === 'done' ? ' is-done' : ''}${product.available ? '' : ' is-out'}`}
                onClick={onClick}
                disabled={!product.available || state === 'busy'}
                aria-label={label}
            >
                <Icon name={state === 'done' ? 'cartAdded' : 'cartAdd'} size={17} />
                <span className="sm-cartbtn__label">{tip}</span>
            </button>

            {open && createPortal(
                <div
                    className="sm-sizes"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Sizes for ${product.title}`}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setOpen(false);
                    }}
                >
                    <div className="sm-sizes__panel">
                        <div className="sm-sizes__head">
                            <p className="sm-sizes__title">{product.title}</p>
                            <button
                                type="button"
                                className="sm-sizes__close"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                            >
                                <Icon name="close" size={16} />
                            </button>
                        </div>

                        <p className="sm-eyebrow">Choose a size</p>

                        <ul className="sm-sizes__list" role="list">
                            {sizes.map((size) => (
                                <li key={size.id}>
                                    <button
                                        type="button"
                                        className="sm-sizes__option"
                                        disabled={!size.available || state === 'busy'}
                                        onClick={() => add(size.id)}
                                    >
                                        <span>{size.title}</span>
                                        <span className="sm-sizes__price">
                                            {size.available ? money(size.price, currency) : 'Sold out'}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {state === 'error' && (
                            <p className="sm-sizes__error" role="alert">That did not go through. Try again.</p>
                        )}

                        <a className="sm-link" href={product.url}>See the full listing</a>
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}

export default function ProductCard({ product, currency }) {
    const off = discount(product.price, product.compareAt);
    const inBag = useCartLine(product.variantCount > 1 ? null : product.variantId);

    return (
        <a className="sm-card" href={product.url}>
            <div className="sm-card__media">
                {product.image ? (
                    <img src={product.image} alt={product.title} loading="lazy" />
                ) : (
                    <span className="sm-card__placeholder"><Icon name="image" size={22} /></span>
                )}

                {/* No "New" or "Best seller" labels: the shop asked for the
                    tags to go. What is left is a fact about the product — the
                    discount and whether it can be bought at all. */}
                <div className="sm-card__badges">
                    {/* "Sale", not "-69%". The number is on the price under
                        the card, struck through, where it can be compared;
                        up here it is a badge, and a badge is a word. */}
                    {off && <span className="sm-badge sm-badge--signal">Sale</span>}
                    {!product.available && <span className="sm-badge sm-badge--ink">Sold out</span>}
                </div>

                {/* What is already in the bag, on the artwork, so a shopper
                    scanning the row can see it without reading the buttons. */}
                {inBag && (
                    <span className="sm-card__inbag">
                        <Icon name="bag" size={13} />
                        {inBag.quantity} in bag
                    </span>
                )}

            </div>

            <div className="sm-card__body">
                <h3 className="sm-card__title">{product.title}</h3>
                {product.type && <p className="sm-mono">{product.type}</p>}

                {/* Judge.me syncs its score into Shopify's own rating metafield,
                    so the stars are ours to draw — the app's badge markup is
                    not needed on a card. Nothing renders when it is unset. */}
                {product.rating > 0 && (
                    <p className="sm-card__rating">
                        {/* Always five: the earned ones in gold, the rest pale. A
                            4.4 drew four stars and nothing after them, which read
                            as a broken row rather than a score. */}
                        <span className="sm-card__stars" aria-hidden="true">
                            {'★★★★★'.slice(0, Math.round(product.rating))}
                            <span className="sm-card__stars-off">{'★★★★★'.slice(Math.round(product.rating))}</span>
                        </span>
                        <span className="visually-hidden">
                            {product.rating} out of 5
                        </span>
                        {product.reviewCount > 0 && (
                            <span className="sm-card__reviews">{product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}</span>
                        )}
                    </p>
                )}

                <p className={`sm-card__price${product.compareAt > product.price ? ' sm-card__price--sale' : ''}`}>
                    {money(product.price, currency)}
                    {product.compareAt > product.price && (
                        <span className="sm-card__compare">{money(product.compareAt, currency)}</span>
                    )}
                </p>

                {/* Only when it changes the decision: sold out, or nearly.
                    "Available" under every card in a row of twenty-four is a
                    word repeated until it stops being read — the shelf is
                    already the claim that it is in stock. */}
                <p
                    className={[
                        'sm-card__stock',
                        !product.available ? 'sm-card__stock--out' : '',
                        product.available && product.inventory > 0 && product.inventory <= 3
                            ? 'sm-card__stock--low'
                            : '',
                    ].join(' ').trim()}
                >
                    {!product.available
                        ? 'Sold out'
                        : product.inventory > 0 && product.inventory <= 3
                            ? `Only ${product.inventory} left`
                            : ''}
                </p>

                <QuickAdd product={product} currency={currency} />
            </div>
        </a>
    );
}
