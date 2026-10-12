import { useMemo, useState } from 'react';
import Icon from './Icon';

/**
 * Every collection, grouped by category.
 *
 * The shop has nearly sixty collections. Listed flat they are a wall; listed
 * under a menu they are fifteen links nobody reads. So this page is the place
 * they are chosen from: DTF together, UV DTF together, blanks, seasonal — each
 * with its own heading, and pills at the top that jump to a group or narrow to
 * one.
 *
 * Collections carry no tags in Shopify, so a category is a word match against
 * the collection's title and handle, set in the theme editor. That keeps the
 * grouping in the shop's hands without a second list to maintain.
 */
const ALL = 'All';

function matches(collection, terms) {
    const haystack = `${collection.title} ${collection.handle}`.toLowerCase();

    return terms.some((term) => haystack.includes(term));
}

function Card({ collection, countLabel }) {
    return (
        <a className="sm-card" href={collection.url}>
            <div className="sm-card__media">
                {collection.image ? (
                    <img src={collection.image} alt={collection.title} loading="lazy" />
                ) : (
                    <span className="sm-card__placeholder"><Icon name="image" size={22} /></span>
                )}
            </div>

            <div className="sm-card__body">
                <h3 className="sm-card__title">{collection.title}</h3>
                {countLabel && <p className="sm-card__price">{collection.count} {countLabel}</p>}
            </div>
        </a>
    );
}

export default function CollectionList({ collections = [], categories = [], countLabel = 'designs' }) {
    const [active, setActive] = useState(ALL);

    // A pill with nothing behind it is a dead end, so only categories that
    // actually match something are offered.
    const groups = useMemo(() => {
        const live = categories
            .map((category) => ({
                label: category.label,
                terms: (category.terms ?? '')
                    .split(',')
                    .map((term) => term.trim().toLowerCase())
                    .filter(Boolean),
            }))
            .filter((category) => category.terms.length > 0);

        const taken = new Set();
        const filled = [];

        live.forEach((category) => {
            // First match wins, so a UV DTF collection lands under UV DTF
            // rather than appearing again under DTF — the categories overlap
            // by their own words ("uv dtf" contains "dtf").
            const items = collections.filter(
                (collection) => !taken.has(collection.id) && matches(collection, category.terms),
            );

            items.forEach((collection) => taken.add(collection.id));

            if (items.length > 0) filled.push({ ...category, items });
        });

        const rest = collections.filter((collection) => !taken.has(collection.id));

        // Whatever no category claimed. With categories above it that is a
        // "More collections" group; on its own it is simply the list, and a
        // heading saying "More collections" over the only group there is was
        // the one thing on this page nobody could explain.
        if (rest.length > 0) {
            filled.push({ label: filled.length > 0 ? 'More collections' : '', terms: [], items: rest });
        }

        return filled;
    }, [categories, collections]);

    const shown = active === ALL ? groups : groups.filter((group) => group.label === active);

    return (
        <div className="sm-collections">
            {groups.length > 1 && (
                <div className="sm-pills" role="tablist" aria-label="Collection categories">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={active === ALL}
                        className={`sm-pill${active === ALL ? ' is-active' : ''}`}
                        onClick={() => setActive(ALL)}
                    >
                        {ALL}
                    </button>

                    {groups.filter((group) => group.label).map((group) => (
                        <button
                            type="button"
                            key={group.label}
                            role="tab"
                            aria-selected={active === group.label}
                            className={`sm-pill${active === group.label ? ' is-active' : ''}`}
                            onClick={() => setActive(group.label)}
                        >
                            {group.label}
                            <span className="sm-pill__count">{group.items.length}</span>
                        </button>
                    ))}
                </div>
            )}

            {shown.map((group) => (
                <section className="sm-collections__group" key={group.label}>
                    {group.label && (
                        <h2 className="sm-collections__heading">
                            {group.label}
                            <span className="sm-collections__tally">{group.items.length}</span>
                        </h2>
                    )}

                    <div className="sm-browse__grid">
                        {group.items.map((collection) => (
                            <Card collection={collection} countLabel={countLabel} key={collection.id} />
                        ))}
                    </div>
                </section>
            ))}

            {shown.length === 0 && (
                <p className="sm-browse__count">Nothing in that category yet.</p>
            )}
        </div>
    );
}
