import { useState } from 'react';
import Icon from './Icon';

/**
 * The product gallery.
 *
 * The shop's extra images are not alternate angles — they are information:
 * the pressing instructions, the size chart, "here's why you'll love it".
 * Liquid drew them as 84px thumbnails with nothing to click, so the only
 * readable one was whichever happened to be first.
 *
 * Thumbnails are big enough to recognise here, and choosing one swaps the main
 * image. Everything is already on the page; this only decides which one is
 * shown large.
 */
export default function ProductGallery({ images = [], alt = '' }) {
    const [shown, setShown] = useState(0);

    if (images.length === 0) return null;

    const current = images[Math.min(shown, images.length - 1)];

    // Wraps at both ends: the last photo's "next" is the first one. A dead
    // arrow on the last image reads as a broken control.
    const step = (by) => setShown((index) => (index + by + images.length) % images.length);

    return (
        <div className="sm-gallery2">
            <div className="sm-gallery2__main">
                <img
                    src={current.large}
                    srcSet={`${current.medium} 600w, ${current.large} 1200w`}
                    sizes="(min-width: 990px) 45vw, 92vw"
                    alt={current.alt || alt}
                    width={current.width || undefined}
                    height={current.height || undefined}
                    loading="eager"
                />

                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="sm-gallery2__nav sm-gallery2__nav--prev"
                            onClick={() => step(-1)}
                        >
                            <Icon name="arrowRight" size={18} />
                            <span className="visually-hidden">Previous image</span>
                        </button>

                        <button
                            type="button"
                            className="sm-gallery2__nav sm-gallery2__nav--next"
                            onClick={() => step(1)}
                        >
                            <Icon name="arrowRight" size={18} />
                            <span className="visually-hidden">Next image</span>
                        </button>

                        <p className="sm-gallery2__count" aria-hidden="true">
                            {Math.min(shown, images.length - 1) + 1} / {images.length}
                        </p>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <ul className="sm-gallery2__thumbs" role="list">
                    {images.map((image, index) => (
                        <li key={image.id ?? image.large}>
                            <button
                                type="button"
                                className={`sm-gallery2__thumb${index === shown ? ' is-current' : ''}`}
                                onClick={() => setShown(index)}
                                aria-current={index === shown}
                            >
                                <img src={image.thumb} alt="" loading="lazy" />
                                <span className="visually-hidden">
                                    Show image {index + 1} of {images.length}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
