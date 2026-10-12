import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import ShippingBar from './ShippingBar';
import CartLines from './CartLines';
import CartUpsell from './CartUpsell';
import { money } from '@/lib/money';
import { getCart } from '@/lib/cart';
import { lockScroll, releaseScroll, unlockScroll } from '@/lib/scrollLock';

/**
 * The cart side panel.
 *
 * The theme's own drawer had to go: its stylesheet and its script were both
 * loaded by the stock header, which this redesign replaces, so it rendered as
 * unstyled markup at the top of every page and could not be opened. This is
 * the replacement, and it reuses the cart page's own line controls.
 *
 * It opens on two things and nothing else:
 *
 *   • a click on anything marked `data-sm-cart-open` — the header button
 *   • `shemakes:cart:updated`, which every add-to-cart already dispatches, so
 *     adding something shows what was added
 *
 * The header button stays a real link to /cart. The click is only intercepted
 * once this component is mounted, so with no JavaScript the cart page is still
 * one click away.
 */
export default function CartDrawer({ threshold = 15000, currency = 'CAD', checkoutUrl = '/checkout', upsell = [],
}) {
    const [open, setOpen] = useState(false);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const closeRef = useRef(null);

    useEffect(() => {
        const onOpen = (event) => {
            const trigger = event.target.closest?.('[data-sm-cart-open]');

            if (!trigger) return;
            // Let a modified click open the cart page in a new tab as usual.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

            event.preventDefault();
            setOpen(true);
            setLoading(true);
            getCart()
                .then(setCart)
                .finally(() => setLoading(false));
        };

        const onUpdated = (event) => {
            const detail = event.detail;

            setOpen(true);

            // Only a real cart has a line count. `/cart/add.js` returns the
            // line it added, and drawing that gives an empty panel with a
            // $0.00 subtotal — so fetch the cart rather than trust the event.
            if (detail && typeof detail.item_count === 'number' && Array.isArray(detail.items)) {
                setCart(detail);
                return;
            }

            setLoading(true);
            getCart()
                .then(setCart)
                .finally(() => setLoading(false));
        };

        document.addEventListener('click', onOpen);
        document.addEventListener('shemakes:cart:updated', onUpdated);

        return () => {
            document.removeEventListener('click', onOpen);
            document.removeEventListener('shemakes:cart:updated', onUpdated);
        };
    }, []);

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', onKey);
        // The page behind a panel must not scroll with it. Counted, because
        // the size sheet may still be holding the lock when this opens.
        lockScroll();
        closeRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', onKey);
            unlockScroll();
        };
    }, [open]);

    const empty = !loading && (!cart || cart.item_count === 0);

    return (
        <div
            className={`sm-drawer${open ? ' is-open' : ''}`}
            aria-hidden={!open}
            // On the container rather than the overlay alone: anything that
            // lands between the overlay and the pointer — an app widget, a
            // stacking context — would otherwise swallow "click outside".
            onMouseDown={(event) => {
                if (!event.target.closest('.sm-drawer__panel')) setOpen(false);
            }}
        >
            <div className="sm-drawer__overlay" />

            <aside
                className="sm-drawer__panel"
                role="dialog"
                aria-modal="true"
                aria-label="Cart"
                // A closed panel must not be reachable by tab.
                {...(open ? {} : { inert: '' })}
            >
                <header className="sm-drawer__head">
                    <h2>Your cart</h2>
                    <button
                        type="button"
                        ref={closeRef}
                        className="sm-drawer__close"
                        onClick={() => setOpen(false)}
                        aria-label="Close cart"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </header>

                <div className="sm-drawer__body">
                    {loading && <p className="sm-body">Loading…</p>}

                    {empty && (
                        <div className="sm-cart__empty">
                            <Icon name="image" size={28} />
                            <p>Nothing in the cart yet.</p>
                            <a href="/collections/all" className="sm-button sm-button--primary">
                                Browse ready to press
                            </a>
                        </div>
                    )}

                    {!loading && cart && cart.item_count > 0 && (
                        <>
                            <ShippingBar total={cart.total_price} threshold={threshold} currency={currency} />
                            <CartLines items={cart.items} currency={currency} onCart={setCart} />
                            <CartUpsell items={cart.items} currency={currency} onCart={setCart} chosen={upsell} />
                        </>
                    )}
                </div>

                {!empty && cart && (
                    <footer className="sm-drawer__foot">
                        <div className="sm-drawer__total">
                            <span>Subtotal</span>
                            <strong>{money(cart.total_price, currency)}</strong>
                        </div>

                        <p className="sm-cart__note">Shipping and taxes are worked out at checkout.</p>

                        <a href={checkoutUrl} className="sm-button sm-button--primary sm-cart__checkout">
                            Go to checkout
                        </a>

                        <a href="/cart" className="sm-button sm-button--secondary">View cart</a>
                    </footer>
                )}
            </aside>
        </div>
    );
}
