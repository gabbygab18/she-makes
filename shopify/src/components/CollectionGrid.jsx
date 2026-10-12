import { useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import ProductCard from './ProductCard';

/**
 * Browse — where the mega-menu went.
 *
 * Filtering happens in the browser against the products Liquid already
 * rendered, so narrowing a list is instant rather than a page load. Sorting
 * and paging stay on Shopify: those need the whole catalogue, not one page of
 * it, and pretending otherwise would quietly show the wrong results.
 *
 * The card itself lives in ProductCard, because the homepage strip draws it
 * too.
 */
/**
 * Price bands, the way the template lists them.
 *
 * Fixed rather than derived from the page: a band that changes as you page
 * through is not a filter anyone can use. Cents, like everything else here.
 * `max: null` is the open-ended top band.
 */
const PRICE_BANDS = [
    { label: 'Under $10', min: 0, max: 999 },
    { label: '$10 – $24.99', min: 1000, max: 2499 },
    { label: '$25 – $49.99', min: 2500, max: 4999 },
    { label: '$50 and up', min: 5000, max: null },
];

const PRICE_GROUP = 'Price';

export default function CollectionGrid({ products = [], filters = [], currency = 'CAD', prompt }) {
    const [active, setActive] = useState({});
    const [open, setOpen] = useState(false);
    const results = useRef(null);

    /**
     * Put the shopper back at the top of the grid.
     *
     * Ticking a filter three screens down redraws the rows above where they
     * are looking, so the page appears to have done nothing.
     */
    const backToResults = () => {
        const node = results.current;

        if (!node) return;

        const top = node.getBoundingClientRect().top + window.scrollY - 110;

        if (window.scrollY <= top) return;

        window.scrollTo({ top, behavior: 'smooth' });
    };

    const shown = useMemo(() => {
        const groups = Object.entries(active).filter(([, values]) => values.length > 0);

        if (groups.length === 0) return products;

        // Within a group the values are alternatives (OR); across groups they
        // narrow each other (AND) — which is what a shopper expects.
        return products.filter((product) =>
            groups.every(([group, values]) => {
                if (group === PRICE_GROUP) {
                    return values.some((label) => {
                        const band = PRICE_BANDS.find((item) => item.label === label);

                        if (!band) return false;

                        return product.price >= band.min && (band.max === null || product.price <= band.max);
                    });
                }

                return values.some((value) => (product.tags ?? []).includes(value) || product.type === value);
            }),
        );
    }, [products, active]);

    const toggle = (group, value) => {
        backToResults();

        setActive((current) => {
            const values = current[group] ?? [];

            return {
                ...current,
                [group]: values.includes(value)
                    ? values.filter((item) => item !== value)
                    : [...values, value],
            };
        });
    };

    const activeCount = Object.values(active).flat().length;

    // No groups means Shopify's own filters are on the page — they narrow the
    // whole collection rather than this page of it, so drawing a second set
    // here would be two sidebars disagreeing with each other.
    const ownFilters = filters.length > 0;

    return (
        <div className={`sm-browse${ownFilters ? '' : ' sm-browse--plain'}`}>
            {ownFilters && (
            <button
                type="button"
                className="sm-browse__toggle sm-button sm-button--secondary"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                <Icon name="filter" size={16} />
                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
            )}

            {ownFilters && (
            <aside className={`sm-browse__filters${open ? ' is-open' : ''}`}>
                <p className="sm-browse__filters-title">
                    <Icon name="filter" size={16} />
                    Filter
                </p>

                {[...filters, { label: PRICE_GROUP, values: PRICE_BANDS.map((band) => band.label) }].map((group) => (
                    <fieldset key={group.label}>
                        <legend className="sm-eyebrow">{group.label}</legend>

                        {group.values.map((value) => (
                            <label key={value} className="sm-browse__option">
                                <input
                                    type="checkbox"
                                    checked={(active[group.label] ?? []).includes(value)}
                                    onChange={() => toggle(group.label, value)}
                                />
                                {value}
                            </label>
                        ))}
                    </fieldset>
                ))}

                {activeCount > 0 && (
                    <button type="button" className="sm-browse__clear" onClick={() => setActive({})}>
                        Clear all
                    </button>
                )}
            </aside>
            )}

            <div className="sm-browse__results" ref={results}>
                {/* Liquid prints the collection-wide count under the heading.
                    This one only appears once a filter is on, because then the
                    two numbers genuinely differ. */}
                {activeCount > 0 && (
                    <p className="sm-browse__count">
                        {shown.length} of {products.length} on this page match
                    </p>
                )}

                {shown.length === 0 ? (
                    <div className="sm-browse__empty">
                        <p>Nothing on this page matches those filters.</p>
                        <button type="button" className="sm-button sm-button--secondary" onClick={() => setActive({})}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="sm-browse__grid">
                        {shown.map((product) => (
                            <ProductCard key={product.id} product={product} currency={currency} />
                        ))}
                    </div>
                )}

                {prompt?.heading && (
                    <div className="sm-browse__prompt">
                        <div>
                            <h2>{prompt.heading}</h2>
                            <p>{prompt.body}</p>
                        </div>
                        <a href={prompt.url || '#'} className="sm-button sm-button--primary">{prompt.label}</a>
                    </div>
                )}
            </div>
        </div>
    );
}
