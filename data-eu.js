/**
 * data-eu.js — InviteBro European database
 * ─────────────────────────────────────────
 * Separate data layer for InviteBro.it (EU market).
 * Add new European merchants and codes here.
 * When a real backend is added, replace these arrays
 * with API fetch calls — all pages update automatically.
 */

/* ══════════════════════════════════════════════
   MERCHANT LIST  (used by explore.html)
══════════════════════════════════════════════ */
const EU_MERCHANTS = [
  {
    id: 'itabus',
    name: 'Itabus',
    emoji: '🚌',
    cat: 'travel',
    featured: true,
    verified: true,
    isNew: false,
    desc: 'Italian intercity bus operator. Fast, comfortable and affordable coach travel between Italy\'s major cities. Book online in minutes.',
    codes: 1,
    invites: 0,
    success: 97,
    bestCode: 'PRENOTA15',
    bestDisc: '−15%',
  },
  // ── ADD MORE EU MERCHANTS BELOW ──────────────
  // {
  //   id: 'trenitalia',
  //   name: 'Trenitalia',
  //   emoji: '🚄',
  //   cat: 'travel',
  //   featured: false,
  //   verified: true,
  //   isNew: false,
  //   desc: "Italy's national rail operator. Frecciarossa high-speed and regional trains across Italy.",
  //   codes: 3, invites: 5, success: 88,
  //   bestCode: 'TRENI10', bestDisc: '−10%',
  // },
];

/* ══════════════════════════════════════════════
   PROMO CODES  (used by merchant.html)
══════════════════════════════════════════════ */
const EU_PROMO_CODES = {
  itabus: [
    {
      code: 'PRENOTA15',
      disc: '−15%',
      desc: '15% discount on any Itabus trip. Valid for all routes and departure dates. Enter at checkout on itabus.com.',
      verified: true,
      top: true,
      expiring: false,
      expires: 'No expiry',
      uses: 1,
    },
  ],
  // ── ADD MORE CODES BY MERCHANT ID ───────────
};

/* ══════════════════════════════════════════════
   INVITE CODES  (used by merchant.html)
══════════════════════════════════════════════ */
const EU_INVITE_CODES = {
  itabus: [
    // Community invite codes will appear here once users submit them
  ],
  // ── ADD MORE INVITE CODES BY MERCHANT ID ────
};

/* ══════════════════════════════════════════════
   MERCHANT DETAIL  (used by merchant.html header)
══════════════════════════════════════════════ */
const EU_MERCHANT_DETAIL = {
  itabus: {
    name: 'Itabus',
    emoji: '🚌',
    cat: 'travel',
    verified: true,
    featured: true,
    desc: 'Italian intercity bus operator connecting Rome, Milan, Naples, Florence, Venice and 100+ other cities. Comfortable coaches, free Wi-Fi, USB charging. Book online and save.',
    website: 'itabus.com',
    totalCodes: 1,
    inviteCodes: 0,
    success: 97,
  },
  // ── ADD MORE MERCHANT DETAILS ────────────────
};
