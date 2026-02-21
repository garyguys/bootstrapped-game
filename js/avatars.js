/* ============================================
   avatars.js — 16-bit Pixel Art Character Generator
   ============================================ */

var AvatarGen = (function() {

  // Skin tones by ethnicity grouping
  var SKIN = {
    east_asian:     ['#F5D5B8', '#E0C0A0'],
    south_asian:    ['#C6956A', '#B8844D'],
    middle_eastern: ['#D4A574', '#C69460'],
    hispanic:       ['#D4A574', '#C08850'],
    european:       ['#FDDBB4', '#EBC8A0'],
    african:        ['#8D5524', '#7A4420'],
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
  };

  var HAIR_COLORS = [
    '#1a1a2e', '#2d1b0e', '#4a2c0a', '#8B4513', '#654321',
    '#2c1608', '#0a0a0a', '#3d2b1f', '#5c3317', '#704214',
    '#1a0a00', '#332211',
  ];

  var ROLE_SHIRT = {
    developer: '#2D6B2D',
    designer:  '#6B2D6B',
    marketer:  '#6B6B2D',
    sales:     '#2D3D6B',
    devops:    '#6B3D2D',
    pm:        '#2D6B6B',
  };

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  // Male sprite (10x14) — 0=transparent, 1=hair, 2=skin, 3=eye, 4=mouth, 5=shirt, 6=pants, 7=shoe, 8=hair-shadow
  var MALE_BASE = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,8,2,2,2,2,8,0,0],
    [0,0,2,3,2,2,3,2,0,0],
    [0,0,2,2,2,2,2,2,0,0],
    [0,0,0,2,4,4,2,0,0,0],
    [0,0,0,0,2,2,0,0,0,0],
    [0,0,5,5,5,5,5,5,0,0],
    [0,5,5,5,5,5,5,5,5,0],
    [0,2,5,5,5,5,5,5,2,0],
    [0,2,0,5,5,5,5,0,2,0],
    [0,0,0,6,6,6,6,0,0,0],
    [0,0,0,6,0,0,6,0,0,0],
    [0,0,0,7,0,0,7,0,0,0],
  ];

  // Male hair variants — different top rows
  var MALE_HAIR_V2 = [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
  ];
  var MALE_HAIR_V3 = [
    [0,0,0,0,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,1,0,0],
  ];

  // Female sprite (10x14)
  var FEMALE_BASE = [
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,8,2,2,2,2,2,2,8,1],
    [0,1,2,3,2,2,3,2,1,0],
    [0,0,2,2,2,2,2,2,0,0],
    [0,0,0,2,4,4,2,0,0,0],
    [0,0,0,0,2,2,0,0,0,0],
    [0,0,5,5,5,5,5,5,0,0],
    [0,5,5,5,5,5,5,5,5,0],
    [0,2,5,5,5,5,5,5,2,0],
    [0,0,0,5,5,5,5,0,0,0],
    [0,0,0,6,6,6,6,0,0,0],
    [0,0,0,6,0,0,6,0,0,0],
    [0,0,0,7,0,0,7,0,0,0],
  ];

  // Female hair variants
  var FEMALE_HAIR_V2 = [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,2,2,2,2,2,2,1,1],
  ];
  var FEMALE_HAIR_V3 = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,8,2,2,2,2,2,2,8,1],
  ];

  function getSkinFromName(name) {
    var parts = name.split(' ');
    var lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    var eth = LAST_NAME_ETH[lastName] || 'european';
    return (SKIN[eth] || SKIN.european)[0];
  }

  function getSpriteForStyle(spriteStyle, hairVariant) {
    if (spriteStyle === 'b') {
      var s = FEMALE_BASE.map(function(r) { return r.slice(); });
      if (hairVariant === 1) {
        s[0] = FEMALE_HAIR_V2[0].slice();
        s[1] = FEMALE_HAIR_V2[1].slice();
        s[2] = FEMALE_HAIR_V2[2].slice();
      } else if (hairVariant === 2) {
        s[0] = FEMALE_HAIR_V3[0].slice();
        s[1] = FEMALE_HAIR_V3[1].slice();
        s[2] = FEMALE_HAIR_V3[2].slice();
      }
      return s;
    } else {
      var s2 = MALE_BASE.map(function(r) { return r.slice(); });
      if (hairVariant === 1) {
        s2[0] = MALE_HAIR_V2[0].slice();
        s2[1] = MALE_HAIR_V2[1].slice();
      } else if (hairVariant === 2) {
        s2[0] = MALE_HAIR_V3[0].slice();
        s2[1] = MALE_HAIR_V3[1].slice();
      }
      return s2;
    }
  }

  // Keep legacy function for backwards compatibility
  function getSprite(gender, nameHash) {
    var spriteStyle = (gender === 'female') ? 'b' : 'a';
    return getSpriteForStyle(spriteStyle, nameHash % 3);
  }

  function generate(person, scale) {
    scale = scale || 3;
    var name = person.name || 'Unknown';
    var roleId = person.role ? (typeof person.role === 'string' ? person.role : person.role.id) : 'developer';

    var h = hash(name);

    // Sprite style: 'b' = female sprite, 'a' = male sprite; legacy gender field also supported
    var spriteStyle = person.spriteStyle || (person.gender === 'female' ? 'b' : 'a');
    // Hair variant: direct index override (0/1/2) takes priority, else use name hash
    var hairVariant = (person.hairStyle !== undefined) ? (person.hairStyle % 3) : (h % 3);
    // Colors: direct overrides take priority, else compute from name
    var hairColor  = person.hairColor  || HAIR_COLORS[h % HAIR_COLORS.length];
    var hairShadow = person.hairColor  || HAIR_COLORS[(h + 3) % HAIR_COLORS.length];
    var skinColor  = person.skinColor  || getSkinFromName(name);
    var shirtColor = person.shirtColor || ROLE_SHIRT[roleId] || '#2D6B2D';
    var pantsColor = person.pantsColor || '#1a1a3e';

    var palette = {
      0: null,
      1: hairColor,
      2: skinColor,
      3: '#111111',
      4: '#CC6666',
      5: shirtColor,
      6: pantsColor,
      7: '#111111',
      8: hairShadow,
    };

    var sprite = getSpriteForStyle(spriteStyle, hairVariant);

    var canvas = document.createElement('canvas');
    canvas.width = 10 * scale;
    canvas.height = 14 * scale;
    canvas.style.imageRendering = 'pixelated';
    canvas.className = 'pixel-avatar';

    var ctx = canvas.getContext('2d');
    for (var y = 0; y < 14; y++) {
      for (var x = 0; x < 10; x++) {
        var idx = sprite[y][x];
        var color = palette[idx];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  return { generate: generate };
})();
