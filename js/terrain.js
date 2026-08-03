function randInt(min, maxExclusive){
  return min + Math.floor(Math.random()*(maxExclusive-min));
}


function generateTerrainMap(){
  const n = ROWS*COLS;
  const terrain = new Array(n).fill(null);
  const idxOf = (r,c)=>r*COLS+c;

  function canPlace(cells){
    return cells.every(([r,c])=>r>=0&&r<ROWS&&c>=0&&c<COLS&&terrain[idxOf(r,c)]===null);
  }
  function place(cells, type){
    for(const [r,c] of cells) terrain[idxOf(r,c)] = type;
  }
  function tryCluster(genFn, type, attempts){
    for(let a=0;a<attempts;a++){
      const cells = genFn();
      if(canPlace(cells)){ place(cells, type); return true; }
    }
    return false;
  }
  function placeSingle(type, attempts){
    for(let a=0;a<attempts;a++){
      const r=randInt(0,ROWS), c=randInt(0,COLS);
      if(terrain[idxOf(r,c)]===null){ terrain[idxOf(r,c)]=type; return true; }
    }
    return false;
  }

  const EDGES = ['top','bottom','left','right'];
  const CORNERS = ['top-left','top-right','bottom-left','bottom-right'];
  const pick = arr => arr[randInt(0,arr.length)];

  const targetPerType = Math.max(2, Math.round(n * 0.033));
  const clusterSide = Math.max(2, Math.round(Math.sqrt(targetPerType * 0.8)));
  const clusterCount = clusterSide*clusterSide;
  const scatterCount = Math.max(0, targetPerType - clusterCount);
  const waterLen1 = Math.max(2, Math.round(targetPerType * 0.4));
  const waterLen2 = Math.max(2, targetPerType - waterLen1);

  function blockCells(r0,c0,side){
    const cells=[];
    for(let dr=0;dr<side;dr++) for(let dc=0;dc<side;dc++) cells.push([r0+dr,c0+dc]);
    return cells;
  }
  function cornerBlock(which, side){
    const r0 = which.includes('bottom') ? ROWS-side : 0;
    const c0 = which.includes('right') ? COLS-side : 0;
    return blockCells(r0,c0,side);
  }
  function edgeBlock(edge, side){
    if(edge==='top') return blockCells(0, randInt(0,COLS-side+1), side);
    if(edge==='bottom') return blockCells(ROWS-side, randInt(0,COLS-side+1), side);
    if(edge==='left') return blockCells(randInt(0,ROWS-side+1), 0, side);
    return blockCells(randInt(0,ROWS-side+1), COLS-side, side);
  }
  function freeBlock(side){
    return blockCells(randInt(0,ROWS-side+1), randInt(0,COLS-side+1), side);
  }
  function edgeLine(edge, length){
    if(edge==='top'){ const c0=randInt(0,COLS-length+1); return Array.from({length},(_,k)=>[0,c0+k]); }
    if(edge==='bottom'){ const c0=randInt(0,COLS-length+1); return Array.from({length},(_,k)=>[ROWS-1,c0+k]); }
    if(edge==='left'){ const r0=randInt(0,ROWS-length+1); return Array.from({length},(_,k)=>[r0+k,0]); }
    const r0=randInt(0,ROWS-length+1); return Array.from({length},(_,k)=>[r0+k,COLS-1]);
  }

  tryCluster(()=>cornerBlock(pick(CORNERS), clusterSide), 'mountain', 30);
  tryCluster(()=>edgeBlock(pick(EDGES), clusterSide), 'forest', 50);
  tryCluster(()=>edgeLine(pick(EDGES), waterLen1), 'water', 50);
  tryCluster(()=>edgeLine(pick(EDGES), waterLen2), 'water', 50);
  tryCluster(()=>freeBlock(clusterSide), 'farm', 80);

  function fallbackClusters(type, remainder){
    for(let size=clusterSide-1; size>=2; size--){
      if(size*size <= remainder && tryCluster(()=>freeBlock(size), type, 80)){
        remainder -= size*size;
      }
    }
    return remainder;
  }
  const remForest = fallbackClusters('forest', scatterCount);
  const remMountain = fallbackClusters('mountain', scatterCount);
  const remFarm = fallbackClusters('farm', scatterCount);

  for(let s=0;s<remForest;s++) placeSingle('forest', 300);
  for(let s=0;s<remMountain;s++) placeSingle('mountain', 300);
  for(let s=0;s<remFarm;s++) placeSingle('farm', 300);

  for(let i=0;i<n;i++){ if(terrain[i]===null) terrain[i]='grass'; }
  return terrain;
}

