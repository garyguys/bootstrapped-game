/* ============================================
   main.js — Game Init, Screen Management
   Character creation on new game.
   Uses 48px procedural sprite system (v0.16.2)
   ============================================ */

(function() {

  // Current state of character creation form
  var cc = {
    bodyType: 'male',
    skinTone: 0,
    hairStyleIdx: 0,
    hairColorIdx: 0,
    shirtStyleIdx: 0,
    shirtColorIdx: 0,
    pantsStyleIdx: 0,
    pantsColorIdx: 0,
    shoeColorIdx: 0,
    accIdx: 0,
    technical: 0,
    communication: 0,
    reliability: 0,
  };

  var SKILL_POOL = 8;

  // Accessory list (all keys from the sprite system)
  var ALL_ACCESSORIES = ['none', 'glasses', 'headphones', 'cap', 'scarf', 'badge', 'phone', 'watch'];

  function getHairStyles() {
    return cc.bodyType === 'female' ? AvatarGen.FEMALE_HAIR_STYLES : AvatarGen.MALE_HAIR_STYLES;
  }

  function updateAvatarPreview() {
    var canvas = document.getElementById('create-avatar-preview');
    if (!canvas) return;
    var hairStyles = getHairStyles();
    var previewState = {
      name: 'Preview',
      gender: cc.bodyType,
      skinTone: cc.skinTone,
      hairStyle: hairStyles[cc.hairStyleIdx % hairStyles.length],
      hairColorIdx: cc.hairColorIdx,
      shirtStyle: AvatarGen.SHIRT_STYLES[cc.shirtStyleIdx],
      shirtColorIdx: cc.shirtColorIdx,
      pantsStyle: AvatarGen.PANTS_STYLES[cc.pantsStyleIdx],
      pantsColorIdx: cc.pantsColorIdx,
      shoeColorIdx: cc.shoeColorIdx,
      accessory: ALL_ACCESSORIES[cc.accIdx],
    };
    var generated = AvatarGen.generate(previewState, 3);
    canvas.width = generated.width;
    canvas.height = generated.height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(generated, 0, 0);
    canvas.style.imageRendering = 'pixelated';
  }

  function buildSwatches(containerId, palette, currentIdx, onSelect) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < palette.length; i++) {
      (function(idx) {
        var swatch = document.createElement('button');
        swatch.className = 'color-swatch' + (currentIdx === idx ? ' selected' : '');
        swatch.style.background = palette[idx].base;
        swatch.title = palette[idx].name;
        swatch.onclick = function() {
          onSelect(idx);
          updateAvatarPreview();
        };
        el.appendChild(swatch);
      })(i);
    }
  }

  function rebuildAllSwatches() {
    buildSwatches('swatch-skin', AvatarGen.SKIN_TONES, cc.skinTone, function(i) { cc.skinTone = i; rebuildAllSwatches(); });
    buildSwatches('swatch-hair', AvatarGen.HAIR_COLORS, cc.hairColorIdx, function(i) { cc.hairColorIdx = i; rebuildAllSwatches(); });
    buildSwatches('swatch-shirt', AvatarGen.SHIRT_COLORS, cc.shirtColorIdx, function(i) { cc.shirtColorIdx = i; rebuildAllSwatches(); });
    buildSwatches('swatch-pants', AvatarGen.PANTS_COLORS, cc.pantsColorIdx, function(i) { cc.pantsColorIdx = i; rebuildAllSwatches(); });
    buildSwatches('swatch-shoes', AvatarGen.SHOE_COLORS, cc.shoeColorIdx, function(i) { cc.shoeColorIdx = i; rebuildAllSwatches(); });
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

  function updateLabels() {
    var hairStyles = getHairStyles();
    document.getElementById('body-label').textContent = cc.bodyType === 'female' ? 'Female' : 'Male';
    document.getElementById('hair-label').textContent = hairStyles[cc.hairStyleIdx % hairStyles.length];
    document.getElementById('shirt-style-label').textContent = AvatarGen.SHIRT_STYLES[cc.shirtStyleIdx];
    document.getElementById('pants-style-label').textContent = AvatarGen.PANTS_STYLES[cc.pantsStyleIdx];
    document.getElementById('acc-label').textContent = ALL_ACCESSORIES[cc.accIdx];
  }

  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  function randomizeAppearance() {
    // Keep current body type — randomize everything else
    cc.skinTone      = randInt(AvatarGen.SKIN_TONES.length);
    cc.hairColorIdx  = randInt(AvatarGen.HAIR_COLORS.length);
    cc.shirtStyleIdx = randInt(AvatarGen.SHIRT_STYLES.length);
    cc.shirtColorIdx = randInt(AvatarGen.SHIRT_COLORS.length);
    cc.pantsStyleIdx = randInt(AvatarGen.PANTS_STYLES.length);
    cc.pantsColorIdx = randInt(AvatarGen.PANTS_COLORS.length);
    cc.shoeColorIdx  = randInt(AvatarGen.SHOE_COLORS.length);
    cc.accIdx        = randInt(ALL_ACCESSORIES.length);

    var hairStyles = getHairStyles();
    cc.hairStyleIdx = randInt(hairStyles.length);

    // Randomize skills — distribute all 8 points
    cc.technical = 0;
    cc.communication = 0;
    cc.reliability = 0;
    for (var i = 0; i < SKILL_POOL; i++) {
      var r = randInt(3);
      if (r === 0 && cc.technical < 8) { cc.technical++; }
      else if (r === 1 && cc.communication < 8) { cc.communication++; }
      else if (cc.reliability < 8) { cc.reliability++; }
      else if (cc.technical < 8) { cc.technical++; }
      else { cc.communication++; }
    }

    rebuildAllSwatches();
    updateLabels();
    updateSkillDisplay();
    updateAvatarPreview();
  }

  function initCharacterCreation() {
    // Reset cc state
    cc.bodyType      = 'male';
    cc.skinTone      = 0;
    cc.hairStyleIdx  = 0;
    cc.hairColorIdx  = 0;
    cc.shirtStyleIdx = 0;
    cc.shirtColorIdx = 0;
    cc.pantsStyleIdx = 0;
    cc.pantsColorIdx = 0;
    cc.shoeColorIdx  = 0;
    cc.accIdx        = 0;
    cc.technical     = 0;
    cc.communication = 0;
    cc.reliability   = 0;

    // Body type picker
    document.getElementById('body-prev').onclick = function() {
      cc.bodyType = cc.bodyType === 'male' ? 'female' : 'male';
      // Clamp hair style to valid range
      var hairStyles = getHairStyles();
      cc.hairStyleIdx = cc.hairStyleIdx % hairStyles.length;
      updateLabels(); updateAvatarPreview();
    };
    document.getElementById('body-next').onclick = function() {
      cc.bodyType = cc.bodyType === 'male' ? 'female' : 'male';
      var hairStyles = getHairStyles();
      cc.hairStyleIdx = cc.hairStyleIdx % hairStyles.length;
      updateLabels(); updateAvatarPreview();
    };

    // Hair style picker
    document.getElementById('hair-prev').onclick = function() {
      var hairStyles = getHairStyles();
      cc.hairStyleIdx = (cc.hairStyleIdx + hairStyles.length - 1) % hairStyles.length;
      updateLabels(); updateAvatarPreview();
    };
    document.getElementById('hair-next').onclick = function() {
      var hairStyles = getHairStyles();
      cc.hairStyleIdx = (cc.hairStyleIdx + 1) % hairStyles.length;
      updateLabels(); updateAvatarPreview();
    };

    // Shirt style picker
    document.getElementById('shirt-style-prev').onclick = function() {
      cc.shirtStyleIdx = (cc.shirtStyleIdx + AvatarGen.SHIRT_STYLES.length - 1) % AvatarGen.SHIRT_STYLES.length;
      updateLabels(); updateAvatarPreview();
    };
    document.getElementById('shirt-style-next').onclick = function() {
      cc.shirtStyleIdx = (cc.shirtStyleIdx + 1) % AvatarGen.SHIRT_STYLES.length;
      updateLabels(); updateAvatarPreview();
    };

    // Pants style picker
    document.getElementById('pants-style-prev').onclick = function() {
      cc.pantsStyleIdx = (cc.pantsStyleIdx + AvatarGen.PANTS_STYLES.length - 1) % AvatarGen.PANTS_STYLES.length;
      updateLabels(); updateAvatarPreview();
    };
    document.getElementById('pants-style-next').onclick = function() {
      cc.pantsStyleIdx = (cc.pantsStyleIdx + 1) % AvatarGen.PANTS_STYLES.length;
      updateLabels(); updateAvatarPreview();
    };

    // Accessory picker
    document.getElementById('acc-prev').onclick = function() {
      cc.accIdx = (cc.accIdx + ALL_ACCESSORIES.length - 1) % ALL_ACCESSORIES.length;
      updateLabels(); updateAvatarPreview();
    };
    document.getElementById('acc-next').onclick = function() {
      cc.accIdx = (cc.accIdx + 1) % ALL_ACCESSORIES.length;
      updateLabels(); updateAvatarPreview();
    };

    // Color swatches
    rebuildAllSwatches();

    // Randomize button
    var btnRandomize = document.getElementById('btn-randomize');
    if (btnRandomize) {
      btnRandomize.onclick = function() { randomizeAppearance(); };
    }

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

    updateLabels();
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

    var hairStyles = getHairStyles();

    G.player.name          = playerName;
    G.player.companyName   = companyName;
    G.player.gender        = cc.bodyType;
    G.player.skinTone      = cc.skinTone;
    G.player.hairStyle     = hairStyles[cc.hairStyleIdx % hairStyles.length];
    G.player.hairColorIdx  = cc.hairColorIdx;
    G.player.shirtStyle    = AvatarGen.SHIRT_STYLES[cc.shirtStyleIdx];
    G.player.shirtColorIdx = cc.shirtColorIdx;
    G.player.pantsStyle    = AvatarGen.PANTS_STYLES[cc.pantsStyleIdx];
    G.player.pantsColorIdx = cc.pantsColorIdx;
    G.player.shoeColorIdx  = cc.shoeColorIdx;
    G.player.accessory     = ALL_ACCESSORIES[cc.accIdx];
    G.player.technical     = cc.technical;
    G.player.communication = cc.communication;
    G.player.reliability   = cc.reliability;

    // Tutorial toggle
    var tutorialCheckbox = document.getElementById('create-tutorial-toggle');
    G.tutorialEnabled = tutorialCheckbox && tutorialCheckbox.checked;
    G.tutorialStep = 0;
    G.tutorialComplete = !G.tutorialEnabled;

    generatePipelineLeads(true);
    initMarket();

    addLog('Day 1 (MON) \u2014 ' + playerName + ' quit their job. $500 in the bank. Let\'s build ' + companyName + '.', 'info');

    saveGame();
    showScreen('screen-game');
    UI.renderAll();

    // Show tutorial after a short delay so the game screen renders first
    if (G.tutorialEnabled) {
      setTimeout(function() { UI.showTutorial(); }, 400);
    }
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
