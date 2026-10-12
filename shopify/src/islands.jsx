/**
 * The island runtime.
 *
 * Shopify renders the page; React takes over the parts that are genuinely
 * interactive. Liquid emits a mount point and hands over its data:
 *
 *   <div data-sm-island="product-panel" data-props='{"variants":[…]}'>
 *     …server-rendered fallback…
 *   </div>
 *
 * Two rules this file exists to keep:
 *
 *   1. The markup inside a mount point is a real fallback. It is rendered by
 *      Liquid, so the page is complete before any JavaScript runs — which is
 *      what crawlers and a failed bundle both see. React replaces it.
 *   2. One component failing must not take the page down. Each island mounts
 *      inside its own try/catch, and an error boundary keeps the fallback.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import Hero from '@/components/Hero';
import Promises from '@/components/Promises';
import Process from '@/components/Process';
import Gallery from '@/components/Gallery';
import Faq from '@/components/Faq';
import Ticker from '@/components/Ticker';
import ProductPanel from '@/components/ProductPanel';
import CollectionGrid from '@/components/CollectionGrid';
import ProductStrip from '@/components/ProductStrip';
import CartView from '@/components/CartView';
import CartDrawer from '@/components/CartDrawer';
import PageFaq from '@/components/PageFaq';
import SelectField from '@/components/SelectField';
import ProductReviews from '@/components/ProductReviews';
import ReviewCarousel from '@/components/ReviewCarousel';
import ProductDescription from '@/components/ProductDescription';
import ShippingBar from '@/components/ShippingBar';
import SearchBox from '@/components/SearchBox';
import ProductGallery from '@/components/ProductGallery';
import CollectionList from '@/components/CollectionList';
import FitPreview from '@/components/FitPreview';

const ISLANDS = {
    hero: Hero,
    promises: Promises,
    process: Process,
    gallery: Gallery,
    faq: Faq,
    ticker: Ticker,
    'product-panel': ProductPanel,
    'collection-grid': CollectionGrid,
    'product-strip': ProductStrip,
    cart: CartView,
    'cart-drawer': CartDrawer,
    'page-faq': PageFaq,
    select: SelectField,
    reviews: ProductReviews,
    'review-carousel': ReviewCarousel,
    'product-description': ProductDescription,
    'shipping-bar': ShippingBar,
    search: SearchBox,
    'product-gallery': ProductGallery,
    'collection-list': CollectionList,
    fit: FitPreview,
};

/**
 * Props are JSON in a <script> inside the mount point, so Liquid is the only
 * source of data and nothing has to survive attribute escaping.
 *
 * Returns null — not an empty object — when they cannot be read. An island
 * with no props would mount empty and wipe out the fallback it was supposed
 * to improve on, so the caller leaves the Liquid in place instead.
 */
function readProps(element) {
    const holder = element.querySelector(':scope > script[data-sm-props]');

    if (!holder) return null;

    try {
        return JSON.parse(holder.textContent);
    } catch (error) {
        console.error('[shemakes] island props were not valid JSON', element, error);
        return null;
    }
}

function mount(element) {
    if (element.dataset.smMounted === 'true') return;

    const name = element.getAttribute('data-sm-island');
    const Component = ISLANDS[name];

    if (!Component) {
        console.warn(`[shemakes] no island registered for "${name}"`);
        return;
    }

    const props = readProps(element);

    // No usable props means the server-rendered markup is the best thing on
    // the page. Mounting anyway would replace it with an empty component.
    if (props === null) {
        console.warn(`[shemakes] island "${name}" has no usable props — keeping the server-rendered markup`);
        return;
    }

    try {
        const root = createRoot(element);
        root.render(
            <StrictMode>
                <Component {...props} />
            </StrictMode>,
        );

        element.dataset.smMounted = 'true';
    } catch (error) {
        // Leave the Liquid fallback exactly as it is.
        console.error(`[shemakes] island "${name}" failed to mount`, error);
    }
}

function mountAll(scope = document) {
    scope.querySelectorAll('[data-sm-island]').forEach(mount);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAll());
} else {
    mountAll();
}

// Sections added or re-rendered in the theme editor, and Dawn's own cart
// re-renders, both need their islands mounting again.
document.addEventListener('shopify:section:load', (event) => mountAll(event.target));
document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll('[data-sm-mounted]').forEach((element) => {
        delete element.dataset.smMounted;
    });
});
