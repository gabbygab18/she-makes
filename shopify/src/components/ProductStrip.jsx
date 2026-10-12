import ProductCard from './ProductCard';

/**
 * A row of products — the homepage "New this week".
 *
 * No state of its own: it exists so the strip draws the same card as browse,
 * add to cart included. Liquid still picks the products and renders the
 * heading around it.
 */
export default function ProductStrip({ products = [], currency = 'CAD' }) {
    if (products.length === 0) return null;

    return (
        <div className="sm-browse__grid">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} currency={currency} />
            ))}
        </div>
    );
}
