import { useEffect, useState } from 'react';

/**
 * Read markup a Shopify app injects, and take over the display of it.
 *
 * Judge.me does not put its reviews in the page: its script builds them after
 * load. Two components need the same three things from that — wait for it,
 * read it, and mark the page so a stylesheet can hide the app's own version —
 * and both had their own copy of the waiting and watching, which is where the
 * differences crept in: one stopped observing after the first hit and froze
 * its list, the other kept going.
 *
 *   selector   what to read, e.g. '.jdgm-rev'
 *   read       one node -> one object
 *   rootClass  put on <html> once something was found; the stylesheet keys off
 *              it to hide the app's own markup. A class rather than `hidden`
 *              on the node, because the app re-renders and puts its markup
 *              straight back.
 *   ready      optional: the app has answered, even with nothing to show —
 *              used to tell "still loading" apart from "no reviews yet"
 *
 * Returns null until the app answers, then an array — possibly empty.
 */
export function useAppMarkup({ selector, read, rootClass, ready }) {
    const [items, setItems] = useState(null);

    useEffect(() => {
        const collect = () => {
            const answered = ready ? Boolean(document.querySelector(ready)) : true;
            const nodes = [...document.querySelectorAll(selector)];

            if (!answered) return false;
            if (!ready && nodes.length === 0) return false;

            // Never go back to nothing.
            //
            // Judge.me re-renders its widget while the page is open, and for a
            // moment the nodes are gone — the carousel read that as "no
            // reviews" and unmounted itself, which is why the row appeared and
            // then vanished a few seconds later. An empty read after a good one
            // is treated as a blink, not as an answer.
            setItems((current) => (
                current && current.length > 0 && nodes.length === 0 ? current : nodes.map(read)
            ));

            if (rootClass) document.documentElement.classList.add(rootClass);

            return true;
        };

        const found = collect();

        // Keep watching either way: the app pages more in after its first
        // render, and stopping at the first hit froze the list at whatever
        // had landed by then.
        const observer = new MutationObserver(() => collect());

        observer.observe(document.body, { childList: true, subtree: true });

        // The app not loading at all is a normal outcome — an ad blocker, a
        // slow network. Stop watching rather than observing forever.
        const giveUp = setTimeout(() => observer.disconnect(), found ? 8000 : 15000);

        return () => {
            observer.disconnect();
            clearTimeout(giveUp);
        };
        // Every call site passes constants, so this runs once by design.
    }, []);

    return items;
}

/**
 * Wait for a node the app builds on demand.
 *
 * The review form does not exist until about a second after its link is
 * clicked. Querying for it straight after the click found nothing, so it was
 * never moved into the panel — the whole bug behind "the pop-up does nothing".
 */
export function waitForNode(selector, timeout = 4000) {
    return new Promise((resolve) => {
        const existing = document.querySelector(selector);

        if (existing) {
            resolve(existing);
            return;
        }

        const observer = new MutationObserver(() => {
            const node = document.querySelector(selector);

            if (!node) return;

            observer.disconnect();
            resolve(node);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            resolve(document.querySelector(selector));
        }, timeout);
    });
}
