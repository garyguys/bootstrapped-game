/* ============================================
   avatars.js — 48px HD Procedural Sprite System
   Layer-based rendering: body -> shirt -> pants -> hair -> accessory
   Ported from bootstrapped-sprite-system.html (v0.16.2)
   ============================================ */

var AvatarGen = (function() {

  var S = 48; // sprite size

  // --- Color Palettes ---

  var SKIN_TONES = [
    {name:'Light',base:'#f5d0a9',shadow:'#d4a574',dark:'#b8885a',highlight:'#ffe0c0',rim:'#c09060'},
    {name:'Fair',base:'#e8b88a',shadow:'#c4946a',dark:'#a07048',highlight:'#f5d0aa',rim:'#b08050'},
    {name:'Medium',base:'#c68c5a',shadow:'#a06830',dark:'#845020',highlight:'#daa878',rim:'#906030'},
    {name:'Tan',base:'#a06830',shadow:'#804818',dark:'#663810',highlight:'#c08848',rim:'#704020'},
    {name:'Brown',base:'#7a4420',shadow:'#5a2a10',dark:'#401a08',highlight:'#9a6440',rim:'#4a2010'},
    {name:'Dark',base:'#4a2810',shadow:'#2a1808',dark:'#1a0c04',highlight:'#6a4828',rim:'#201008'}
  ];

  var HAIR_COLORS = [
    {name:'Black',base:'#1a1a2e',shadow:'#0a0a15',highlight:'#2a2a40',rim:'#333350'},
    {name:'Brown',base:'#5a3a1a',shadow:'#3a2210',highlight:'#7a5a3a',rim:'#8a6a4a'},
    {name:'Blonde',base:'#d4aa40',shadow:'#b08820',highlight:'#f0cc60',rim:'#f8dd80'},
    {name:'Red',base:'#aa3020',shadow:'#801810',highlight:'#cc5040',rim:'#dd6050'},
    {name:'Blue',base:'#2060cc',shadow:'#1040aa',highlight:'#4080ee',rim:'#60a0ff'},
    {name:'Pink',base:'#cc40aa',shadow:'#aa2088',highlight:'#ee60cc',rim:'#ff80dd'},
    {name:'Green',base:'#20aa40',shadow:'#108828',highlight:'#40cc60',rim:'#60ee80'},
    {name:'White',base:'#ccccdd',shadow:'#9999aa',highlight:'#eeeeff',rim:'#ffffff'},
    {name:'Purple',base:'#7040bb',shadow:'#5020aa',highlight:'#9060dd',rim:'#aa80ee'},
    {name:'Teal',base:'#20aaaa',shadow:'#108888',highlight:'#40cccc',rim:'#60eeee'},
    {name:'Orange',base:'#dd6620',shadow:'#bb4410',highlight:'#ff8840',rim:'#ffaa60'},
    {name:'Gray',base:'#666677',shadow:'#444455',highlight:'#888899',rim:'#9999aa'}
  ];

  var SHIRT_COLORS = [
    {name:'White',base:'#ddddee',shadow:'#aaaabb',highlight:'#eeeeff',dark:'#8888aa'},
    {name:'Black',base:'#222233',shadow:'#111122',highlight:'#333344',dark:'#080810'},
    {name:'Blue',base:'#3366cc',shadow:'#2244aa',highlight:'#4488ee',dark:'#1a3388'},
    {name:'Red',base:'#cc3333',shadow:'#aa1818',highlight:'#ee5555',dark:'#881010'},
    {name:'Green',base:'#33aa55',shadow:'#228833',highlight:'#55cc77',dark:'#186622'},
    {name:'Yellow',base:'#ccaa22',shadow:'#aa8810',highlight:'#eedd44',dark:'#886608'},
    {name:'Purple',base:'#7744bb',shadow:'#5522aa',highlight:'#9966dd',dark:'#3a1188'},
    {name:'Pink',base:'#ee7799',shadow:'#cc5577',highlight:'#ff99bb',dark:'#aa3355'},
    {name:'Orange',base:'#dd7722',shadow:'#bb5510',highlight:'#ff9944',dark:'#883808'},
    {name:'Teal',base:'#22aaaa',shadow:'#108888',highlight:'#44cccc',dark:'#086666'},
    {name:'Navy',base:'#223355',shadow:'#112244',highlight:'#334466',dark:'#0a1122'},
    {name:'Gray',base:'#777788',shadow:'#555566',highlight:'#9999aa',dark:'#333344'}
  ];

  var PANTS_COLORS = [
    {name:'Denim',base:'#334466',shadow:'#222244',highlight:'#445588',dark:'#1a1a33'},
    {name:'Black',base:'#1a1a22',shadow:'#0a0a12',highlight:'#2a2a33',dark:'#050508'},
    {name:'Khaki',base:'#aa9966',shadow:'#887744',highlight:'#ccbb88',dark:'#665533'},
    {name:'Gray',base:'#555566',shadow:'#333344',highlight:'#777788',dark:'#222233'},
    {name:'Brown',base:'#664422',shadow:'#442a10',highlight:'#886644',dark:'#331a08'},
    {name:'Green',base:'#336633',shadow:'#224422',highlight:'#448844',dark:'#112211'},
    {name:'Pink',base:'#ee88aa',shadow:'#cc6688',highlight:'#ffaacc',dark:'#aa4466'},
    {name:'White',base:'#ccccdd',shadow:'#9999aa',highlight:'#eeeeff',dark:'#777788'}
  ];

  var SHOE_COLORS = [
    {name:'Black',base:'#222233',shadow:'#111122',highlight:'#333344',dark:'#080810',sole:'#111118'},
    {name:'White',base:'#ccccdd',shadow:'#9999aa',highlight:'#eeeeff',dark:'#777788',sole:'#888899'},
    {name:'Brown',base:'#664422',shadow:'#442a10',highlight:'#886644',dark:'#331a08',sole:'#221208'},
    {name:'Red',base:'#cc3333',shadow:'#aa1818',highlight:'#ee5555',dark:'#881010',sole:'#660808'},
    {name:'Blue',base:'#3355aa',shadow:'#223388',highlight:'#4477cc',dark:'#112266',sole:'#0a1444'},
    {name:'Green',base:'#33aa55',shadow:'#228833',highlight:'#55cc77',dark:'#186622',sole:'#0a4410'}
  ];

  // Role -> shirt color index mapping
  var ROLE_SHIRT_IDX = {
    developer: 2,   // Blue
    designer:  6,    // Purple
    marketer:  5,    // Yellow
    sales:     10,   // Navy
    devops:    8,    // Orange
    pm:        9,    // Teal
  };

  // Ethnicity -> skin tone index mapping
  var ETHNICITY_SKIN = {
    east_asian: 1,     // Fair
    south_asian: 3,    // Tan
    middle_eastern: 2, // Medium
    hispanic: 2,       // Medium
    european: 0,       // Light
    african: 4,        // Brown
  };

  var LAST_NAME_ETH = {
    'Chen': 'east_asian', 'Kim': 'east_asian', 'Nakamura': 'east_asian',
    'Park': 'east_asian', 'Nguyen': 'east_asian', 'Tanaka': 'east_asian',
    'Yamamoto': 'east_asian',
    'Patel': 'south_asian', 'Singh': 'south_asian', 'Shah': 'south_asian',
    'Ali': 'middle_eastern', 'Ibrahim': 'middle_eastern',
    'Garcia': 'hispanic', 'Santos': 'hispanic', 'Rivera': 'hispanic', 'Torres': 'hispanic',
    'Muller': 'european', 'Johansson': 'european', 'Schmidt': 'european',
    'Larsson': 'european', 'Dubois': 'european', 'Volkov': 'european', 'Cohen': 'european',
    'Lee': 'east_asian', 'Wang': 'east_asian', 'Zhang': 'east_asian',
    'Sato': 'east_asian', 'Reyes': 'hispanic', 'Lopez': 'hispanic',
    'Brown': 'european', 'Davis': 'european', 'Wilson': 'european',
    'Okafor': 'african', 'Adeyemi': 'african', 'Mensah': 'african',
    'Okonkwo': 'african', 'Nkosi': 'african',
    'Petrov': 'european', 'Andersson': 'european', 'Bianchi': 'european',
    'Khatri': 'south_asian', 'Moreno': 'hispanic', 'Fujita': 'east_asian',
    'Vasquez': 'hispanic', 'Lam': 'east_asian',
  };

  // Hair styles available per gender
  var MALE_HAIR_STYLES = ['short', 'long', 'mohawk', 'buzz', 'curly', 'bald', 'beanie', 'spiky'];
  var FEMALE_HAIR_STYLES = ['ponytail', 'long', 'bald'];

  // All shirt/pants/accessory style keys
  var SHIRT_STYLES = ['tee', 'hoodie', 'tank', 'buttonup', 'jacket'];
  var PANTS_STYLES = ['jeans', 'shorts', 'cargo', 'skirt', 'sweats'];
  var ACCESSORIES = ['none', 'none', 'none', 'glasses', 'headphones', 'badge', 'watch'];

  // --- Drawing Primitives ---

  function px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  function blend(c1, c2, t) {
    var r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    var r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    var r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
    var rr = r.toString(16); if (rr.length < 2) rr = '0' + rr;
    var gg = g.toString(16); if (gg.length < 2) gg = '0' + gg;
    var bb = b.toString(16); if (bb.length < 2) bb = '0' + bb;
    return '#' + rr + gg + bb;
  }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  // --- Body Drawers ---

  function drawBodyMale(ctx, sk) {
    var b = sk.base, s = sk.shadow, d = sk.dark, hi = sk.highlight;
    var mid = blend(b, s, 0.4), midhi = blend(b, hi, 0.5);
    // Head
    rect(ctx, 19, 4, 10, 1, mid); rect(ctx, 17, 5, 14, 1, b); rect(ctx, 16, 6, 16, 2, b);
    rect(ctx, 15, 8, 18, 6, b); rect(ctx, 16, 14, 16, 2, b); rect(ctx, 18, 16, 12, 1, mid); rect(ctx, 19, 17, 10, 1, mid);
    // Head highlights
    rect(ctx, 21, 4, 7, 1, hi); rect(ctx, 20, 5, 9, 1, midhi); rect(ctx, 26, 6, 5, 2, hi); rect(ctx, 29, 8, 3, 4, midhi); rect(ctx, 31, 9, 1, 3, hi);
    // Head shadow
    rect(ctx, 15, 8, 2, 5, s); rect(ctx, 16, 13, 2, 2, s); px(ctx, 15, 7, s);
    // Jaw
    rect(ctx, 18, 16, 3, 1, s); rect(ctx, 27, 16, 3, 1, s); rect(ctx, 19, 17, 2, 1, s); rect(ctx, 27, 17, 2, 1, s);
    // Ears
    rect(ctx, 14, 9, 1, 3, mid); rect(ctx, 33, 9, 1, 3, midhi);
    // Eyes
    rect(ctx, 19, 10, 4, 3, '#fff'); rect(ctx, 21, 10, 2, 3, '#1a1a33'); px(ctx, 22, 10, '#fff');
    rect(ctx, 26, 10, 4, 3, '#fff'); rect(ctx, 27, 10, 2, 3, '#1a1a33'); px(ctx, 28, 10, '#fff');
    rect(ctx, 19, 9, 4, 1, d); rect(ctx, 26, 9, 4, 1, d);
    // Nose + mouth
    rect(ctx, 23, 12, 2, 2, mid); px(ctx, 24, 13, s); rect(ctx, 22, 15, 4, 1, s);
    // Neck
    rect(ctx, 21, 18, 6, 3, b); rect(ctx, 21, 18, 2, 3, s); rect(ctx, 25, 18, 2, 3, midhi);
    // Torso
    rect(ctx, 15, 21, 18, 12, b); rect(ctx, 15, 21, 3, 12, s); rect(ctx, 18, 21, 2, 12, mid);
    rect(ctx, 28, 21, 2, 12, midhi); rect(ctx, 30, 21, 3, 12, hi); rect(ctx, 20, 21, 8, 1, midhi);
    // Arms
    rect(ctx, 11, 21, 4, 11, b); rect(ctx, 11, 21, 1, 11, s); rect(ctx, 12, 21, 1, 11, mid); rect(ctx, 14, 21, 1, 11, midhi);
    rect(ctx, 33, 21, 4, 11, b); rect(ctx, 33, 21, 1, 11, midhi); rect(ctx, 35, 21, 1, 11, mid); rect(ctx, 36, 21, 1, 11, s);
    // Hands
    rect(ctx, 11, 32, 4, 3, b); rect(ctx, 11, 32, 1, 3, s); rect(ctx, 14, 32, 1, 3, midhi);
    rect(ctx, 33, 32, 4, 3, b); rect(ctx, 33, 32, 1, 3, midhi); rect(ctx, 36, 32, 1, 3, s);
    // Legs
    rect(ctx, 17, 40, 6, 5, b); rect(ctx, 17, 40, 2, 5, s); rect(ctx, 21, 40, 2, 5, midhi);
    rect(ctx, 25, 40, 6, 5, b); rect(ctx, 25, 40, 2, 5, midhi); rect(ctx, 29, 40, 2, 5, s);
  }

  function drawBodyFemale(ctx, sk) {
    var b = sk.base, s = sk.shadow, d = sk.dark, hi = sk.highlight;
    var mid = blend(b, s, 0.4), midhi = blend(b, hi, 0.5);
    // Head
    rect(ctx, 19, 4, 10, 1, mid); rect(ctx, 17, 5, 14, 1, b); rect(ctx, 16, 6, 16, 2, b);
    rect(ctx, 15, 8, 18, 6, b); rect(ctx, 16, 14, 16, 2, b); rect(ctx, 18, 16, 12, 1, b); rect(ctx, 19, 17, 10, 1, b);
    // Head highlights
    rect(ctx, 21, 4, 7, 1, hi); rect(ctx, 20, 5, 9, 1, midhi); rect(ctx, 26, 6, 5, 2, hi); rect(ctx, 29, 8, 3, 4, midhi); rect(ctx, 31, 9, 1, 3, hi);
    // Head shadow
    rect(ctx, 15, 8, 2, 5, s); rect(ctx, 16, 13, 2, 2, s); px(ctx, 15, 7, s);
    // Softer jaw
    rect(ctx, 18, 16, 3, 1, mid); rect(ctx, 27, 16, 3, 1, mid);
    // Ears
    rect(ctx, 14, 9, 1, 3, mid); rect(ctx, 33, 9, 1, 3, midhi);
    // Eyes with lashes
    rect(ctx, 19, 10, 4, 3, '#fff'); rect(ctx, 21, 10, 2, 3, '#1a1a33'); px(ctx, 22, 10, '#fff');
    rect(ctx, 26, 10, 4, 3, '#fff'); rect(ctx, 27, 10, 2, 3, '#1a1a33'); px(ctx, 28, 10, '#fff');
    rect(ctx, 18, 9, 5, 1, '#1a1a33'); rect(ctx, 25, 9, 5, 1, '#1a1a33');
    px(ctx, 18, 8, '#1a1a33'); px(ctx, 25, 8, '#1a1a33');
    // Nose
    rect(ctx, 23, 12, 2, 2, mid); px(ctx, 24, 13, s);
    // Lips
    rect(ctx, 22, 15, 4, 1, '#cc7777'); px(ctx, 21, 15, blend('#cc7777', b, 0.5)); px(ctx, 26, 15, blend('#cc7777', b, 0.5));
    // Neck
    rect(ctx, 21, 18, 6, 3, b); rect(ctx, 21, 18, 2, 3, s); rect(ctx, 25, 18, 2, 3, midhi);
    // Torso
    rect(ctx, 15, 21, 18, 12, b); rect(ctx, 15, 21, 3, 12, s); rect(ctx, 18, 21, 2, 12, mid);
    rect(ctx, 28, 21, 2, 12, midhi); rect(ctx, 30, 21, 3, 12, hi); rect(ctx, 20, 21, 8, 1, midhi);
    // Arms
    rect(ctx, 11, 21, 4, 11, b); rect(ctx, 11, 21, 1, 11, s); rect(ctx, 12, 21, 1, 11, mid); rect(ctx, 14, 21, 1, 11, midhi);
    rect(ctx, 33, 21, 4, 11, b); rect(ctx, 33, 21, 1, 11, midhi); rect(ctx, 35, 21, 1, 11, mid); rect(ctx, 36, 21, 1, 11, s);
    // Hands
    rect(ctx, 11, 32, 4, 3, b); rect(ctx, 11, 32, 1, 3, s); rect(ctx, 14, 32, 1, 3, midhi);
    rect(ctx, 33, 32, 4, 3, b); rect(ctx, 33, 32, 1, 3, midhi); rect(ctx, 36, 32, 1, 3, s);
    // Legs
    rect(ctx, 17, 40, 6, 5, b); rect(ctx, 17, 40, 2, 5, s); rect(ctx, 21, 40, 2, 5, midhi);
    rect(ctx, 25, 40, 6, 5, b); rect(ctx, 25, 40, 2, 5, midhi); rect(ctx, 29, 40, 2, 5, s);
  }

  // --- Hair Drawers ---

  var HAIR_DRAWERS = {
    short: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight, ri = h.rim;
      rect(ctx, 18, 2, 12, 2, s); rect(ctx, 16, 3, 16, 3, b); rect(ctx, 15, 5, 18, 4, b);
      rect(ctx, 14, 7, 2, 5, b); rect(ctx, 32, 7, 2, 5, b);
      rect(ctx, 21, 2, 8, 2, hi); rect(ctx, 20, 3, 9, 2, hi); rect(ctx, 28, 5, 4, 3, hi); rect(ctx, 30, 6, 3, 3, ri);
      rect(ctx, 15, 7, 2, 4, s); rect(ctx, 14, 8, 2, 3, s);
    },
    long: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight, ri = h.rim;
      rect(ctx, 18, 2, 12, 2, s); rect(ctx, 16, 3, 16, 3, b); rect(ctx, 15, 5, 18, 4, b);
      rect(ctx, 14, 7, 2, 14, b); rect(ctx, 32, 7, 2, 14, b); rect(ctx, 13, 10, 2, 10, b); rect(ctx, 33, 10, 2, 10, b);
      rect(ctx, 21, 2, 8, 2, hi); rect(ctx, 20, 3, 9, 2, hi); rect(ctx, 30, 5, 3, 4, hi); rect(ctx, 33, 8, 2, 8, ri);
      rect(ctx, 14, 9, 2, 10, s); rect(ctx, 13, 12, 2, 6, s);
    },
    mohawk: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight;
      rect(ctx, 20, 0, 8, 6, b); rect(ctx, 22, 0, 4, 1, hi); rect(ctx, 21, 1, 6, 1, hi); rect(ctx, 20, 0, 2, 6, s);
      rect(ctx, 16, 5, 16, 3, b); rect(ctx, 18, 3, 12, 2, b); rect(ctx, 21, 3, 6, 1, hi);
    },
    buzz: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight;
      rect(ctx, 17, 3, 14, 3, b); rect(ctx, 16, 5, 16, 3, b); rect(ctx, 18, 3, 10, 2, s); rect(ctx, 21, 4, 6, 1, hi);
    },
    curly: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight;
      rect(ctx, 15, 2, 18, 3, b); rect(ctx, 14, 4, 20, 5, b); rect(ctx, 13, 7, 2, 7, b); rect(ctx, 33, 7, 2, 7, b);
      for (var i = 0; i < 8; i++) { px(ctx, 16 + i * 2, 3, hi); px(ctx, 15 + i * 2, 5, s); px(ctx, 14 + i * 2, 7, hi); }
      px(ctx, 13, 8, s); px(ctx, 34, 8, s); px(ctx, 13, 10, hi); px(ctx, 34, 10, hi); px(ctx, 13, 12, s); px(ctx, 34, 12, s);
    },
    ponytail: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight, ri = h.rim;
      rect(ctx, 18, 2, 12, 2, s); rect(ctx, 16, 3, 16, 3, b); rect(ctx, 15, 5, 18, 4, b); rect(ctx, 14, 7, 2, 4, b);
      rect(ctx, 21, 2, 8, 2, hi); rect(ctx, 20, 3, 9, 2, hi);
      rect(ctx, 33, 7, 3, 3, b); rect(ctx, 35, 10, 3, 8, b); rect(ctx, 36, 18, 2, 3, b);
      rect(ctx, 35, 10, 2, 5, s); rect(ctx, 37, 12, 1, 4, hi);
    },
    bald: function(ctx, h) {},
    beanie: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight;
      rect(ctx, 16, 1, 16, 2, b); rect(ctx, 15, 3, 18, 5, b); rect(ctx, 21, 0, 6, 1, b);
      rect(ctx, 16, 7, 16, 2, s); rect(ctx, 19, 1, 10, 2, hi); rect(ctx, 18, 3, 8, 2, hi);
    },
    spiky: function(ctx, h) {
      var b = h.base, s = h.shadow, hi = h.highlight;
      rect(ctx, 16, 5, 16, 3, b); rect(ctx, 17, 3, 14, 2, b);
      rect(ctx, 17, 0, 3, 4, b); rect(ctx, 22, 0, 4, 4, b); rect(ctx, 28, 0, 3, 4, b);
      px(ctx, 18, 0, hi); px(ctx, 23, 0, hi); px(ctx, 29, 0, hi);
      rect(ctx, 14, 7, 2, 4, b); rect(ctx, 32, 7, 2, 4, b); rect(ctx, 14, 7, 2, 3, s);
    }
  };

  // --- Shirt Drawers ---

  var SHIRT_DRAWERS = {
    tee: function(ctx, c, isFemale) {
      var b = c.base, s = c.shadow, hi = c.highlight, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 21, 18, 12, b); rect(ctx, 15, 21, 3, 12, s); rect(ctx, 18, 21, 2, 12, mid); rect(ctx, 28, 21, 2, 12, mh); rect(ctx, 30, 21, 3, 12, hi);
      rect(ctx, 11, 21, 4, 6, b); rect(ctx, 11, 21, 1, 6, s); rect(ctx, 14, 21, 1, 6, mid); rect(ctx, 33, 21, 4, 6, b); rect(ctx, 36, 21, 1, 6, s); rect(ctx, 33, 21, 1, 6, hi);
      rect(ctx, 20, 20, 8, 2, b); rect(ctx, 22, 20, 4, 1, s); rect(ctx, 20, 22, 8, 1, hi);
      if (isFemale) { rect(ctx, 15, 27, 2, 3, s); rect(ctx, 31, 27, 2, 3, s); }
    },
    hoodie: function(ctx, c, isFemale) {
      var b = c.base, s = c.shadow, hi = c.highlight, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 20, 18, 13, b); rect(ctx, 15, 20, 3, 13, s); rect(ctx, 18, 20, 2, 13, mid); rect(ctx, 28, 20, 2, 13, mh); rect(ctx, 30, 20, 3, 13, hi);
      rect(ctx, 11, 21, 4, 11, b); rect(ctx, 11, 21, 1, 11, s); rect(ctx, 14, 21, 1, 11, mid); rect(ctx, 33, 21, 4, 11, b); rect(ctx, 36, 21, 1, 11, s); rect(ctx, 33, 21, 1, 11, hi);
      rect(ctx, 14, 14, 3, 5, b); rect(ctx, 31, 14, 3, 5, b); rect(ctx, 14, 14, 2, 5, s);
      rect(ctx, 19, 28, 10, 3, s); rect(ctx, 19, 28, 10, 1, hi); rect(ctx, 22, 21, 1, 3, hi); rect(ctx, 25, 21, 1, 3, hi);
      if (isFemale) { rect(ctx, 15, 27, 2, 3, s); rect(ctx, 31, 27, 2, 3, s); }
    },
    tank: function(ctx, c, isFemale) {
      var b = c.base, s = c.shadow, hi = c.highlight, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 17, 21, 14, 12, b); rect(ctx, 17, 21, 3, 12, s); rect(ctx, 20, 21, 2, 12, mid); rect(ctx, 26, 21, 2, 12, mh); rect(ctx, 28, 21, 3, 12, hi);
      rect(ctx, 19, 19, 3, 2, b); rect(ctx, 26, 19, 3, 2, b); rect(ctx, 19, 22, 10, 1, hi);
      if (isFemale) { rect(ctx, 17, 27, 2, 3, s); rect(ctx, 29, 27, 2, 3, s); }
    },
    buttonup: function(ctx, c, isFemale) {
      var b = c.base, s = c.shadow, hi = c.highlight, dk = c.dark, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 21, 18, 12, b); rect(ctx, 15, 21, 3, 12, s); rect(ctx, 18, 21, 2, 12, mid); rect(ctx, 28, 21, 2, 12, mh); rect(ctx, 30, 21, 3, 12, hi);
      rect(ctx, 11, 21, 4, 8, b); rect(ctx, 11, 21, 1, 8, s); rect(ctx, 14, 21, 1, 8, mid); rect(ctx, 33, 21, 4, 8, b); rect(ctx, 36, 21, 1, 8, s); rect(ctx, 33, 21, 1, 8, hi);
      rect(ctx, 19, 19, 3, 2, b); rect(ctx, 26, 19, 3, 2, b); px(ctx, 20, 18, b); px(ctx, 27, 18, b);
      for (var y = 23; y < 32; y += 2) px(ctx, 24, y, dk); rect(ctx, 24, 21, 1, 12, s);
      if (isFemale) { rect(ctx, 15, 27, 2, 3, s); rect(ctx, 31, 27, 2, 3, s); }
    },
    jacket: function(ctx, c, isFemale) {
      var b = c.base, s = c.shadow, hi = c.highlight, dk = c.dark, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 14, 21, 20, 13, b); rect(ctx, 14, 21, 3, 13, s); rect(ctx, 17, 21, 2, 13, mid); rect(ctx, 29, 21, 2, 13, mh); rect(ctx, 31, 21, 3, 13, hi);
      rect(ctx, 11, 21, 4, 11, b); rect(ctx, 11, 21, 1, 11, s); rect(ctx, 14, 21, 1, 11, mid); rect(ctx, 33, 21, 4, 11, b); rect(ctx, 36, 21, 1, 11, s); rect(ctx, 33, 21, 1, 11, hi);
      rect(ctx, 24, 21, 1, 13, dk); rect(ctx, 15, 18, 3, 3, b); rect(ctx, 30, 18, 3, 3, b); rect(ctx, 15, 18, 2, 3, hi); rect(ctx, 31, 18, 2, 3, hi);
      if (isFemale) { rect(ctx, 14, 27, 2, 3, s); rect(ctx, 32, 27, 2, 3, s); }
    }
  };

  // --- Shoes ---

  function drawShoes(ctx, shoe) {
    rect(ctx, 14, 43, 10, 4, shoe.base); rect(ctx, 24, 43, 10, 4, shoe.base);
    rect(ctx, 14, 45, 10, 2, shoe.shadow); rect(ctx, 24, 45, 10, 2, shoe.shadow);
    rect(ctx, 16, 43, 6, 1, shoe.highlight); rect(ctx, 26, 43, 6, 1, shoe.highlight);
    rect(ctx, 15, 43, 3, 1, shoe.highlight); rect(ctx, 25, 43, 3, 1, shoe.highlight);
    rect(ctx, 14, 46, 10, 1, shoe.sole || shoe.dark); rect(ctx, 24, 46, 10, 1, shoe.sole || shoe.dark);
  }

  // --- Pants Drawers ---

  var PANTS_DRAWERS = {
    jeans: function(ctx, c, shoe) {
      var b = c.base, s = c.shadow, hi = c.highlight, dk = c.dark, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 33, 18, 10, b); rect(ctx, 15, 33, 18, 1, s); rect(ctx, 15, 33, 3, 10, s); rect(ctx, 18, 33, 2, 10, mid);
      rect(ctx, 28, 33, 2, 10, mh); rect(ctx, 30, 33, 3, 10, hi); rect(ctx, 23, 36, 2, 7, dk);
      rect(ctx, 19, 35, 3, 1, hi); rect(ctx, 27, 35, 3, 1, hi); drawShoes(ctx, shoe);
    },
    shorts: function(ctx, c, shoe) {
      var b = c.base, s = c.shadow, hi = c.highlight, dk = c.dark, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 33, 18, 6, b); rect(ctx, 15, 33, 18, 1, s); rect(ctx, 15, 33, 3, 6, s); rect(ctx, 18, 33, 2, 6, mid);
      rect(ctx, 28, 33, 2, 6, mh); rect(ctx, 30, 33, 3, 6, hi); rect(ctx, 23, 35, 2, 4, dk);
      rect(ctx, 19, 35, 3, 1, hi); rect(ctx, 27, 35, 3, 1, hi); drawShoes(ctx, shoe);
    },
    cargo: function(ctx, c, shoe) {
      var b = c.base, s = c.shadow, hi = c.highlight, dk = c.dark, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 33, 18, 10, b); rect(ctx, 15, 33, 18, 1, s); rect(ctx, 15, 33, 3, 10, s); rect(ctx, 18, 33, 2, 10, mid);
      rect(ctx, 28, 33, 2, 10, mh); rect(ctx, 30, 33, 3, 10, hi); rect(ctx, 23, 36, 2, 7, dk);
      rect(ctx, 17, 37, 4, 3, s); rect(ctx, 17, 37, 4, 1, hi); rect(ctx, 27, 37, 4, 3, s); rect(ctx, 27, 37, 4, 1, hi); drawShoes(ctx, shoe);
    },
    skirt: function(ctx, c, shoe) {
      var b = c.base, s = c.shadow, hi = c.highlight;
      rect(ctx, 14, 33, 20, 7, b); rect(ctx, 14, 33, 20, 1, s); rect(ctx, 14, 33, 3, 7, s); rect(ctx, 31, 33, 3, 7, hi);
      rect(ctx, 13, 37, 1, 3, b); rect(ctx, 34, 37, 1, 3, b); rect(ctx, 19, 36, 2, 4, s); rect(ctx, 27, 36, 2, 4, s); drawShoes(ctx, shoe);
    },
    sweats: function(ctx, c, shoe) {
      var b = c.base, s = c.shadow, hi = c.highlight, dk = c.dark, mid = blend(b, s, 0.4), mh = blend(b, hi, 0.4);
      rect(ctx, 15, 33, 18, 10, b); rect(ctx, 15, 33, 18, 1, hi); rect(ctx, 22, 33, 4, 2, s);
      rect(ctx, 15, 33, 3, 10, s); rect(ctx, 18, 33, 2, 10, mid); rect(ctx, 28, 33, 2, 10, mh); rect(ctx, 30, 33, 3, 10, hi);
      rect(ctx, 23, 36, 2, 7, dk); drawShoes(ctx, shoe);
    }
  };

  // --- Accessory Drawers ---

  var ACCESSORY_DRAWERS = {
    none: function(ctx) {},
    glasses: function(ctx) {
      rect(ctx, 18, 10, 5, 3, '#333355'); rect(ctx, 25, 10, 5, 3, '#333355'); rect(ctx, 23, 10, 2, 1, '#333355');
      rect(ctx, 19, 11, 3, 1, '#88aaff'); rect(ctx, 26, 11, 3, 1, '#88aaff');
    },
    headphones: function(ctx) {
      rect(ctx, 13, 5, 2, 7, '#444466'); rect(ctx, 33, 5, 2, 7, '#444466'); rect(ctx, 15, 3, 18, 2, '#444466');
      rect(ctx, 11, 8, 3, 5, '#555577'); rect(ctx, 34, 8, 3, 5, '#555577');
      rect(ctx, 11, 8, 2, 5, '#666688'); rect(ctx, 35, 8, 2, 5, '#666688');
    },
    cap: function(ctx) {
      rect(ctx, 15, 2, 18, 6, '#cc3333'); rect(ctx, 16, 1, 16, 1, '#cc3333'); rect(ctx, 11, 7, 7, 2, '#aa2222');
      rect(ctx, 18, 2, 12, 2, '#ee5555'); rect(ctx, 15, 2, 2, 6, '#aa2222');
    },
    scarf: function(ctx) {
      rect(ctx, 14, 17, 20, 4, '#ddaa33'); rect(ctx, 14, 17, 20, 1, '#eedd55');
      rect(ctx, 14, 21, 3, 6, '#ddaa33'); rect(ctx, 14, 21, 2, 6, '#bb8822');
    },
    badge: function(ctx) {
      rect(ctx, 28, 23, 3, 3, '#ffcc00'); px(ctx, 28, 23, '#ffee44'); px(ctx, 30, 25, '#cc9900');
    },
    phone: function(ctx) {
      rect(ctx, 10, 30, 3, 5, '#222233'); rect(ctx, 10, 30, 3, 1, '#333344'); rect(ctx, 10, 31, 3, 3, '#4488ff');
    },
    watch: function(ctx) {
      rect(ctx, 12, 31, 3, 2, '#888888'); rect(ctx, 13, 31, 1, 2, '#44ff88');
    }
  };

  // --- Canvas Helpers ---

  function createCanvas() {
    var c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    return c;
  }

  function renderLayer(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    var c = createCanvas();
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    fn.apply(null, [ctx].concat(args));
    return c;
  }

  function flipCanvas(src) {
    var c = createCanvas();
    var ctx = c.getContext('2d');
    ctx.translate(S, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  }

  // --- Skin Tone from Name ---

  function getSkinToneIdx(name) {
    var parts = name.split(' ');
    var lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    var eth = LAST_NAME_ETH[lastName];
    if (eth && ETHNICITY_SKIN[eth] !== undefined) return ETHNICITY_SKIN[eth];
    return hash(name) % SKIN_TONES.length;
  }

  // --- Generate Appearance from Hash (for NPCs without stored appearance) ---

  function generateAppearance(person) {
    var name = person.name || 'Unknown';
    var h = hash(name);
    var isFemale = person.gender === 'female';
    var roleId = person.role ? (typeof person.role === 'string' ? person.role : person.role.id) : 'developer';

    var hairStyles = isFemale ? FEMALE_HAIR_STYLES : MALE_HAIR_STYLES;

    return {
      bodyType: isFemale ? 'female' : 'male',
      skinTone: person.skinTone !== undefined ? person.skinTone : getSkinToneIdx(name),
      hairStyle: person.hairStyle || hairStyles[h % hairStyles.length],
      hairColorIdx: person.hairColorIdx !== undefined ? person.hairColorIdx : (h >> 4) % HAIR_COLORS.length,
      shirtStyle: person.shirtStyle || SHIRT_STYLES[(h >> 8) % SHIRT_STYLES.length],
      shirtColorIdx: person.shirtColorIdx !== undefined ? person.shirtColorIdx : (ROLE_SHIRT_IDX[roleId] !== undefined ? ROLE_SHIRT_IDX[roleId] : (h >> 12) % SHIRT_COLORS.length),
      pantsStyle: person.pantsStyle || PANTS_STYLES[(h >> 16) % PANTS_STYLES.length],
      pantsColorIdx: person.pantsColorIdx !== undefined ? person.pantsColorIdx : (h >> 20) % PANTS_COLORS.length,
      shoeColorIdx: person.shoeColorIdx !== undefined ? person.shoeColorIdx : (h >> 24) % SHOE_COLORS.length,
      accessory: person.accessory || ACCESSORIES[(h >> 28) % ACCESSORIES.length],
    };
  }

  // --- Main Generate Function ---

  function generate(person, scale) {
    scale = scale || 1;

    var app = generateAppearance(person);
    var isFemale = app.bodyType === 'female';

    var skin = SKIN_TONES[app.skinTone] || SKIN_TONES[0];
    var hair = HAIR_COLORS[app.hairColorIdx] || HAIR_COLORS[0];
    var shirt = SHIRT_COLORS[app.shirtColorIdx] || SHIRT_COLORS[0];
    var pants = PANTS_COLORS[app.pantsColorIdx] || PANTS_COLORS[0];
    var shoe = SHOE_COLORS[app.shoeColorIdx] || SHOE_COLORS[0];

    var bodyDrawer = isFemale ? drawBodyFemale : drawBodyMale;
    var hairDrawer = HAIR_DRAWERS[app.hairStyle] || HAIR_DRAWERS.short;
    var shirtDrawer = SHIRT_DRAWERS[app.shirtStyle] || SHIRT_DRAWERS.tee;
    var pantsDrawer = PANTS_DRAWERS[app.pantsStyle] || PANTS_DRAWERS.jeans;
    var accDrawer = ACCESSORY_DRAWERS[app.accessory] || ACCESSORY_DRAWERS.none;

    // Render layers
    var bodyLayer = renderLayer(bodyDrawer, skin);
    var shirtLayer = renderLayer(shirtDrawer, shirt, isFemale);
    var pantsLayer = renderLayer(pantsDrawer, pants, shoe);
    var hairLayer = renderLayer(hairDrawer, hair);
    var accLayer = renderLayer(accDrawer);

    // Flip all layers for left-facing (default display)
    bodyLayer = flipCanvas(bodyLayer);
    shirtLayer = flipCanvas(shirtLayer);
    pantsLayer = flipCanvas(pantsLayer);
    hairLayer = flipCanvas(hairLayer);
    accLayer = flipCanvas(accLayer);

    // Composite
    var composite = createCanvas();
    var cCtx = composite.getContext('2d');
    cCtx.drawImage(bodyLayer, 0, 0);
    cCtx.drawImage(shirtLayer, 0, 0);
    cCtx.drawImage(pantsLayer, 0, 0);
    cCtx.drawImage(hairLayer, 0, 0);
    cCtx.drawImage(accLayer, 0, 0);

    // Scale up
    var canvas = document.createElement('canvas');
    canvas.width = S * scale;
    canvas.height = S * scale;
    canvas.style.imageRendering = 'pixelated';
    canvas.className = 'pixel-avatar';
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(composite, 0, 0, S * scale, S * scale);

    return canvas;
  }

  // --- Public API ---

  return {
    generate: generate,
    generateAppearance: generateAppearance,
    SKIN_TONES: SKIN_TONES,
    HAIR_COLORS: HAIR_COLORS,
    SHIRT_COLORS: SHIRT_COLORS,
    PANTS_COLORS: PANTS_COLORS,
    SHOE_COLORS: SHOE_COLORS,
    MALE_HAIR_STYLES: MALE_HAIR_STYLES,
    FEMALE_HAIR_STYLES: FEMALE_HAIR_STYLES,
    SHIRT_STYLES: SHIRT_STYLES,
    PANTS_STYLES: PANTS_STYLES,
    ACCESSORIES: ACCESSORIES,
    S: S
  };
})();
