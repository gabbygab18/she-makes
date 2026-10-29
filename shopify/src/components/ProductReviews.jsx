import { useEffect, useRef, useState } from 'react';
import { useAppMarkup, waitForNode } from '@/lib/useAppMarkup';
import { lockScroll, releaseScroll, unlockScroll } from '@/lib/scrollLock';

/**
 * The review list, in the redesign's own cards.
 *
 * Judge.me does not put the reviews in the page: its script injects them after
 * load, so there is nothing to parse at render time and nothing a stylesheet
 * can reach until it arrives. This waits for that markup, reads it, and draws
 * the same card the prototype used — name, score, the quote, the date.
 *
 * No API token is involved. The data is already on the page by the time this
 * runs; it is the app's own markup, read rather than re-fetched.
 *
 * If the widget never arrives, or Judge.me changes its markup, the original is
 * left exactly where it was. A styled app widget is a worse outcome than this
 * one, not a broken page.
 */
const REVIEW = '.jdgm-rev';

function read(node) {
    const text = (selector) => node.querySelector(selector)?.textContent?.trim() ?? '';

    const scored = node.querySelector('[data-score]');
    const score = Number(scored?.getAttribute('data-score'));

    return {
        id: node.getAttribute('data-review-id') || text('.jdgm-rev__author') + text('.jdgm-rev__timestamp'),
        author: text('.jdgm-rev__author') || 'Verified buyer',
        rating: Number.isFinite(score) && score > 0 ? score : 5,
        title: text('.jdgm-rev__title'),
        body: text('.jdgm-rev__body'),
        date: text('.jdgm-rev__timestamp'),
    };
}

export default function ProductReviews({ heading = 'Rating & reviews', initial = 3 }) {
    const reviews = useAppMarkup({
        selector: REVIEW,
        read,
        rootClass: 'sm-has-reviews',
        // The widget existing is how "no reviews yet" is told apart from
        // "the app has not answered".
        ready: '.jdgm-rev-widg, #judgeme_product_reviews',
    });
    const [shown, setShown] = useState(initial);
    const [writing, setWriting] = useState(false);


    // Hiding the app's widget took its "Write a review" button with it — the
    // button lives inside the same header as the heading and the histogram.
    // This is our own, and it clicks theirs: the form, the validation and the
    // spam handling all stay with Judge.me.
    const FORM = '.jdgm-form-wrapper, .jdgm-write-rev-form, .jdgm-rev-widg__form-wrapper';

    /**
     * Hold the page still for a moment.
     *
     * The app scrolls to its widget when the form opens and when it closes,
     * and not always synchronously — on the second open it happened after the
     * click returned, so restoring once was not enough. Re-applying across a
     * few frames covers both.
     */
    const pinScroll = (until = 700) => {
        const y = window.scrollY;
        const start = Date.now();

        const hold = () => {
            if (window.scrollY !== y) window.scrollTo(0, y);
            if (Date.now() - start < until) requestAnimationFrame(hold);
        };

        requestAnimationFrame(hold);
    };

    /**
     * Move the form to be a child of <body> while it is open.
     *
     * Positioning it with CSS was not enough: `position: fixed` and a z-index
     * are only honoured against whatever stacking context its ancestors build,
     * and inside the reviews section the form ended up under the page dimmer
     * instead of over it. As a child of <body> there is nothing to lose to.
     *
     * Moving a node does not drop its event listeners, so Judge.me's own
     * handlers, validation and submit all come with it. `home` is where it was,
     * so it can be put back exactly.
     */
    // A ref, not the state flag: two quick clicks both pass a state check,
    // because `writing` is not true until React re-renders. Both then clicked
    // the app's link — toggling it twice — and the panel came up half-open and
    // out of place.
    const opening = useRef(false);

    const write = async () => {
        if (writing || opening.current) return;

        opening.current = true;

        const link = document.querySelector('.jdgm-write-rev-link, .jdgm-widget .jdgm-write-rev-link');

        // Their link is an anchor: clicking it jumps the page down to the
        // widget. The panel is fixed, so the only thing that moves is the page
        // behind it — which is why reopening looked like it dropped to the
        // bottom.
        lockScroll();
        pinScroll();

        if (link) link.click();

        // Wait for the app to build it — it does not exist until about a
        // second after the click — but leave it exactly where it is.
        //
        // It used to be moved onto <body> to escape the stacking context. That
        // broke three of Judge.me's own rules in turn, because each of them is
        // scoped to an ancestor the form no longer had: the wrapper's display,
        // the file input's hiding, and the upload box's size. Raising the
        // widget's own stacking context instead leaves all of that intact.
        const form = await waitForNode(FORM);

        opening.current = false;

        if (!form) {
            releaseScroll();
            return;
        }

        document.documentElement.classList.add('sm-review-form-open');
        setWriting(true);

        // The app focuses its first field, and focusing inside a scrollable
        // box scrolls that box — so the panel opened part-way down its own
        // form, with the heading above the top edge. Hold it at the top for a
        // moment, the same way the page scroll is held.
        const start = Date.now();
        const top = () => {
            form.scrollTop = 0;
            if (Date.now() - start < 700) requestAnimationFrame(top);
        };

        requestAnimationFrame(top);
    };

    const closeWriting = () => {
        // Their write link only opens; it does not toggle. Clicking it again
        // on the way out re-opened the form inline at the foot of the page,
        // which is what was left behind after closing. Their own cancel
        // control is what puts the widget back to rest.
        const cancel = document.querySelector('.jdgm-cancel-rev');

        pinScroll();

        if (cancel) cancel.click();

        document.documentElement.classList.remove('sm-review-form-open');
        releaseScroll();
        setWriting(false);
    };

    // Unmounting mid-write must not leave the page scroll-locked.
    useEffect(() => () => {
        document.documentElement.classList.remove('sm-review-form-open');
        releaseScroll();
    }, []);

    useEffect(() => {
        if (!writing) return undefined;

        const onKey = (event) => {
            if (event.key === 'Escape') closeWriting();
        };

        // Closing on a click outside is done at the document, not on an
        // overlay element of ours. An overlay rendered inside this section
        // depends on the stacking context the product page happens to build
        // around it — and on the real page that left the form floating over an
        // undimmed page. The ground behind it is drawn on <body> instead.
        const onPointer = (event) => {
            if (event.target.closest(FORM)) return;

            closeWriting();
        };

        // Their own controls close their own form, and we have to notice.
        //
        // The cancel and submit buttons inside the panel are Judge.me's. They
        // hide the form and leave our state exactly as it was — the class is
        // still on <html>, so the dimmer stays up and the panel keeps the
        // `!important` rules that place it. To the shopper the modal simply
        // refuses to close.
        //
        // Capture phase, because their handler may stop the event on its way
        // back up.
        const onTheirControl = (event) => {
            if (event.target.closest('.jdgm-cancel-rev, .jdgm-submit-rev, .jdgm-close-form')) {
                // Let their handler run first, then tear ours down.
                window.setTimeout(() => {
                    document.documentElement.classList.remove('sm-review-form-open');
                    setWriting(false);
                }, 0);
            }
        };

        // And a backstop for every other way it can go — a control we have not
        // named, or the app removing the node outright. If the form is no
        // longer on the page, or no longer visible, nothing of ours should
        // still be holding the page down.
        const watcher = new MutationObserver(() => {
            const form = document.querySelector(FORM);

            if (!form || form.offsetParent === null) {
                document.documentElement.classList.remove('sm-review-form-open');
                setWriting(false);
            }
        });

        watcher.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

        document.addEventListener('click', onTheirControl, true);
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onPointer);

        // The lock is already on — `write` sets it before clicking, so the app
        // cannot move the page. Reading it back here captured 'hidden' as the
        // value to restore, which is why the page stayed locked after closing.
        lockScroll();

        return () => {
            watcher.disconnect();
            document.removeEventListener('click', onTheirControl, true);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onPointer);
            releaseScroll();
        };
    }, [writing]);

    // `null` while the app has not answered; an empty state once it has.
    if (!reviews) return null;

    return (
        <section className="sm-reviews">

            <div className="sm-reviews__bar">
                <h2 className="sm-heading sm-heading--md">
                    {heading}{reviews.length > 0 ? ` (${reviews.length})` : ''}
                </h2>

                <button type="button" className="sm-button sm-button--secondary" onClick={write}>
                    Write a review
                </button>
            </div>

            {reviews.length === 0 && (
                <p className="sm-reviews__empty">
                    No reviews yet. If you have pressed this one, tell the next person how it went.
                </p>
            )}

            {/* The same card as the review rail — stars, title, the words, and
                who wrote it under a hairline — laid out as a grid of three so
                "Show more" can add rows rather than hide them off to the side. */}
            <ul className="sm-reviews__rail sm-reviews__rail--grid" role="list">
                {reviews.slice(0, shown).map((review) => (
                    <li className="sm-reviews__slide" key={review.id}>
                        <span className="sm-reviews__stars" aria-hidden="true">
                            {'★★★★★'.slice(0, Math.round(review.rating))}
                        </span>
                        <span className="visually-hidden">{review.rating} out of 5</span>

                        {review.title && <p className="sm-reviews__title">{review.title}</p>}
                        {review.body && <p className="sm-reviews__body">{review.body}</p>}

                        <div className="sm-reviews__by">
                            <div>
                                <p className="sm-reviews__name">{review.author}</p>
                                {review.date && <p className="sm-reviews__product">Posted {review.date}</p>}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {shown < reviews.length && (
                <button
                    type="button"
                    className="sm-button sm-button--secondary"
                    onClick={() => setShown((count) => count + initial)}
                >
                    Show more reviews
                </button>
            )}
        </section>
    );
}
