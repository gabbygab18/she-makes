/**
 * Shopify's AJAX Cart API.
 *
 * The storefront's cart lives on Shopify, not in this bundle — these are thin
 * wrappers so no component has to remember the endpoints or the shape.
 *
 * Every call returns the updated cart, and every failure throws with the
 * message Shopify actually gave, so a component can show it rather than a
 * guess ("sold out", "only 3 left").
 */
async function request(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.description || data.message || 'That did not work.');
    }

    return data;
}

/**
 * Add, then return the whole cart.
 *
 * `/cart/add.js` answers with the line it just added — not the cart. It has no
 * `item_count`, no `items` array and no `total_price`, so handing that to the
 * drawer drew an empty panel with a $0.00 subtotal directly after a successful
 * add. One extra request, and every caller gets what it actually needs.
 */
export async function addItem(variantId, quantity = 1, properties) {
    await request('/cart/add.js', {
        items: [{ id: variantId, quantity, properties }],
    });

    return getCart();
}

/** `line` is 1-based, as Shopify numbers cart lines. */
export function changeLine(line, quantity) {
    return request('/cart/change.js', { line, quantity });
}

export async function getCart() {
    const response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });

    return response.json();
}

/**
 * Tell the theme the cart moved.
 *
 * Dawn's own header count and drawer listen for their own events; dispatching
 * this keeps them in step with what the island just did, instead of the page
 * showing two different totals.
 */
export function announceCartChange(cart) {
    document.dispatchEvent(new CustomEvent('shemakes:cart:updated', { detail: cart }));
    document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
}
