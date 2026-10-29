/* @ds-bundle: {"format":4,"namespace":"BlockConcepts","components":[{"name":"Wordmark"},{"name":"Button"},{"name":"NavBar"},{"name":"RenderPlaceholder"},{"name":"PillarPanels"},{"name":"Statement"},{"name":"SolutionTile"},{"name":"TierRow"},{"name":"CredibilityBand"},{"name":"CtaBand"},{"name":"Footer"},{"name":"CookieBanner"},{"name":"Callout"},{"name":"Stage"},{"name":"DataTable"},{"name":"TextField"},{"name":"SelectField"},{"name":"TextArea"},{"name":"FileDrop"},{"name":"Checkbox"},{"name":"Radio"},{"name":"SearchField"},{"name":"TabBar"},{"name":"ListBox"},{"name":"ButtonColumn"},{"name":"StatusPill"},{"name":"StatusSelect"},{"name":"LogTable"},{"name":"PdfPreview"},{"name":"DetailPane"},{"name":"GrabLayout"},{"name":"FixLayout"},{"name":"VaultShell"},{"name":"BuilderLayout"},{"name":"Modal"},{"name":"ConfirmDialog"},{"name":"Toast"},{"name":"StateMessage"},{"name":"StagedBar"},{"name":"StepRail"},{"name":"ConfigBar"},{"name":"StationCard"},{"name":"AddStation"},{"name":"LayoutPreview"},{"name":"WelcomeScreen"},{"name":"ChatWindow"},{"name":"DrawingSheet"},{"name":"StationBox"},{"name":"DrawingLine"},{"name":"FlowArrow"},{"name":"DrawingLegend"},{"name":"ScheduleTable"},{"name":"ProcessList"}]} */
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

  /* ===== Application components: Concepts Hub and Concepts Vault ===== */
  var uidn = 0;
  function useUid(prefix) { var r = React.useRef(null); if (!r.current) { uidn += 1; r.current = (prefix || 'bc') + '-' + uidn; } return r.current; }
  function icon(name, size) {
    var s = size || 16, p = { width: s, height: s, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true, focusable: 'false', className: 'bc-icon' };
    var d = {
      chevron: h('path', { d: 'M3 6l5 5 5-5' }),
      search: [h('circle', { key: 1, cx: 7, cy: 7, r: 4.5 }), h('path', { key: 2, d: 'M10.5 10.5L14 14' })],
      close: h('path', { d: 'M3.5 3.5l9 9M12.5 3.5l-9 9' }),
      check: h('path', { d: 'M3 8.5l3.2 3.2L13 4.8' }),
      expand: h('path', { d: 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10' }),
      collapse: h('path', { d: 'M6 2.5V6H2.5M13.5 6H10V2.5M10 13.5V10h3.5M2.5 10H6v3.5' }),
      download: h('path', { d: 'M8 2v8M4.5 7L8 10.5 11.5 7M2.5 13.5h11' }),
      lock: [h('rect', { key: 1, x: 3, y: 7, width: 10, height: 7 }), h('path', { key: 2, d: 'M5.5 7V5a2.5 2.5 0 015 0v2' })],
      archive: [h('rect', { key: 1, x: 2, y: 2.5, width: 12, height: 3 }), h('path', { key: 2, d: 'M3 5.5V13.5h10V5.5M6.5 8.5h3' })],
      open: h('path', { d: 'M9 2.5h4.5V7M13.5 2.5L7 9M11.5 9.5v4h-9v-9h4' }),
      sort: h('path', { d: 'M5 3v10M2.5 10.5L5 13l2.5-2.5M11 13V3M8.5 5.5L11 3l2.5 2.5' }),
      upload: h('path', { d: 'M8 11V3M4.5 6L8 2.5 11.5 6M2.5 13.5h11' }),
      back: h('path', { d: 'M13 8H3M7 4L3 8l4 4' }),
      info: [h('circle', { key: 1, cx: 8, cy: 8, r: 6 }), h('path', { key: 2, d: 'M8 7.5v4M8 5v.1' })],
      warn: [h('path', { key: 1, d: 'M8 2l6.5 11.5h-13z' }), h('path', { key: 2, d: 'M8 6.5v3.2M8 11.6v.1' })],
      error: [h('rect', { key: 1, x: 2, y: 2, width: 12, height: 12 }), h('path', { key: 2, d: 'M5.5 5.5l5 5M10.5 5.5l-5 5' })],
      plus: h('path', { d: 'M8 3v10M3 8h10' }),
      arrow: h('path', { d: 'M2 8h11M9 4l4 4-4 4' })
    };
    return h('svg', p, d[name]);
  }

  /* ---------- Form controls ---------- */
  function Field(props) {
    return h('div', { className: cx('bc-field', props.error && 'bc-field--error', props.disabled && 'bc-field--disabled', props.className) },
      h('label', { className: 'bc-field__label', htmlFor: props.id }, props.label, props.optional ? h('span', { className: 'bc-field__opt' }, ' (optional)') : null),
      props.children,
      props.error ? h('p', { className: 'bc-field__error', id: props.id + '-msg', role: 'alert' }, icon('error', 14), props.error)
        : props.hint ? h('p', { className: 'bc-field__hint', id: props.id + '-msg' }, props.hint) : null);
  }
  function describe(props, id) { return props.error || props.hint ? id + '-msg' : undefined; }

  /* type: text | email | number. Only type="email" validates, on blur: it needs one @ and a dot after it. */
  function TextField(props) {
    var id = useUid('tf');
    var st = useState(props.defaultValue || ''), inner = st[0], setInner = st[1];
    var tc = useState(!!props.touched), touched = tc[0], setTouched = tc[1];
    var controlled = props.value !== undefined;
    var value = controlled ? props.value : inner;
    var bad = props.type === 'email' && touched && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    var error = props.error || (bad ? 'Enter an email address like name@company.com' : '');
    return h(Field, { id: id, label: props.label, hint: props.hint, error: error, disabled: props.disabled, optional: props.optional },
      h('div', { className: 'bc-control' + (props.suffix ? ' bc-control--suffix' : '') },
        h('input', { id: id, className: 'bc-input', type: props.type || 'text', name: props.name, value: value, disabled: props.disabled, required: props.required, inputMode: props.inputMode,
          'aria-invalid': error ? true : undefined, 'aria-describedby': describe({ error: error, hint: props.hint }, id),
          onChange: function (e) { if (!controlled) setInner(e.target.value); if (props.onChange) props.onChange(e.target.value, e); },
          onBlur: function () { setTouched(true); } }),
        props.suffix ? h('span', { className: 'bc-input__suffix' }, props.suffix) : null));
  }

  /* options: [{value, label}] or strings */
  function SelectField(props) {
    var id = useUid('sf');
    var opts = (props.options || []).map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; });
    return h(Field, { id: id, label: props.label, hint: props.hint, error: props.error, disabled: props.disabled, optional: props.optional },
      h('div', { className: 'bc-control bc-control--select' },
        h('select', { id: id, className: 'bc-input', name: props.name, value: props.value, defaultValue: props.value === undefined ? props.defaultValue : undefined, disabled: props.disabled,
          'aria-invalid': props.error ? true : undefined, 'aria-describedby': describe(props, id), onChange: function (e) { if (props.onChange) props.onChange(e.target.value, e); } },
          opts.map(function (o) { return h('option', { key: o.value, value: o.value }, o.label); })),
        h('span', { className: 'bc-select__chevron' }, icon('chevron'))));
  }

  function TextArea(props) {
    var id = useUid('ta');
    var st = useState(props.defaultValue || ''), inner = st[0], setInner = st[1];
    var controlled = props.value !== undefined, value = controlled ? props.value : inner;
    return h(Field, { id: id, label: props.label, hint: props.hint, error: props.error, disabled: props.disabled, optional: props.optional },
      h('div', { className: 'bc-control bc-control--area' },
        h('textarea', { id: id, className: 'bc-input bc-input--area', rows: props.rows || 4, name: props.name, value: value, disabled: props.disabled,
          'aria-invalid': props.error ? true : undefined, 'aria-describedby': describe(props, id),
          onChange: function (e) { if (!controlled) setInner(e.target.value); if (props.onChange) props.onChange(e.target.value, e); } })));
  }

  /* Drag area plus a Choose file button. onFiles receives a FileList. */
  function FileDrop(props) {
    var id = useUid('fd');
    var ref = React.useRef(null);
    var sf = useState(props.fileName || ''), fileName = sf[0], setFileName = sf[1];
    var sd = useState(false), drag = sd[0], setDrag = sd[1];
    function take(files) { if (files && files.length) { setFileName(files[0].name); if (props.onFiles) props.onFiles(files); } }
    return h(Field, { id: id, label: props.label, hint: props.hint, error: props.error, disabled: props.disabled, optional: props.optional },
      h('div', { className: cx('bc-drop', drag && 'bc-drop--drag'), onDragOver: function (e) { e.preventDefault(); if (!props.disabled) setDrag(true); }, onDragLeave: function () { setDrag(false); },
        onDrop: function (e) { e.preventDefault(); setDrag(false); if (!props.disabled) take(e.dataTransfer.files); } },
        icon('upload', 20),
        h('p', { className: 'bc-drop__text' }, fileName ? h('strong', null, fileName) : (props.prompt || 'Drag a file here, or')),
        h('button', { type: 'button', className: 'bc-button bc-button--secondary bc-button--compact', disabled: props.disabled, onClick: function () { ref.current && ref.current.click(); } }, fileName ? 'Replace file' : 'Choose file'),
        h('input', { ref: ref, id: id, type: 'file', className: 'bc-drop__input', accept: props.accept, disabled: props.disabled, tabIndex: -1, 'aria-describedby': describe(props, id), onChange: function (e) { take(e.target.files); } })));
  }

  function Checkbox(props) {
    var id = useUid('cb');
    return h('div', { className: cx('bc-check', props.disabled && 'bc-check--disabled') },
      h('input', { id: id, type: 'checkbox', className: 'bc-check__input', name: props.name, checked: props.checked, defaultChecked: props.checked === undefined ? props.defaultChecked : undefined, disabled: props.disabled,
        onChange: function (e) { if (props.onChange) props.onChange(e.target.checked, e); } }),
      h('label', { htmlFor: id, className: 'bc-check__label' }, h('span', { className: 'bc-check__box' }, icon('check', 14)), h('span', null, props.label)));
  }

  /* options: [{value, label}]. A radio group is one fieldset with a visible legend. */
  function Radio(props) {
    var name = useUid('rg');
    var st = useState(props.defaultValue), inner = st[0], setInner = st[1];
    var value = props.value !== undefined ? props.value : inner;
    return h('fieldset', { className: cx('bc-radiogroup', props.error && 'bc-field--error'), disabled: props.disabled },
      h('legend', { className: 'bc-field__label' }, props.legend),
      (props.options || []).map(function (o) {
        var id = name + '-' + o.value;
        return h('div', { key: o.value, className: 'bc-check' },
          h('input', { id: id, type: 'radio', className: 'bc-check__input', name: props.name || name, value: o.value, checked: value === o.value,
            onChange: function () { setInner(o.value); if (props.onChange) props.onChange(o.value); } }),
          h('label', { htmlFor: id, className: 'bc-check__label' }, h('span', { className: 'bc-check__box bc-check__box--radio' }, h('span')), h('span', null, o.label)));
      }),
      props.error ? h('p', { className: 'bc-field__error', role: 'alert' }, icon('error', 14), props.error) : null);
  }

  function SearchField(props) {
    var id = useUid('sr');
    var st = useState(props.defaultValue || ''), inner = st[0], setInner = st[1];
    var value = props.value !== undefined ? props.value : inner;
    return h('div', { className: cx('bc-field', props.className), role: 'search' },
      h('label', { className: 'bc-field__label', htmlFor: id }, props.label || 'Search'),
      h('div', { className: 'bc-control bc-control--search' },
        icon('search'),
        h('input', { id: id, type: 'search', className: 'bc-input', value: value, placeholder: props.placeholder, disabled: props.disabled,
          onChange: function (e) { if (props.value === undefined) setInner(e.target.value); if (props.onChange) props.onChange(e.target.value, e); } })));
  }

  /* ---------- Navigation lists ---------- */
  /* tabs: [{id, label}]. Fixed count, always one row: tabs share the width equally and the type scales down to fit. */
  function TabBar(props) {
    var tabs = props.tabs || [];
    var st = useState(props.defaultValue || (tabs[0] && tabs[0].id)), inner = st[0], setInner = st[1];
    var value = props.value !== undefined ? props.value : inner;
    var base = useUid('tab');
    var refs = React.useRef({});
    function pick(id, focus) { if (props.value === undefined) setInner(id); if (props.onChange) props.onChange(id); if (focus && refs.current[id]) refs.current[id].focus(); }
    function key(e, i) {
      var n = tabs.length, to = -1;
      if (e.key === 'ArrowRight') to = (i + 1) % n; else if (e.key === 'ArrowLeft') to = (i - 1 + n) % n; else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = n - 1;
      if (to >= 0) { e.preventDefault(); pick(tabs[to].id, true); }
    }
    return h('div', { className: 'bc-tabs', role: 'tablist', 'aria-label': props.label || 'Sections', style: { '--n': tabs.length } },
      tabs.map(function (t, i) {
        var on = t.id === value;
        return h('button', { key: t.id, ref: function (el) { refs.current[t.id] = el; }, id: base + '-' + t.id, role: 'tab', type: 'button', className: cx('bc-tab', on && 'bc-tab--on'), 'aria-selected': on, 'aria-controls': props.panelId, tabIndex: on ? 0 : -1, title: t.label,
          onClick: function () { pick(t.id); }, onKeyDown: function (e) { key(e, i); } }, h('span', null, t.label));
      }));
  }

  /* items: [{id, label, meta}]. Active row is Steel Blue. Scrolls on its own; give it a height. */
  function ListBox(props) {
    var items = props.items || [];
    var st = useState(props.defaultValue), inner = st[0], setInner = st[1];
    var value = props.value !== undefined ? props.value : inner;
    var sq = useState(''), q = sq[0], setQ = sq[1];
    var uid = useUid('lb');
    var shown = items.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q.toLowerCase()) >= 0; });
    function pick(id) { if (props.value === undefined) setInner(id); if (props.onChange) props.onChange(id); }
    function key(e) {
      var i = shown.findIndex(function (it) { return it.id === value; }), to = -1;
      if (e.key === 'ArrowDown') to = Math.min(shown.length - 1, i + 1); else if (e.key === 'ArrowUp') to = Math.max(0, i < 0 ? 0 : i - 1); else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = shown.length - 1;
      if (to >= 0 && shown[to]) { e.preventDefault(); pick(shown[to].id); var el = document.getElementById(uid + '-' + shown[to].id); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
    }
    return h('div', { className: cx('bc-listbox', props.className), style: props.height ? { height: props.height } : undefined },
      props.search ? h(SearchField, { label: props.searchLabel || 'Search', value: q, onChange: setQ }) : null,
      h('ul', { className: 'bc-listbox__list', role: 'listbox', tabIndex: 0, 'aria-label': props.label, 'aria-activedescendant': value ? uid + '-' + value : undefined, onKeyDown: key },
        shown.length ? shown.map(function (it) {
          var on = it.id === value;
          return h('li', { key: it.id, id: uid + '-' + it.id, role: 'option', 'aria-selected': on, className: cx('bc-option', on && 'bc-option--on'), onClick: function () { pick(it.id); } },
            h('span', { className: 'bc-option__label' }, it.label), it.meta ? h('span', { className: 'bc-option__meta' }, it.meta) : null);
        }) : h('li', { className: 'bc-option bc-option--empty', role: 'presentation' }, 'No matches')));
  }

  /* items: [{id, label, private}]. One selected; the private item is set apart and marked with a lock. */
  function ButtonColumn(props) {
    var items = props.items || [];
    var st = useState(props.defaultValue), inner = st[0], setInner = st[1];
    var value = props.value !== undefined ? props.value : inner;
    function pick(id) { if (props.value === undefined) setInner(id); if (props.onChange) props.onChange(id); }
    var pub = items.filter(function (i) { return !i.private; }), priv = items.filter(function (i) { return i.private; });
    return h('nav', { className: cx('bc-btncol', props.className), 'aria-label': props.label || 'Options' },
      pub.map(function (it) { return h('button', { key: it.id, type: 'button', className: cx('bc-btncol__btn', it.id === value && 'bc-btncol__btn--on'), 'aria-pressed': it.id === value, onClick: function () { pick(it.id); } }, it.label); }),
      priv.length ? h('div', { className: 'bc-btncol__private' }, priv.map(function (it) {
        return h('button', { key: it.id, type: 'button', className: cx('bc-btncol__btn', 'bc-btncol__btn--private', it.id === value && 'bc-btncol__btn--on'), 'aria-pressed': it.id === value, onClick: function () { pick(it.id); } }, icon('lock'), it.label);
      })) : null);
  }

  /* ---------- Status ---------- */
  var STATE = {
    status: { New: ['new', 0], Contacted: ['contacted', 0.5], Quoted: ['quoted', 0.75], Closed: ['closed', 1] },
    build: { Quoting: ['quoting', 1 / 6], Designing: ['designing', 2 / 6], Purchasing: ['purchasing', 3 / 6], Manufacturing: ['manufacturing', 4 / 6], Assembling: ['assembling', 5 / 6], Completed: ['completed', 1] },
    feedback: { error: ['error', 'error'], warning: ['warning', 'warn'], success: ['success', 'check'], info: ['info', 'info'] }
  };
  var KIND_VALUES = { status: ['New', 'Contacted', 'Quoted', 'Closed'], build: ['Quoting', 'Designing', 'Purchasing', 'Manufacturing', 'Assembling', 'Completed'], feedback: ['error', 'warning', 'success', 'info'] };
  /* Marker: a small square that fills with progress, so state never rests on color alone. */
  function Marker(props) {
    if (typeof props.fill === 'string') return icon(props.fill, 12);
    var f = props.fill;
    return h('svg', { className: 'bc-marker', width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': true, focusable: 'false' },
      h('rect', { x: 0.8, y: 0.8, width: 10.4, height: 10.4, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }),
      f > 0 ? h('rect', { x: 0.8, y: 0.8 + 10.4 * (1 - f), width: 10.4, height: 10.4 * f, fill: 'currentColor' }) : null);
  }
  /* kind: status | build | feedback. value: the state name. */
  function StatusPill(props) {
    var def = STATE[props.kind || 'status'][props.value];
    if (!def) return h('span', { className: 'bc-pill' }, props.value);
    return h('span', { className: cx('bc-pill', 'bc-pill--' + (props.kind || 'status') + '-' + def[0], props.className) },
      h(Marker, { fill: def[1] }), h('span', { className: 'bc-pill__label' }, props.label || props.value));
  }
  /* Inline editor: the pill is a native select, so it is keyboard and screen reader ready. */
  function StatusSelect(props) {
    var kind = props.kind || 'build';
    var vals = props.options || KIND_VALUES[kind];
    var def = STATE[kind][props.value] || ['x', 0];
    return h('span', { className: cx('bc-pill', 'bc-pill--editable', 'bc-pill--' + kind + '-' + def[0], props.className) },
      h(Marker, { fill: def[1] }),
      h('span', { className: 'bc-pill__label' }, props.value),
      icon('chevron', 12),
      h('select', { className: 'bc-pill__select', value: props.value, 'aria-label': props.label || (kind === 'build' ? 'Build State' : 'Status'), disabled: props.disabled, onChange: function (e) { if (props.onChange) props.onChange(e.target.value, e); } },
        vals.map(function (v) { return h('option', { key: v, value: v }, v); })));
  }

  /* ---------- Log List table ---------- */
  /* columns: [{key, label, type: text|status|build|file|date, filter: true}]. The first two columns of the Log List carry filters.
     rows: [{id, ...values}]. file cells: {name, href, preview}. Controlled: selected/onSelectedChange. Actions via onAction('open'|'archive', row). */
  function LogTable(props) {
    var cols = props.columns || [], rows = props.rows || [];
    var ss = useState(props.defaultSort || null), sort = ss[0], setSort = ss[1];
    var sf = useState({}), filters = sf[0], setFilters = sf[1];
    var sel = useState(props.defaultSelected || []), innerSel = sel[0], setInnerSel = sel[1];
    var selected = props.selected || innerSel;
    function setSelected(next) { if (!props.selected) setInnerSel(next); if (props.onSelectedChange) props.onSelectedChange(next); }
    function text(v) { return v && typeof v === 'object' ? (v.name || '') : (v == null ? '' : String(v)); }
    var shown = rows.filter(function (r) { return cols.every(function (c) { return !filters[c.key] || text(r[c.key]) === filters[c.key]; }); });
    if (sort) shown = shown.slice().sort(function (a, b) { var x = text(a[sort.key]), y = text(b[sort.key]); return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
    var allOn = shown.length > 0 && shown.every(function (r) { return selected.indexOf(r.id) >= 0; });
    function toggleAll() { setSelected(allOn ? selected.filter(function (id) { return !shown.some(function (r) { return r.id === id; }); }) : Array.from(new Set(selected.concat(shown.map(function (r) { return r.id; }))))); }
    function toggle(id) { setSelected(selected.indexOf(id) >= 0 ? selected.filter(function (x) { return x !== id; }) : selected.concat([id])); }
    function cell(c, r) {
      var v = r[c.key];
      if (c.type === 'build' || c.type === 'status') return h(StatusSelect, { kind: c.type, value: v, label: c.label + ' for ' + r.id, onChange: function (nv) { if (props.onCellChange) props.onCellChange(r.id, c.key, nv); } });
      if (c.type === 'file') return v ? h('a', { className: 'bc-filecell', href: v.href || '#', 'aria-label': 'Open ' + v.name },
        h(PdfPreview, { src: v.preview, name: v.name, size: 'sm' }), h('span', { className: 'bc-filecell__name' }, v.name)) : h('span', { className: 'bc-muted' }, 'No file');
      return v;
    }
    return h('div', { className: cx('bc-log', props.className), style: props.height ? { maxHeight: props.height } : undefined, role: 'region', 'aria-label': props.label || 'Log list', tabIndex: 0 },
      h('table', { className: 'bc-logtable' },
        h('thead', null, h('tr', null,
          h('th', { className: 'bc-logtable__sel', scope: 'col' }, h('label', { className: 'bc-hit' }, h('input', { type: 'checkbox', className: 'bc-rowcheck', checked: allOn, 'aria-label': 'Select all rows', onChange: toggleAll }))),
          cols.map(function (c) {
            var on = sort && sort.key === c.key;
            var opts = c.filter ? Array.from(new Set(rows.map(function (r) { return text(r[c.key]); }))).filter(Boolean) : null;
            return h('th', { key: c.key, scope: 'col', 'aria-sort': on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none' },
              h('button', { type: 'button', className: 'bc-sortbtn', onClick: function () { setSort(on && sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' }); } },
                c.label, h('span', { className: cx('bc-sortbtn__ico', on && 'bc-sortbtn__ico--on') }, icon('sort', 12), on ? h('span', { className: 'bc-vh' }, sort.dir === 'asc' ? ', sorted ascending' : ', sorted descending') : null)),
              opts ? h('select', { className: 'bc-colfilter', 'aria-label': 'Filter ' + c.label, value: filters[c.key] || '', onChange: function (e) { var f = Object.assign({}, filters); f[c.key] = e.target.value; setFilters(f); } },
                [h('option', { key: '', value: '' }, 'All')].concat(opts.map(function (o) { return h('option', { key: o, value: o }, o); }))) : null);
          }),
          h('th', { className: 'bc-logtable__act', scope: 'col' }, h('span', { className: 'bc-vh' }, 'Actions')))),
        h('tbody', null, shown.length ? shown.map(function (r) {
          var on = selected.indexOf(r.id) >= 0;
          return h('tr', { key: r.id, className: on ? 'bc-row--on' : undefined, 'aria-selected': on },
            h('td', { className: 'bc-logtable__sel' }, h('label', { className: 'bc-hit' }, h('input', { type: 'checkbox', className: 'bc-rowcheck', checked: on, 'aria-label': 'Select ' + r.id, onChange: function () { toggle(r.id); } }))),
            cols.map(function (c) { return h('td', { key: c.key }, cell(c, r)); }),
            h('td', { className: 'bc-logtable__act' },
              h('button', { type: 'button', className: 'bc-rowbtn', onClick: function () { props.onAction && props.onAction('open', r); } }, icon('open', 14), 'Open', h('span', { className: 'bc-vh' }, ' ' + r.id)),
              h('button', { type: 'button', className: 'bc-rowbtn', onClick: function () { props.onAction && props.onAction('archive', r); } }, icon('archive', 14), 'Archive', h('span', { className: 'bc-vh' }, ' ' + r.id))));
        }) : h('tr', null, h('td', { colSpan: cols.length + 2, className: 'bc-logtable__empty' }, 'No rows match these filters.')))));
  }

  /* First page of a PDF as a picture. Pass the rendered image as src; without one it shows a PDF placeholder. */
  function PdfPreview(props) {
    var cls = cx('bc-pdf', 'bc-pdf--' + (props.size || 'md'));
    return props.src ? h('img', { className: cls, src: props.src, alt: props.alt !== undefined ? props.alt : 'First page of ' + (props.name || 'the PDF') })
      : h('span', { className: cx(cls, 'bc-pdf--blank'), role: 'img', 'aria-label': 'First page of ' + (props.name || 'the PDF') + ' (preview not available)' }, 'PDF');
  }

  /* ---------- Detail pane (Grab this) ---------- */
  /* revisions: up to 3 [{id, label}], latest first; latest is selected by default. expanded/onToggleExpand control the full-width state. */
  function DetailPane(props) {
    var revs = (props.revisions || []).slice(0, 3);
    var sr = useState(revs[0] && revs[0].id), rv = sr[0], setRv = sr[1];
    var revision = props.revision !== undefined ? props.revision : rv;
    var se = useState(false), exp = se[0], setExp = se[1];
    var expanded = props.expanded !== undefined ? props.expanded : exp;
    var rid = useUid('rev');
    if (props.empty) return h('section', { className: 'bc-detail bc-detail--empty' }, h(StateMessage, { kind: 'empty', title: props.emptyTitle || 'Nothing selected', children: props.emptyText || 'Choose an item from the list to see its details.' }));
    return h('section', { className: cx('bc-detail', expanded && 'bc-detail--expanded'), 'aria-label': props.title },
      h('div', { className: 'bc-detail__bar' },
        h('button', { type: 'button', className: 'bc-iconbtn', 'aria-label': expanded ? 'Show the lists again' : 'Expand to full width', 'aria-pressed': expanded, onClick: function () { if (props.expanded === undefined) setExp(!expanded); if (props.onToggleExpand) props.onToggleExpand(!expanded); } }, icon(expanded ? 'collapse' : 'expand', 18)),
        revs.length ? h('div', { className: 'bc-detail__rev' }, h('label', { htmlFor: rid, className: 'bc-field__label' }, 'Revision'),
          h('div', { className: 'bc-control bc-control--select bc-control--compact' },
            h('select', { id: rid, className: 'bc-input', value: revision, onChange: function (e) { if (props.revision === undefined) setRv(e.target.value); if (props.onRevision) props.onRevision(e.target.value); } },
              revs.map(function (r, i) { return h('option', { key: r.id, value: r.id }, r.label + (i === 0 ? ' (latest)' : '')); })),
            h('span', { className: 'bc-select__chevron' }, icon('chevron')))) : null),
      h('div', { className: 'bc-detail__body' },
        h('div', { className: 'bc-detail__preview' }, h(PdfPreview, { src: props.preview && props.preview.src, alt: props.preview && props.preview.alt, name: props.title, size: 'lg' })),
        h('div', { className: 'bc-detail__text' },
          h('h2', { className: 'bc-detail__title' }, props.title),
          h('p', { className: 'bc-body bc-body--muted' }, props.description),
          props.whenToUse ? h('div', { className: 'bc-when' }, h('p', { className: 'bc-label' }, 'When to use'), h('p', { className: 'bc-when__text' }, props.whenToUse)) : null,
          h(Button, { onClick: props.onDownload, href: props.downloadHref }, icon('download', 16), props.downloadLabel || 'Download'))));
  }

  /* ---------- Layouts ---------- */
  /* Grab this: tab bar, then 1/5 + 1/5 + 3/5. On phones the two lists show together at full width; opening an entry swaps to the detail alone. */
  function GrabLayout(props) {
    var narrow = useNarrow();
    var so = useState(false), innerOpen = so[0], setInnerOpen = so[1];
    var open = props.detailOpen !== undefined ? props.detailOpen : innerOpen;
    function back() { if (props.detailOpen === undefined) setInnerOpen(false); if (props.onBack) props.onBack(); }
    return h('div', { className: 'bc-grab' },
      props.tabs ? h(TabBar, { tabs: props.tabs, value: props.tab, onChange: props.onTab, label: props.tabLabel || 'Library' }) : null,
      narrow
        ? (open
          ? h('div', { className: 'bc-grab__phone' }, h('button', { type: 'button', className: 'bc-backbtn', onClick: back }, icon('back', 16), props.backLabel || 'Back to list'), h('div', { className: 'bc-grab__detail' }, props.detail))
          : h('div', { className: 'bc-grab__menu' }, h('div', { className: 'bc-grab__col' }, props.columnA), h('div', { className: 'bc-grab__col' }, props.columnB)))
        : h('div', { className: 'bc-grab__cols' },
          props.expanded ? null : h('div', { className: 'bc-grab__col' }, props.columnA),
          props.expanded ? null : h('div', { className: 'bc-grab__col' }, props.columnB),
          h('div', { className: cx('bc-grab__detail', props.expanded && 'bc-grab__detail--full') }, props.detail)));
  }

  /* Fix this: 1/5 button column and a 4/5 content area. On phones the buttons stack as a full-width menu above the content. */
  function FixLayout(props) {
    return h('div', { className: 'bc-fix' }, h('div', { className: 'bc-fix__menu' }, props.buttons), h('div', { className: 'bc-fix__content' }, props.children));
  }

  /* Vault shell: header, a six-tab bar and the content area. tabs: Log List, Releases, Directory, Customers, Settings, Registry. */
  function VaultShell(props) {
    return h('div', { className: 'bc-vault' },
      h('header', { className: 'bc-vault__head' },
        h('a', { className: 'bc-vault__brand', href: props.homeHref || '#', 'aria-label': 'Concepts Vault home' }, h(Wordmark, { size: 15 }), h('span', { className: 'bc-label bc-label--muted' }, 'Vault')),
        props.actions ? h('div', { className: 'bc-vault__actions' }, props.actions) : null),
      h(TabBar, { tabs: props.tabs, value: props.tab, onChange: props.onTab, label: 'Vault sections', panelId: 'vault-panel' }),
      h('main', { className: 'bc-vault__content', id: 'vault-panel', role: 'tabpanel' }, props.children));
  }

  /* Two-column builder: a scrolling form at left and a sticky preview at right; stacks on phones. */
  function BuilderLayout(props) {
    return h('div', { className: 'bc-builder' }, h('div', { className: 'bc-builder__form' }, props.form), h('aside', { className: 'bc-builder__preview', 'aria-label': props.previewLabel || 'Preview' }, props.preview));
  }

  /* ---------- Feedback and overlays ---------- */
  function Modal(props) {
    var ref = React.useRef(null), last = React.useRef(null);
    useEffect(function () {
      if (!props.open) return undefined;
      last.current = document.activeElement;
      var first = ref.current && ref.current.querySelector('button, [href], input, select, textarea');
      if (first) first.focus();
      function onKey(e) {
        if (e.key === 'Escape' && props.onClose) props.onClose();
        if (e.key === 'Tab' && ref.current) {
          var f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (!f.length) return;
          var a = f[0], z = f[f.length - 1];
          if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        }
      }
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('keydown', onKey); if (last.current && last.current.focus) last.current.focus(); };
    }, [props.open]);
    if (!props.open) return null;
    return h('div', { className: cx('bc-overlay', props.inline && 'bc-overlay--inline') },
      h('div', { className: 'bc-modal', role: props.role || 'dialog', 'aria-modal': true, 'aria-label': props.title, ref: ref },
        h('div', { className: 'bc-modal__head' }, h('h2', { className: 'bc-modal__title' }, props.title),
          props.onClose ? h('button', { type: 'button', className: 'bc-iconbtn', 'aria-label': 'Close', onClick: props.onClose }, icon('close', 18)) : null),
        h('div', { className: 'bc-modal__body' }, props.children),
        props.actions ? h('div', { className: 'bc-modal__actions' }, props.actions) : null));
  }
  /* Confirm dialog for archive and apply. Name the exact consequence in message; the confirm label repeats the action. */
  function ConfirmDialog(props) {
    return h(Modal, { open: props.open, inline: props.inline, title: props.title, role: 'alertdialog', onClose: props.onCancel,
      actions: [h(Button, { key: 'c', variant: 'secondary', onClick: props.onCancel }, props.cancelLabel || 'Cancel'), h(Button, { key: 'k', onClick: props.onConfirm }, props.confirmLabel || 'Confirm')] },
      h('p', { className: 'bc-body bc-body--muted' }, props.message));
  }
  /* tone: success | error | warning | info. Announced politely; errors assertively. */
  function Toast(props) {
    var tone = props.tone || 'info';
    var ic = { success: 'check', error: 'error', warning: 'warn', info: 'info' }[tone];
    return h('div', { className: cx('bc-toast', 'bc-toast--' + tone), role: tone === 'error' ? 'alert' : 'status' },
      icon(ic, 16), h('span', { className: 'bc-toast__text' }, h('strong', null, { success: 'Done. ', error: 'Error. ', warning: 'Check this. ', info: 'Note. ' }[tone]), props.children),
      props.onClose ? h('button', { type: 'button', className: 'bc-iconbtn bc-iconbtn--sm', 'aria-label': 'Dismiss', onClick: props.onClose }, icon('close', 14)) : null);
  }
  /* kind: empty | loading | error. Say what is missing and what to do next. */
  function StateMessage(props) {
    var kind = props.kind || 'empty';
    return h('div', { className: cx('bc-state', 'bc-state--' + kind), role: kind === 'error' ? 'alert' : 'status', 'aria-busy': kind === 'loading' ? true : undefined },
      kind === 'loading' ? h('span', { className: 'bc-spinner', 'aria-hidden': true }, h('i'), h('i'), h('i')) : kind === 'error' ? icon('error', 20) : icon('info', 20),
      h('p', { className: 'bc-state__title' }, props.title || (kind === 'loading' ? 'Loading' : kind === 'error' ? 'Something went wrong' : 'Nothing here yet')),
      props.children ? h('p', { className: 'bc-state__text' }, props.children) : null,
      props.action ? h('div', { className: 'bc-state__action' }, props.action) : null);
  }
  /* Staged-changes bar: nothing is saved until Apply. */
  function StagedBar(props) {
    var n = props.count || 0;
    return h('div', { className: cx('bc-staged', n === 0 && 'bc-staged--idle'), role: 'region', 'aria-label': 'Staged changes' },
      h('p', { className: 'bc-staged__text' }, h('strong', null, n), n === 1 ? ' change pending' : ' changes pending', n ? ' · not saved until you apply' : ''),
      h('div', { className: 'bc-staged__actions' },
        h(Button, { variant: 'secondary', disabled: !n, onClick: props.onDiscard }, 'Discard'),
        h(Button, { disabled: !n, onClick: props.onApply }, 'Apply' + (n ? ' (' + n + ')' : ''))));
  }

  /* ---------- Station builder (Build this) ---------- */
  /* steps: ['Setup', 'Stations', ...]; active: zero-based index. Steps before it are done. Square badges, per the shape rule. */
  function StepRail(props) {
    var steps = props.steps || [];
    return h('ol', { className: 'bc-steps', 'aria-label': props.label || 'Progress' },
      steps.map(function (s, i) {
        var state = i < props.active ? 'done' : i === props.active ? 'active' : 'todo';
        return h('li', { key: s, className: 'bc-step bc-step--' + state, 'aria-current': state === 'active' ? 'step' : undefined },
          h('span', { className: 'bc-step__badge' }, state === 'done' ? icon('check', 14) : i + 1),
          h('span', { className: 'bc-step__label' }, s, h('span', { className: 'bc-vh' }, state === 'done' ? ' (done)' : state === 'active' ? ' (current step)' : '')));
      }));
  }

  function ConfigBar(props) {
    return h('div', { className: 'bc-configbar' },
      h('div', { className: 'bc-configbar__field' }, h(TextField, { label: 'Config Number', value: props.value, onChange: props.onChange, hint: props.hint, error: props.error })),
      h('div', { className: 'bc-configbar__actions' },
        h(Button, { variant: 'secondary', onClick: props.onReload }, 'Reload Past Configuration'),
        h(Button, { variant: 'secondary', onClick: props.onBack, disabled: props.backDisabled }, 'Back'),
        h(Button, { onClick: props.onNext }, props.nextLabel || 'Next')));
  }

  var FLOWS = ['Left → Right', 'Right → Left', 'Vertical'];
  /* values: {name, type, speed, parts, length, width, air, electrical, flow}. types: Station Type options. */
  function StationCard(props) {
    var v = props.values || {};
    function set(k) { return function (val) { if (props.onChange) props.onChange(k, val); }; }
    var nameId = useUid('sn');
    return h('article', { className: 'bc-station', 'aria-label': 'Station ' + props.index },
      h('header', { className: 'bc-station__head' },
        h('span', { className: 'bc-station__badge' }, props.index),
        h('div', { className: 'bc-station__name' }, h('label', { htmlFor: nameId, className: 'bc-vh' }, 'Station name'), h('input', { id: nameId, className: 'bc-input bc-input--bare', value: v.name || '', onChange: function (e) { set('name')(e.target.value); } })),
        h('span', { className: 'bc-tag bc-tag--line' }, icon('arrow', 12), v.flow || FLOWS[0]),
        h('button', { type: 'button', className: 'bc-iconbtn', 'aria-label': 'Remove station ' + props.index, onClick: props.onRemove }, '×')),
      h('div', { className: 'bc-station__grid' },
        h(SelectField, { label: 'Station Type', options: props.types || ['Pick and place', 'Conveyor', 'Inspection', 'Press'], value: v.type, onChange: set('type') }),
        h(TextField, { label: 'Speed', value: v.speed || '', onChange: set('speed'), suffix: 'in/s', inputMode: 'decimal' }),
        h(TextField, { label: 'Parts/Cycle', value: v.parts || '', onChange: set('parts'), inputMode: 'numeric' }),
        h(TextField, { label: 'Length', value: v.length || '', onChange: set('length'), suffix: 'in', inputMode: 'decimal' }),
        h(TextField, { label: 'Width', value: v.width || '', onChange: set('width'), suffix: 'in', inputMode: 'decimal' }),
        h(TextField, { label: 'Air', value: v.air || '', onChange: set('air'), suffix: 'psi', inputMode: 'decimal' }),
        h(TextField, { label: 'Electrical', value: v.electrical || '', onChange: set('electrical'), suffix: 'V' }),
        h(SelectField, { label: 'Flow Direction', options: FLOWS, value: v.flow || FLOWS[0], onChange: set('flow') })));
  }

  function AddStation(props) {
    return h('button', { type: 'button', className: 'bc-addstation', onClick: props.onClick }, icon('plus', 16), props.label || 'Add station');
  }

  /* stations: [{name, flow}]. Draws an 11 x 8.5 in grid (1 in squares), the stations in order, and the Proposed Operation Order beneath. */
  function LayoutPreview(props) {
    var st = props.stations || [], n = Math.max(st.length, 1);
    var dir = (st[0] && st[0].flow) || FLOWS[0];
    var vertical = dir === FLOWS[2], rev = dir === FLOWS[1];
    var boxes = st.map(function (s, i) {
      var k = rev ? n - 1 - i : i, w, hgt, x, y;
      if (vertical) { w = 260; hgt = Math.min(110, 640 / n - 24); x = 420; y = 80 + i * (640 / n); }
      else { w = Math.min(190, 980 / n - 30); hgt = 150; x = 60 + k * (980 / n); y = 350; }
      return { s: s, i: i, x: x, y: y, w: w, h: hgt };
    });
    var grid = [];
    for (var gx = 0; gx <= 1100; gx += 100) grid.push(h('line', { key: 'x' + gx, x1: gx, y1: 0, x2: gx, y2: 850, className: 'bc-gridline' }));
    for (var gy = 0; gy <= 850; gy += 100) grid.push(h('line', { key: 'y' + gy, x1: 0, y1: gy, x2: 1100, y2: gy, className: 'bc-gridline' }));
    return h('div', { className: 'bc-layoutprev' },
      h('svg', { className: 'bc-layoutprev__svg', viewBox: '0 0 1100 850', role: 'img', 'aria-label': 'Overhead layout, 11 by 8.5 inch grid, ' + st.length + ' stations' },
        h('rect', { x: 0, y: 0, width: 1100, height: 850, className: 'bc-layoutprev__bg' }), grid,
        boxes.map(function (b, idx) {
          var nxt = boxes[idx + 1], arrow = null;
          if (nxt) {
            var x1 = vertical ? b.x + b.w / 2 : (rev ? b.x : b.x + b.w), y1 = vertical ? b.y + b.h : b.y + b.h / 2;
            var x2 = vertical ? nxt.x + nxt.w / 2 : (rev ? nxt.x + nxt.w : nxt.x), y2 = vertical ? nxt.y : nxt.y + nxt.h / 2;
            var ang = Math.atan2(y2 - y1, x2 - x1), ah = 12;
            arrow = h('g', { className: 'bc-layoutprev__arrow' }, h('line', { x1: x1, y1: y1, x2: x2, y2: y2 }),
              h('polygon', { points: [x2, y2, x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4), x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4)].join(' ') }));
          }
          return h('g', { key: b.i },
            h('rect', { x: b.x, y: b.y, width: b.w, height: b.h, className: 'bc-layoutprev__box' }),
            h('rect', { x: b.x, y: b.y, width: 30, height: 30, className: 'bc-layoutprev__tag' }),
            h('text', { x: b.x + 15, y: b.y + 21, textAnchor: 'middle', className: 'bc-layoutprev__num' }, b.i + 1),
            h('text', { x: b.x + b.w / 2, y: b.y + b.h / 2 + 5, textAnchor: 'middle', className: 'bc-layoutprev__name' }, b.s.name), arrow);
        })),
      h('section', { className: 'bc-card bc-ordercard', 'aria-label': 'Proposed Operation Order' },
        h('h3', { className: 'bc-ordercard__title' }, 'Proposed Operation Order'),
        st.length ? h('ol', { className: 'bc-ordercard__list' }, st.map(function (s, i) { return h('li', { key: i }, h('strong', null, s.name), s.type ? ' · ' + s.type : ''); }))
          : h('p', { className: 'bc-small' }, 'Add a station to see the order.')));
  }

  /* Near-black welcome screen. pattern: URL of assets/Patterns/lines-top-right.png. */
  function WelcomeScreen(props) {
    return h('section', { className: 'bc-welcome' },
      props.pattern ? h('img', { className: 'bc-welcome__pattern', src: props.pattern, alt: '' }) : null,
      h('div', { className: 'bc-welcome__inner' },
        h('span', { className: 'bc-tag bc-tag--solid bc-welcome__tag' }, 'BLOCK CONCEPTS'),
        h('h1', { className: 'bc-welcome__title' }, props.heading),
        props.text ? h('p', { className: 'bc-body bc-body--muted' }, props.text) : null,
        h(Button, { onClick: props.onStart, href: props.href }, props.startLabel || 'Start')));
  }

  /* ---------- Chat window (Ask this) ---------- */
  /* messages: [{id, role: 'visitor'|'agent', text, streaming}]. handoff: {onContact} shows the contact prompt. error: string. */
  function ChatWindow(props) {
    var msgs = props.messages || [];
    var sv = useState(''), draft = sv[0], setDraft = sv[1];
    var id = useUid('chat');
    var end = React.useRef(null);
    useEffect(function () { if (end.current && end.current.scrollIntoView && !props.static) end.current.scrollIntoView({ block: 'end' }); }, [msgs.length, msgs.length && msgs[msgs.length - 1].text]);
    function send(e) { e.preventDefault(); var t = draft.trim(); if (!t) return; if (props.onSend) props.onSend(t); setDraft(''); }
    return h('section', { className: 'bc-chat', 'aria-label': 'Chat' },
      h('div', { className: 'bc-chat__log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions text', tabIndex: 0 },
        msgs.map(function (m) {
          return h('div', { key: m.id, className: cx('bc-msg', 'bc-msg--' + m.role, m.streaming && 'bc-msg--streaming'), 'aria-busy': m.streaming ? true : undefined },
            h('p', { className: 'bc-msg__who' }, m.role === 'visitor' ? 'You' : 'Block Concepts assistant'),
            h('p', { className: 'bc-msg__text' }, m.text, m.streaming ? h('span', { className: 'bc-caret', 'aria-hidden': true }) : null, m.streaming ? h('span', { className: 'bc-vh' }, ' (still writing)') : null));
        }),
        props.error ? h('div', { className: 'bc-msg bc-msg--error', role: 'alert' }, icon('error', 16), h('span', null, props.error), props.onRetry ? h('button', { type: 'button', className: 'bc-rowbtn', onClick: props.onRetry }, 'Try again') : null) : null,
        props.handoff ? h(Callout, { title: 'Want a person to follow up?' }, h('p', { className: 'bc-callout__p' }, 'Share your contact details and the team will reply.'), h(Button, { variant: 'secondary', onClick: props.handoff.onContact }, 'Share contact details')) : null,
        h('span', { ref: end })),
      h('form', { className: 'bc-chat__composer', onSubmit: send },
        h('div', { className: 'bc-chat__field' }, h('label', { htmlFor: id, className: 'bc-field__label' }, 'Message'),
          h('div', { className: 'bc-control bc-control--area' }, h('textarea', { id: id, className: 'bc-input bc-input--area', rows: 2, value: draft, disabled: props.busy, onChange: function (e) { setDraft(e.target.value); },
            onKeyDown: function (e) { if (e.key === 'Enter' && !e.shiftKey) send(e); } }))),
        h(Button, { type: 'submit', disabled: props.busy || !draft.trim() }, 'Send')),
      h('p', { className: 'bc-chat__notice' }, props.notice || 'AI assistant, not a binding quote.'));
  }

  /* ---------- Engineering drawing sheets (print, light theme) ---------- */
  /* orientation: landscape (11 x 8.5 in) | portrait (8.5 x 11 in). drawing: {number, title, date, size, version, scale, sheet, of, notes, tolerances}.
     Children are the drawing: usually an <svg> filling the area. The sheet always renders in the light theme. */
  function DrawingSheet(props) {
    var land = (props.orientation || 'landscape') === 'landscape';
    var d = props.drawing || {};
    function cell(label, value, cls) { return h('div', { className: cx('bc-tb__cell', cls) }, h('span', { className: 'bc-tb__label' }, label), h('span', { className: 'bc-tb__value' }, value)); }
    return h('div', { className: cx('bc-sheet', land ? 'bc-sheet--land' : 'bc-sheet--port'), 'data-theme': 'light' },
      h('div', { className: 'bc-sheet__outer' }, h('div', { className: 'bc-sheet__inner' },
        h('header', { className: 'bc-sheet__head' }, h(Mark, { size: 30, color: 'var(--bc-mark-print)', label: 'Block Concepts' }), h('div', { className: 'bc-sheet__no' }, h('span', { className: 'bc-tb__label' }, 'Drawing No.'), h('strong', null, d.number))),
        h('div', { className: 'bc-sheet__area' }, props.children),
        h('footer', { className: 'bc-tb' },
          h('div', { className: 'bc-tb__notice' },
            h('p', null, h('strong', null, 'Proprietary and confidential. '), d.notice || 'This drawing is the property of Block Concepts LLC and may not be copied or shared without written permission.'),
            h('p', null, h('strong', null, 'Tolerances. '), d.tolerances || 'Dimensions are nominal unless noted. Tentative items are shown dashed.')),
          h('div', { className: 'bc-tb__company' }, h('strong', null, 'Block Concepts LLC'), h('span', null, d.email || 'grant@blockconceptsllc.com'), h('span', null, d.phone || '913-327-9271')),
          cell('Title', d.title, 'bc-tb__title'),
          cell('Date', d.date), cell('Size', d.size || 'A'), cell('Version', d.version),
          cell('Scale', d.scale, 'bc-tb__span2'), cell('Drawing No.', d.number, 'bc-tb__span2'), cell('Sheet', 'Sheet ' + (d.sheet || 1) + ' of ' + (d.of || 1), 'bc-tb__span2')))));
  }

  /* One station, control cabinet, tentative item or the highlighted pick-and-place station, drawn inside an <svg>. Units are the svg's own.
     kind: station | cabinet | tentative | highlight. Label lines: name, type, L x W, speed. */
  function StationBox(props) {
    var kind = props.kind || 'station', x = props.x, y = props.y, w = props.w, hh = props.h;
    var lines = [props.name, props.type, props.size, props.speed].filter(Boolean);
    return h('g', { className: cx('bc-sbox', 'bc-sbox--' + kind) },
      h('rect', { x: x, y: y, width: w, height: hh, className: 'bc-sbox__rect' }),
      kind === 'cabinet' ? h('rect', { x: x + 4, y: y + 4, width: w - 8, height: hh - 8, className: 'bc-sbox__inner' }) : null,
      props.number ? h('g', null, h('rect', { x: x - 1, y: y - 1, width: 18, height: 18, className: 'bc-sbox__tag' }), h('text', { x: x + 8, y: y + 12.5, textAnchor: 'middle', className: 'bc-sbox__num' }, props.number)) : null,
      lines.map(function (t, i) { return h('text', { key: i, x: x + w / 2, y: y + hh / 2 + (i - (lines.length - 1) / 2) * 13 + 4, textAnchor: 'middle', className: i === 0 ? 'bc-sbox__name' : 'bc-sbox__line' }, t); }),
      kind === 'tentative' ? h('text', { x: x + w / 2, y: y + hh + 11, textAnchor: 'middle', className: 'bc-sbox__line' }, 'TENTATIVE') : null);
  }

  /* kind: object | hidden | center | dimension. Dimension lines carry arrowheads and an optional label. Draw inside an <svg>. */
  function DrawingLine(props) {
    var kind = props.kind || 'object', x1 = props.x1, y1 = props.y1, x2 = props.x2, y2 = props.y2;
    var els = [h('line', { key: 'l', x1: x1, y1: y1, x2: x2, y2: y2, className: 'bc-dl bc-dl--' + kind })];
    if (kind === 'dimension') {
      var a = Math.atan2(y2 - y1, x2 - x1), s = 7;
      function head(px, py, dir) { return h('polygon', { key: 'h' + dir, className: 'bc-dl__head', points: [px, py, px + dir * s * Math.cos(a - 0.3), py + dir * s * Math.sin(a - 0.3), px + dir * s * Math.cos(a + 0.3), py + dir * s * Math.sin(a + 0.3)].join(' ') }); }
      els.push(head(x1, y1, 1), head(x2, y2, -1));
      if (props.label) els.push(h('text', { key: 't', x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 4, textAnchor: 'middle', className: 'bc-dl__text' }, props.label));
    }
    return h('g', null, els);
  }

  /* Flow arrow: a thin line with a filled arrowhead from (x1,y1) to (x2,y2). Draw inside an <svg>. */
  function FlowArrow(props) {
    var a = Math.atan2(props.y2 - props.y1, props.x2 - props.x1), s = 9;
    return h('g', { className: 'bc-flow' }, h('line', { x1: props.x1, y1: props.y1, x2: props.x2, y2: props.y2 }),
      h('polygon', { points: [props.x2, props.y2, props.x2 - s * Math.cos(a - 0.4), props.y2 - s * Math.sin(a - 0.4), props.x2 - s * Math.cos(a + 0.4), props.y2 - s * Math.sin(a + 0.4)].join(' ') }));
  }

  /* Legend of every drawing line and symbol. */
  function DrawingLegend() {
    function row(label, svg) { return h('li', { key: label }, h('svg', { width: 120, height: 16, viewBox: '0 0 120 16', 'aria-hidden': true }, svg), h('span', null, label)); }
    return h('ul', { className: 'bc-legend', 'data-theme': 'light' },
      row('Object line, 0.6 mm', h(DrawingLine, { kind: 'object', x1: 4, y1: 8, x2: 116, y2: 8 })),
      row('Hidden line, 0.3 mm', h(DrawingLine, { kind: 'hidden', x1: 4, y1: 8, x2: 116, y2: 8 })),
      row('Center line, 0.3 mm', h(DrawingLine, { kind: 'center', x1: 4, y1: 8, x2: 116, y2: 8 })),
      row('Dimension line, 0.3 mm', h(DrawingLine, { kind: 'dimension', x1: 8, y1: 8, x2: 112, y2: 8 })),
      row('Flow arrow', h(FlowArrow, { x1: 4, y1: 8, x2: 114, y2: 8 })),
      row('Station tag', h('g', { className: 'bc-sbox' }, h('rect', { x: 50, y: -1, width: 18, height: 18, className: 'bc-sbox__tag' }), h('text', { x: 59, y: 12, textAnchor: 'middle', className: 'bc-sbox__num' }, '3'))),
      row('Tentative item', h('rect', { x: 4, y: 2, width: 112, height: 12, className: 'bc-sbox__rect bc-sbox--tentative' })),
      row('Pick-and-place station', h('rect', { x: 4, y: 2, width: 112, height: 12, className: 'bc-sbox--highlight bc-sbox__rect', style: { stroke: 'var(--bc-steel-blue)', fill: 'var(--bc-steel-blue-tint)', strokeWidth: '0.6mm' } })));
  }

  /* Schedule table for a drawing sheet or a process document. columns: [{key, label, align}]. */
  function ScheduleTable(props) {
    return h('table', { className: 'bc-schedule', 'data-theme': 'light' },
      props.caption ? h('caption', null, props.caption) : null,
      h('thead', null, h('tr', null, (props.columns || []).map(function (c) { return h('th', { key: c.key, scope: 'col', style: c.align ? { textAlign: c.align } : undefined }, c.label); }))),
      h('tbody', null, (props.rows || []).map(function (r, i) { return h('tr', { key: i }, (props.columns || []).map(function (c) { return h('td', { key: c.key, style: c.align ? { textAlign: c.align } : undefined }, r[c.key]); })); })));
  }

  /* Numbered list for the process description sheet. items: [{title, text}] or strings. */
  function ProcessList(props) {
    return h('ol', { className: 'bc-process', 'data-theme': 'light' }, (props.items || []).map(function (it, i) {
      return typeof it === 'string' ? h('li', { key: i }, it) : h('li', { key: i }, h('strong', null, it.title), it.text ? ' — ' + it.text : '');
    }));
  }

  window.BlockConcepts = { Mark: Mark, Wordmark: Wordmark, Button: Button, NavBar: NavBar, RenderPlaceholder: RenderPlaceholder, PillarPanels: PillarPanels, Statement: Statement, SolutionTile: SolutionTile, TierRow: TierRow, CredibilityBand: CredibilityBand, CtaBand: CtaBand, Footer: Footer, CookieBanner: CookieBanner, Callout: Callout, Stage: Stage, DataTable: DataTable, TextField: TextField, SelectField: SelectField, TextArea: TextArea, FileDrop: FileDrop, Checkbox: Checkbox, Radio: Radio, SearchField: SearchField, TabBar: TabBar, ListBox: ListBox, ButtonColumn: ButtonColumn, StatusPill: StatusPill, StatusSelect: StatusSelect, LogTable: LogTable, PdfPreview: PdfPreview, DetailPane: DetailPane, GrabLayout: GrabLayout, FixLayout: FixLayout, VaultShell: VaultShell, BuilderLayout: BuilderLayout, Modal: Modal, ConfirmDialog: ConfirmDialog, Toast: Toast, StateMessage: StateMessage, StagedBar: StagedBar, StepRail: StepRail, ConfigBar: ConfigBar, StationCard: StationCard, AddStation: AddStation, LayoutPreview: LayoutPreview, WelcomeScreen: WelcomeScreen, ChatWindow: ChatWindow, DrawingSheet: DrawingSheet, StationBox: StationBox, DrawingLine: DrawingLine, FlowArrow: FlowArrow, DrawingLegend: DrawingLegend, ScheduleTable: ScheduleTable, ProcessList: ProcessList };
})();
