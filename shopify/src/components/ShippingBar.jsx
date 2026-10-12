import Icon from './Icon';
import { money } from '@/lib/money';

/**
 * The free-shipping countdown.
 *
 * The threshold used to be announced once in a banner and never mentioned
 * again. Here it is a number that keeps counting down on the screen where it
 * can still change the order — the cheapest change on the plan, and the one
 * measured by average order value.
 */
export default function ShippingBar({ total = 0, threshold = 15000, currency = 'CAD' }) {
    const remaining = Math.max(0, threshold - total);
    const percent = threshold > 0 ? Math.min(100, Math.round((total / threshold) * 100)) : 0;

    return (
        <div className="sm-shipbar">
            {/* The truck rides the fill, the way the shop's live cart does it. */}
            <div
                className="sm-shipbar__track"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress towards free shipping"
            >
                {/* The colour is the reading: red while the order is a long
                    way off free shipping, amber as it gets close, green once
                    it is there. The width alone was a pink bar on a pink
                    panel, which told the shopper nothing from across a
                    phone. */}
                <div
                    className={[
                        'sm-shipbar__fill',
                        percent >= 100 ? 'is-done' : percent >= 60 ? 'is-close' : 'is-far',
                    ].join(' ')}
                    style={{ width: `${percent}%` }}
                />
                <span className="sm-shipbar__truck" style={{ left: `${percent}%` }} aria-hidden="true">
                    <Icon name="truck" size={18} />
                </span>
            </div>

            <p className="sm-shipbar__text">
                {remaining === 0 ? (
                    'Your order ships free.'
                ) : (
                    <>
                        You are only <span className="sm-shipbar__amount">{money(remaining, currency)}</span> from Free Shipping!
                    </>
                )}
            </p>

            <p className="sm-shipbar__meta">{money(threshold, currency)}</p>
        </div>
    );
}
