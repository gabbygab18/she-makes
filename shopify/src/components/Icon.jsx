/**
 * The icon set, inlined.
 *
 * Every glyph is a stroke path on a 24×24 grid, so they inherit currentColor
 * and the surrounding size. Inlining keeps them in the same bundle as the
 * components that use them — no icon font, no extra request.
 */
/**
 * The six the shop supplied are Boxicons v3 — solid shapes, not outlines, so
 * they are drawn with fill and no stroke. FILLED below is what switches the
 * rendering; call sites say `name="truck"` as they always did.
 */
const PATHS = {
    truck: <path d="M19.1 7.8c-.38-.5-.97-.8-1.6-.8H15V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2 0 1.65 1.35 3 3 3s3-1.35 3-3h4c0 1.65 1.35 3 3 3s3-1.35 3-3c1.1 0 2-.9 2-2v-3.67c0-.43-.14-.86-.4-1.2zM7 19a1.003 1.003 0 0 1-.87-1.5c.36-.62 1.33-.63 1.72-.02A.95.95 0 0 1 8 18c0 .55-.45 1-1 1m10 0a1.003 1.003 0 0 1-.87-1.5c.36-.62 1.33-.63 1.72-.02A.95.95 0 0 1 18 18c0 .55-.45 1-1 1m-2-7V9h2.5l2.25 3z" />,
    leaf: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></>,
    shield: <path d="m20.42 6.11-7.97-4c-.28-.14-.62-.14-.9 0l-7.97 4c-.31.15-.51.45-.55.79-.01.11-.96 10.77 8.55 15.01a.98.98 0 0 0 .82 0C21.91 17.66 20.97 7 20.95 6.9a.98.98 0 0 0-.55-.79ZM11 15.42l-2.71-2.71L9.7 11.3l1.29 1.29 3.29-3.29 1.41 1.41-4.71 4.71Z" />,
    star: <path d="m6.87 14.33-1.83 6.4c-.12.4.03.84.37 1.08.34.25.8.26 1.14.02L12 18.2l5.45 3.63a.99.99 0 0 0 1.14-.02c.34-.25.49-.68.37-1.08l-1.83-6.4 4.54-4.08c.3-.27.41-.69.28-1.06-.13-.38-.47-.64-.87-.68l-5.7-.45-2.47-5.46a.998.998 0 0 0-1.82 0L8.62 8.06l-5.7.45c-.4.03-.74.3-.87.68s-.02.8.28 1.06z" />,
    check: <path d="m20 6-11 11-5-5" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    trash: (
        <>
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
        </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L4 21" /></>,
    bag: <path d="M2.95 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-.16-.05-.31-.11-.44s-1.72-3.45-1.72-3.45A2 2 0 0 0 17.33 2H6.56c-.76 0-1.45.42-1.79 1.11L3.05 6.56c-.07.14-.11.29-.11.45v13ZM12 15c-2.76 0-5-2.24-5-5h2c0 1.65 1.35 3 3 3s3-1.35 3-3h2c0 2.76-2.24 5-5 5M6.56 4h10.76l1 2H5.56z" />,
    mail: <path d="M20 4H4c-1.1 0-2 .9-2 2v.25l10 7.5 10-7.5V6c0-1.1-.9-2-2-2m1.93 14.51c.04-.16.07-.33.07-.51V8.75l-5.62 4.22 5.55 5.55ZM12.6 15.8c-.18.13-.39.2-.6.2s-.42-.07-.6-.2l-2.16-1.62-5.75 5.75c.16.04.33.07.51.07h16c.18 0 .35-.03.51-.07l-5.75-5.75zM2 8.75V18c0 .18.03.35.07.51l5.55-5.55L2 8.74Z" />,
    // The maple leaf from the Canadian flag. The flag design is in the
    // public domain, so this needs no attribution — unlike the stock-icon
    // sites. Drawn on a 9600×4800 grid, hence the transform onto 24×24.
    maple: <g transform="translate(-0.864 -0.944) scale(0.0053598)"><path d="m2490 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z" /></g>,
    time: <path d="M12 2C6.58 2 2 6.58 2 12s4.58 10 10 10 10-4.58 10-10S17.42 2 12 2m5 11h-6V7h2v4h4z" />,
    arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    filter: <><path d="M3 4h18" /><path d="M7 12h10" /><path d="M10 20h4" /></>,
    cartAdd: <path d="M10 18a2 2 0 1 0 0 4 2 2 0 1 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 1 0 0-4m4-12H7.05L5.94 2.68A1 1 0 0 0 4.99 2h-3v2h2.28l3.54 10.63A2 2 0 0 0 9.71 16h7.59a2 2 0 0 0 1.87-1.3l2.76-7.35A.997.997 0 0 0 21 6m-4.5 6h-2v2h-2v-2h-2v-2h2V8h2v2h2z" />,
    cartAdded: <path d="M10 18a2 2 0 1 0 0 4 2 2 0 1 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 1 0 0-4m4-12H7.05L5.94 2.68A1 1 0 0 0 4.99 2h-3v2h2.28l3.54 10.63A2 2 0 0 0 9.71 16h7.59a2 2 0 0 0 1.87-1.3l2.76-7.35A.997.997 0 0 0 21 6m-8 7.91-2.71-2.71 1.41-1.41 1.29 1.29 3.29-3.29 1.41 1.41-4.71 4.71Z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>,
    // Boxicons solid, like the rest of the set: bxs-cloud and bxs-coin-stack.
    cloud: <path d="M18.944 11.112C18.507 7.67 15.56 5 12 5 9.244 5 6.85 6.611 5.757 9.15 3.609 9.792 2 11.82 2 14c0 2.757 2.243 5 5 5h11c2.206 0 4-1.794 4-4a4.01 4.01 0 0 0-3.056-3.888z" />,
    coins: <><path d="M12 10c3.976 0 8-1.374 8-4s-4.024-4-8-4-8 1.374-8 4 4.024 4 8 4z" /><path d="M4 10c0 2.626 4.024 4 8 4s8-1.374 8-4V8c0 2.626-4.024 4-8 4s-8-1.374-8-4v2z" /><path d="M4 14c0 2.626 4.024 4 8 4s8-1.374 8-4v-2c0 2.626-4.024 4-8 4s-8-1.374-8-4v2z" /><path d="M4 18c0 2.626 4.024 4 8 4s8-1.374 8-4v-2c0 2.626-4.024 4-8 4s-8-1.374-8-4v2z" /></>,
};

// Boxicons v3 glyphs are solid: stroking them draws an outline around the
// shape as well as filling it, which reads as a heavier, muddier icon.
const FILLED = new Set(['truck', 'shield', 'star', 'bag', 'mail', 'time', 'maple', 'cartAdd', 'cartAdded', 'cloud', 'coins']);

export default function Icon({ name, size = 22, filled = false, className }) {
    const path = PATHS[name];
    const solid = filled || FILLED.has(name);

    // A missing icon must not crash a page or leave a broken box.
    if (!path) return null;

    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={solid ? 'currentColor' : 'none'}
            stroke={solid ? 'none' : 'currentColor'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            {path}
        </svg>
    );
}
