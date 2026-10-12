/**
 * One scroll lock for the whole page.
 *
 * Three things can hold the page still — the cart drawer, the card's size
 * sheet, and the review form — and they overlap: pick a size, and the drawer
 * opens while the sheet is still closing.
 *
 * Each of them used to save and restore `body.style.overflow` for itself. Save
 * it while another one is already holding the lock and you save "hidden", and
 * restoring that on close leaves the page unable to scroll with nothing on
 * screen to explain why.
 *
 * A count fixes the overlap: the page is held while anything is holding it and
 * released once, by the last one to let go.
 */
let held = 0;

export function lockScroll() {
    held += 1;

    if (held === 1) {
        document.body.style.overflow = 'hidden';
    }
}

export function unlockScroll() {
    held = Math.max(0, held - 1);

    if (held === 0) {
        document.body.style.overflow = '';
    }
}

/** For a panel that can be closed by something other than its own cleanup. */
export function releaseScroll() {
    held = 0;
    document.body.style.overflow = '';
}
