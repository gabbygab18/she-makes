import { useState } from 'react';
import Icon from './Icon';
import ShippingBar from './ShippingBar';
import CartLines from './CartLines';
import { money } from '@/lib/money';

/**
 * The cart page.
 *
 * Quantities change in place — no page reload between "I want three of these"
 * and seeing what that costs — and the free-shipping countdown recalculates
 * with every change, which is the whole reason the cart is an island.
 *
 * The initial cart is rendered by Liquid and handed over, so the page is
 * complete before this script runs.
 */
export default function CartView({ cart: initial, threshold = 15000, currency = 'CAD', checkoutUrl = '/checkout' }) {
    const [cart, setCart] = useState(initial);

    if (!cart || cart.item_count === 0) {
        return (
            <div className="sm-cart__empty">
                <Icon name="image" size={28} />
                <p>Nothing in the cart yet.</p>
                <a href="/collections/all" className="sm-button sm-button--primary">Browse ready to press</a>
            </div>
        );
    }

    return (
        <div className="sm-cart">
            <div className="sm-cart__lines">
                <ShippingBar total={cart.total_price} threshold={threshold} currency={currency} />

                <CartLines items={cart.items} currency={currency} onCart={setCart} />
            </div>

            <aside className="sm-cart__summary">
                <h2>Order summary</h2>

                <dl>
                    <div>
                        <dt>Subtotal</dt>
                        <dd>{money(cart.total_price, currency)}</dd>
                    </div>
                </dl>

                <p className="sm-cart__note">Shipping and taxes are worked out at checkout.</p>

                <a href={checkoutUrl} className="sm-button sm-button--primary sm-cart__checkout">
                    Go to checkout
                </a>
            </aside>
        </div>
    );
}
