/**
 * lang-switcher.js — shared language dropdown widget
 * Injects its own CSS. Call LangSwitcher.init() at page boot.
 */
const LangSwitcher = (() => {
  const CIS = [
    {code:'ru',flag:'🇷🇺',label:'RUS',name:'Русский'},
    {code:'uk',flag:'🇺🇦',label:'UKR',name:'Українська'},
    {code:'be',flag:'🇧🇾',label:'BEL',name:'Беларуская'},
    {code:'kk',flag:'🇰🇿',label:'KAZ',name:'Қазақша'},
    {code:'uz',flag:'🇺🇿',label:'UZB',name:"O'zbekcha"},
    {code:'az',flag:'🇦🇿',label:'AZE',name:'Azərbaycanca'},
    {code:'ka',flag:'🇬🇪',label:'GEO',name:'ქართული'},
    {code:'hy',flag:'🇦🇲',label:'ARM',name:'Հայերեն'},
    {code:'ky',flag:'🇰🇬',label:'KYR',name:'Кыргызча'},
    {code:'tg',flag:'🇹🇯',label:'TJK',name:'Тоҷикӣ'},
    {code:'tk',flag:'🇹🇲',label:'TKM',name:'Türkmençe'},
    {code:'mo',flag:'🇲🇩',label:'MOL',name:'Moldovenească'},
  ];
  const WORLD = [
    {code:'en',flag:'🇬🇧',label:'ENG',name:'English'},
    {code:'es',flag:'🇪🇸',label:'ESP',name:'Español'},
    {code:'zh',flag:'🇨🇳',label:'ZHO',name:'中文'},
    {code:'ar',flag:'🇸🇦',label:'ARA',name:'العربية'},
    {code:'pt',flag:'🇧🇷',label:'POR',name:'Português'},
    {code:'fr',flag:'🇫🇷',label:'FRA',name:'Français'},
    {code:'de',flag:'🇩🇪',label:'DEU',name:'Deutsch'},
    {code:'hi',flag:'🇮🇳',label:'HIN',name:'हिन्दी'},
    {code:'ja',flag:'🇯🇵',label:'JPN',name:'日本語'},
    {code:'ko',flag:'🇰🇷',label:'KOR',name:'한국어'},
    {code:'it',flag:'🇮🇹',label:'ITA',name:'Italiano'},
  ];
  const ALL = [...CIS, ...WORLD];

  let _cb = null, _cur = 'en';

  function _injectCSS() {
    if (document.getElementById('_ls_css')) return;
    const s = document.createElement('style');
    s.id = '_ls_css';
    s.textContent = [
      '.ls-wrap{position:relative;display:inline-block}',
      '.ls-btn{display:flex;align-items:center;gap:5px;padding:6px 11px;background:var(--cream,#faf8f4);border:1.5px solid var(--border,#e8e2d9);border-radius:8px;cursor:pointer;font-family:var(--font-body,sans-serif);font-size:13px;font-weight:600;color:var(--ink,#1c1917);white-space:nowrap;transition:border-color .15s,background .15s}',
      '.ls-btn:hover{border-color:var(--rust,#c94a2b);background:rgba(201,74,43,.05)}',
      '.ls-code{font-size:11px;letter-spacing:.08em;color:var(--muted,#8a7f74);font-weight:700}',
      '.ls-caret{font-size:9px;color:var(--muted,#8a7f74);transition:transform .15s;margin-left:1px}',
      '.ls-wrap.open .ls-caret{transform:rotate(180deg)}',
      '.ls-dd{display:none;position:absolute;right:0;top:calc(100% + 6px);background:var(--cream,#faf8f4);border:1.5px solid var(--border,#e8e2d9);border-radius:10px;overflow-y:auto;max-height:340px;min-width:190px;z-index:9999;box-shadow:0 8px 28px rgba(0,0,0,.13)}',
      '.ls-dd.open{display:block}',
      '.ls-grp{padding:5px 12px 3px;font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--muted,#8a7f74);text-transform:uppercase;background:rgba(0,0,0,.035);border-bottom:1px solid var(--border,#e8e2d9)}',
      '.ls-opt{display:flex;align-items:center;gap:8px;width:100%;padding:7px 12px;background:transparent;border:none;cursor:pointer;font-family:var(--font-body,sans-serif);font-size:13px;color:var(--ink,#1c1917);text-align:left;transition:background .1s;line-height:1.3}',
      '.ls-opt:hover{background:rgba(201,74,43,.08)}',
      '.ls-opt.on{background:rgba(201,74,43,.12);color:var(--rust,#c94a2b);font-weight:600}',
      '.ls-f{font-size:15px;flex-shrink:0}',
      '.ls-n{flex:1}',
      '.ls-c{font-size:10px;color:var(--muted,#8a7f74);letter-spacing:.07em;font-weight:700;flex-shrink:0}',
    ].join('');
    document.head.appendChild(s);
  }

  function _find(code) {
    return ALL.find(l => l.code === code) || {code, flag:'🌐', label:code.toUpperCase().slice(0,3), name:code};
  }

  function _btnHTML(l) {
    return `${l.flag} <span class="ls-code">${l.label}</span><span class="ls-caret">▾</span>`;
  }

  function _optHTML(l) {
    return `<button class="ls-opt${l.code===_cur?' on':''}" data-code="${l.code}" onclick="LangSwitcher.pick('${l.code}')">` +
      `<span class="ls-f">${l.flag}</span><span class="ls-n">${l.name}</span><span class="ls-c">${l.label}</span>` +
    `</button>`;
  }

  function init(containerId, code, cb) {
    _cur = code; _cb = cb;
    _injectCSS();
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
      `<div class="ls-wrap" id="_ls_w">` +
        `<button class="ls-btn" id="_ls_b" onclick="LangSwitcher.toggle()">${_btnHTML(_find(code))}</button>` +
        `<div class="ls-dd" id="_ls_d">` +
          `<div class="ls-grp">СНГ / CIS</div>` + CIS.map(_optHTML).join('') +
          `<div class="ls-grp">World</div>` + WORLD.map(_optHTML).join('') +
        `</div>` +
      `</div>`;
    document.addEventListener('click', function(e) {
      const w = document.getElementById('_ls_w');
      if (w && !w.contains(e.target)) _close();
    }, {capture: true, passive: true});
  }

  function _close() {
    const w = document.getElementById('_ls_w'), d = document.getElementById('_ls_d');
    if (w) w.classList.remove('open');
    if (d) d.classList.remove('open');
  }

  function toggle() {
    const w = document.getElementById('_ls_w'), d = document.getElementById('_ls_d');
    if (!w || !d) return;
    const o = d.classList.toggle('open');
    w.classList.toggle('open', o);
  }

  function pick(code) {
    _close();
    if (_cb) _cb(code);
  }

  function update(code) {
    _cur = code;
    const b = document.getElementById('_ls_b');
    if (b) b.innerHTML = _btnHTML(_find(code));
    document.querySelectorAll('.ls-opt').forEach(e => e.classList.toggle('on', e.dataset.code === code));
  }

  return {init, update, toggle, pick};
})();
