import { useEffect, useId, useRef, useState } from 'react';

/**
 * A select that the design controls.
 *
 * A native `<select>` draws its own popup: square corners, the operating
 * system's blue highlight, the system font. None of that is reachable from
 * CSS, which is why the contact form's one dropdown looked like it belonged to
 * a different site.
 *
 * The chosen value goes into a hidden input with the real field name, so the
 * form still posts to Shopify exactly as it did. With no JavaScript the Liquid
 * fallback is a plain `<select>` — the form keeps working either way.
 */
export default function SelectField({ name, label, options = [], value, param, prefix = '' }) {
    // Options are plain strings for a form field, {label, value} when the
    // choice is a URL parameter and the two differ.
    const items = options.map((option) =>
        typeof option === 'string' ? { label: option, value: option } : option,
    );

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(
        () => value || (typeof options[0] === 'string' ? options[0] : options[0]?.value) || '',
    );
    const [active, setActive] = useState(0);
    const root = useRef(null);
    const listId = useId();

    useEffect(() => {
        if (!open) return undefined;

        const onPointer = (event) => {
            if (!root.current?.contains(event.target)) setOpen(false);
        };

        document.addEventListener('mousedown', onPointer);

        return () => document.removeEventListener('mousedown', onPointer);
    }, [open]);

    const current = items.find((item) => item.value === selected) ?? items[0];

    const choose = (option) => {
        setSelected(option.value);
        setOpen(false);

        // A URL parameter is the whole point of the control on the browse page:
        // Shopify does the sorting, so the choice has to travel in the address.
        if (param) {
            const url = new URL(window.location.href);
            url.searchParams.set(param, option.value);
            // Sorting changes what page 1 is.
            url.searchParams.delete('page');
            window.location.assign(url.toString());
            return;
        }

        root.current?.querySelector('.sm-select__button')?.focus();
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            return;
        }

        if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setActive(Math.max(0, items.findIndex((item) => item.value === selected)));
            setOpen(true);
            return;
        }

        if (!open) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(options.length - 1, index + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(0, index - 1));
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            choose(items[active]);
        } else if (event.key === 'Home') {
            event.preventDefault();
            setActive(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setActive(options.length - 1);
        }
    };

    return (
        <div className="sm-field sm-select" ref={root}>
            <span className="sm-select__label" id={`${listId}-label`}>{label}</span>

            {!param && <input type="hidden" name={name} value={selected} />}

            <button
                type="button"
                className={`sm-select__button${open ? ' is-open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby={`${listId}-label`}
                onClick={() => {
                    setActive(Math.max(0, items.findIndex((item) => item.value === selected)));
                    setOpen((was) => !was);
                }}
                onKeyDown={onKeyDown}
            >
                <span>{prefix}{current?.label ?? selected}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {open && (
                <ul className="sm-select__list" role="listbox" aria-labelledby={`${listId}-label`} tabIndex={-1}>
                    {items.map((option, index) => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === selected}
                            className={`sm-select__option${index === active ? ' is-active' : ''}${option.value === selected ? ' is-selected' : ''}`}
                            onMouseEnter={() => setActive(index)}
                            onMouseDown={(event) => {
                                // mousedown, not click: the outside-click
                                // listener above fires on mousedown too.
                                event.preventDefault();
                                choose(option);
                            }}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
