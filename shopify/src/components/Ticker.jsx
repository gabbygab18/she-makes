/**
 * The claims ticker.
 *
 * The list is rendered twice and the track slides exactly half its width, so
 * the loop has no seam. The second copy is hidden from assistive technology
 * rather than read out again.
 */
export default function Ticker({ claims = [], speed = 48 }) {
    if (claims.length === 0) return null;

    return (
        <div className="sm-ticker" style={{ '--sm-ticker-duration': `${speed}s` }}>
            <div className="sm-ticker__track">
                {[false, true].map((isClone) => (
                    <ul className="sm-ticker__list" key={String(isClone)} aria-hidden={isClone || undefined}>
                        {claims.map((claim, index) => (
                            <li className="sm-ticker__item" key={`${claim}-${index}`}>
                                <span>{claim}</span>
                                <span className="sm-ticker__dot" aria-hidden="true" />
                            </li>
                        ))}
                    </ul>
                ))}
            </div>
        </div>
    );
}
