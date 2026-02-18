/**
 * © Leohoca — Të gjitha të drejtat e rezervuara.
 * Mbrojtje bazë: sağ tık, F12, Ctrl+U bloklanır.
 */
(function() {
  'use strict';
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) e.preventDefault();
  });
})();
