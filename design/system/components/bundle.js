/* @ds-bundle: {"format":4,"namespace":"BlockConcepts","components":[{"name":"Wordmark"},{"name":"Button"},{"name":"NavBar"},{"name":"RenderPlaceholder"},{"name":"PillarPanels"},{"name":"Statement"},{"name":"SolutionTile"},{"name":"TierRow"},{"name":"CredibilityBand"},{"name":"CtaBand"},{"name":"Footer"},{"name":"CookieBanner"},{"name":"Callout"},{"name":"Stage"},{"name":"DataTable"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }

  /* Narrow below 820px, the breakpoint the website adapts at. */
  function useNarrow() {
    var s = useState(typeof window !== 'undefined' && window.innerWidth < 820), narrow = s[0], set = s[1];
    useEffect(function () {
      function on() { set(window.innerWidth < 820); }
      window.addEventListener('resize', on);
      on();
      return function () { window.removeEventListener('resize', on); };
    }, []);
    return narrow;
  }

  /* The mark: geometry copied from the master SVG (1000 x 1000, 50px stroke). */
  function Mark(props) {
    var size = props.size || 48;
    return h('svg', { className: cx('bc-mark', props.className), width: size, height: size, viewBox: '0 0 1000 1000', role: 'img', 'aria-label': props.label || 'Block Concepts mark', style: { color: props.color || 'var(--bc-steel-blue)' } },
      h('g', { stroke: 'currentColor', strokeWidth: 50, strokeMiterlimit: 10, fill: 'none' },
        h('circle', { cx: 500, cy: 500, r: 476 }),
        h('path', { d: 'M70 500 385 185 615 185 930 500 615 815 385 815Z' }),
        h('path', { d: 'M385 185 700 500 385 815' }),
        h('path', { d: 'M700 500 930 500' })));
  }

  /* variant: dark (website) | primary (white) | reversed (on Steel Blue) | one-color. tagline: "Specialty Automation" after a divider. */
  function Wordmark(props) {
    var variant = props.variant || 'dark';
    var size = props.size || 22;
    var word = h('span', { className: cx('bc-wordmark', 'bc-wordmark--' + variant), role: 'img', 'aria-label': 'Block Concepts', style: { fontSize: size } },
      h('span', { className: 'bc-wordmark__block' }, 'BLOCK'), ' ',
      h('span', { className: 'bc-wordmark__concepts' }, 'CONCEPTS'));
    if (!props.mark && !props.tagline) return word;
    return h('span', { className: 'bc-lockup' },
      props.mark ? h(Mark, { size: Math.round(size * 1.6), color: variant === 'reversed' ? '#fff' : variant === 'one-color' ? 'var(--bc-ink)' : 'var(--bc-steel-blue)' }) : null,
      word,
      props.tagline ? h('span', { className: 'bc-lockup__tag' }, h('span', { className: 'bc-lockup__bar' }, '|'), props.tagline) : null);
  }

  /* variant: primary | secondary | link */
  function Button(props) {
    var cls = cx('bc-button', 'bc-button--' + (props.variant || 'primary'), props.className);
    if (props.href) return h('a', { className: cls, href: props.href, onClick: props.onClick }, props.children);
    return h('button', { className: cls, type: props.type || 'button', disabled: props.disabled, onClick: props.onClick }, props.children);
  }

  /* links: [{label, href, onClick, group: 'pillars'|undefined}]. Desktop: inline right. Below 820px: hamburger and a full-screen menu. */
  function NavBar(props) {
    var narrow = useNarrow();
    var s = useState(!!props.menuOpen), open = s[0], setOpen = s[1];
    var links = props.links || [];
    var pillars = links.filter(function (l) { return l.group === 'pillars'; });
    var others = links.filter(function (l) { return l.group !== 'pillars'; });
    function link(l, cls) {
      return h('a', { key: l.label, className: cls, href: l.href || '#', 'aria-current': l.current ? 'page' : undefined, onClick: function (e) { if (l.onClick) l.onClick(e); setOpen(false); } }, l.label);
    }
    return h('header', { className: 'bc-nav' },
      h('a', { className: 'bc-nav__brand', href: props.homeHref || '#', 'aria-label': 'Block Concepts home' },
        h(Wordmark, { size: 15, tagline: narrow ? null : (props.tagline === undefined ? 'Specialty Automation' : props.tagline) })),
      narrow
        ? h('button', { className: 'bc-nav__burger', 'aria-label': 'Open menu', onClick: function () { setOpen(true); } }, h('span'), h('span'))
        : h('nav', { className: 'bc-nav__links', 'aria-label': 'Primary' }, links.map(function (l) { return link(l, 'bc-nav__link'); })),
      narrow && open ? h('div', { className: 'bc-menu', role: 'dialog', 'aria-label': 'Menu' },
        h('div', { className: 'bc-menu__top' }, h('span', { className: 'bc-label bc-label--muted' }, 'Menu'),
          h('button', { className: 'bc-menu__close', 'aria-label': 'Close menu', onClick: function () { setOpen(false); } }, '×')),
        h('nav', { className: 'bc-menu__nav' },
          pillars.length ? h('div', { className: 'bc-menu__group' }, h('span', { className: 'bc-label' }, 'Service pillars'), pillars.map(function (l) { return link(l, 'bc-menu__link'); })) : null,
          pillars.length ? h('div', { className: 'bc-menu__rule' }) : null,
          h('div', { className: 'bc-menu__group' }, others.map(function (l) { return link(l, 'bc-menu__link'); })))) : null);
  }

  /* Striped stand-in for a CAD render. label example: "CAD RENDER · SLS print farm". */
  function RenderPlaceholder(props) {
    return h('div', { className: cx('bc-placeholder', props.className), style: { aspectRatio: props.ratio || '4 / 3' } }, h('span', { className: 'bc-tag-text' }, props.label || 'IMAGE · render'));
  }

  /* pillars: [{name, label, scope: [bullets]}]. Three full-height panels; a swipeable row with indicator bars below 820px. */
  function PillarPanels(props) {
    var narrow = useNarrow();
    var pillars = props.pillars || [];
    var so = useState(props.open === undefined ? -1 : props.open), open = so[0], setOpen = so[1];
    var si = useState(0), idx = si[0], setIdx = si[1];
    var ref = React.useRef(null);
    function onScroll(e) { if (!narrow) return; var el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.clientWidth * 0.88))); }
    return h('div', null,
      h('section', { className: 'bc-pillars', ref: ref, onScroll: onScroll, style: props.height ? { '--bc-panel-h': props.height } : undefined },
        pillars.map(function (p, i) {
          var isOpen = open === i;
          return h('div', { key: p.name, className: cx('bc-pillar', isOpen && 'bc-pillar--open'), id: 'pillar-' + p.name.toLowerCase() },
            h('span', { className: 'bc-pillar__image bc-tag-text' }, 'IMAGE · ' + p.name + ' render'),
            h('div', { className: 'bc-pillar__scrim' }),
            h('button', { className: 'bc-pillar__button', 'aria-expanded': isOpen, onClick: function () { setOpen(isOpen ? -1 : i); } },
              h('span', { className: 'bc-label' }, p.label),
              h('span', { className: 'bc-pillar__name' }, p.name),
              h('span', { className: 'bc-pillar__chevron', style: { transform: isOpen ? 'rotate(180deg)' : 'none' } }, h('span')),
              isOpen ? h('ul', { className: 'bc-pillar__scope' }, p.scope.map(function (t) { return h('li', { key: t }, h('span', { className: 'bc-pillar__dot' }), h('span', null, t)); })) : null));
        })),
      narrow ? h('div', { className: 'bc-dots' }, pillars.map(function (p, i) {
        return h('button', { key: p.name, className: 'bc-dots__hit', 'aria-label': 'Show ' + p.name, onClick: function () { var el = ref.current; if (el) el.scrollTo({ left: i * el.clientWidth * 0.88, behavior: 'smooth' }); } },
          h('span', { className: cx('bc-dots__bar', idx === i && 'bc-dots__bar--on') }));
      })) : null);
  }

  function Statement(props) {
    return h('section', { className: 'bc-statement' },
      h('div', { className: 'bc-statement__lead' },
        props.eyebrow ? h('span', { className: 'bc-label' }, props.eyebrow) : null,
        h('h1', { className: 'bc-headline' }, props.headline)),
      h('div', { className: 'bc-statement__body' },
        props.paragraph ? h('p', { className: 'bc-body bc-body--muted' }, props.paragraph) : null,
        props.caption ? h('p', { className: 'bc-body' }, props.caption) : null));
  }

  /* One solutions tile: render, industry tag, pillar tags, title. Lay tiles in a .bc-tiles grid. */
  function SolutionTile(props) {
    return h('a', { className: 'bc-tile', href: props.href || '#' },
      h('span', { className: 'bc-tile__render bc-tag-text' }, props.render || ''),
      h('div', { className: 'bc-tile__text' },
        h('div', { className: 'bc-tags' },
          h('span', { className: 'bc-tag bc-tag--solid' }, props.industry),
          (props.pillars || []).map(function (t) { return h('span', { key: t, className: 'bc-tag bc-tag--line' }, t); })),
        h('span', { className: 'bc-tile__title' }, props.title)));
  }

  /* One sourcing tier: percentage, Steel Blue bar filled to it, name, what is sourced, render, and a linked solution if one exists. */
  function TierRow(props) {
    return h('article', { className: 'bc-tier' },
      h('div', { className: 'bc-tier__main' },
        h('p', { className: 'bc-tier__pct' }, props.pct + '%'),
        h('div', { className: 'bc-bar', role: 'img', 'aria-label': props.name + ' tier, ' + props.pct + ' percent' }, h('span', { style: { width: props.pct + '%' } })),
        h('h3', { className: 'bc-tier__name' }, props.name),
        h('p', { className: 'bc-body bc-body--muted' }, props.items),
        props.solution ? h('a', { className: 'bc-tier__link', href: props.solution.href || '#' }, props.solution.title, ' →') : null),
      h(RenderPlaceholder, { label: 'CAD RENDER · ' + props.name + ' tier', ratio: '16 / 10' }));
  }

  function CredibilityBand(props) {
    return h('section', { className: 'bc-band' },
      h('div', { className: 'bc-band__text' }, props.children),
      h('a', { className: 'bc-getto', href: props.href || '#' }, props.linkLabel || 'Get to know us', h('span', null, '→')));
  }

  function CtaBand(props) {
    return h('section', { className: 'bc-cta' },
      h('h2', { className: 'bc-cta__title' }, props.title),
      h(Button, { href: props.href || '#' }, props.buttonLabel || 'Contact'));
  }

  /* links: [{label, href}], legal: [{label, href}]. Rows stack on phones; the logo sits right on desktop. */
  function Footer(props) {
    var links = props.links || [], legal = props.legal || [];
    return h('footer', { className: 'bc-footer' },
      h('div', { className: 'bc-footer__top' },
        h('div', { className: 'bc-footer__social' }, (props.social || []).map(function (s) { return h('a', { key: s.label, className: 'bc-social', href: s.href || '#', 'aria-label': s.label }, s.label); })),
        h(Wordmark, { size: 22 })),
      h('div', { className: 'bc-footer__rows' },
        h('nav', { className: 'bc-footer__links' }, links.map(function (l) { return h('a', { key: l.label, href: l.href || '#' }, l.label); })),
        h('div', { className: 'bc-footer__bottom' },
          h('span', { className: 'bc-small' }, props.copyright || '©2026 Block Concepts LLC · Specialty Automation'),
          h('div', { className: 'bc-footer__legal' },
            legal.map(function (l) { return l.onClick ? h('button', { key: l.label, onClick: l.onClick }, l.label) : h('a', { key: l.label, href: l.href || '#' }, l.label); })))));
  }

  function CookieBanner(props) {
    return h('div', { className: 'bc-cookie', role: 'region', 'aria-label': 'Cookie consent' },
      h('p', null, props.children || 'We use Google Analytics to understand how the site is used. See the ', h('a', { href: props.privacyHref || '#' }, 'Privacy policy'), '.'),
      h('div', { className: 'bc-cookie__actions' },
        h('button', { className: 'bc-cookie__accept', onClick: props.onAccept }, 'Accept'),
        h('button', { className: 'bc-cookie__decline', onClick: props.onDecline }, 'Decline')));
  }

  /* Document components: web renderings of the Word document patterns. */
  function Callout(props) {
    return h('aside', { className: 'bc-callout' },
      props.title ? h('p', { className: 'bc-callout__title' }, props.title) : null,
      h('div', null, props.children));
  }

  function Stage(props) {
    return h('section', { className: 'bc-stage' },
      h('header', { className: 'bc-stage__head' },
        h('p', { className: 'bc-label' }, 'Stage ' + props.number),
        h('h3', { className: 'bc-stage__name' }, props.name),
        h('p', { className: 'bc-stage__statement' }, props.statement)),
      h('ul', { className: 'bc-stage__list' }, (props.deliverables || []).map(function (d) { return h('li', { key: d }, d); })),
      props.cost ? h('p', { className: 'bc-stage__cost' }, h('strong', null, 'Cost at this milestone: '), props.cost) : null);
  }

  function DataTable(props) {
    var cols = props.columns || [];
    return h('div', { className: 'bc-table-wrap' },
      h('table', { className: 'bc-table' },
        props.caption ? h('caption', null, props.caption) : null,
        h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { key: c.key, scope: 'col' }, c.label); }))),
        h('tbody', null, (props.rows || []).map(function (r, i) {
          return h('tr', { key: i }, cols.map(function (c) { return h('td', { key: c.key, className: c.mono ? 'bc-table__mono' : undefined }, r[c.key]); }));
        }))));
  }

  window.BlockConcepts = { Mark: Mark, Wordmark: Wordmark, Button: Button, NavBar: NavBar, RenderPlaceholder: RenderPlaceholder, PillarPanels: PillarPanels, Statement: Statement, SolutionTile: SolutionTile, TierRow: TierRow, CredibilityBand: CredibilityBand, CtaBand: CtaBand, Footer: Footer, CookieBanner: CookieBanner, Callout: Callout, Stage: Stage, DataTable: DataTable };
})();
