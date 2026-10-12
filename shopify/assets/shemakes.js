/* ==========================================================================
   SHEmakes Transfers — redesign behaviour
   ==========================================================================

   Deliberately small and dependency-free. The redesign is a restyle, so the
   only JavaScript here is what CSS genuinely cannot do: reveal a section when
   it is scrolled to. Everything else — the ticker, the hover states — is CSS.

   No build step: this is a plain file in assets/, loaded with `defer`.
   ========================================================================== */

(function () {
  'use strict';

  /**
   * Reveal each marked block once it comes into view.
   *
   * The hidden starting state lives behind `.sm-reveal-ready` on <html>, which
   * is added here — so if this file fails to load, or the browser has no
   * IntersectionObserver, every block simply renders visible instead of the
   * page coming up blank.
   */
  function setUpReveals() {
    var blocks = document.querySelectorAll('.sm-reveal');

    if (!blocks.length) return;

    if (!('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('sm-reveal-ready');

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-revealed');
          // Once only: a block that re-hides on scroll-up is distracting.
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );

    blocks.forEach(function (block) {
      observer.observe(block);
    });
  }

  /**
   * Animate the menu panel shut as well as open.
   *
   * <details> is the right element here: it opens with no JavaScript, closes
   * on Escape, and is announced correctly. What it cannot do is animate — the
   * browser removes the content the instant `open` goes away, so a closing
   * transition has nothing left to run on.
   *
   * So closing is intercepted: mark it closing, let the animation play, then
   * drop the attribute. Opening needs no help; CSS handles that.
   */
  function setUpMenu() {
    var menus = document.querySelectorAll('details.sm-header__mobile');

    Array.prototype.forEach.call(menus, function (menu) {
      var summary = menu.querySelector('summary');
      var panel = menu.querySelector('.sm-header__panel');

      if (!summary || !panel) return;

      summary.addEventListener('click', function (event) {
        if (!menu.open) return;

        event.preventDefault();
        menu.classList.add('is-closing');

        var done = function () {
          menu.classList.remove('is-closing');
          menu.open = false;
          panel.removeEventListener('animationend', done);
        };

        panel.addEventListener('animationend', done);
        // A panel that never animates — reduced motion, a failed stylesheet —
        // must still close.
        window.setTimeout(done, 300);
      });

      // Tapping the page behind the panel closes it, as a drawer should.
      document.addEventListener('click', function (event) {
        if (!menu.open || menu.contains(event.target)) return;

        menu.open = false;
      });
    });
  }

  /**
   * Keep the header's cart count honest.
   *
   * It is printed by Liquid, so it holds whatever the page loaded with —
   * removing a line in the drawer left the badge showing the old number until
   * the next navigation. Every cart change already announces itself; this
   * listens and rewrites the badge.
   */
  function setUpCartCount() {
    document.addEventListener('shemakes:cart:updated', function (event) {
      var cart = event.detail;

      if (!cart || typeof cart.item_count !== 'number') return;

      var badges = document.querySelectorAll('[data-sm-cart-count]');

      Array.prototype.forEach.call(badges, function (badge) {
        badge.textContent = String(cart.item_count);
        badge.hidden = cart.item_count === 0;

        var link = badge.closest('[data-sm-cart-open]');

        if (link) link.setAttribute('aria-label', 'Cart, ' + cart.item_count + ' items');
      });
    });
  }



  /**
   * Land on the results, not at the top of the page.
   *
   * The filter links carry `#sm-results`, but the browser jumps there while
   * the images above are still unsized — by the time the grid has settled the
   * page has moved out from under it. This puts it right once things have
   * stopped moving.
   */
  function setUpResultsAnchor() {
    if (window.location.hash !== '#sm-results') return;

    var target = document.getElementById('sm-results');

    if (!target) return;

    var settle = function () {
      var top = target.getBoundingClientRect().top + window.scrollY - 110;

      window.scrollTo(0, top);
    };

    settle();
    window.setTimeout(settle, 250);
    window.addEventListener('load', settle, { once: true });
  }


  /**
   * Filtering without a page load.
   *
   * The links still point at real, shareable URLs — Shopify's own filter and
   * tag routes — so this only intercepts them: fetch that page, take the four
   * parts that changed, and put them in. With JavaScript off, or if anything
   * here throws, the link is followed the ordinary way and the page reloads.
   *
   * What gets swapped: the sidebar (its counts and ticks change), the count
   * line, the grid, and the pager.
   */
  function setUpFilterAjax() {
    var section = document.querySelector('[data-sm-collection]');

    if (!section) return;
    if (!window.fetch || !window.history.pushState || !window.DOMParser) return;

    var PARTS = ['sm-filters', 'sm-count', 'sm-results', 'sm-pager'];
    var loading = false;

    /**
     * Cards with nothing in them, in place of the grid.
     *
     * The alternative — leaving the old results up while the new ones load —
     * reads as "nothing happened", which is what made the filters feel broken
     * on a slow connection.
     */
    function skeleton() {
      var results = document.getElementById('sm-results');

      if (!results) return;

      var count = Math.min(results.querySelectorAll('.sm-card').length || 6, 12);
      var cards = '';

      for (var i = 0; i < count; i += 1) {
        cards +=
          '<div class="sm-skeleton">' +
          '<div class="sm-skeleton__media"></div>' +
          '<div class="sm-skeleton__line"></div>' +
          '<div class="sm-skeleton__line sm-skeleton__line--short"></div>' +
          '</div>';
      }

      results.innerHTML = '<div class="sm-browse__grid sm-skeleton__grid" aria-hidden="true">' + cards + '</div>';
      results.setAttribute('aria-busy', 'true');
    }

    function swap(html) {
      var next = new DOMParser().parseFromString(html, 'text/html');

      PARTS.forEach(function (id) {
        var here = document.getElementById(id);
        var there = next.getElementById(id);

        if (!here) return;

        // A part the new page does not have — the pager on a single page of
        // results, say — is emptied rather than left showing the old one.
        here.innerHTML = there ? there.innerHTML : '';

        if (there) {
          here.className = there.className;
        }
      });

      var results = document.getElementById('sm-results');

      if (results) results.removeAttribute('aria-busy');

      // The grid is an island; the runtime mounts on this event, scoped to
      // whatever element it is dispatched on.
      section.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
    }

    function go(url, push) {
      if (loading) return;

      loading = true;
      skeleton();

      window.fetch(url, { headers: { 'X-Requested-With': 'fetch' } })
        .then(function (response) {
          if (!response.ok) throw new Error(response.status);

          return response.text();
        })
        .then(function (html) {
          swap(html);

          if (push) window.history.pushState({ smFilter: true }, '', url);

          var target = document.getElementById('sm-results');

          if (target) {
            var top = target.getBoundingClientRect().top + window.scrollY - 110;

            if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
          }
        })
        .catch(function () {
          // Whatever went wrong, the URL is real: let the browser have it.
          window.location.href = url;
        })
        .then(function () {
          loading = false;
        });
    }

    document.addEventListener('click', function (event) {
      var link = event.target.closest('#sm-filters a, #sm-pager a, #sm-results .sm-browse__empty a');

      if (!link) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

      var url = link.getAttribute('href');

      if (!url || url.charAt(0) !== '/') return;

      event.preventDefault();
      go(url, true);
    });

    // The price range is a form, and it submits the same way.
    document.addEventListener('submit', function (event) {
      var form = event.target.closest('#sm-filters form');

      if (!form) return;

      event.preventDefault();

      var query = new URLSearchParams(new FormData(form)).toString();
      var action = form.getAttribute('action') || window.location.pathname;

      go(action.split('#')[0] + (query ? '?' + query : '') + '#sm-results', true);
    });

    // Back and forward have to work, or this is a worse page than the one it
    // replaced.
    window.addEventListener('popstate', function () {
      go(window.location.pathname + window.location.search, false);
    });
  }


  /**
   * Put the Klaviyo pop-up in the shop's clothes.
   *
   * Its own classes are hashed (`go401463541`) and change on every republish,
   * so the two buttons cannot be told apart in CSS — they share
   * `.klaviyo-form-button` and differ only in their words. This marks them
   * once, and the stylesheet does the rest.
   *
   * The form is built after load and re-rendered as the shopper moves through
   * it, so this keeps watching rather than running once.
   */
  function setUpKlaviyoSkin() {
    var DISMISS = /^\s*(no,?\s*thanks|no thank you|close|maybe later|not now)\s*$/i;

    function mark() {
      var forms = document.querySelectorAll('form.klaviyo-form, [class*="klaviyo-form"] form');

      Array.prototype.forEach.call(forms, function (form) {
        var panel = form.parentElement;

        if (panel && !panel.classList.contains('sm-klaviyo-panel')) {
          panel.classList.add('sm-klaviyo-panel');
        }
      });

      // The teaser: the small floating badge the form leaves behind once it
      // has been dismissed. Klaviyo draws it as a butterfly reading "SAVE";
      // the shop wants the offer in words, so this marks it and the
      // stylesheet blanks the artwork and draws a pill over it. The element
      // itself stays — it is the click target that reopens the form.
      // Klaviyo names the teaser `kl-teaser-<hash>`, not `klaviyo-form-*`.
      var teasers = document.querySelectorAll('[class*="kl-teaser"], [class*="klaviyo-form"]');

      Array.prototype.forEach.call(teasers, function (node) {
        var box = node.getBoundingClientRect();
        var floating = window.getComputedStyle(node).position === 'fixed';

        if (!floating || box.width > 180 || box.height > 180 || box.width < 32) return;
        if (node.classList.contains('sm-klaviyo-teaser')) return;

        node.classList.add('sm-klaviyo-teaser');
      });

      var buttons = document.querySelectorAll('.klaviyo-form-button');

      Array.prototype.forEach.call(buttons, function (button) {
        var dismiss = DISMISS.test(button.textContent || '');

        button.classList.toggle('sm-klaviyo-dismiss', dismiss);
        button.classList.toggle('sm-klaviyo-go', !dismiss);
      });
    }

    mark();

    if (!('MutationObserver' in window)) return;

    // Coalesced to one pass a frame. Klaviyo mutates its own subtree while it
    // animates, and marking on every mutation record is a dozen passes for
    // one open.
    var queued = false;

    function markSoon() {
      if (queued) return;

      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        mark();
      });
    }

    var watcher = new MutationObserver(markSoon);

    // This used to stop after 30 seconds, on the grounds that a pop-up is not
    // a permanent fixture. It is: dismissing the form leaves the teaser, and
    // clicking the teaser makes Klaviyo throw that element away and build a
    // new one. Past the timeout there was nothing left to mark the new one,
    // so the shop's offer went back to being Klaviyo's butterfly. It watches
    // for the session now — one pass a frame, only while Klaviyo is moving.
    watcher.observe(document.body, { childList: true, subtree: true });
  }


  /**
   * In-page links that land where they should.
   *
   * `scroll-behavior: smooth` alone stopped a third of the way down: the
   * collection page is still loading images while the scroll runs, so the
   * target moves and the browser gives up where it is. This scrolls, then
   * re-checks twice as the page settles.
   */
  function setUpAnchorLinks() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#sm-"]');

      if (!link) return;

      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);

      if (!target) return;

      event.preventDefault();

      var settle = function (smooth) {
        var top = target.getBoundingClientRect().top + window.scrollY - 96;

        window.scrollTo({ top: top, behavior: smooth ? 'smooth' : 'auto' });
      };

      settle(true);
      window.setTimeout(function () { settle(false); }, 600);
      window.setTimeout(function () { settle(false); }, 1400);

      if (window.history.replaceState) {
        window.history.replaceState(null, '', '#' + id);
      }
    });
  }

  function setUp() {
    setUpReveals();
    setUpAnchorLinks();
    setUpKlaviyoSkin();
    setUpFilterAjax();
    setUpResultsAnchor();
    setUpMenu();
    setUpCartCount();
    setUpBackToTop();
    setUpFilterGroups();
  }

  /**
   * The filter groups start shut on a phone and a tablet.
   *
   * They are written `open` so that a page with no JavaScript — and every
   * crawler — gets the filters expanded. This closes them where the sidebar
   * sits above the products rather than beside them, so the page opens on the
   * designs. A group the shopper has already narrowed by stays open: closing
   * it would hide the reason the grid looks the way it does.
   */
  function setUpFilterGroups() {
    if (window.innerWidth > 1023) return;

    var groups = document.querySelectorAll('.sm-browse__group');

    Array.prototype.forEach.call(groups, function (group) {
      if (group.querySelector('.is-on')) return;

      group.open = false;
    });
  }

  /**
   * Back to top, and how far down the page we are.
   *
   * One custom property per frame, coalesced into a rAF: the ring is a conic
   * gradient reading `--sm-progress`, so nothing here touches layout.
   *
   * It appears after a screen and a half. Sooner and it is in the way of the
   * hero on a phone; later and the shopper has already started flicking.
   */
  function setUpBackToTop() {
    var button = document.querySelector('.sm-totop');

    if (!button) return;

    button.hidden = false;

    var queued = false;

    function paint() {
      queued = false;

      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var y = window.scrollY || doc.scrollTop || 0;
      var pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;

      button.style.setProperty('--sm-progress', pct.toFixed(1));
      button.classList.toggle('is-on', y > window.innerHeight * 1.5);
    }

    function onScroll() {
      if (queued) return;

      queued = true;
      window.requestAnimationFrame(paint);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();

    button.addEventListener('click', function () {
      var slow = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      window.scrollTo({ top: 0, behavior: slow ? 'auto' : 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setUp);
  } else {
    setUp();
  }

  // Sections added in the theme editor are not there on first paint.
  document.addEventListener('shopify:section:load', function () {
    setUpReveals();
  });
})();


/**
 * The discount tab opens Klaviyo's pop-up.
 *
 * Klaviyo exposes `_klOnsite` as a queue, so the call works whether or not
 * their script has finished loading. With their script blocked or the form ID
 * wrong nothing opens, so the button removes itself rather than sitting there
 * doing nothing.
 */
function setUpDiscountTab() {
    const tab = document.querySelector('[data-sm-klaviyo-form]');

    if (!tab) return;

    document.documentElement.classList.add('sm-has-discount-tab');

    tab.addEventListener('click', () => {
        const id = tab.getAttribute('data-sm-klaviyo-form');

        window._klOnsite = window._klOnsite || [];
        window._klOnsite.push(['openForm', id]);
    });
}

setUpDiscountTab();


/**
 * The search field on a phone.
 *
 * The bar has room for five things at that width and the field is not one of
 * them, so it hides behind its own icon and drops down as a row of its own.
 */
function setUpHeaderSearch() {
    const toggle = document.querySelector('[data-sm-search-toggle]');
    const header = document.querySelector('.sm-header');

    if (!toggle || !header) return;

    toggle.addEventListener('click', () => {
        const open = header.classList.toggle('is-searching');

        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open) header.querySelector('.sm-header__searchbox input')?.focus();
    });
}

setUpHeaderSearch();
