/* ============================================
   main.js — Game Init, Screen Management
   Character creation on new game.
   ============================================ */

(function() {

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
  }

  function startGameWithCharacter() {
    var nameInput = document.getElementById('create-player-name');
    var compInput = document.getElementById('create-company-name');
    var genderSelect = document.getElementById('create-gender');

    var playerName = (nameInput.value || '').trim() || 'Founder';
    var companyName = (compInput.value || '').trim() || 'My Startup';
    var gender = genderSelect ? genderSelect.value : 'male';

    G = createDefaultState();
    deleteSave();

    G.player.name = playerName;
    G.player.companyName = companyName;
    G.player.gender = gender;

    generatePipelineLeads(true); // Guarantee startable project on day 1
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
