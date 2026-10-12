import { useEffect, useState } from 'react';
import Icon from './Icon';
import { money } from '@/lib/money';
import { addItem, announceCartChange } from '@/lib/cart';

/**
 * What else goes with what is already in the bag.
 *
 * Shopify works the pairing out itself — `/recommendations/products.json` with
 * the first line's product — so the shop keeps no list and nothing goes stale
 * when a design is retired. Anything already in the cart is dropped, because
 * recommending what somebody has just added reads as a page that is not
 * paying attention.
 *
 * It is quiet by design: three products, small, under the lines and above the
 * subtotal. A drawer is opened to check out, not to shop again.
 */
export default function CartUpsell({ items = [], currency, onCart, chosen = [] }) {
    const [picks, setPicks] = useState([]);
    const [busy, setBusy] = useState(null);

    const seedId = items[0]?.product_id ?? null;
    const have = items.map((item) => item.product_id).join(',');

    useEffect(() => {
        // The shop's own list, when it has named one in Theme settings. It is
        // not a suggestion then — it is what the drawer offers, minus whatever
        // is already in the bag.
        if (chosen.length > 0) {
            const inCart = new Set(items.map((item) => item.product_id));

            setPicks(chosen.filter((product) => !inCart.has(product.id)).slice(0, 3));
            return undefined;
        }

        if (!seedId) {
            setPicks([]);
            return undefined;
        }

        let live = true;
        const inCart = new Set(items.map((item) => item.product_id));

        const ask = (intent) =>
            fetch(`/recommendations/products.json?product_id=${seedId}&limit=6&intent=${intent}`, {
                headers: { Accept: 'application/json' },
            })
                .then((response) => response.json())
                .then((data) =>
                    (data.products ?? []).filter((product) => product.available && !inCart.has(product.id)),
                )
                .catch(() => []);

        // `complementary` is the shop's own "goes with this" list, set in
        // Search & Discovery. It is empty until somebody fills it in, so this
        // falls back to what Shopify works out on its own rather than showing
        // nothing on a store that never opened that app.
        ask('complementary')
            .then((picked) => (picked.length > 0 ? picked : ask('related')))
            .then((picked) => {
                if (live) setPicks(picked.slice(0, 3));
            });

        return () => {
            live = false;
        };
    }, [seedId, have, chosen.length]);

    if (picks.length === 0) return null;

    const add = async (product) => {
        // A recommended product arrives with its variants; one named in Theme
        // settings arrives with the id Liquid already resolved.
        const variantId =
            product.variantId ?? (product.variants?.find((v) => v.available) ?? product.variants?.[0])?.id;

        if (!variantId || busy) return;

        setBusy(product.id);

        try {
            const cart = await addItem(variantId, 1);

            announceCartChange(cart);
            onCart?.(cart);
        } finally {
            setBusy(null);
        }
    };

    return (
        <section className="sm-upsell" aria-label="Add these too">
            <h3 className="sm-upsell__title">Add these too</h3>

            <ul className="sm-upsell__list" role="list">
                {picks.map((product) => (
                    <li className="sm-upsell__item" key={product.id}>
                        <a className="sm-upsell__media" href={product.url} tabIndex={-1} aria-hidden="true">
                            {product.featured_image ? (
                                <img src={product.featured_image} alt="" loading="lazy" />
                            ) : (
                                <span className="sm-card__placeholder"><Icon name="image" size={16} /></span>
                            )}
                        </a>

                        <div className="sm-upsell__copy">
                            <a className="sm-upsell__name" href={product.url}>{product.title}</a>
                            <p className="sm-upsell__price">{money(product.price, currency)}</p>
                        </div>

                        <button
                            type="button"
                            className="sm-upsell__add"
                            onClick={() => add(product)}
                            disabled={busy === product.id}
                            aria-label={`Add ${product.title} to cart`}
                        >
                            {busy === product.id ? <Icon name="check" size={16} /> : <Icon name="plus" size={16} />}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
