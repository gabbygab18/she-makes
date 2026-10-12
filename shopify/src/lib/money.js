/**
 * Money crosses the wire in cents, as Shopify stores it, and becomes a string
 * only at the edge — one place to make the rounding decision.
 */
export function money(cents, currency = 'CAD') {
    const value = (Number(cents) || 0) / 100;

    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
        }).format(value);
    } catch (error) {
        // An unknown currency code should not break a price.
        return `$${value.toFixed(2)}`;
    }
}

/** "-25%" for a compare-at price, or null when there is nothing to show. */
export function discount(price, compareAt) {
    if (!compareAt || compareAt <= price) return null;

    return `-${Math.round((1 - price / compareAt) * 100)}%`;
}
