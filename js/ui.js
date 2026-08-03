function getRoadSVG(n,e,s,w){
  const road = '#5f6470';
  const line = '#7d828d';
  let shapes = `<rect x="34" y="34" width="32" height="32" fill="${road}"/>`;
  if(n) shapes += `<rect x="34" y="0" width="32" height="50" fill="${road}"/>`;
  if(s) shapes += `<rect x="34" y="50" width="32" height="50" fill="${road}"/>`;
  if(e) shapes += `<rect x="50" y="34" width="50" height="32" fill="${road}"/>`;
  if(w) shapes += `<rect x="0" y="34" width="50" height="32" fill="${road}"/>`;
  if(n) shapes += `<rect x="48.5" y="0" width="3" height="50" fill="${line}"/>`;
  if(s) shapes += `<rect x="48.5" y="50" width="3" height="50" fill="${line}"/>`;
  if(e) shapes += `<rect x="50" y="48.5" width="50" height="3" fill="${line}"/>`;
  if(w) shapes += `<rect x="0" y="48.5" width="50" height="3" fill="${line}"/>`;
  return `<svg viewBox="0 0 100 100" style="position:absolute;top:0;left:0;width:100%;height:100%;">${shapes}</svg>`;
}


function fitGridTileSize(){
  const gridcol = document.querySelector('.gridcol');
  const grid = document.getElementById('grid');
  const availableWidth = gridcol.clientWidth;
  if(availableWidth<=0) return;
  const gapPx = 2, paddingPx = 16;
  const maxTileFromWidth = Math.floor((availableWidth - paddingPx - (COLS-1)*gapPx) / COLS);
  const tileSize = Math.max(14, Math.min(maxTileFromWidth, 48));
  grid.style.gridTemplateColumns = `repeat(${COLS}, ${tileSize}px)`;
  grid.style.gridTemplateRows = `repeat(${ROWS}, ${tileSize}px)`;
  grid.style.setProperty('--tile-size', tileSize+'px');
}


function triggerImportFilePicker(){
  const input = document.getElementById('loadFileInput');
  input.value = '';
  input.click();
}


function handleImportFile(fileList){
  const file = fileList && fileList[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const state = JSON.parse(e.target.result);
      importGameState(state);
    } catch(err){
      addLog('❌ Gagal membaca file save (format JSON tidak valid).', 'err');
    }
  };
  reader.readAsText(file);
}


function showWinBanner(){
  const banner = document.getElementById('winBanner');
  const pop = computePopulation();
  const goldStr = gold.toLocaleString('id-ID');
  const popStr = pop.cap.toLocaleString('id-ID');
  banner.innerHTML = `Selamat, Balai Kota Sudah Sempurna🏆<br>Anda Menang dengan Emas ${goldStr} dan Populasi Maksimal ${popStr}.`;
  banner.style.display = 'block';
  addLog(`🏆 KOTA MENANG! Emas ${goldStr}, Populasi Maksimal ${popStr}.`, 'sale');
}


function openDisconnectModal(hubIndex, hubRoutes){
  const modal = document.getElementById('disconnectModal');
  const desc = document.getElementById('disconnectModalDesc');
  const btnsWrap = document.getElementById('disconnectModalBtns');
  const hubTile = tiles[hubIndex];
  const hubName = `${BUILDINGS[hubTile.building].name}${hubTile.buildingSeq?' #'+hubTile.buildingSeq:''}`;
  desc.textContent = `Rute aktif lewat ${hubName}. Klik salah satu untuk memutusnya.`;
  btnsWrap.innerHTML = '';
  hubRoutes.forEach(r=>{
    const oTile = tiles[r.origin];
    const dTile = tiles[r.dest];
    const oName = oTile.building ? `${BUILDINGS[oTile.building].name}${oTile.buildingSeq?' #'+oTile.buildingSeq:''}` : '?';
    const dName = dTile.building ? `${BUILDINGS[dTile.building].name}${dTile.buildingSeq?' #'+dTile.buildingSeq:''}` : '?';
    const chainNote = r.hubs.length>1 ? ` (rantai ${r.hubs.length} Kargo)` : '';
    const btn = document.createElement('button');
    btn.className = 'toolbtn';
    btn.textContent = `✂️ ${oName} → ${dName}${chainNote}`;
    btn.onclick = function(){
      routes = routes.filter(x=>x!==r);
      addLog(`✂️ Rute diputus: ${oName} → ${dName}.`, 'err');
      closeDisconnectModal();
      renderGrid();
      if(currentDetailTile===hubIndex) renderDetail(hubIndex);
    };
    btnsWrap.appendChild(btn);
  });
  modal.style.display = 'flex';
}


function closeDisconnectModal(){
  document.getElementById('disconnectModal').style.display = 'none';
}


function addLog(msg, type){
  const now = new Date();
  const ts = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  logEntries.unshift({msg, type:type||'', ts});
  if(logEntries.length>30) logEntries.pop();
  const el = document.getElementById('log');
  el.innerHTML = logEntries.slice(0,12).map(e=>`<div class="entry ${e.type}"><span class="ts">${e.ts}</span> ${e.msg}</div>`).join('');
  if(type==='err') showAlert(msg);
}


let toastTimer;

function showAlert(msg){
  const toast = document.getElementById('toast');
  toast.textContent = `⚠️ ${msg}`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove('show'), 2800);
}


function buildToolbar(){
  const tb = document.getElementById('toolbar');
  tb.innerHTML='';

  const select = document.createElement('select');
  select.id = 'buildSelect';
  select.onchange = function(){
    if(selectedTool && BUILDINGS[selectedTool]){
      selectedTool = select.value;
      highlightActiveTool();
    }
    renderBuildPreview(select.value);
    currentDetailTile = null;
  };
  tb.appendChild(select);

  const buildBtn = document.createElement('button');
  buildBtn.className = 'toolbtn';
  buildBtn.id = 'buildBtn';
  buildBtn.textContent = 'Bangun';
  buildBtn.onclick = function(){
    const opt = select.options[select.selectedIndex];
    if(!opt || opt.disabled){ addLog('Bangunan ini masih terkunci — bangun dulu prasyaratnya.', 'err'); return; }
    selectedTool = (selectedTool===select.value) ? null : select.value;
    highlightActiveTool();
  };
  tb.appendChild(buildBtn);

  const view = document.createElement('button');
  view.className = 'toolbtn';
  view.id = 'viewBtn';
  view.textContent = '🔍 Lihat';
  view.onclick = function(){ selectedTool = (selectedTool==='view') ? null : 'view'; highlightActiveTool(); };
  tb.appendChild(view);

  const up = document.createElement('button');
  up.className = 'toolbtn';
  up.id = 'upgradeBtn';
  up.textContent = '⬆️ Upgrade';
  up.onclick = function(){ selectedTool = (selectedTool==='upgrade') ? null : 'upgrade'; highlightActiveTool(); };
  tb.appendChild(up);

  const dem = document.createElement('button');
  dem.className = 'toolbtn demolish';
  dem.id = 'demolishBtn';
  dem.textContent = '✖️ Bongkar';
  dem.onclick = function(){ selectedTool = (selectedTool==='demolish') ? null : 'demolish'; highlightActiveTool(); };
  tb.appendChild(dem);

  const conn = document.createElement('button');
  conn.className = 'toolbtn';
  conn.id = 'connectBtn';
  conn.textContent = '🔗 Hubungkan';
  conn.onclick = function(){
    if(selectedTool==='connect'){ selectedTool = null; }
    else { selectedTool = 'connect'; connectChain = []; }
    highlightActiveTool();
  };
  tb.appendChild(conn);

  const disc = document.createElement('button');
  disc.className = 'toolbtn';
  disc.id = 'disconnectBtn';
  disc.textContent = '✂️ Putuskan';
  disc.onclick = function(){
    selectedTool = (selectedTool==='disconnect') ? null : 'disconnect';
    highlightActiveTool();
  };
  tb.appendChild(disc);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'toolbtn';
  saveBtn.id = 'saveBtn';
  saveBtn.textContent = '💾 Simpan';
  saveBtn.onclick = function(){ exportGameState(); };
  tb.appendChild(saveBtn);

  const loadBtn = document.createElement('button');
  loadBtn.className = 'toolbtn';
  loadBtn.id = 'loadBtn';
  loadBtn.textContent = '📂 Muat';
  loadBtn.onclick = function(){ triggerImportFilePicker(); };
  tb.appendChild(loadBtn);

  const restartBtn = document.createElement('button');
  restartBtn.className = 'toolbtn';
  restartBtn.id = 'restartBtn';
  restartBtn.textContent = '↺ Restart';
  restartBtn.onclick = function(){ document.getElementById('sizeModal').style.display = 'flex'; };
  tb.appendChild(restartBtn);

  refreshBuildOptions();
}


function refreshBuildOptions(){
  const select = document.getElementById('buildSelect');
  if(!select) return;
  const prevValue = select.value;
  select.innerHTML = '';
  const groupMap = {};
  for(const g of BUILD_GROUP_ORDER) groupMap[g] = [];
  for(const key in BUILDINGS){
    groupMap[buildGroupOf(BUILDINGS[key])].push(key);
  }
  for(const g of BUILD_GROUP_ORDER){
    groupMap[g].sort((a,b)=>BUILDINGS[a].cost-BUILDINGS[b].cost);
  }
  for(const g of BUILD_GROUP_ORDER){
    if(groupMap[g].length===0) continue;
    const optgroup = document.createElement('optgroup');
    optgroup.label = g;
    for(const key of groupMap[g]){
      const def = BUILDINGS[key];
      const opt = document.createElement('option');
      opt.value = key;
      const atMax = isAtMaxCount(key);
      const missing = getMissingPrerequisites(key);
      if(atMax){
        opt.textContent = `🔒 ${def.name} — sudah dibangun (maks ${MAX_BUILDING_COUNT[key]})`;
        opt.disabled = true;
      } else if(missing.length===0){
        opt.textContent = `${def.icon} ${def.name} — ${def.cost} emas`;
      } else {
        opt.textContent = `🔒 ${def.name} — perlu ${missing.map(k=>BUILDINGS[k].name).join(', ')}`;
        opt.disabled = true;
      }
      optgroup.appendChild(opt);
    }
    select.appendChild(optgroup);
  }
  const stillValid = Array.from(select.options).some(o=>o.value===prevValue);
  if(stillValid) select.value = prevValue;
}


function highlightActiveTool(){
  document.querySelectorAll('.toolbtn').forEach(b=>b.classList.remove('active'));
  if(selectedTool==='view') document.getElementById('viewBtn').classList.add('active');
  else if(selectedTool==='upgrade') document.getElementById('upgradeBtn').classList.add('active');
  else if(selectedTool==='demolish') document.getElementById('demolishBtn').classList.add('active');
  else if(selectedTool==='connect') document.getElementById('connectBtn').classList.add('active');
  else if(selectedTool==='disconnect') document.getElementById('disconnectBtn').classList.add('active');
  else if(selectedTool && BUILDINGS[selectedTool]) document.getElementById('buildBtn').classList.add('active');
}



function renderBuildPreview(buildingKey){
  const panel = document.getElementById('detailPanel');
  const def = BUILDINGS[buildingKey];
  if(!def){ panel.textContent = 'Pilih alat Lihat, lalu klik bangunan di peta.'; return; }
  if(def.category==='cityhall'){
    panel.innerHTML = `<b style="color:var(--text)">${def.icon} ${def.name}</b><br>Menyimpan sumber daya sebagai syarat naik level Rumah, diambil dari jaringan sebelum diekspor.<br>Biaya: ${def.cost} emas`;
    return;
  }
  let html = `<b style="color:var(--text)">${def.icon} ${def.name}</b><br>Biaya: ${def.cost} emas`;
  if(def.terrain && def.terrain.length===1 && def.terrain[0]!=='grass'){
    html += `<br>Lahan: ${TERRAIN_NAME[def.terrain[0]]}`;
  }
  if(def.category==='extractor'){
    html += `<br>Menghasilkan ${def.rate} ${RESOURCE_LABEL[def.resource]}/putaran (Lv1), kapasitas ${def.cap}.`;
    html += `<br>Harga ekspor: ${PRICES[def.resource]} emas/unit.`;
    html += `<br>Menurunkan level Rumah -1 dalam radius 2 petak.`;
  } else if(def.category==='processor'){
    const inputDesc = Object.keys(def.inputs).map(k=>`${def.inputs[k]} ${RESOURCE_LABEL[k]}`).join(' + ');
    html += `<br>Resep: ${inputDesc} &rarr; ${def.produceRate} ${RESOURCE_LABEL[def.output]} (Lv1), kapasitas ${def.cap}.`;
    html += `<br>Harga ekspor: ${PRICES[def.output]} emas/unit.`;
    html += `<br>Menurunkan level Rumah -1 dalam radius 2 petak.`;
  } else if(def.category==='port'){
    if(def.fixedCapacity){
      html += `<br>Mengekspor bahan mentah maupun hasil olahan jadi emas`;
    } else {
      const priceDesc = def.sellMultiplier && def.sellMultiplier!==1 ? ` Harga jual ${Math.round((def.sellMultiplier-1)*100)}% lebih tinggi dari harga dasar.` : '';
      html += `<br>Mengekspor bahan mentah maupun hasil olahan jadi emas, kapasitas ${PORT_CAPACITY} unit/putaran (Lv1), naik ${PORT_CAPACITY}/level saat upgrade.${priceDesc}`;
    }
    html += `<br>Menurunkan level Rumah -1 dalam radius 1 petak.`;
  } else if(def.category==='relay'){
    html += `<br>Menghubungkan rute pasokan lewat alat 🔗 Hubungkan.`;
    html += `<br>Jangkauan ${SUPPLY_REACH_PER_LEVEL} petak jalan × level, kuota rute maksimal = level.`;
  } else if(def.category==='amenity_radius' || def.category==='amenity_road'){
    const am = AMENITIES.find(a=>a.key===buildingKey);
    const desc = am.type==='radius' ? `radius ${am.value} petak (8 arah)` : `jarak hingga ${am.value} Jalan lewat jaringan jalan`;
    html += `<br>Menaikkan level Rumah +1 dalam ${desc}.`;
    const negEffect = NEGATIVE_EFFECTS.find(neg=>neg.match(buildingKey) && neg.onlyKey===buildingKey);
    if(negEffect){
      html += `<br>Menurunkan level Rumah -1 dalam radius ${negEffect.radius} petak (efek keramaian).`;
    }
  } else if(def.category==='house'){
    html += `<br>Menambah populasi kota.<br>Levelnya naik otomatis jika bahan pendukung dan prasarana perumahan terpenuhi; turun otomatis jika dekat bangunan industri.`;
  } else if(def.category==='road'){
    html += `<br>Menyambungkan jaringan bangunan, dan menentukan jangkauan Kargo/amenity.`;
  }
  panel.innerHTML = html;
}


function renderDetail(i){
  const panel = document.getElementById('detailPanel');
  if(i==null){
    panel.textContent = 'Pilih alat Lihat, lalu klik bangunan di peta.';
    return;
  }
  const tile = tiles[i];
  if(!tile.building){
    const buildable = Object.keys(BUILDINGS)
      .filter(k=>BUILDINGS[k].terrain.includes(tile.terrain))
      .map(k=>BUILDINGS[k].name);
    let list;
    if(buildable.length===0) list = 'tidak ada bangunan yang cocok';
    else if(buildable.length===1) list = buildable[0];
    else list = buildable.slice(0,-1).join(', ') + ' dan ' + buildable[buildable.length-1];
    panel.innerHTML = `${TERRAIN_NAME[tile.terrain]}: Lahan kosong<br>Dapat dibangun: ${list}`;
    return;
  }
  const def = BUILDINGS[tile.building];
  const level = tile.level||1;
  const maxLv = getMaxLevel(tile.building);
  const eff = getEffective(tile);
  const hdef = def.category==='house' ? HOUSE_LEVELS[level-1] : null;
  const headerIcon = hdef ? hdef.icon : def.icon;
  const headerName = hdef ? hdef.name : def.name;
  const seqLabel = tile.buildingSeq ? ` #${tile.buildingSeq}` : '';
  let html = `<b style="color:var(--text)">${headerIcon} ${headerName}${seqLabel}</b> <span style="color:var(--gold)">Lv${level}</span><br>`;
  if(def.category==='extractor'){
    const isOperating = tile.buffer < eff.cap;
    html += `${isOperating ? 'Beroperasi' : 'Tidak Beroperasi'}: ${tile.buffer}/${eff.cap}<br>Menghasilkan ${eff.rate} ${RESOURCE_LABEL[def.resource]}/putaran<br>Harga ekspor: ${PRICES[def.resource]} emas/unit`;
  } else if(def.category==='processor'){
    const keys = Object.keys(eff.inputs);
    const avail = {};
    for(const k of keys){
      avail[k] = tile.inputStatus && tile.inputStatus[k]!==undefined
        ? tile.inputStatus[k]
        : checkInputAvailability(i, k, eff.inputs[k]);
    }
    const isOperating = tile.wasOperating!==undefined ? tile.wasOperating : (keys.every(k=>avail[k]) && tile.buffer<eff.cap);
    const inputDesc = keys.map(k=>`${eff.inputs[k]} ${RESOURCE_LABEL[k]} ${avail[k] ? 'Tersedia' : 'Tidak Tersedia'}`).join(' + ');
    html += `${isOperating ? 'Beroperasi' : 'Tidak Beroperasi'}: ${tile.buffer}/${eff.cap}<br>Menghasilkan ${eff.produceRate} ${RESOURCE_LABEL[def.output]}/putaran<br>Kebutuhan: ${inputDesc}<br>Harga ekspor: ${PRICES[def.output]} emas/unit`;
  } else if(def.category==='port'){
    const priceNote = eff.sellMultiplier!==1 ? ` (harga jual +${Math.round((eff.sellMultiplier-1)*100)}%)` : '';
    html += `Kapasitas: ${eff.capacity} unit/putaran${priceNote}`;
  } else if(def.category==='house'){
    const desiredLv = computeDesiredHouseLevel(i);
    html += `Menambah populasi kota: +${eff.pop}<br><br>`;
    const saranaIcons = LEVEL_GATES.filter(g=>level>=g.level).map(g=>{
      const pk = getProducerKey(g.resKey);
      return pk ? BUILDINGS[pk].icon : '';
    }).join(' ');
    html += `Sarana Pendukung: ${saranaIcons || '–'}<br>`;
    const prasaranaPosIcons = AMENITIES.filter(am=>isAmenitySatisfied(i, am)).map(am=>BUILDINGS[am.key].icon).join(' ');
    html += `Prasarana Pendukung: ${prasaranaPosIcons || '–'}<br>`;
    const prasaranaNegIcons = NEGATIVE_EFFECTS.filter(neg=>isNegativeEffectActive(i, neg)).map(neg=>neg.icon).join(' ');
    html += `Prasarana Penghambat: ${prasaranaNegIcons || '–'}`;
    if(desiredLv>level){
      const nextGate = LEVEL_GATES.find(g=>g.level===level+1);
      const gateLabel = nextGate ? RESOURCE_LABEL[nextGate.resKey] : '?';
      const st = nextGate ? cityhallStats[nextGate.resKey] : {stock:0,used:0,waiting:0};
      html += `<br><br>Menurut syarat di atas, level seharusnya Lv${desiredLv}, tapi tertahan di Lv${level} karena stok ${gateLabel} di Balai Kota belum cukup (stok kota: ${st.stock}, sudah dipakai: ${st.used}, menunggu: ${st.waiting}).`;
    } else if(level>=MAX_HOUSE_LEVEL){
      html += `<br><br>Sudah level maksimal (Lv${MAX_HOUSE_LEVEL}).`;
    }
  } else if(def.category==='cityhall'){
    html += `Stok:`;
    const allGateResources = Object.keys(CITYHALL_UNLOCK).sort((a,b)=>CITYHALL_UNLOCK[a]-CITYHALL_UNLOCK[b]);
    allGateResources.forEach((resKey, idx)=>{
      const label = RESOURCE_LABEL[resKey];
      const unlockLv = CITYHALL_UNLOCK[resKey];
      const cap = getCityhallCap(level, resKey);
      const stored = (tile.store && tile.store[resKey]) || 0;
      html += `<br>${idx+1}. ${label}: ${cap<=0 ? `belum bisa menyimpan (butuh Balai Kota Lv${unlockLv})` : `${stored}/${cap} tersimpan`}`;
    });
    if(level>=maxLv){
      html += `<br>🏆 Balai Kota ini sudah Level ${maxLv} — kota MENANG!`;
    } else if(level<maxLv){
      const gateRes = getLevelGateResource(level);
      let stockLine = '';
      if(gateRes){
        const capNow = getCityhallCap(level, gateRes);
        const stockNow = (tile.store && tile.store[gateRes]) || 0;
        stockLine = `<br>Stok ${RESOURCE_LABEL[gateRes]} Penuh: ${stockNow}/${capNow} (${stockNow>=capNow ? 'terpenuhi' : 'belum terpenuhi'})`;
      }
      html += `<br><br>Untuk upgrade ke Lv${level+1}:<br>Perlu minimal 1 Rumah Lv${level} di kota (${hasHouseAtLevel(level) ? 'terpenuhi' : 'belum'}).${stockLine}`;
    }
  } else if(def.category==='relay'){
    const hubRoutes = routes.filter(r=>r.hubs.includes(i));
    html += `Jangkauan menghubungkan: ${getHubReach(tile)} petak jalan (dari sini ke titik sebelumnya/berikutnya di rantai).<br>Kuota rute: ${hubRoutes.length}/${level} (maksimal = level Kargo).<br>Gunakan alat 🔗 Hubungkan: klik bangunan asal → klik satu atau beberapa Kargo berturutan → klik bangunan tujuan.`;
    if(hubRoutes.length===0){
      html += `<br><br>Belum ada rute lewat Kargo ini.`;
    } else {
      html += `<br><br>Rute aktif (${hubRoutes.length}/${level}):`;
      hubRoutes.forEach((r,idx)=>{
        const oTile = tiles[r.origin];
        const dTile = tiles[r.dest];
        const oName = oTile.building ? `${BUILDINGS[oTile.building].name}${oTile.buildingSeq?' #'+oTile.buildingSeq:''}` : '?';
        const dName = dTile.building ? `${BUILDINGS[dTile.building].name}${dTile.buildingSeq?' #'+dTile.buildingSeq:''}` : '?';
        const chainNote = r.hubs.length>1 ? ` (rantai ${r.hubs.length} Kargo)` : '';
        html += `<br>${idx+1}. ${oName} → ${dName}${chainNote}`;
      });
    }
  } else if(def.category==='amenity_radius' || def.category==='amenity_road'){
    const am = AMENITIES.find(a=>a.key===tile.building);
    html += `Aktif melayani Rumah di sekitarnya.`;
  } else if(def.category==='road'){
    html += `Menyambungkan jaringan, tidak memproduksi apa pun.`;
  }
  if(def.category!=='road' && def.category!=='house' && def.category!=='amenity_radius' && def.category!=='amenity_road'){
    if(level<maxLv){
      html += `<br>Biaya upgrade ke Lv${level+1}: ${def.cost*level} emas + ${getBasePopulation(tile.building)} populasi`;
    } else if(!(def.category==='cityhall' && level>=maxLv)){
      html += `<br>Sudah level maksimal (Lv${maxLv}).`;
    }
  }
  const comp = compCache[i];
  const networkSize = compCache.filter(c=>c===comp).length;
  if(networkSize<=1){
    html += `<br>Status: belum tersambung ke bangunan lain.`;
  } else {
    html += `<br>Jaringan: tersambung dengan ${networkSize-1} petak lain (total ${networkSize} petak).`;
  }
  panel.innerHTML = html;
}


function hasAdjacentRoad(i){
  const r = Math.floor(i/COLS), c = i%COLS;
  const dirs = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
  for(const [nr,nc] of dirs){
    if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
    const ni = nr*COLS+nc;
    if(tiles[ni].building==='road') return true;
  }
  return false;
}


function onTileClick(i){
  const tile = tiles[i];
  if(!selectedTool) return;
  if(selectedTool==='view'){
    currentDetailTile = i;
    renderDetail(i);
    return;
  }
  if(selectedTool==='connect'){
    if(!tile.building){ addLog('Petak ini tidak ada bangunan.', 'err'); return; }
    const cat = BUILDINGS[tile.building].category;
    if(connectChain.length>0 && connectChain.includes(i)){
      addLog(`${BUILDINGS[tile.building].name} sudah dipakai di rantai ini — asal dan tujuan (atau Kargo) tidak boleh sama. Batal, mulai ulang.`, 'err');
      connectChain = [];
      return;
    }
    if(connectChain.length===0){
      if(!['extractor','processor','relay'].includes(cat)){
        addLog('Bangunan asal harus penghasil, pabrik pengolah, atau Kargo.', 'err');
        return;
      }
      connectChain = [i];
      addLog(`Asal: ${BUILDINGS[tile.building].name}${tile.buildingSeq?' #'+tile.buildingSeq:''}. Sekarang pilih Kargo penghubung.`, 'sale');
      return;
    }
    const prevIdx = connectChain[connectChain.length-1];
    if(cat==='relay'){
      const hubLevel = tile.level||1;
      const currentRoutes = routes.filter(r=>r.hubs.includes(i)).length;
      if(currentRoutes >= hubLevel){
        addLog(`Kargo ini sudah maksimal (${currentRoutes}/${hubLevel} rute). Upgrade Kargo atau bongkar salah satu rutenya dulu.`, 'err');
        connectChain = [];
        return;
      }
      const hubReach = getHubReach(tile);
      if(!isWithinReach(i, prevIdx, hubReach)){
        addLog(`Bangunan sebelumnya di luar jangkauan Kargo ini (${hubReach} petak jalan). Batal, mulai ulang.`, 'err');
        connectChain = [];
        return;
      }
      connectChain.push(i);
      addLog(`Kargo${tile.buildingSeq?' #'+tile.buildingSeq:''} ditambahkan ke rantai (posisi ke-${connectChain.length-1}). Pilih Kargo lain untuk memperpanjang jangkauan, atau bangunan tujuan.`, 'sale');
      return;
    }
    if(connectChain.length<2){
      addLog('Butuh minimal 1 Kargo penghubung sebelum memilih bangunan tujuan.', 'err');
      connectChain = [];
      return;
    }
    if(!['processor','port','cityhall'].includes(cat)){
      addLog('Bangunan tujuan harus pabrik pengolah, Pelabuhan, atau Balai Kota.', 'err');
      connectChain = [];
      return;
    }
    const lastHubTile = tiles[prevIdx];
    const lastHubReach = getHubReach(lastHubTile);
    if(!isWithinReach(prevIdx, i, lastHubReach)){
      addLog(`Bangunan tujuan di luar jangkauan Kargo terakhir (${lastHubReach} petak jalan). Batal, mulai ulang.`, 'err');
      connectChain = [];
      return;
    }
    const originIdx = connectChain[0];
    const hubsUsed = connectChain.slice(1);
    routes.push({origin: originIdx, hubs: hubsUsed, dest: i});
    const originTile = tiles[originIdx];
    const oName = `${BUILDINGS[originTile.building].name}${originTile.buildingSeq?' #'+originTile.buildingSeq:''}`;
    const dName = `${BUILDINGS[tile.building].name}${tile.buildingSeq?' #'+tile.buildingSeq:''}`;
    addLog(`🔗 Rute tersambung: ${oName} → ${dName} lewat ${hubsUsed.length} Kargo.`, 'sale');
    connectChain = [];
    renderGrid();
    return;
  }
  if(selectedTool==='disconnect'){
    if(!tile.building){ addLog('Petak ini tidak ada bangunan.', 'err'); return; }
    if(BUILDINGS[tile.building].category!=='relay'){
      addLog('Pilih petak Kargo untuk melihat rute yang lewat situ.', 'err');
      return;
    }
    const hubRoutes = routes.filter(r=>r.hubs.includes(i));
    if(hubRoutes.length===0){
      addLog(`${BUILDINGS[tile.building].name}${tile.buildingSeq?' #'+tile.buildingSeq:''} belum punya rute aktif.`, 'err');
      return;
    }
    openDisconnectModal(i, hubRoutes);
    return;
  }
  if(selectedTool==='upgrade'){
    if(!tile.building){ addLog('Tidak ada bangunan untuk di-upgrade.', 'err'); return; }
    if(tile.building==='road'){ addLog('Jalan tidak bisa di-upgrade.', 'err'); return; }
    if(tile.building==='house'){ addLog('Level Rumah naik otomatis dari lingkungan (Taman/Sutet/Pemancar/Sekolah/Rumah Sakit/Halte), bukan lewat Upgrade.', 'err'); return; }
    if(['amenity_radius','amenity_road'].includes(BUILDINGS[tile.building].category)){ addLog(`${BUILDINGS[tile.building].name} belum memiliki efek upgrade.`, 'err'); return; }
    const level = tile.level||1;
    const maxLv = getMaxLevel(tile.building);
    if(level>=maxLv){ addLog(`Bangunan sudah level maksimal (Lv${maxLv}).`, 'err'); return; }
    if(tile.building==='cityhall' && !hasHouseAtLevel(level)){
      addLog(`Butuh minimal 1 Rumah Lv${level} di kota untuk upgrade Balai Kota ke Lv${level+1}.`, 'err');
      return;
    }
    if(tile.building==='cityhall'){
      const gateRes = getLevelGateResource(level);
      if(gateRes){
        const capNow = getCityhallCap(level, gateRes);
        const stockNow = (tile.store && tile.store[gateRes]) || 0;
        if(stockNow < capNow){
          addLog(`Stok ${RESOURCE_LABEL[gateRes]} di Balai Kota ini belum penuh (${stockNow}/${capNow}) — harus penuh dulu sebelum upgrade ke Lv${level+1}.`, 'err');
          return;
        }
      }
    }
    const pop = computePopulation();
    const base = getBasePopulation(tile.building);
    if(pop.used+base > pop.cap){ addLog(`Populasi tidak cukup untuk upgrade (butuh ${base}, tersisa ${pop.cap-pop.used}). Bangun Rumah dulu.`, 'err'); return; }
    const def = BUILDINGS[tile.building];
    const cost = def.cost*level;
    if(gold<cost){ addLog(`Emas tidak cukup untuk upgrade (butuh ${cost}).`, 'err'); return; }
    gold -= cost;
    tile.level = level+1;
    addLog(`${def.name} naik ke level ${tile.level}.`, 'sale');
    if(!hasWon && tile.building==='cityhall' && tile.level>=getMaxLevel('cityhall')){
      hasWon = true;
      showWinBanner();
    }
    currentDetailTile = i;
    renderGrid(); updateHUD(); renderDetail(i);
    return;
  }
  if(selectedTool==='demolish'){
    if(!tile.building){ addLog('Tidak ada bangunan di petak ini.', 'err'); return; }
    const refund = Math.floor(BUILDINGS[tile.building].cost*0.5);
    gold += refund;
    addLog(`Membongkar ${BUILDINGS[tile.building].name}, kembali ${refund} emas.`);
    tile.building=null; tile.buffer=0; tile.level=1; tile.store=null; tile.houseSeq=null; tile.buildingSeq=null;
    routes = routes.filter(r=>r.origin!==i && !r.hubs.includes(i) && r.dest!==i);
    compCache = computeComponents();
    updateHouseLevels();
    refreshBuildOptions();
    if(currentDetailTile===i) renderDetail(i);
    renderGrid(); updateHUD();
    return;
  }
  const def = BUILDINGS[selectedTool];
  if(tile.building){ addLog('Petak sudah terisi bangunan.', 'err'); return; }
  if(isAtMaxCount(selectedTool)){
    addLog(`${def.name} sudah dibangun (maksimal ${MAX_BUILDING_COUNT[selectedTool]}).`, 'err');
    return;
  }
  const missingPrereq = getMissingPrerequisites(selectedTool);
  if(missingPrereq.length>0){
    addLog(`Butuh ${missingPrereq.map(k=>BUILDINGS[k].name).join(', ')} dulu sebelum bisa membangun ${def.name}.`, 'err');
    return;
  }
  if(!def.terrain.includes(tile.terrain)){ addLog(`${def.name} tidak bisa dibangun di lahan ini.`, 'err'); return; }
  if(def.category!=='road' && !hasAdjacentRoad(i)){
    addLog('Butuh Jalan di sisi horizontal/vertikal untuk membangun di sini.', 'err');
    return;
  }
  if(def.category!=='road' && def.category!=='house'){
    const pop = computePopulation();
    const base = getBasePopulation(selectedTool);
    if(pop.used+base > pop.cap){ addLog(`Populasi tidak cukup (butuh ${base}, tersisa ${pop.cap-pop.used}). Bangun Rumah dulu.`, 'err'); return; }
  }
  if(gold < def.cost){ addLog('Emas tidak cukup.', 'err'); return; }
  gold -= def.cost;
  tile.building = selectedTool;
  tile.buffer = 0;
  tile.level = 1;
  if(selectedTool!=='road'){
    buildingTypeCounters[selectedTool] = (buildingTypeCounters[selectedTool]||0) + 1;
    tile.buildingSeq = buildingTypeCounters[selectedTool];
  }
  if(selectedTool==='cityhall'){ tile.store = {}; }
  if(selectedTool==='house'){ tile.houseSeq = ++houseBuildCounter; }
  addLog(`Membangun ${def.name}${tile.buildingSeq ? ' #'+tile.buildingSeq : ''}.`);
  compCache = computeComponents();
  updateHouseLevels();
  refreshBuildOptions();
  if(currentDetailTile===i) renderDetail(i);
  renderGrid(); updateHUD();
}


function renderGrid(){
  const grid = document.getElementById('grid');
  grid.innerHTML='';
  for(let i=0;i<ROWS*COLS;i++){
    const tile = tiles[i];
    const div = document.createElement('div');
    div.className='tile';
    div.style.background = TERRAIN_COLOR[tile.terrain];
    let icon = TERRAIN_ICON[tile.terrain];
    let title = tile.terrain;
    let badge = '';
    let lvbadge = '';
    if(tile.building){
      const def = BUILDINGS[tile.building];
      icon = def.icon;
      title = def.name + (tile.buildingSeq ? ` #${tile.buildingSeq}` : '');
      if(tile.building==='road'){
        const r = Math.floor(i/COLS), c = i%COLS;
        const isRoad = (rr,cc)=> rr>=0&&rr<ROWS&&cc>=0&&cc<COLS && tiles[rr*COLS+cc].building==='road';
        icon = getRoadSVG(isRoad(r-1,c), isRoad(r,c+1), isRoad(r+1,c), isRoad(r,c-1));
      } else if(def.category==='extractor' || def.category==='processor'){
        badge = `<span class="badge">${tile.buffer}</span>`;
        title += ` — stok: ${tile.buffer}`;
      } else if(def.category==='house'){
        const lvl = tile.level||1;
        const hdef = HOUSE_LEVELS[lvl-1];
        const eff = getEffective(tile);
        icon = hdef.icon.startsWith('<svg') ? hdef.icon : `<span style="font-size:${hdef.size}px">${hdef.icon}</span>`;
        badge = `<span class="badge">+${eff.pop}</span>`;
        title = `${hdef.name} (Lv${lvl}) — populasi: +${eff.pop}`;
      } else if(def.category==='cityhall'){
        const st = tile.store||{flour:0,furniture:0,electronics:0};
        title = `${def.name}${tile.buildingSeq?' #'+tile.buildingSeq:''} — Tepung ${st.flour||0}, Furnitur ${st.furniture||0}, Elektronik ${st.electronics||0}`;
      } else if(def.category==='relay'){
        const routeCount = routes.filter(r=>r.hubs.includes(i)).length;
        badge = `<span class="badge">${routeCount}/${tile.level||1}</span>`;
        title = `${def.name}${tile.buildingSeq?' #'+tile.buildingSeq:''} — ${routeCount}/${tile.level||1} rute aktif`;
      }
      if(def.category!=='road' && def.category!=='house' && def.category!=='relay' && (tile.level||1)>1){
        lvbadge = `<span class="lvbadge">L${tile.level}</span>`;
      }
      if(compCache[i]>=0){
        div.style.borderColor = NET_COLORS[compCache[i]%NET_COLORS.length];
      }
    }
    div.title = title;
    div.innerHTML = `${icon}${badge}${lvbadge}`;
    div.onclick = ()=>onTileClick(i);
    grid.appendChild(div);
  }
}


function updateHUD(){
  document.getElementById('goldVal').textContent = gold.toLocaleString('id-ID');
  const pop = computePopulation();
  document.getElementById('popVal').textContent = `${pop.used}/${pop.cap}`;
  document.getElementById('carVal').textContent = `${getHighestCityhallLevel()}/${getMaxLevel('cityhall')}`;
}

