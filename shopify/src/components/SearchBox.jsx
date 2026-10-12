import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { money } from '@/lib/money';

/**
 * The header search, with results as you type.
 *
 * The form underneath is Shopify's ordinary GET to /search and stays that way:
 * pressing Enter, or having no JavaScript, gives the full results page. This
 * only adds the shortcut — Shopify's own predictive endpoint
 * (/search/suggest.json), which reads the same index the results page does, so
 * the dropdown can never disagree with the page it links to.
 */
const ENDPOINT = '/search/suggest.json';
const LIMIT = 6;

function useSuggestions(term) {
    const [state, setState] = useState({ products: [], collections: [], loading: false });

    useEffect(() => {
        const query = term.trim();

        if (query.length < 2) {
            setState({ products: [], collections: [], loading: false });
            return undefined;
        }

        // One request per pause in typing, and the one before it is dropped —
        // otherwise a slow early response lands after a fast late one and the
        // list shows results for a word that is no longer in the box.
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setState((current) => ({ ...current, loading: true }));

            const url =
                `${ENDPOINT}?q=${encodeURIComponent(query)}` +
                `&resources[type]=product,collection&resources[limit]=${LIMIT}` +
                '&resources[options][unavailable_products]=last';

            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                const data = await response.json();
                const results = data?.resources?.results ?? {};

                setState({
                    products: results.products ?? [],
                    collections: results.collections ?? [],
                    loading: false,
                });
            } catch (error) {
                if (error.name === 'AbortError') return;

                setState({ products: [], collections: [], loading: false });
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [term]);

    return state;
}

export default function SearchBox({
    action = '/search',
    placeholder = 'Search designs, sizes…',
    value = '',
    currency = 'CAD',
}) {
    const [term, setTerm] = useState(value);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const box = useRef(null);

    const { products, collections, loading } = useSuggestions(term);
    const rows = [...products, ...collections];
    const hasResults = rows.length > 0;

    useEffect(() => setActive(-1), [term]);

    // Clicking anywhere else puts the dropdown away.
    useEffect(() => {
        if (!open) return undefined;

        const onPointer = (event) => {
            if (!box.current?.contains(event.target)) setOpen(false);
        };

        document.addEventListener('mousedown', onPointer);

        return () => document.removeEventListener('mousedown', onPointer);
    }, [open]);

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            return;
        }

        if (!hasResults) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setActive((current) => {
                const next = event.key === 'ArrowDown' ? current + 1 : current - 1;

                if (next < 0) return rows.length - 1;
                if (next >= rows.length) return 0;

                return next;
            });
            return;
        }

        // Enter with nothing highlighted submits the form, which is the whole
        // results page — the dropdown is a shortcut, not a replacement.
        if (event.key === 'Enter' && active >= 0) {
            event.preventDefault();
            window.location.href = rows[active].url;
        }
    };

    const query = term.trim();

    return (
        <div className="sm-search" ref={box}>
            <form action={action} method="get" role="search" className="sm-header__search">
                <label className="visually-hidden" htmlFor="sm-search">Search</label>

                <Icon name="search" size={15} />

                <input
                    id="sm-search"
                    type="search"
                    name="q"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={term}
                    onChange={(event) => {
                        setTerm(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    aria-expanded={open && hasResults}
                    aria-controls="sm-search-results"
                />
            </form>

            {open && query.length >= 2 && (
                <div className="sm-search__panel" id="sm-search-results" role="listbox">
                    {hasResults ? (
                        <>
                            <ul className="sm-search__list" role="list">
                                {products.map((product, index) => (
                                    <li key={product.id}>
                                        <a
                                            className={`sm-search__row${active === index ? ' is-active' : ''}`}
                                            href={product.url}
                                            onMouseEnter={() => setActive(index)}
                                        >
                                            {product.image ? (
                                                <img src={product.image} alt="" loading="lazy" />
                                            ) : (
                                                <span className="sm-search__thumb" />
                                            )}

                                            <span className="sm-search__text">
                                                <span className="sm-search__title">{product.title}</span>
                                                {/* The endpoint answers in dollars as a string;
                                                    the rest of the theme counts in cents. */}
                                                <span className="sm-search__price">
                                                    {money(Math.round(Number(product.price) * 100), currency)}
                                                </span>
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>

                            {collections.length > 0 && (
                                <ul className="sm-search__list sm-search__list--plain" role="list">
                                    {collections.map((collection, index) => (
                                        <li key={collection.id}>
                                            <a
                                                className={`sm-search__row sm-search__row--plain${
                                                    active === products.length + index ? ' is-active' : ''
                                                }`}
                                                href={collection.url}
                                                onMouseEnter={() => setActive(products.length + index)}
                                            >
                                                <Icon name="filter" size={14} />
                                                <span className="sm-search__title">{collection.title}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <a className="sm-search__all" href={`${action}?q=${encodeURIComponent(query)}`}>
                                See everything for “{query}”
                                <Icon name="arrowRight" size={14} />
                            </a>
                        </>
                    ) : (
                        <p className="sm-search__empty">
                            {loading ? 'Looking…' : `Nothing matches “${query}” yet.`}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
