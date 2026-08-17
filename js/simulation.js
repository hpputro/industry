function applyMapSizeConfig(sizeKey){
  const key = (sizeKey==='large') ? 'large' : 'small';
  currentMapSizeKey = key;
  MAX_LEVEL_OVERRIDE = MAX_LEVEL_OVERRIDE_BY_SIZE[key];
  LEVEL_GATES = LEVEL_GATES_BY_SIZE[key];
  CITYHALL_UNLOCK = CITYHALL_UNLOCK_BY_SIZE[key];
  MAX_HOUSE_LEVEL = MAX_HOUSE_LEVEL_BY_SIZE[key];
  HOUSE_LEVELS = HOUSE_LEVELS_BY_SIZE[key];
  cityhallStats = {};
  for(const gate of LEVEL_GATES) cityhallStats[gate.resKey] = {stock:0, used:0, waiting:0};
  renderDynamicGoalInfo(key);
}


function renderDynamicGoalInfo(sizeKey){
  const el = document.getElementById('dynamicGoalInfo');
  if(!el) return;
  const maxCityhallLv = MAX_LEVEL_OVERRIDE_BY_SIZE[sizeKey].cityhall;
  const cityhallOrder = Object.keys(CITYHALL_UNLOCK_BY_SIZE[sizeKey]).sort((a,b)=>CITYHALL_UNLOCK_BY_SIZE[sizeKey][a]-CITYHALL_UNLOCK_BY_SIZE[sizeKey][b]);
  const cityhallList = cityhallOrder.map((k,idx)=>`Lv${idx+1} ${RESOURCE_LABEL[k]}`).join(', ');
  const gateList = LEVEL_GATES_BY_SIZE[sizeKey].map(g=>`Lv${g.level} ${RESOURCE_LABEL[g.resKey]}`).join(', ');
  const maxHouseLv = MAX_HOUSE_LEVEL_BY_SIZE[sizeKey];
  const popList = Array.from({length: maxHouseLv}, (_,idx)=>`Lv${idx+1}=${BUILDINGS.house.pop + HOUSE_POP_PER_LEVEL*idx}`).join(', ');
  const mapLabel = sizeKey==='large' ? 'Peta Besar' : 'Peta Kecil';
  el.innerHTML = `<b>Target ${mapLabel}:</b> menangkan permainan dengan mengupgrade Balai Kota sampai Level ${maxCityhallLv}. Urutan komoditas gerbang Balai Kota: ${cityhallList}. Rumah maksimal Level ${maxHouseLv}, urutan syarat komoditas naik level Rumah: ${gateList}. Populasi per level Rumah: ${popList}.`;
}


function getMaxLevel(buildingKey){
  return MAX_LEVEL_OVERRIDE[buildingKey] || MAX_LEVEL;
}


function hasHouseAtLevel(minLevel){
  return tiles.some(t=>t.building==='house' && (t.level||1)>=minLevel);
}


function getCarStock(){
  let sum = 0;
  for(const t of tiles){
    if(t.building==='cityhall' && t.store) sum += t.store.car||0;
  }
  return sum;
}


function getHighestCityhallLevel(){
  let max = 0;
  for(const t of tiles){
    if(t.building==='cityhall') max = Math.max(max, t.level||1);
  }
  return max;
}


function getCityhallCap(level, resKey){
  const unlock = CITYHALL_UNLOCK[resKey];
  if(level < unlock) return 0;
  return 2*level - unlock;
}


function getLevelGateResource(level){
  return Object.keys(CITYHALL_UNLOCK).find(k=>CITYHALL_UNLOCK[k]===level);
}


function levelMultiplier(level){
  return 1 + 0.5*(level-1);
}


function getEffective(tile){
  const def = BUILDINGS[tile.building];
  const level = tile.level||1;
  const mult = levelMultiplier(level);
  const eff = Object.assign({}, def);
  if(def.category==='extractor'){
    eff.rate = Math.round(def.rate*mult);
    eff.cap = Math.round(def.cap*mult);
  } else if(def.category==='processor'){
    eff.inputs = {};
    for(const key in def.inputs){
      const base = def.inputs[key];
      eff.inputs[key] = base + (level-1)*(base-1);
    }
    eff.produceRate = def.produceRate + (level-1);
    eff.cap = Math.round(def.cap*mult);
  } else if(def.category==='port'){
    eff.capacity = def.fixedCapacity || (PORT_CAPACITY * (tile.level||1));
    eff.sellMultiplier = def.sellMultiplier || 1;
  } else if(def.category==='house'){
    eff.pop = def.pop + HOUSE_POP_PER_LEVEL*((tile.level||1)-1);
  }
  return eff;
}


function getSellableType(buildingKey){
  const def = BUILDINGS[buildingKey];
  if(def.category==='extractor') return def.resource;
  if(def.category==='processor') return def.output;
  return null;
}


function checkInputAvailability(tileIndex, resKey, neededAmount){
  return findReachableProducerSum(tileIndex, resKey) >= neededAmount;
}


function findReachableOrigins(destIndex){
  const visited = new Set([destIndex]);
  const queue = [destIndex];
  while(queue.length){
    const cur = queue.pop();
    for(const route of routes){
      if(route.dest===cur && !visited.has(route.origin)){
        visited.add(route.origin);
        const originBuilding = tiles[route.origin].building;
        if(originBuilding && BUILDINGS[originBuilding].category==='relay'){
          queue.push(route.origin);
        }
      }
    }
  }
  visited.delete(destIndex);
  return visited;
}


function findReachableProducerTiles(destIndex, resKey){
  const origins = findReachableOrigins(destIndex);
  const result = [];
  for(const idx of origins){
    const b = tiles[idx].building;
    if(b && getSellableType(b)===resKey) result.push(tiles[idx]);
  }
  return result;
}


function findReachableProducerSum(destIndex, resKey){
  return findReachableProducerTiles(destIndex, resKey).reduce((a,t)=>a+t.buffer,0);
}


function getHubReach(tile){
  return SUPPLY_REACH_PER_LEVEL * (tile.level||1);
}


function isWithinReach(fromIndex, toIndex, reach){
  const dist = roadDistanceFrom(fromIndex);
  const r = Math.floor(toIndex/COLS), c = toIndex%COLS;
  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];
  for(const [dr,dc] of dirs4){
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
    const ni = nr*COLS+nc;
    if(tiles[ni].building==='road' && dist[ni]<=reach) return true;
  }
  return false;
}


function isNearAmenity(i, buildingKey, radius){
  const r = Math.floor(i/COLS), c = i%COLS;
  for(let dr=-radius;dr<=radius;dr++){
    for(let dc=-radius;dc<=radius;dc++){
      if(dr===0 && dc===0) continue;
      const nr=r+dr, nc=c+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
      const ni = nr*COLS+nc;
      if(tiles[ni].building===buildingKey) return true;
    }
  }
  return false;
}


function roadDistanceFrom(originIndex){
  const dist = new Array(ROWS*COLS).fill(Infinity);
  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];
  const r0 = Math.floor(originIndex/COLS), c0 = originIndex%COLS;
  const queue = [];
  for(const [dr,dc] of dirs4){
    const nr=r0+dr, nc=c0+dc;
    if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
    const ni = nr*COLS+nc;
    if(tiles[ni].building==='road'){ dist[ni]=1; queue.push(ni); }
  }
  let qi=0;
  while(qi<queue.length){
    const cur = queue[qi++];
    const r=Math.floor(cur/COLS), c=cur%COLS;
    for(const [dr,dc] of dirs4){
      const nr=r+dr, nc=c+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
      const ni = nr*COLS+nc;
      if(tiles[ni].building==='road' && dist[ni]===Infinity){
        dist[ni] = dist[cur]+1;
        queue.push(ni);
      }
    }
  }
  return dist;
}


function isWithinRoadDistance(houseIndex, amenityIndex, maxDist){
  const dist = roadDistanceFrom(amenityIndex);
  const r = Math.floor(houseIndex/COLS), c = houseIndex%COLS;
  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];
  for(const [dr,dc] of dirs4){
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
    const ni = nr*COLS+nc;
    if(tiles[ni].building==='road' && dist[ni]<=maxDist) return true;
  }
  return false;
}


function isNearRoadAmenity(houseIndex, buildingKey, maxDist){
  for(let j=0;j<tiles.length;j++){
    if(tiles[j].building===buildingKey && isWithinRoadDistance(houseIndex, j, maxDist)) return true;
  }
  return false;
}


function isAmenitySatisfied(houseIndex, amenity){
  if(amenity.type==='radius') return isNearAmenity(houseIndex, amenity.key, amenity.value);
  return isNearRoadAmenity(houseIndex, amenity.key, amenity.value);
}


function isNearMatchingBuilding(houseIndex, matchFn, radius){
  const r = Math.floor(houseIndex/COLS), c = houseIndex%COLS;
  for(let dr=-radius;dr<=radius;dr++){
    for(let dc=-radius;dc<=radius;dc++){
      if(dr===0 && dc===0) continue;
      const nr=r+dr, nc=c+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
      const ni = nr*COLS+nc;
      const b = tiles[ni].building;
      if(b && matchFn(b)) return true;
    }
  }
  return false;
}


function isNegativeEffectActive(houseIndex, effect){
  return isNearMatchingBuilding(houseIndex, effect.match, effect.radius);
}


function computeDesiredHouseLevel(i){
  let level = 1;
  for(const am of AMENITIES){
    if(isAmenitySatisfied(i, am)) level += 1;
  }
  for(const neg of NEGATIVE_EFFECTS){
    if(isNegativeEffectActive(i, neg)) level -= 1;
  }
  return Math.max(1, Math.min(MAX_HOUSE_LEVEL, level));
}


let cityhallStats = {};

for(const gate of LEVEL_GATES) cityhallStats[gate.resKey] = {stock:0, used:0, waiting:0};


function updateHouseLevels(){
  const houseIndices = [];
  for(let i=0;i<tiles.length;i++){
    if(tiles[i].building==='house') houseIndices.push(i);
  }
  const desired = {};
  for(const i of houseIndices) desired[i] = computeDesiredHouseLevel(i);

  const stock = {};
  for(const gate of LEVEL_GATES) stock[gate.resKey] = 0;
  for(let i=0;i<tiles.length;i++){
    if(tiles[i].building==='cityhall' && tiles[i].store){
      for(const gate of LEVEL_GATES){
        stock[gate.resKey] += tiles[i].store[gate.resKey]||0;
      }
    }
  }

  houseIndices.sort((a,b)=>(tiles[a].houseSeq||0)-(tiles[b].houseSeq||0));

  const used = {}, waiting = {};
  for(const gate of LEVEL_GATES){ used[gate.resKey]=0; waiting[gate.resKey]=0; }

  for(const i of houseIndices){
    const want = desired[i];
    let lvl = 1;
    for(const gate of LEVEL_GATES){
      if(want < gate.level) break;
      if(used[gate.resKey] < stock[gate.resKey]){
        lvl = gate.level;
        used[gate.resKey]++;
      } else {
        waiting[gate.resKey]++;
        break;
      }
    }
    tiles[i].level = lvl;
  }

  cityhallStats = {};
  for(const gate of LEVEL_GATES){
    cityhallStats[gate.resKey] = {stock:stock[gate.resKey], used:used[gate.resKey], waiting:waiting[gate.resKey]};
  }
}



function getBasePopulation(buildingKey){
  const def = BUILDINGS[buildingKey];
  if(def.category==='processor' && def.inputs){
    let sum = 0;
    for(const resKey in def.inputs){
      const producerKey = getProducerKey(resKey);
      if(producerKey) sum += getBasePopulation(producerKey);
    }
    return sum + 1;
  }
  return 1;
}

function getPopulationUsed(buildingKey, level){
  return getBasePopulation(buildingKey) + (level-1);
}

function computePopulation(){
  let cap = 0, used = 0;
  tiles.forEach(t=>{
    if(!t.building) return;
    const def = BUILDINGS[t.building];
    if(def.category==='house'){
      cap += getEffective(t).pop;
    } else if(def.category!=='road'){
      used += getPopulationUsed(t.building, t.level||1);
    }
  });
  return {cap, used};
}


let tiles, gold, selectedTool, tickHandle, logEntries, lastIncome, compCache, currentDetailTile, houseBuildCounter, hasWon, hasLost, routes, connectChain, buildingTypeCounters;


function initGame(sizeKey){
  if(sizeKey && MAP_SIZES[sizeKey]){
    const sz = MAP_SIZES[sizeKey];
    ROWS = sz.rows; COLS = sz.cols;
    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${COLS}, ${sz.tileSize}px)`;
    grid.style.gridTemplateRows = `repeat(${ROWS}, ${sz.tileSize}px)`;
    grid.style.setProperty('--tile-size', sz.tileSize+'px');
    grid.dataset.tileSize = sz.tileSize;
    document.querySelector('.wrap').classList.toggle('wide', sizeKey==='large');
  }
  applyMapSizeConfig(sizeKey);
  tiles = [];
  const terrainMap = generateTerrainMap();
  for(let i=0;i<ROWS*COLS;i++){
    tiles.push({terrain:terrainMap[i], building:null, buffer:0, level:1});
  }
  gold = 500;
  selectedTool = null;
  logEntries = [];
  lastIncome = 0;
  compCache = new Array(ROWS*COLS).fill(-1);
  currentDetailTile = null;
  houseBuildCounter = 0;
  buildingTypeCounters = {};
  hasWon = false;
  hasLost = false;
  routes = [];
  connectChain = [];
  document.getElementById('winBanner').style.display = 'none';
  document.getElementById('loseBanner').style.display = 'none';
  addLog(`Mulai membangun industri! Emas awal: 500. Peta ${ROWS*COLS} petak (${COLS}x${ROWS}).`, 'sale');
  buildToolbar();
  renderGrid();
  updateHUD();
  requestAnimationFrame(()=>{ fitGridTileSize(); setTimeout(fitGridTileSize, 60); });
  const initialSelect = document.getElementById('buildSelect');
  if(initialSelect && initialSelect.value) renderBuildPreview(initialSelect.value);
  else renderDetail(null);
  restartTicker();
}


function exportGameState(){
  const state = {
    saveVersion: 1,
    mapSizeKey: currentMapSizeKey,
    rows: ROWS,
    cols: COLS,
    gold: gold,
    tiles: tiles,
    routes: routes,
    logEntries: logEntries,
    houseBuildCounter: houseBuildCounter,
    buildingTypeCounters: buildingTypeCounters,
    hasWon: hasWon,
    hasLost: hasLost,
    lastIncome: lastIncome
  };
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const stamp = now.toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.href = url;
  a.download = `kota-industri-save-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  addLog('💾 Kota disimpan ke file. Silakan cek unduhan browser Anda.', 'sale');
}


function importGameState(state){
  if(!state || !Array.isArray(state.tiles) || typeof state.rows!=='number' || typeof state.cols!=='number'){
    addLog('❌ File save tidak valid atau rusak.', 'err');
    return;
  }
  const sizeKey = state.mapSizeKey==='large' ? 'large' : 'small';
  const sz = MAP_SIZES[sizeKey];
  ROWS = sz.rows; COLS = sz.cols;
  if(state.rows!==ROWS || state.cols!==COLS){
    addLog('❌ File save tidak cocok dengan ukuran peta yang seharusnya, dibatalkan.', 'err');
    return;
  }
  const grid = document.getElementById('grid');
  grid.style.gridTemplateColumns = `repeat(${COLS}, ${sz.tileSize}px)`;
  grid.style.gridTemplateRows = `repeat(${ROWS}, ${sz.tileSize}px)`;
  grid.style.setProperty('--tile-size', sz.tileSize+'px');
  grid.dataset.tileSize = sz.tileSize;
  document.querySelector('.wrap').classList.toggle('wide', sizeKey==='large');
  applyMapSizeConfig(sizeKey);

  tiles = state.tiles;
  gold = typeof state.gold==='number' ? state.gold : 500;
  routes = Array.isArray(state.routes) ? state.routes : [];
  logEntries = Array.isArray(state.logEntries) ? state.logEntries : [];
  houseBuildCounter = typeof state.houseBuildCounter==='number' ? state.houseBuildCounter : 0;
  buildingTypeCounters = state.buildingTypeCounters || {};
  hasWon = !!state.hasWon;
  hasLost = !!state.hasLost;
  lastIncome = typeof state.lastIncome==='number' ? state.lastIncome : 0;
  selectedTool = null;
  connectChain = [];
  currentDetailTile = null;
  compCache = new Array(ROWS*COLS).fill(-1);
  document.getElementById('winBanner').style.display = hasWon ? 'block' : 'none';
  document.getElementById('loseBanner').style.display = hasLost ? 'block' : 'none';

  addLog('📂 Kota berhasil dimuat dari file save.', 'sale');
  buildToolbar();
  renderGrid();
  updateHUD();
  requestAnimationFrame(()=>{ fitGridTileSize(); setTimeout(fitGridTileSize, 60); });
  renderDetail(null);
  restartTicker();
}


function getProducerKey(resKey){
  for(const key in BUILDINGS){
    const d = BUILDINGS[key];
    if(d.category==='extractor' && d.resource===resKey) return key;
    if(d.category==='processor' && d.output===resKey) return key;
  }
  return null;
}


function isAtMaxCount(buildingKey){
  const max = MAX_BUILDING_COUNT[buildingKey];
  if(!max) return false;
  return tiles.filter(t=>t.building===buildingKey).length >= max;
}


function getMissingPrerequisites(buildingKey){
  const def = BUILDINGS[buildingKey];
  const missing = [];

  if(buildingKey==='road'){
    return [];
  }
  if(buildingKey==='house'){
    if(!tiles.some(t=>t.building==='road')) missing.push('road');
    return missing;
  }
  if(buildingKey==='freshwater'){
    if(!tiles.some(t=>t.building==='house')) missing.push('house');
    return missing;
  }
  if(buildingKey==='relay' || (def.category==='extractor' && buildingKey!=='freshwater')){
    if(!tiles.some(t=>t.building==='freshwater')) missing.push('freshwater');
    return missing;
  }
  if(buildingKey==='bazaar'){
    if(!tiles.some(t=>t.building==='relay')) missing.push('relay');
    return missing;
  }
  if(buildingKey==='park'){
    if(!tiles.some(t=>t.building==='bazaar')) missing.push('bazaar');
    return missing;
  }
  if(buildingKey==='terminal'){
    if(!tiles.some(t=>t.building==='park')) missing.push('park');
    return missing;
  }
  if(buildingKey==='cityhall'){
    if(!tiles.some(t=>t.building==='bazaar')) missing.push('bazaar');
    return missing;
  }
  if(buildingKey==='port'){
    if(!tiles.some(t=>t.building==='cityhall')) missing.push('cityhall');
    return missing;
  }
  if(def.category==='amenity_road' && buildingKey!=='terminal'){
    if(!tiles.some(t=>t.building==='terminal')) missing.push('terminal');
    return missing;
  }
  if(def.category==='amenity_radius' && buildingKey!=='park'){
    if(!tiles.some(t=>t.building==='park')) missing.push('park');
    return missing;
  }
  if(def.category==='processor'){
    for(const resKey in def.inputs){
      const producerKey = getProducerKey(resKey);
      if(producerKey && !tiles.some(t=>t.building===producerKey) && !missing.includes(producerKey)){
        missing.push(producerKey);
      }
    }
    return missing;
  }
  return missing;
}


function buildGroupOf(def){
  if(def.category==='amenity_radius') return 'Prasarana perumahan';
  if(def.category==='amenity_road') return 'Prasarana kota';
  if(def.category==='extractor') return 'Industri mentah';
  if(def.category==='processor') return 'Industri pengolahan';
  return 'Infrastruktur dasar';
}


function computeComponents(){
  const n=ROWS*COLS;
  const comp = new Array(n).fill(-1);
  let cid=0;
  for(let i=0;i<n;i++){
    if(tiles[i].building && comp[i]===-1){
      const stack=[i];
      comp[i]=cid;
      while(stack.length){
        const cur=stack.pop();
        const curIsRoad = tiles[cur].building==='road';
        const r=Math.floor(cur/COLS), c=cur%COLS;
        const dirs=[[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
        for(const [nr,nc] of dirs){
          if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
          const ni=nr*COLS+nc;
          if(tiles[ni].building && comp[ni]===-1){
            const niIsRoad = tiles[ni].building==='road';
            if(curIsRoad || niIsRoad){
              comp[ni]=cid;
              stack.push(ni);
            }
          }
        }
      }
      cid++;
    }
  }
  return comp;
}


function tick(){
  const goldAtTickStart = gold;

  tiles.forEach(t=>{
    if(t.building && BUILDINGS[t.building].category==='extractor'){
      const eff = getEffective(t);
      t.buffer = Math.min(eff.cap, t.buffer + eff.rate);
    }
  });

  const comp = computeComponents();
  compCache = comp;

  const processorIndices = [];
  for(let i=0;i<tiles.length;i++){
    if(tiles[i].building && BUILDINGS[tiles[i].building].category==='processor') processorIndices.push(i);
  }
  processorIndices.sort((a,b)=>(PROCESS_TIER[tiles[a].building]||1)-(PROCESS_TIER[tiles[b].building]||1));

  for(const i of processorIndices){
    const t = tiles[i];
    const def = BUILDINGS[t.building];
    const eff = getEffective(t);
    if(t.buffer >= eff.cap){ t.wasOperating = false; t.inputStatus = {}; continue; }
    const inputKeys = Object.keys(def.inputs);
    const sourcesByKey = {};
    const inputStatus = {};
    let allAvailable = true;
    for(const key of inputKeys){
      const sources = findReachableProducerTiles(i, key);
      const totalAvail = sources.reduce((a,s)=>a+s.buffer,0);
      const ok = totalAvail >= eff.inputs[key];
      inputStatus[key] = ok;
      if(!ok) allAvailable = false;
      sourcesByKey[key] = sources;
    }
    t.inputStatus = inputStatus;
    t.wasOperating = allAvailable;
    if(allAvailable){
      for(const key of inputKeys){
        let remain = eff.inputs[key];
        for(const s of sourcesByKey[key]){
          if(remain<=0) break;
          const take = Math.min(s.buffer, remain);
          s.buffer -= take;
          remain -= take;
        }
      }
      t.buffer = Math.min(eff.cap, t.buffer + eff.produceRate);
    }
  }

  for(let i=0;i<tiles.length;i++){
    const t = tiles[i];
    if(!t.building || BUILDINGS[t.building].category!=='cityhall') continue;
    if(!t.store) t.store = {};
    const level = t.level||1;
    for(const resKey of Object.keys(CITYHALL_UNLOCK)){
      const cap = getCityhallCap(level, resKey);
      const room = cap - (t.store[resKey]||0);
      if(room<=0) continue;
      const sources = findReachableProducerTiles(i, resKey);
      const totalAvail = sources.reduce((a,s)=>a+s.buffer,0);
      const takeAmt = Math.min(room, totalAvail);
      if(takeAmt>0){
        let remain = takeAmt;
        for(const s of sources){
          if(remain<=0) break;
          const take = Math.min(s.buffer, remain);
          s.buffer -= take;
          remain -= take;
        }
        t.store[resKey] = (t.store[resKey]||0) + takeAmt;
      }
    }
  }

  if(!hasWon && getHighestCityhallLevel()>=getMaxLevel('cityhall')){
    hasWon = true;
    showWinBanner();
  }

  updateHouseLevels();

  let tickWages = 0;
  for(let i=0;i<tiles.length;i++){
    const t = tiles[i];
    if(!t.building) continue;
    const cat = BUILDINGS[t.building].category;
    if(cat==='road' || cat==='house') continue;
    tickWages += getPopulationUsed(t.building, t.level||1);
  }
  if(tickWages>0){
    gold -= tickWages;
    addLog(`Membayar gaji pekerja: ${tickWages} emas (populasi ${tickWages}).`);
  }

  let tickIncome = 0;
  for(let i=0;i<tiles.length;i++){
    const t = tiles[i];
    if(!t.building || BUILDINGS[t.building].category!=='port') continue;
    const eff = getEffective(t);
    let capacityLeft = eff.capacity;
    for(const resType of SELLABLE_TYPES_BY_PRICE_DESC){
      if(capacityLeft<=0) break;
      const producers = findReachableProducerTiles(i, resType);
      const totalBuf = producers.reduce((a,p)=>a+p.buffer,0);
      const sellAmt = Math.min(capacityLeft, totalBuf);
      if(sellAmt>0){
        let remain = sellAmt;
        for(const p of producers){
          if(remain<=0) break;
          const take = Math.min(p.buffer, remain);
          p.buffer -= take;
          remain -= take;
        }
        const earned = Math.round(sellAmt*PRICES[resType]*eff.sellMultiplier);
        gold += earned;
        tickIncome += earned;
        capacityLeft -= sellAmt;
        addLog(`${BUILDINGS[t.building].name} mengekspor ${sellAmt} ${RESOURCE_LABEL[resType]} seharga ${earned} emas.`, 'sale');
      }
    }
  }

  lastIncome = tickIncome;

  if(goldAtTickStart>0 && gold<=0){
    addLog(`⚠️ Peringatan: emas kota sudah habis (${gold})! Atur ulang produksi atau bongkar bangunan yang boros sebelum bangkrut.`, 'err');
  }
  if(!hasLost && gold<-100){
    hasLost = true;
    showLoseBanner();
  }

  renderGrid();
  updateHUD();
  if(currentDetailTile!=null) renderDetail(currentDetailTile);
}


function restartTicker(){
  if(tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(tick, 1800);
}

