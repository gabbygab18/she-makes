/**
 * Mounts every island in a real browser, with the props its section emits.
 *
 * The islands shipped twice with props that never arrived: React replaced the
 * Liquid fallback with an empty component, and the hero became a tall black
 * void. Nothing in the build catches that — the bundle compiles fine, the
 * Liquid parses fine, and the damage only shows on a rendered page.
 *
 * So: a page shaped like what sm-island.liquid emits, the real bundle, and an
 * assertion that each island both mounted and put its own text on the page.
 *
 *     node island_check.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

const executablePath = process.env.CHECK_BROWSER ?? BROWSERS.find((path) => existsSync(path));

if (!executablePath || !existsSync(executablePath)) {
    console.error('No Chrome or Edge found — install one, or set CHECK_BROWSER.');
    process.exit(1);
}

// One fixture per island, shaped exactly like the `capture props` block of the
// section that renders it. `expect` is a string the mounted component has to
// put on the page — proof the props arrived, not just that React ran.
const FIXTURES = [
    {
        name: 'ticker',
        props: { claims: ['Ships in 2 business days', 'Free local pickup in London'], speed: 48 },
        expect: 'Ships in 2 business days',
    },
    {
        name: 'hero',
        props: {
            image: 'https://images.unsplash.com/photo-1',
            pill: 'London, Ontario',
            heading: 'Transfers that press first time',
            body: 'DTF and UV DTF, printed here.',
            rating: '4.9 from 320 reviews',
            primary: { label: 'Browse ready to press', url: '/collections/all' },
            secondary: { label: 'Start a custom order', url: '/pages/custom' },
            stats: [{ value: '2 days', label: 'Turnaround' }],
        },
        expect: 'Transfers that press first time',
    },
    {
        name: 'promises',
        props: {
            items: [
                { icon: 'truck', title: 'Free local pickup', body: 'London, Ontario.' },
                // An uploaded icon wins over the glyph — the escape hatch for
                // anything the theme does not ship.
                { icon: 'leaf', image: 'https://cdn.shopify.com/leaf.svg', alt: 'Maple leaf', title: 'Made in Canada', body: 'London, Ontario.' },
            ],
        },
        expect: 'Free local pickup',
    },
    {
        name: 'process',
        props: {
            eyebrow: 'How it works',
            heading: 'Four steps',
            body: 'From file to pressed.',
            items: [{ title: 'Send your art', image: 'https://images.unsplash.com/photo-3' }],
        },
        expect: 'Send your art',
    },
    {
        name: 'gallery',
        props: {
            heading: 'Pressed by you',
            body: 'Real customer photos.',
            photos: ['https://images.unsplash.com/photo-2', 'https://images.unsplash.com/photo-4'],
            speed: 60,
            cta: { label: 'See more', url: '#' },
        },
        expect: 'Pressed by you',
    },
    {
        name: 'faq',
        props: {
            eyebrow: 'Questions',
            heading: 'Before you order',
            items: [{ question: 'What temperature?', answer: '300 degrees for ten seconds.' }],
            cta: { label: 'Ask us', url: '/pages/contact' },
        },
        expect: 'What temperature?',
    },
    {
        name: 'product-panel',
        props: {
            variants: [
                { id: 1, title: 'A4 sheet', price: 1200, available: true },
                { id: 2, title: 'A3 sheet', price: 1800, available: true },
            ],
            specs: [{ label: 'Press', value: '300F for 10s' }],
            currency: 'CAD',
            compareAt: 0,
            gangSheetUrl: '',
        },
        expect: 'A4 sheet',
    },
    {
        name: 'search',
        props: {
            action: '/search',
            placeholder: 'Search designs, sizes…',
            value: '',
            currency: 'CAD',
        },
        // The field itself is what has to be on screen; the dropdown needs the
        // shop's own endpoint, which this page does not have.
        expect: 'Search',
    },
    {
        name: 'product-gallery',
        props: {
            images: [
                { id: 1, thumb: '', medium: '', large: '', alt: 'Front', width: 800, height: 800 },
                { id: 2, thumb: '', medium: '', large: '', alt: 'Pressing instructions', width: 800, height: 800 },
            ],
            alt: 'Daisy transfer',
        },
        // Images have no text; the buttons are what says it rendered.
        expect: 'Show image 1 of 2',
        alsoExpect: 'Next image',
        skipMount: false,
        overlay: true,
    },
    {
        name: 'collection-list',
        props: {
            collections: [
                { id: 1, title: 'Christmas UV DTF', handle: 'christmas-uv-dtf', url: '/collections/a', image: '', count: 12 },
                { id: 2, title: 'Blank ornaments', handle: 'blanks', url: '/collections/b', image: '', count: 4 },
            ],
            categories: [
                { label: 'UV DTF', terms: 'uv dtf, uv-dtf' },
                { label: 'Blanks', terms: 'blank' },
                // Nothing matches this one, so it must not be offered.
                { label: 'Apparel', terms: 'hoodie' },
            ],
            countLabel: 'designs',
        },
        expect: 'Christmas UV DTF',
        alsoExpect: 'Blanks',
    },
    {
        name: 'product-strip',
        props: {
            products: [
                {
                    id: 9,
                    title: 'Daisy transfer',
                    url: '/products/daisy',
                    image: '',
                    price: 900,
                    compareAt: 0,
                    available: true,
                    isNew: true,
                    variantId: 111,
                    variantCount: 2,
                    type: 'DTF',
                    tags: ['floral'],
                    rating: 5,
                    reviewCount: 12,
                    variants: [
                        { id: 111, title: 'Pocket', price: 900, available: true },
                        { id: 112, title: 'Adult', price: 1400, available: true },
                    ],
                },
            ],
            currency: 'CAD',
        },
        expect: 'Daisy transfer',
        // The card's add control is an icon now, so there is no label text to
        // look for — the button and the size sheet are checked below.
        alsoExpect: '$9.00',
    },
    {
        name: 'collection-grid',
        props: {
            products: [
                {
                    id: 9,
                    title: 'Daisy transfer',
                    url: '/products/daisy',
                    image: '',
                    price: 900,
                    compareAt: 0,
                    available: true,
                    isNew: true,
                    variantId: 111,
                    variantCount: 2,
                    type: 'DTF',
                    tags: ['floral'],
                    rating: 5,
                    reviewCount: 12,
                    variants: [
                        { id: 111, title: 'Pocket', price: 900, available: true },
                        { id: 112, title: 'Adult', price: 1400, available: true },
                    ],
                },
            ],
            filters: [{ label: 'Type', values: ['DTF', 'UV DTF'] }],
            currency: 'CAD',
            prompt: { heading: 'Not seeing it?', body: 'We print custom.', label: 'Ask', url: '#' },
        },
        expect: 'Daisy transfer',
        // The card's own price, not a label: the "New" and "Best seller" tags
        // were dropped at the shop's request.
        alsoExpect: '$9.00',
    },
    {
        name: 'cart',
        props: {
            cart: {
                item_count: 1,
                total_price: 1200,
                items: [
                    {
                        key: '1:a',
                        product_title: 'Daisy transfer',
                        variant_title: 'A4',
                        quantity: 1,
                        final_line_price: 1200,
                        image: '',
                        url: '/products/daisy',
                    },
                ],
            },
            threshold: 15000,
            currency: 'CAD',
            checkoutUrl: '/cart/checkout',
        },
        expect: 'Daisy transfer',
    },
    {
        name: 'page-faq',
        props: {
            title: 'FAQs',
            eyebrow: 'Before you order',
            // Exactly how the shop writes it: a bold question in its own
            // paragraph, then the answer.
            // Exactly how the shop writes it, trailing sign-off included: two
            // bold lines with nothing under them, then an empty bold line.
            // Each of those used to become an empty accordion row.
            html: '<p><strong>Where can I find application instructions?</strong></p><ul><li>In the box.</li></ul><p><strong>Do you ship?</strong></p><p>Canada and the US.</p><p><strong>Instagram @shemakestransfers</strong></p><p><strong>TikTok @shemakestransfers</strong></p><p><strong> </strong></p>',
            cta: { heading: 'Still not sure?', body: 'Send the file over.', label: 'Talk to us', url: '/pages/contact' },
        },
        expect: 'Where can I find application instructions?',
    },
    {
        name: 'select',
        props: {
            name: 'contact[topic]',
            label: 'What is it about?',
            options: ['Artwork or file question', 'An existing order', 'Rush or same-day'],
        },
        expect: 'Artwork or file question',
    },
    {
        name: 'reviews',
        props: { heading: 'Rating & reviews', initial: 3 },
        // Nothing to show until Judge.me's markup exists, which the check
        // injects below; this island renders null at first on purpose.
        skipMount: true,
    },
    {
        name: 'product-description',
        props: {
            heading: 'What you get',
            // Exactly how the shop writes it: bold lines with prose under them.
            // Word-processor markup, the way the gang-sheet page is written:
            // the heading is a bold run with the line break inside it, and the
            // next line follows in the same paragraph. Reading paragraphs
            // rather than lines put all of this in one card.
            html: '<p>WHAT A STEAL!!!</p><p><strong>Included:</strong></p><p>- a variety of our premium blank ornaments</p><p><strong><span style="color:#ff2a00">Did you know?<br></span></strong><span>We offer free local pickup.</span></p><p><strong>No refunds</strong></p><p>No refunds, exchanges or cancelled orders permitted.</p>',
        },
        // The colon is dropped and a shouted line is cased down — the labels
        // are set as titles, not as the running copy they were written in.
        expect: 'Included',
        alsoExpect: 'Did you know?',
    },
    {
        name: 'cart-drawer',
        props: { threshold: 15000, currency: 'CAD', checkoutUrl: '/cart/checkout' },
        // Closed and empty until something opens it — the head is what proves
        // it rendered at all. It is a fixed-position overlay, so the mount
        // point itself has no height.
        expect: 'Your cart',
        overlay: true,
    },
    {
        name: 'shipping-bar',
        props: { total: 4000, threshold: 15000, currency: 'CAD' },
        expect: 'shipping',
    },
    {
        name: 'fit',
        props: {
            eyebrow: 'Before you order',
            heading: 'What size transfer do I need?',
            body: 'Pick a t-shirt size below.',
            note: '',
            garments: [
                { label: 'Youth', chest: 16, min: 7, max: 8 },
                { label: 'Adult', chest: 21, min: 10, max: 11 },
            ],
            placements: [
                { label: 'Left chest', min: 3, max: 4, fixed: true, side: true },
                { label: 'Center front', min: 11, max: 11, fixed: false, side: false },
            ],
            blurb_heading: "Can't be bothered?",
            blurb_body: 'Ready to press transfers come pre-cut and pre-sized.',
            cta: { label: 'Browse Ready To Press', url: '/collections' },
        },
        expect: 'What size transfer do I need?',
    },
];

// Exactly what snippets/sm-island.liquid emits, fallback included.
const mounts = FIXTURES.map(({ name, props }) => `
  <div data-sm-island="${name}">
    <script type="application/json" data-sm-props>${JSON.stringify(props).replace(/<\//g, '<\\/')}</script>
    <p class="sm-fallback">Liquid fallback for ${name}</p>
  </div>
`).join('\n');

// The failure that caused all of this: props that do not parse. The island has
// to leave the Liquid alone rather than replace it with an empty component.
// Judge.me's own markup, as its script writes it into the page after load.
const judgeme = `
  <div class="jdgm-rev-widg">
    <div class="jdgm-rev-widg__title">Customer Reviews</div>
    <a class="jdgm-write-rev-link" href="#" onclick="window.__wroteReview = true; document.querySelector('.jdgm-form-wrapper').classList.add('jdgm-form-wrapper--open'); return false;">Write a review</a>
    <div class="jdgm-form-wrapper" style="transform: translateY(300px)">the form</div>
    <div class="jdgm-rev" data-review-id="r1">
      <span class="jdgm-rev__rating" data-score="5"></span>
      <span class="jdgm-rev__author">Priya N.</span>
      <span class="jdgm-rev__timestamp">September 2, 2026</span>
      <div class="jdgm-rev__title">Perfect fit</div>
      <div class="jdgm-rev__body">These sit perfectly on a 16oz libbey with no trimming.</div>
    </div>
  </div>
`;

const broken = `
  <div data-sm-island="hero" id="broken">
    <script type="application/json" data-sm-props>{"heading": </script>
    <p class="sm-fallback">Liquid fallback survived</p>
  </div>
`;

// The page has no origin under setContent, so a relative fetch throws before
// it can be answered. The drawer asks for /cart.js whenever it is handed
// something that is not a cart, which is exactly the path being tested.
// The header is Liquid, not an island, so its cart badge is included here as
// the markup the section emits — it is driven by the same event the drawer is.
const headerBadge = `
  <a href="/cart" class="sm-header__cart" data-sm-cart-open aria-label="Cart, 2 items">
    <span class="sm-header__count" data-sm-cart-count>2</span>
  </a>
`;

const cartStub = `
<script>
  window.__cartRequests = 0;
  const realFetch = window.fetch;
  window.fetch = (input, init) => {
    const url = String(input);

    if (url.includes('/cart.js')) {
      window.__cartRequests += 1;
      return Promise.resolve(new Response(JSON.stringify({
        item_count: 1,
        total_price: 1200,
        items: [{ key: '1:a', product_title: 'Daisy transfer', variant_title: 'A4', quantity: 1, final_line_price: 1200, image: '', url: '/products/daisy' }],
      }), { headers: { 'Content-Type': 'application/json' } }));
    }

    return realFetch(input, init);
  };
</script>
`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${readFileSync('assets/shemakes.css', 'utf-8')}</style>
</head><body>${cartStub}${headerBadge}${judgeme}${mounts}${broken}
<script>${readFileSync('assets/shemakes.js', 'utf-8')}</script>
<script type="module">${readFileSync('assets/shemakes-islands.js', 'utf-8')}</script>
</body></html>`;

const problems = [];
const browser = await puppeteer.launch({ executablePath, headless: 'new' });
const page = await browser.newPage();

page.on('console', (message) => {
    const text = message.text();

    // The broken mount below logs this on purpose.
    if (text.includes('island props were not valid JSON')) return;

    if (message.type() === 'error') problems.push(`console: ${text.slice(0, 200)}`);
});
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message.slice(0, 200)}`));

await page.setContent(html, { waitUntil: 'networkidle0' });
await page
    .waitForFunction(() => document.querySelectorAll('[data-sm-mounted]').length > 0, { timeout: 10000 })
    .catch(() => problems.push('no island mounted at all'));

for (const { name, expect, alsoExpect, overlay, skipMount } of FIXTURES) {
    if (skipMount) continue;

    const state = await page.evaluate((island) => {
        const element = document.querySelector(`[data-sm-island="${island}"]`);

        return {
            mounted: element?.dataset.smMounted === 'true',
            // A section that renders nothing is the exact failure being guarded
            // against here, so height counts as much as text does.
            height: Math.round(element?.getBoundingClientRect().height ?? 0),
            text: element?.textContent ?? '',
        };
    }, name);

    const found =
        state.text.toLowerCase().includes(expect.toLowerCase()) &&
        (!alsoExpect || state.text.includes(alsoExpect));
    const ok = state.mounted && found && (overlay || state.height > 0);

    if (!ok) {
        problems.push(
            `${name}: mounted=${state.mounted} height=${state.height} ` +
                `${found ? '' : `missing "${expect}" `}` +
                `text="${state.text.trim().slice(0, 80)}"`,
        );
    }

    console.log(`${ok ? 'ok   ' : 'FAIL '} ${name.padEnd(16)} ${state.height}px`);
}

const accordion = await page.evaluate(async () => {
    const section = document.querySelector('[data-sm-island="page-faq"]');
    const items = [...(section?.querySelectorAll('.sm-faq__item') ?? [])];
    const [first, second] = items;

    // The prototype opens its first row on arrival and leaves the rest shut.
    const firstOpenOnArrival = first?.classList.contains('is-open');
    const restShut = items.slice(1).every((item) => !item.classList.contains('is-open'));

    second?.querySelector('.sm-faq__question')?.click();
    await new Promise((resolve) => setTimeout(resolve, 450));

    const answer = second?.querySelector('.sm-faq__answer');
    const question = second?.querySelector('.sm-faq__question');

    return {
        questions: items.length,
        firstOpenOnArrival,
        restShut,
        opensOnClick: second?.classList.contains('is-open'),
        showsAnswer: (answer?.getBoundingClientRect().height ?? 0) > 0,
        // A plus that becomes a minus, not a chevron — the marker is two bars.
        markerHasBars: (first?.querySelectorAll('.sm-faq__bar').length ?? 0) === 2,
        // The panel animates rather than snapping.
        animates: getComputedStyle(second.querySelector('.sm-faq__panel')).transitionDuration !== '0s',
        cardHasSurface: getComputedStyle(first).backgroundColor !== 'rgba(0, 0, 0, 0)',
        // The answer starts on the same left edge as its own question.
        aligned:
            Math.abs(
                Math.round(answer?.getBoundingClientRect().left ?? 0) -
                    Math.round(question?.getBoundingClientRect().left ?? 0),
            ) < 40,
    };
});

const faqOk = Object.entries(accordion).every(([key, value]) =>
    key === 'questions' ? value === 2 : value === true,
);
console.log(`${faqOk ? 'ok   ' : 'FAIL '} page accordion matches the prototype`);
if (!faqOk) problems.push(`page-faq: ${JSON.stringify(accordion)}`);

// Both accordions have to be the same component to look at. The homepage one
// kept a chevron long after the stylesheet stopped drawing one, which is how it
// ended up rendering as an empty circle — a check that only looked at the page
// accordion never saw it.
const homeFaq = await page.evaluate(() => {
    const section = document.querySelector('[data-sm-island="faq"]');
    const item = section?.querySelector('.sm-faq__item');
    const marker = item?.querySelector('.sm-faq__marker');
    const bar = marker?.querySelector('.sm-faq__bar');

    return {
        bars: marker?.querySelectorAll('.sm-faq__bar').length ?? 0,
        noChevron: !marker?.querySelector('svg'),
        // An empty circle is exactly what a zero-size bar looks like.
        barHasSize: (bar?.getBoundingClientRect().width ?? 0) > 4,
        marksOpenOnItem: item?.classList.contains('is-open') === true,
        hasPanel: Boolean(item?.querySelector('.sm-faq__panel')),
    };
});

const homeFaqOk =
    homeFaq.bars === 2 && homeFaq.noChevron && homeFaq.barHasSize && homeFaq.marksOpenOnItem && homeFaq.hasPanel;
console.log(`${homeFaqOk ? 'ok   ' : 'FAIL '} homepage FAQ uses the same marker as the page accordion`);
if (!homeFaqOk) problems.push(`faq: ${JSON.stringify(homeFaq)}`);

// The two accordions are one component to a reader, so their type has to
// agree. It did not: the homepage answer was 14.5px and the page answer 16px,
// because the page one also carries .sm-prose and that rule lands later.
const faqType = await page.evaluate(() => {
    const read = (island) => {
        const section = document.querySelector(`[data-sm-island="${island}"]`);
        const question = section?.querySelector('.sm-faq__question span');
        const answer = section?.querySelector('.sm-faq__answer');

        return {
            question: question && getComputedStyle(question).fontSize,
            answer: answer && getComputedStyle(answer).fontSize,
            lineHeight: answer && getComputedStyle(answer).lineHeight,
        };
    };

    return { home: read('faq'), page: read('page-faq') };
});

const typeOk =
    faqType.home.question === faqType.page.question &&
    faqType.home.answer === faqType.page.answer &&
    faqType.home.lineHeight === faqType.page.lineHeight;

console.log(`${typeOk ? 'ok   ' : 'FAIL '} both accordions use the same type scale`);
if (!typeOk) problems.push(`faq type: ${JSON.stringify(faqType)}`);

// The reviews island exists to replace the app's markup with the shop's cards.
// What matters is that it reads the app's data and hides the original.
const reviews = await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const ours = document.querySelector('.sm-reviews');

    // Open the form, then let React paint the panel before reading it.
    ours?.querySelector('.sm-button')?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    const source = document.querySelector('.jdgm-rev-widg');
    const text = ours?.textContent ?? '';

    const result = {
        rendered: Boolean(ours),
        keepsAuthor: text.includes('Priya N.'),
        keepsBody: text.includes('16oz libbey'),
        countsThem: text.includes('Rating & reviews (1)'),
        // Pink stars, ours — not the app's yellow.
        starsAreBrand: getComputedStyle(ours?.querySelector('.sm-reviews__stars') ?? document.body).color,
        // The app restores its own markup on re-render, so the hide is a
        // class on <html> plus a stylesheet rule — not an attribute.
        writeButtonWorks: window.__wroteReview === true,
        // The form the button opens must be visible. Hiding the whole widget
        // hid the form too: the button fired and nothing appeared.
        formCanShow: getComputedStyle(document.querySelector('.jdgm-form-wrapper')).display !== 'none',
        // And it opens as a panel over the page, not inline at the foot of it.
        formIsAPanel: getComputedStyle(document.querySelector('.jdgm-form-wrapper')).position === 'fixed',
        // And it is a child of <body>, so nothing in the page can stack over
        // it. Positioning alone left it under the dimmer.
        // And centred in the viewport. The app sets a transform of its own on
        // this element, which offset the panel off the bottom of the screen.
        formIsCentred: (() => {
            const box = document.querySelector('.jdgm-form-wrapper').getBoundingClientRect();

            return Math.abs(box.top - (window.innerHeight - box.height) / 2) < 8;
        })(),
        // The ground is drawn on <body>, so what matters is the root class
        // the rule keys off — not an element in the reviews section.
        hasOverlay: document.documentElement.classList.contains('sm-review-form-open'),
        // The heading we replace is the part that must go.
        hidesTheirTitle: getComputedStyle(document.querySelector('.jdgm-rev-widg__title')).display === 'none',
        hidesTheApp: document.documentElement.classList.contains('sm-has-reviews'),
    };

    // Close it again: a modal left open covers everything the later steps
    // click on, which is exactly what it would do to a customer.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((resolve) => setTimeout(resolve, 80));

    // And it goes back where it was, so the page is not left rearranged.
    result.rootClassCleared = !document.documentElement.classList.contains('sm-review-form-open');
    result.scrollUnlocked = document.body.style.overflow !== 'hidden';

    // Their link is a toggle: opening twice must not leave the panel wrapped
    // around a form the app has just closed.
    ours?.querySelector('.sm-button')?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    ours?.querySelector('.sm-button')?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    result.reopenIsStable =
        document.documentElement.classList.contains('sm-review-form-open') &&
        getComputedStyle(document.querySelector('.jdgm-form-wrapper')).position === 'fixed';

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((resolve) => setTimeout(resolve, 80));

    return result;
});

const reviewsOk =
    reviews.rendered &&
    reviews.keepsAuthor &&
    reviews.keepsBody &&
    reviews.countsThem &&
    reviews.writeButtonWorks &&
    reviews.formCanShow &&
    reviews.formIsAPanel &&
    reviews.formIsCentred &&
    reviews.rootClassCleared &&
    reviews.scrollUnlocked &&
    reviews.reopenIsStable &&
    reviews.hasOverlay &&
    reviews.hidesTheirTitle &&
    reviews.hidesTheApp;
console.log(`${reviewsOk ? 'ok   ' : 'FAIL '} reviews redrawn from the app's markup`);
if (!reviewsOk) problems.push(`reviews: ${JSON.stringify(reviews)}`);

// The drawer is the one island with behaviour worth driving here: it is what
// the header's cart button now opens, and it opens itself after add-to-cart.
const drawer = await page.evaluate(async () => {
    const cart = {
        item_count: 1,
        total_price: 1200,
        items: [
            {
                key: '1:a',
                product_title: 'Daisy transfer',
                variant_title: 'A4',
                quantity: 1,
                final_line_price: 1200,
                image: '',
                url: '/products/daisy',
            },
        ],
    };

    document.dispatchEvent(new CustomEvent('shemakes:cart:updated', { detail: cart }));
    // Long enough for the 240ms open transition to finish — reading opacity
    // mid-transition once reported a perfectly good overlay as unpainted.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const panel = document.querySelector('.sm-drawer');
    const opened = panel?.classList.contains('is-open') && panel.textContent.includes('Daisy transfer');

    // The overlay has to be both visible and clickable, or "click outside to
    // close" silently does nothing.
    const overlay = panel?.querySelector('.sm-drawer__overlay');
    const style = overlay ? getComputedStyle(overlay) : null;
    const dimmed = style?.opacity === '1' && style.backgroundColor !== 'rgba(0, 0, 0, 0)';

    // Whatever the browser would actually hit at a point outside the panel.
    const hit = document.elementFromPoint(40, window.innerHeight / 2);
    const hitsOverlay = hit === overlay;

    hit?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const closedByOutside = !panel?.classList.contains('is-open');

    document.dispatchEvent(new CustomEvent('shemakes:cart:updated', { detail: cart }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    panel?.querySelector('.sm-drawer__close')?.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
        opened,
        dimmed,
        hitsOverlay,
        hit: hit ? hit.className || hit.tagName : 'nothing',
        closedByOutside,
        closed: !panel?.classList.contains('is-open'),
    };
});

console.log(`${drawer.opened ? 'ok   ' : 'FAIL '} cart drawer opens on add-to-cart`);
if (!drawer.opened) problems.push('the drawer did not open, or did not show the line');

// `/cart/add.js` answers with the line it added, not the cart. Announcing that
// drew an empty panel with a $0.00 subtotal right after a successful add, so
// the drawer must not take the event at its word.
const lineItemOnly = await page.evaluate(async () => {
    const panel = document.querySelector('.sm-drawer');

    panel?.querySelector('.sm-drawer__close')?.click();
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Exactly what Shopify returns from /cart/add.js.
    document.dispatchEvent(new CustomEvent('shemakes:cart:updated', {
        detail: { id: 111, quantity: 1, title: 'Daisy transfer', final_line_price: 1200 },
    }));
    await new Promise((resolve) => setTimeout(resolve, 120));

    return {
        opened: panel?.classList.contains('is-open'),
        // It cannot know the cart from that, so it must go and ask — not paint
        // a confident $0.00.
        claimsEmptyTotal: panel?.textContent.includes('$0.00'),
        askedForTheCart: window.__cartRequests > 0,
    };
});

const lineOk = lineItemOnly.opened && !lineItemOnly.claimsEmptyTotal && lineItemOnly.askedForTheCart;
console.log(`${lineOk ? 'ok   ' : 'FAIL '} drawer does not render a line item as a cart`);
if (!lineOk) problems.push(`drawer took a line item for a cart: ${JSON.stringify(lineItemOnly)}`);

console.log(`${drawer.dimmed ? 'ok   ' : 'FAIL '} cart drawer dims the page behind it`);
if (!drawer.dimmed) problems.push('the drawer overlay is not painted, so there is nothing to click outside');

console.log(`${drawer.closedByOutside ? 'ok   ' : 'FAIL '} cart drawer closes on an outside click`);
if (!drawer.closedByOutside) {
    problems.push(`clicking outside the panel hit "${drawer.hit}" and did not close the drawer`);
}

console.log(`${drawer.closed ? 'ok   ' : 'FAIL '} cart drawer closes`);
if (!drawer.closed) problems.push('the drawer would not close');

// Removing the last line used to leave the header still claiming two items,
// because Liquid printed the badge once and nothing rewrote it.
const badge = await page.evaluate(async () => {
    const read = () => {
        const el = document.querySelector('[data-sm-cart-count]');

        return { text: el?.textContent.trim(), hidden: el?.hidden };
    };

    // Earlier steps have already announced carts, so this sets its own
    // starting point rather than trusting what the markup shipped with.
    const announce = async (count) => {
        document.dispatchEvent(new CustomEvent('shemakes:cart:updated', {
            detail: {
                item_count: count,
                total_price: count * 900,
                items: Array.from({ length: count }, (unused, index) => ({
                    key: `k${index}`, product_title: 'x', quantity: 1, final_line_price: 900, url: '/',
                })),
            },
        }));
        await new Promise((resolve) => setTimeout(resolve, 40));
    };

    await announce(3);
    const before = read();

    await announce(1);
    const afterRemove = read();

    await announce(0);
    const emptied = read();

    return { before, afterRemove, emptied };
});

const badgeOk =
    badge.before.text === '3' &&
    badge.afterRemove.text === '1' &&
    badge.emptied.text === '0' &&
    badge.emptied.hidden === true;

console.log(`${badgeOk ? 'ok   ' : 'FAIL '} header cart count follows the cart`);
if (!badgeOk) problems.push(`cart badge: ${JSON.stringify(badge)}`);

// ── One card per section ───────────────────────────────────────────────────
//    The shop's headings hide inside paragraphs, behind a <br>, wrapped in
//    coloured spans. Reading paragraph by paragraph gave one card holding the
//    whole description.
const descriptionCards = await page.evaluate(() => {
    const section = document.querySelector('[data-sm-island="product-description"]');
    const rows = [...(section?.querySelectorAll('.sm-faq__item') ?? [])];

    return rows.map((row) => {
        const label = row.querySelector('.sm-spec__heading-text');
        const preview = label?.querySelector('.sm-spec__preview')?.textContent ?? '';

        return (label?.textContent ?? '').replace(preview, '').trim();
    });
});

if (descriptionCards.length >= 3 && descriptionCards.includes('Did you know?')) {
    console.log(`ok    description split into ${descriptionCards.length} cards, line breaks included`);
} else {
    problems.push(`description cards: ${JSON.stringify(descriptionCards)}`);
}

// ── A description with no headings is one card, printed once ───────────────
//    Everything lands in the intro when there is no bold line to split on, and
//    the card holds the same text — rendering both showed the description
//    twice on every plain product.
const plainDescription = await page.evaluate(async () => {
    const mount = document.createElement('div');

    mount.setAttribute('data-sm-island', 'product-description');
    mount.innerHTML =
        '<script type="application/json" data-sm-props>' +
        JSON.stringify({ heading: 'What you get', html: '<p>One sheet, hot peel.</p><p>Ships next day.</p>' }) +
        '</scr' + 'ipt>';

    document.body.appendChild(mount);
    document.dispatchEvent(new CustomEvent('shopify:section:load', { detail: {} }));

    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
        cards: mount.querySelectorAll('.sm-faq__item').length,
        occurrences: (mount.textContent.match(/One sheet, hot peel\./g) ?? []).length,
    };
});

if (plainDescription.cards === 1 && plainDescription.occurrences === 1) {
    console.log('ok    a description with no headings is one card, printed once');
} else {
    problems.push(`plain description: ${JSON.stringify(plainDescription)}`);
}

// ── No empty accordion rows ────────────────────────────────────────────────
//    A bold line with nothing under it is a sign-off, not a question. The FAQ
//    page grew three rows that opened onto nothing because of this.
const faqRows = await page.evaluate(() => {
    const section = document.querySelector('[data-sm-island="page-faq"]');
    const items = [...(section?.querySelectorAll('.sm-faq__item') ?? [])];

    return items.map((item) => ({
        question: item.querySelector('.sm-faq__question')?.textContent.trim() ?? '',
        answer: (item.querySelector('.sm-faq__answer')?.textContent ?? '').trim(),
    }));
});

const emptyRows = faqRows.filter((row) => !row.question || row.answer.length === 0);
// Folded in, not thrown away: the sign-off still has to be readable somewhere.
const signOffKept = faqRows.some((row) => row.answer.includes('@shemakestransfers'));

if (emptyRows.length === 0 && signOffKept) {
    console.log(`ok    no empty FAQ rows (${faqRows.length} kept, the sign-off folded in)`);
} else {
    problems.push(
        `faq rows: ${emptyRows.length} empty, sign-off kept=${signOffKept} — ` +
            JSON.stringify(faqRows).slice(0, 160),
    );
}

// ── Category pills offer only what exists ──────────────────────────────────
//    A pill with nothing behind it is a dead end, and clicking one has to
//    actually narrow the grid.
const pills = await page.evaluate(async () => {
    const island = document.querySelector('[data-sm-island="collection-list"]');
    // The pill carries a count now, so the label is what it starts with.
    const label = (n) => n.textContent.replace(/\d+$/, '').trim();
    const labels = [...(island?.querySelectorAll('.sm-pill') ?? [])].map(label);
    const before = island?.querySelectorAll('.sm-card').length ?? 0;
    const groups = island?.querySelectorAll('.sm-collections__group').length ?? 0;

    [...(island?.querySelectorAll('.sm-pill') ?? [])].find((n) => label(n) === 'Blanks')?.click();
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
        labels,
        before,
        groups,
        after: island?.querySelectorAll('.sm-card').length ?? 0,
        groupsAfter: island?.querySelectorAll('.sm-collections__group').length ?? 0,
    };
});

const pillsOk =
    pills.labels.join('|') === 'All|UV DTF|Blanks' &&
    pills.before === 2 &&
    pills.groups === 2 &&
    pills.after === 1 &&
    pills.groupsAfter === 1;

if (pillsOk) {
    console.log('ok    collections group by category, and empty categories are dropped');
} else {
    problems.push(`pills: ${JSON.stringify(pills)}`);
}

// ── The card's add control ─────────────────────────────────────────────────
//    An icon button on the image, and with more than one size, the sizes.
//    This is the whole "add to cart, then choose" flow the shop asked for, and
//    it is invisible to a text check.
const cardAdd = await page.evaluate(async () => {
    const strip = document.querySelector('[data-sm-island="product-strip"]');
    const button = strip?.querySelector('.sm-cartbtn');

    if (!button) return { ok: false, why: 'no add button on the card' };

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 200));

    const sheet = document.querySelector('body > .sm-sizes');

    if (!sheet) return { ok: false, why: 'clicking it opened no sizes' };

    const options = [...sheet.querySelectorAll('.sm-sizes__option')].map((n) => n.textContent);

    return { ok: options.length === 2, why: `sizes: ${options.join(' / ')}`, options };
});

if (cardAdd.ok) {
    console.log('ok    the card adds by icon, and asks for a size first');
} else {
    problems.push(`card add: ${cardAdd.why}`);
}

const survived = await page.evaluate(() => {
    const element = document.getElementById('broken');

    return Boolean(element?.textContent.includes('Liquid fallback survived')) && !element.dataset.smMounted;
});

console.log(`${survived ? 'ok   ' : 'FAIL '} unparseable props keep the fallback`);
if (!survived) problems.push('unparseable props wiped the Liquid fallback');

await browser.close();

if (problems.length) {
    console.error('\nproblems:');
    for (const problem of problems) console.error('  - ' + problem);
    process.exit(1);
}

console.log(`\n${FIXTURES.length} islands mounted with their props`);
