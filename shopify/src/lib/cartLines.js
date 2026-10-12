import { useEffect, useState } from 'react';
import { getCart } from './cart';

/**
 * What is already in the cart, by variant.
 *
 * A card has to know whether the thing it is showing is in the bag: the button
 * is "Add to cart" until it is, and the quantity after. Every card asking
 * Shopify for itself would be one request per card on a page of twenty-four,
 * so the answer is fetched once and handed out.
 *
 * It is kept in step by the same event the drawer listens to, so adding from
 * one card updates the others without a reload.
 */
let lines = new Map();
let loaded = false;
let inFlight = null;
const listeners = new Set();

function index(cart) {
    const next = new Map();

    (cart?.items ?? []).forEach((item, i) => {
        // Shopify numbers cart lines from 1, and `change.js` wants that number.
        next.set(item.variant_id, { quantity: item.quantity, line: i + 1 });
    });

    lines = next;
    loaded = true;
    listeners.forEach((fn) => fn());
}

function load() {
    if (inFlight) return inFlight;

    inFlight = getCart()
        .then(index)
        .catch(() => {
            // A cart that cannot be read is an empty one as far as the cards
            // are concerned; the add still goes to Shopify and still answers.
            loaded = true;
            listeners.forEach((fn) => fn());
        })
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
}

if (typeof document !== 'undefined') {
    document.addEventListener('shemakes:cart:updated', (event) => {
        if (event.detail?.items) index(event.detail);
        else load();
    });
}

/** The line for one variant, or null. Re-renders when the cart changes. */
export function useCartLine(variantId) {
    const [, bump] = useState(0);

    useEffect(() => {
        const fn = () => bump((n) => n + 1);

        listeners.add(fn);

        if (!loaded) load();

        return () => listeners.delete(fn);
    }, []);

    if (!variantId) return null;

    return lines.get(variantId) ?? null;
}
