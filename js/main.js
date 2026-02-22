/* ============================================
   main.js — Game Init, Screen Management
   Character creation on new game.
   ============================================ */

(function() {

  // Character creation color palettes
  var CC_HAIR = [
    '#1a1a2e', '#2d1b0e', '#4a2c0a', '#8B4513', '#654321',
    '#2c1608', '#3d2b1f', '#5c3317', '#704214', '#d4a017',
    '#c0c0c0', '#e87070', '#0a0a0a', '#aa6622', '#f0e68c',
  ];
  var CC_SKIN = [
    '#FDDBB4', '#F5D5B8', '#E0C0A0', '#D4A574', '#C6956A',
    '#C08850', '#B8844D', '#8D5524', '#7A4420',
  ];
  var CC_SHIRT = [
    '#2D5FA0', '#2D6B2D', '#6B2D6B', '#8B2020', '#B8860B',
    '#2D6B6B', '#6B3D2D', '#1a1a3e', '#cc4444', '#44aa44',
    '#4466cc', '#aa44aa', '#ffffff', '#222222',
  ];
  var CC_PANTS = [
    '#1a1a3e', '#2d2d2d', '#1a3e2d', '#3e1a1a', '#2d3a1a',
    '#4a3728', '#1a1a1a', '#3d3d5c',
  ];
  var CC_EYES = [
    '#111111', '#2244aa', '#228844', '#664422', '#666666',
    '#aa4444', '#7744aa',
  ];
  var CC_SHOES = [
    '#111111', '#2d1b0e', '#8B4513', '#1a1a3e', '#cc2222',
    '#ffffff', '#555555',
  ];

  // Current state of character creation form
  var cc = {
    spriteStyle: 'a',
    hairStyle: 0,
    hairColor: CC_HAIR[0],
    skinColor: CC_SKIN[0],
    shirtColor: CC_SHIRT[0],
    pantsColor: CC_PANTS[0],
    eyeColor: CC_EYES[0],
    shoeColor: CC_SHOES[0],
    technical: 0,
    communication: 0,
    reliability: 0,
  };

  var SKILL_POOL = 8;

  function updateAvatarPreview() {
    var canvas = document.getElementById('create-avatar-preview');
    if (!canvas) return;
    var previewState = {
      name: 'Preview',
      spriteStyle: cc.spriteStyle,
      hairStyle: cc.hairStyle,
      hairColor: cc.hairColor,
      skinColor: cc.skinColor,
      shirtColor: cc.shirtColor,
      pantsColor: cc.pantsColor,
      eyeColor: cc.eyeColor,
      shoeColor: cc.shoeColor,
    };
    var generated = AvatarGen.generate(previewState, 6);
    canvas.width = generated.width;
    canvas.height = generated.height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(generated, 0, 0);
    canvas.style.imageRendering = 'pixelated';
  }

  function buildSwatches(containerId, colors, getCurrent, onSelect) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < colors.length; i++) {
      (function(color) {
        var swatch = document.createElement('button');
        swatch.className = 'color-swatch' + (getCurrent() === color ? ' selected' : '');
        swatch.style.background = color;
        swatch.title = color;
        swatch.onclick = function() {
          onSelect(color);
          buildSwatches(containerId, colors, getCurrent, onSelect);
          updateAvatarPreview();
        };
        el.appendChild(swatch);
      })(colors[i]);
    }
  }

  function updateSkillDisplay() {
    var used = cc.technical + cc.communication + cc.reliability;
    var left = SKILL_POOL - used;
    var badge = document.getElementById('skill-points-left');
    if (badge) badge.textContent = left + ' pts';
    document.getElementById('tec-val').textContent = cc.technical;
    document.getElementById('com-val').textContent = cc.communication;
    document.getElementById('rel-val').textContent = cc.reliability;
    document.getElementById('tec-plus').disabled = left === 0 || cc.technical >= 8;
    document.getElementById('com-plus').disabled = left === 0 || cc.communication >= 8;
    document.getElementById('rel-plus').disabled = left === 0 || cc.reliability >= 8;
    document.getElementById('tec-minus').disabled = cc.technical === 0;
    document.getElementById('com-minus').disabled = cc.communication === 0;
    document.getElementById('rel-minus').disabled = cc.reliability === 0;
  }

  var spriteStyles = ['a', 'b', 'c', 'd'];
  var spriteNames  = ['Style A', 'Style B', 'Style C', 'Style D'];

  function initCharacterCreation() {
    // Reset cc state
    cc.spriteStyle   = 'a';
    cc.hairStyle     = 0;
    cc.hairColor     = CC_HAIR[0];
    cc.skinColor     = CC_SKIN[0];
    cc.shirtColor    = CC_SHIRT[0];
    cc.pantsColor    = CC_PANTS[0];
    cc.eyeColor      = CC_EYES[0];
    cc.shoeColor     = CC_SHOES[0];
    cc.technical     = 0;
    cc.communication = 0;
    cc.reliability   = 0;

    document.getElementById('sprite-label').textContent = 'Style A';
    document.getElementById('hair-label').textContent   = 'Hair 1';

    // Sprite picker
    document.getElementById('sprite-prev').onclick = function() {
      var idx = spriteStyles.indexOf(cc.spriteStyle);
      cc.spriteStyle = spriteStyles[(idx + spriteStyles.length - 1) % spriteStyles.length];
      document.getElementById('sprite-label').textContent = spriteNames[spriteStyles.indexOf(cc.spriteStyle)];
      updateAvatarPreview();
    };
    document.getElementById('sprite-next').onclick = function() {
      var idx = spriteStyles.indexOf(cc.spriteStyle);
      cc.spriteStyle = spriteStyles[(idx + 1) % spriteStyles.length];
      document.getElementById('sprite-label').textContent = spriteNames[spriteStyles.indexOf(cc.spriteStyle)];
      updateAvatarPreview();
    };

    // Hair style picker (5 variants)
    document.getElementById('hair-prev').onclick = function() {
      cc.hairStyle = (cc.hairStyle + 4) % 5;
      document.getElementById('hair-label').textContent = 'Hair ' + (cc.hairStyle + 1);
      updateAvatarPreview();
    };
    document.getElementById('hair-next').onclick = function() {
      cc.hairStyle = (cc.hairStyle + 1) % 5;
      document.getElementById('hair-label').textContent = 'Hair ' + (cc.hairStyle + 1);
      updateAvatarPreview();
    };

    // Color swatches
    buildSwatches('swatch-hair',  CC_HAIR,  function() { return cc.hairColor;  }, function(c) { cc.hairColor  = c; });
    buildSwatches('swatch-skin',  CC_SKIN,  function() { return cc.skinColor;  }, function(c) { cc.skinColor  = c; });
    buildSwatches('swatch-eyes',  CC_EYES,  function() { return cc.eyeColor;   }, function(c) { cc.eyeColor   = c; });
    buildSwatches('swatch-shirt', CC_SHIRT, function() { return cc.shirtColor; }, function(c) { cc.shirtColor = c; });
    buildSwatches('swatch-pants', CC_PANTS, function() { return cc.pantsColor; }, function(c) { cc.pantsColor = c; });
    buildSwatches('swatch-shoes', CC_SHOES, function() { return cc.shoeColor;  }, function(c) { cc.shoeColor  = c; });

    // Skill buttons
    document.getElementById('tec-plus').onclick  = function() {
      if (cc.technical < 8 && cc.technical + cc.communication + cc.reliability < SKILL_POOL) { cc.technical++;    updateSkillDisplay(); }
    };
    document.getElementById('tec-minus').onclick = function() {
      if (cc.technical > 0)    { cc.technical--;    updateSkillDisplay(); }
    };
    document.getElementById('com-plus').onclick  = function() {
      if (cc.communication < 8 && cc.technical + cc.communication + cc.reliability < SKILL_POOL) { cc.communication++; updateSkillDisplay(); }
    };
    document.getElementById('com-minus').onclick = function() {
      if (cc.communication > 0) { cc.communication--; updateSkillDisplay(); }
    };
    document.getElementById('rel-plus').onclick  = function() {
      if (cc.reliability < 8 && cc.technical + cc.communication + cc.reliability < SKILL_POOL) { cc.reliability++;   updateSkillDisplay(); }
    };
    document.getElementById('rel-minus').onclick = function() {
      if (cc.reliability > 0)   { cc.reliability--;   updateSkillDisplay(); }
    };

    updateSkillDisplay();
    updateAvatarPreview();
  }

  function showScreen(screenId) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  function showCharacterCreation() {
    showScreen('screen-create');
    initCharacterCreation();
  }

  function startGameWithCharacter() {
    var used = cc.technical + cc.communication + cc.reliability;
    if (used < SKILL_POOL) {
      var badge = document.getElementById('skill-points-left');
      if (badge) { badge.style.color = '#ff3333'; badge.textContent = (SKILL_POOL - used) + ' pts remaining!'; }
      return;
    }

    var nameInput = document.getElementById('create-player-name');
    var compInput = document.getElementById('create-company-name');
    var playerName  = (nameInput ? nameInput.value : '').trim() || 'Founder';
    var companyName = (compInput ? compInput.value : '').trim() || 'My Startup';

    G = createDefaultState();
    deleteSave();

    G.player.name          = playerName;
    G.player.companyName   = companyName;
    G.player.spriteStyle   = cc.spriteStyle;
    G.player.hairStyle     = cc.hairStyle;
    G.player.hairColor     = cc.hairColor;
    G.player.skinColor     = cc.skinColor;
    G.player.shirtColor    = cc.shirtColor;
    G.player.pantsColor    = cc.pantsColor;
    G.player.eyeColor      = cc.eyeColor;
    G.player.shoeColor     = cc.shoeColor;
    G.player.technical     = cc.technical;
    G.player.communication = cc.communication;
    G.player.reliability   = cc.reliability;

    generatePipelineLeads(true);
    initMarket();

    addLog('Day 1 (MON) \u2014 ' + playerName + ' quit their job. $500 in the bank. Let\'s build ' + companyName + '.', 'info');

    saveGame();
    showScreen('screen-game');
    UI.renderAll();
  }

  function continueGame() {
    if (!loadGame()) return;
    showScreen('screen-game');
    UI.renderAll();
  }

  function init() {
    document.getElementById('btn-new-game').addEventListener('click', showCharacterCreation);
    document.getElementById('btn-continue').addEventListener('click', continueGame);

    var btnStart = document.getElementById('btn-start-game');
    if (btnStart) btnStart.addEventListener('click', startGameWithCharacter);

    var btnBack = document.getElementById('btn-back-title');
    if (btnBack) btnBack.addEventListener('click', function() { showScreen('screen-title'); });

    if (hasSave()) {
      document.getElementById('btn-continue').style.display = '';
    }

    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function() {
        UI.switchTab(this.getAttribute('data-tab'));
      });
    }

    document.getElementById('btn-end-day').addEventListener('click', function() {
      if (G.gameOver) return;
      if (G.pushedThroughTonight) {
        G.pushedThroughTonight = false;
        endDay(true);
      } else {
        showNightPushPrompt();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
