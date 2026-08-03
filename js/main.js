document.getElementById('sizeSmallBtn').onclick = function(){
  document.getElementById('sizeModal').style.display = 'none';
  initGame('small');
};

document.getElementById('sizeLargeBtn').onclick = function(){
  document.getElementById('sizeModal').style.display = 'none';
  initGame('large');
};

document.getElementById('sizeModalCancel').onclick = function(){
  document.getElementById('sizeModal').style.display = 'none';
};

document.getElementById('disconnectModalCancel').onclick = function(){
  closeDisconnectModal();
};

document.getElementById('loadFileInput').onchange = function(e){
  handleImportFile(e.target.files);
};


let resizeDebounce;

window.addEventListener('resize', function(){
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(fitGridTileSize, 150);
});


initGame();
