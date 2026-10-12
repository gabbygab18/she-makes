import { useMemo, useState } from 'react';
import Icon from './Icon';
import { money, discount } from '@/lib/money';
import { addItem, announceCartChange } from '@/lib/cart';

/**
 * The product page's buying panel.
 *
 * Every answer above the add-to-cart: size and price together, press, peel,
 * shipping and pickup — the questions that used to arrive as messages before
 * anyone would order.
 *
 * Prices come from Shopify's own variant objects, so what is shown is what the
 * cart will charge. Nothing here decides a price.
 */
export default function ProductPanel({
    variants = [],
    specs = [],
    currency = 'CAD',
    compareAt = null,
    gangSheetUrl,
    stockThreshold = 20,
    service = false,
    optionName = '',
}) {
    // The choice is named for what it is: sizes on a transfer, the number of
    // gang sheets on the rush fee.
    const choiceLabel = !optionName || /size|title/i.test(optionName) ? 'Choose a size' : optionName;
    const available = variants.filter((variant) => variant.available);
    const [variantId, setVariantId] = useState((available[0] ?? variants[0])?.id ?? null);
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState({ state: 'idle', message: '' });

    const variant = useMemo(
        () => variants.find((item) => item.id === variantId) ?? null,
        [variants, variantId],
    );

    const unit = variant?.price ?? 0;
    const off = discount(unit, compareAt);

    const submit = async (event) => {
        event.preventDefault();

        if (!variant) return;

        setStatus({ state: 'busy', message: '' });

        try {
            const cart = await addItem(variant.id, quantity);

            announceCartChange(cart);
            setStatus({ state: 'done', message: 'Added to your cart.' });
        } catch (error) {
            // Shopify's own message — "only 3 left", "sold out" — is more use
            // than anything this component could invent.
            setStatus({ state: 'error', message: error.message });
        }
    };

    return (
        <form className="sm-buy" onSubmit={submit}>
            <div className="sm-buy__price">
                <span className="sm-buy__amount">{money(unit, currency)}</span>
                {compareAt > unit && (
                    <span className="sm-buy__compare">{money(compareAt, currency)}</span>
                )}
                {off && <span className="sm-buy__off">Sale</span>}
            </div>

            {/* How many are left, when it is few enough to matter.
                --------------------------------------------------------------

                Three things have to agree before it shows: the shop tracks
                stock on that variant, the count is at or under the shop's own
                threshold, and the product is not tagged to keep it off. A
                count is the one line that answers "should I decide now", and
                on a product with four hundred in a drawer it answers nothing.

                So it is per product without needing a switch on every one:
                turn tracking off, or tag it `hide-stock`, and it stays quiet.
            */}
            {stockThreshold > 0 && variant?.available && variant.inventory > 0 && variant.inventory <= stockThreshold && (
                <p className="sm-buy__stock">
                    <span className="sm-buy__dot" aria-hidden="true" />
                    {variant.inventory} left
                </p>
            )}

            {variants.length > 1 && (
                <fieldset className="sm-buy__sizes">
                    <legend className="sm-eyebrow">{choiceLabel}</legend>

                    <div className="sm-buy__size-grid">
                        {variants.map((option) => (
                            <label
                                key={option.id}
                                className={[
                                    'sm-buy__size',
                                    option.id === variantId ? 'is-selected' : '',
                                    option.available ? '' : 'is-unavailable',
                                ].join(' ').trim()}
                            >
                                <input
                                    type="radio"
                                    name="variant"
                                    className="visually-hidden"
                                    checked={option.id === variantId}
                                    disabled={!option.available}
                                    onChange={() => setVariantId(option.id)}
                                />
                                <span className="sm-buy__size-label">{option.title}</span>
                                <span className="sm-buy__size-price">{money(option.price, currency)}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}

            <div className="sm-buy__actions">
                <div className="sm-buy__quantity">
                    <button
                        type="button"
                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                        aria-label="Decrease quantity"
                    >
                        <Icon name="minus" size={16} />
                    </button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                        type="button"
                        onClick={() =>
                            setQuantity((value) =>
                                Math.min(
                                    // Never more than the shop has, when the
                                    // shop is counting.
                                    variant?.inventory > 0 ? variant.inventory : 999,
                                    value + 1,
                                ),
                            )
                        }
                        aria-label="Increase quantity"
                    >
                        <Icon name="plus" size={16} />
                    </button>
                </div>

                <button
                    type="submit"
                    className="sm-button sm-button--primary sm-buy__submit"
                    disabled={!variant?.available || status.state === 'busy'}
                >
                    {variant?.available
                        ? `${status.state === 'busy' ? 'Adding…' : 'Add to cart'} · ${money(unit * quantity, currency)}`
                        : 'Sold out'}
                </button>
            </div>

            {status.message && (
                <p
                    className={`sm-buy__status${status.state === 'error' ? ' is-error' : ''}`}
                    role={status.state === 'error' ? 'alert' : 'status'}
                >
                    {status.message}
                    {status.state === 'done' && (
                        <> <a href="/cart">View cart</a></>
                    )}
                </p>
            )}

            {/* The quantity break, offered here rather than discovered at
                checkout — which is the point of showing it at all. */}
            {!service && quantity < 6 && gangSheetUrl && (
                <p className="sm-buy__hint">
                    <Icon name="star" size={15} />
                    Ordering more than six? A gang sheet drops your cost per print by up to 40%.
                    <a href={gangSheetUrl}>Open the builder</a>
                </p>
            )}

            {!service && specs.length > 0 && (
                <dl className="sm-buy__specs">
                    {specs.map((spec) => (
                        <div key={spec.label}>
                            <dt>{spec.label}</dt>
                            <dd>{spec.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </form>
    );
}
