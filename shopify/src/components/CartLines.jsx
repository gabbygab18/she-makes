import { useState } from 'react';
import Icon from './Icon';
import { money } from '@/lib/money';
import { changeLine, announceCartChange } from '@/lib/cart';

/**
 * The editable list of cart lines.
 *
 * Shared by the cart page and the drawer so a quantity control cannot behave
 * one way in the panel and another on the page — the bug that is impossible to
 * spot until a customer hits it.
 *
 * `onCart` hands the updated cart back to whichever surface owns the state.
 */
export default function CartLines({ items = [], currency = 'CAD', onCart }) {
    const [busyLine, setBusyLine] = useState(null);
    const [error, setError] = useState('');

    const update = async (line, quantity) => {
        setBusyLine(line);
        setError('');

        try {
            const updated = await changeLine(line, quantity);

            onCart?.(updated);
            announceCartChange(updated);
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusyLine(null);
        }
    };

    return (
        <>
            {error && <p className="sm-cart__error" role="alert">{error}</p>}

            <ul className="sm-cart__list">
                {items.map((item, index) => {
                    // Shopify numbers cart lines from 1.
                    const line = index + 1;
                    const busy = busyLine === line;

                    return (
                        <li className="sm-cart__item" key={item.key}>
                            <a href={item.url} className="sm-cart__thumb">
                                {item.image ? (
                                    <img src={item.image} alt="" loading="lazy" />
                                ) : (
                                    <span className="sm-cart__thumb-empty"><Icon name="image" size={18} /></span>
                                )}
                            </a>

                            <div className="sm-cart__details">
                                <a href={item.url} className="sm-cart__name">{item.product_title}</a>

                                {item.variant_title && item.variant_title !== 'Default Title' && (
                                    <p className="sm-mono">{item.variant_title}</p>
                                )}

                                <div className="sm-cart__controls">
                                    <div className="sm-buy__quantity">
                                        <button
                                            type="button"
                                            onClick={() => update(line, item.quantity - 1)}
                                            disabled={busy}
                                            aria-label={`Decrease quantity of ${item.product_title}`}
                                        >
                                            <Icon name="minus" size={14} />
                                        </button>
                                        <span aria-live="polite">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => update(line, item.quantity + 1)}
                                            disabled={busy}
                                            aria-label={`Increase quantity of ${item.product_title}`}
                                        >
                                            <Icon name="plus" size={14} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="sm-cart__remove"
                                        onClick={() => update(line, 0)}
                                        disabled={busy}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <span className="sm-cart__price">{money(item.final_line_price, currency)}</span>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
