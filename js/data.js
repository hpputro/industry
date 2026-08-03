let ROWS=10, COLS=15;

const MAP_SIZES = {
  small: {rows:10, cols:15, tileSize:42},
  large: {rows:18, cols:41, tileSize:26}
};


const BUILDINGS = {
  road:      {name:'Jalan',            icon:'▪️', cost:5,  terrain:['grass','forest','farm','mountain','water'], category:'road'},
  house:     {name:'Rumah',            icon:'🏠', cost:20, terrain:['grass'], category:'house', pop:2},
  park:      {name:'Taman',            icon:'🌳', cost:40, terrain:['grass'], category:'amenity_radius'},
  sutet:      {name:'Sutet',   icon:'🗼', cost:200, terrain:['grass'], category:'amenity_radius'},
  fountain:  {name:'Air Mancur',       icon:'⛲', cost:900, terrain:['grass'], category:'amenity_radius'},
  transmitter:{name:'Pemancar',        icon:'📡', cost:3500, terrain:['grass'], category:'amenity_radius'},
  forestpark:{name:'Hutan Kota',       icon:'🏕️', cost:8000, terrain:['grass'], category:'amenity_radius'},
  terminal:  {name:'Halte',      icon:'🚏', cost:90, terrain:['grass'], category:'amenity_road'},
  police:    {name:'Kantor Polisi',    icon:'🚨', cost:150, terrain:['grass'], category:'amenity_road'},
  bank:      {name:'Bank',             icon:'🏦', cost:260, terrain:['grass'], category:'amenity_road'},
  firestation:{name:'Pemadam Kebakaran', icon:'⛑️', cost:3000, terrain:['grass'], category:'amenity_road'},
  school:    {name:'Sekolah',            icon:'🏫', cost:120, terrain:['grass'], category:'amenity_road'},
  gamecenter:{name:'Pusat Games',      icon:'🎮', cost:1000, terrain:['grass'], category:'amenity_road'},
  hospital:    {name:'Rumah Sakit',          icon:'🏥', cost:600, terrain:['grass'], category:'amenity_road'},
  mall:      {name:'Mall',             icon:'🌃', cost:5000, terrain:['grass'], category:'amenity_road'},
  stadium:   {name:'Stadion',          icon:'🏟️', cost:7000, terrain:['grass'], category:'amenity_road'},
  playground:{name:'Arena Bermain',    icon:'🎢', cost:7500, terrain:['grass'], category:'amenity_road'},
  resort:    {name:'Resort Wisata',    icon:'🏖️', cost:10000, terrain:['grass'], category:'amenity_road'},
  woodcutter:{name:'Penebang Kayu',icon:'🪓', cost:25, terrain:['forest'], category:'extractor', resource:'wood',  rate:4, cap:28},
  farm:      {name:'Ladang Gandum',    icon:'🌾', cost:25, terrain:['farm'],   category:'extractor', resource:'wheat', rate:3, cap:28},
  mine:      {name:'Tambang Bijih',    icon:'⛏️', cost:80, terrain:['mountain'],category:'extractor', resource:'ore',   rate:2, cap:24},
  sawmill:   {name:'Kilang Papan',     icon:'🪚', cost:150, terrain:['grass'], category:'processor', inputs:{wood:4}, output:'planks', produceRate:2, cap:24},
  furniture: {name:'Bengkel Furnitur',  icon:'🛋️', cost:800, terrain:['grass'], category:'processor', inputs:{planks:3, fabric:2}, output:'furniture', produceRate:1, cap:16},
  flourmill: {name:'Penggilingan',    icon:'🥖', cost:50, terrain:['grass'], category:'processor', inputs:{wheat:4}, output:'flour',  produceRate:2, cap:24},
  smelter:   {name:'Peleburan Logam',  icon:'🔥', cost:220, terrain:['grass'], category:'processor', inputs:{ore:3}, output:'metal',  produceRate:2, cap:16},
  component: {name:'Bengkel Komponen',  icon:'⚙️', cost:1000, terrain:['grass'], category:'processor', inputs:{metal:2}, output:'component', produceRate:1, cap:12},
  electronics: {name:'Pabrik Elektronik', icon:'📻', cost:4500, terrain:['grass'], category:'processor', inputs:{plastic:2, component:2, rubber:1}, output:'electronics', produceRate:1, cap:8},
  cotton:    {name:'Ladang Kapas',     icon:'🧶', cost:25, terrain:['farm'], category:'extractor', resource:'cotton', rate:4, cap:28},
  fabric:    {name:'Tukang Tenun',      icon:'🧵', cost:85, terrain:['grass'], category:'processor', inputs:{cotton:4}, output:'fabric', produceRate:2, cap:24},
  clothing:  {name:'Konveksi',      icon:'👔', cost:300, terrain:['grass'], category:'processor', inputs:{fabric:3}, output:'clothing', produceRate:1, cap:16},
  rubber:    {name:'Kebun Karet', icon:'🪣', cost:40, terrain:['forest'], category:'extractor', resource:'rubber', rate:3, cap:28},
  tire:      {name:'Vulkanisir',       icon:'🛞', cost:200, terrain:['grass'], category:'processor', inputs:{rubber:4}, output:'tire', produceRate:2, cap:24},
  oil:       {name:'Pengeboran Minyak',icon:'🛢️', cost:70, terrain:['water'], category:'extractor', resource:'oil', rate:1, cap:24},
  plastic:   {name:'Kilang Plastik',    icon:'🧴', cost:230, terrain:['grass'], category:'processor', inputs:{oil:2}, output:'plastic', produceRate:2, cap:16},
  gasoline:  {name:'Kilang Bensin',    icon:'⛽', cost:340, terrain:['grass'], category:'processor', inputs:{oil:3}, output:'gasoline', produceRate:2, cap:16},
  engine:    {name:'Bengkel Mesin',    icon:'🔧', cost:3000, terrain:['grass'], category:'processor', inputs:{component:2, gasoline:2}, output:'engine', produceRate:1, cap:8},
  car:       {name:'Perakitan Mobil',     icon:'🏎️', cost:10000, terrain:['grass'], category:'processor', inputs:{metal:2, electronics:2, furniture:1, tire:2, engine:3}, output:'car', produceRate:1, cap:4},
  port:      {name:'Pelabuhan',        icon:'🚢', cost:350, terrain:['water'], category:'port', sellMultiplier:1.2},
  bazaar:    {name:'Pasar',            icon:'🏪', cost:60, terrain:['grass'], category:'port', fixedCapacity:5},
  cityhall: {name:'Balai Kota',           icon:'🏤', cost:150, terrain:['grass'], category:'cityhall'},
  relay:     {name:'Kargo',           icon:'🚚', cost:50, terrain:['grass'], category:'relay'},
  freshwater:{name:'Sumber Air',       icon:'💧', cost:20, terrain:['water'], category:'extractor', resource:'freshwater', rate:2, cap:28},
  orchard:   {name:'Kebun Buah',       icon:'🍎', cost:65, terrain:['forest'], category:'extractor', resource:'fruit', rate:3, cap:28},
  livestock: {name:'Peternakan',       icon:'🐄', cost:30, terrain:['farm'], category:'extractor', resource:'livestock', rate:2, cap:28},
  quarry:    {name:'Tambang Batu',     icon:'🪨', cost:50, terrain:['mountain'], category:'extractor', resource:'stone', rate:3, cap:24},
  pearl:     {name:'Tambak Mutiara',icon:'🦪', cost:90, terrain:['water'], category:'extractor', resource:'pearl', rate:1, cap:24},
  fish:      {name:'Perikanan',     icon:'🎣', cost:60, terrain:['water'], category:'extractor', resource:'fish', rate:3, cap:28},
  butcher:   {name:'Pemburu Daging',   icon:'🥩', cost:95, terrain:['forest'], category:'extractor', resource:'meat', rate:4, cap:28},
  wool:      {name:'Pemintalan Wol',     icon:'🐑', cost:90, terrain:['grass'], category:'processor', inputs:{livestock:4}, output:'wool', produceRate:3, cap:24},
  jacket:    {name:'Pabrik Jaket',     icon:'🧥', cost:450, terrain:['grass'], category:'processor', inputs:{fabric:3, wool:2}, output:'jacket', produceRate:1, cap:16},
  sandpit:   {name:'Penggalian Pasir', icon:'⏳', cost:100, terrain:['grass'], category:'processor', inputs:{stone:4}, output:'sand', produceRate:2, cap:24},
  glass:     {name:'Peleburan Kaca',      icon:'🪟', cost:350, terrain:['grass'], category:'processor', inputs:{sand:3}, output:'glass', produceRate:1, cap:16},
  fiber:     {name:'Pabrik Serat',     icon:'🕸️', cost:2400, terrain:['grass'], category:'processor', inputs:{glass:2, plastic:2}, output:'fiber', produceRate:1, cap:8},
  jewelry:   {name:'Pengrajin Perhiasan', icon:'💎', cost:290, terrain:['grass'], category:'processor', inputs:{pearl:10}, output:'jewelry', produceRate:1, cap:16},
  leather:   {name:'Pemburu Kulit',    icon:'🦬', cost:75, terrain:['forest'], category:'extractor', resource:'leather', rate:4, cap:28},
  shirtmaker:{name:'Pengrajin Kulit',      icon:'👕', cost:95, terrain:['grass'], category:'processor', inputs:{leather:4}, output:'shirt', produceRate:1, cap:24},
  gadgetmaker:{name:'Perakitan Gadget',icon:'📱', cost:8000, terrain:['grass'], category:'processor', inputs:{electronics:3, glass:2}, output:'gadget', produceRate:1, cap:8},
  restaurant:{name:'Restoran',         icon:'🍳', cost:1500, terrain:['grass'], category:'processor', inputs:{meat:2, sandwich:2, cannedmilk:1, fruit:2}, output:'breakfast', produceRate:1, cap:8},
  woodworker:{name:'Tukang Kayu',      icon:'🪑', cost:180, terrain:['grass'], category:'processor', inputs:{wood:6}, output:'tablechair', produceRate:2, cap:24},
  uniform:   {name:'Konveksi Seragam', icon:'🎽', cost:2500, terrain:['grass'], category:'processor', inputs:{clothing:2, jacket:2, shirt:2}, output:'uniform', produceRate:1, cap:8},
  cabinet:   {name:'Bengkel Kabinet',  icon:'🗄️', cost:5000, terrain:['grass'], category:'processor', inputs:{glass:2, planks:3, paint:1, tools:2}, output:'cabinet', produceRate:1, cap:8},
  tools:     {name:'Bengkel Perkakas', icon:'🧰', cost:700, terrain:['grass'], category:'processor', inputs:{wood:3, metal:2}, output:'tools', produceRate:1, cap:16},
  paint:     {name:'Kilang Cat',       icon:'🎨', cost:500, terrain:['grass'], category:'processor', inputs:{planks:3, oil:2}, output:'paint', produceRate:1, cap:16},
  cannedmilk:{name:'Pengalengan Susu', icon:'🥫', cost:480, terrain:['grass'], category:'processor', inputs:{livestock:3, metal:2}, output:'cannedmilk', produceRate:1, cap:16},
  sandwich:  {name:'Toko Sandwich', icon:'🥪', cost:600, terrain:['grass'], category:'processor', inputs:{fish:3, flour:3}, output:'sandwich', produceRate:1, cap:16}
};

const RESOURCE_LABEL = {wood:'Kayu', wheat:'Gandum', ore:'Bijih', planks:'Papan', flour:'Tepung', metal:'Logam', furniture:'Furnitur', component:'Komponen', electronics:'Elektronik', cotton:'Kapas', fabric:'Kain', clothing:'Kemeja', rubber:'Karet', tire:'Ban', oil:'Minyak', gasoline:'Bensin', car:'Mobil', plastic:'Plastik', freshwater:'Air', fruit:'Buah', livestock:'Ternak', meat:'Daging', wool:'Wool', jacket:'Jaket', stone:'Batu', sand:'Pasir', glass:'Kaca', fiber:'Serat', pearl:'Mutiara', jewelry:'Perhiasan', leather:'Kulit', shirt:'Baju', gadget:'Gadget', breakfast:'Sarapan', tablechair:'Meja Kursi', uniform:'Seragam', cabinet:'Kabinet', tools:'Perkakas', paint:'Cat', cannedmilk:'Susu Kaleng', fish:'Ikan', sandwich:'Sandwich', engine:'Mesin'};

const PRICES = {wood:1, wheat:1, ore:4, cotton:1, rubber:1, oil:5, planks:4, flour:5, metal:9, fabric:4, furniture:17, clothing:10, component:25, electronics:100, tire:7, gasoline:8, car:500, plastic:7, freshwater:1, fruit:3, livestock:3, meat:3, wool:6, jacket:18, stone:2, sand:5, glass:12, fiber:50, pearl:10, jewelry:90, leather:2, shirt:8, gadget:350, breakfast:90, tablechair:6, uniform:80, cabinet:80, tools:15, paint:14, cannedmilk:13, fish:2, sandwich:23, engine:75};

const PROCESS_TIER = {sawmill:1, flourmill:1, smelter:1, furniture:2, component:2, electronics:3, fabric:1, clothing:2, tire:1, gasoline:1, car:4, plastic:1, wool:1, jacket:2, sandpit:1, glass:2, fiber:3, jewelry:1, shirtmaker:1, gadgetmaker:4, restaurant:3, woodworker:1, uniform:3, cabinet:3, tools:2, paint:2, cannedmilk:2, sandwich:2, engine:3};

const PORT_CAPACITY = 10;

const MAX_LEVEL_OVERRIDE_BY_SIZE = {
  small: {cityhall:8, bazaar:1, relay:4},
  large: {cityhall:15, bazaar:1, relay:4}
};

let MAX_LEVEL_OVERRIDE = MAX_LEVEL_OVERRIDE_BY_SIZE.small;


const LEVEL_GATES_BY_SIZE = {
  small: [
    {level:2, resKey:'freshwater'},
    {level:3, resKey:'flour'},
    {level:4, resKey:'shirt'},
    {level:5, resKey:'jacket'},
    {level:6, resKey:'furniture'},
    {level:7, resKey:'electronics'}
  ],
  large: [
    {level:2, resKey:'freshwater'},
    {level:3, resKey:'fruit'},
    {level:4, resKey:'flour'},
    {level:5, resKey:'shirt'},
    {level:6, resKey:'tablechair'},
    {level:7, resKey:'jacket'},
    {level:8, resKey:'furniture'},
    {level:9, resKey:'jewelry'},
    {level:10, resKey:'breakfast'},
    {level:11, resKey:'uniform'},
    {level:12, resKey:'electronics'},
    {level:13, resKey:'cabinet'},
    {level:14, resKey:'gadget'}
  ]
};

let LEVEL_GATES = LEVEL_GATES_BY_SIZE.small;


const CITYHALL_UNLOCK_BY_SIZE = {
  small: {
    freshwater: 1,
    flour: 2,
    shirt: 3,
    jacket: 4,
    furniture: 5,
    electronics: 6,
    car: 7
  },
  large: {
    freshwater: 1,
    fruit: 2,
    flour: 3,
    shirt: 4,
    tablechair: 5,
    jacket: 6,
    furniture: 7,
    jewelry: 8,
    breakfast: 9,
    uniform: 10,
    electronics: 11,
    cabinet: 12,
    gadget: 13,
    car: 14
  }
};

let CITYHALL_UNLOCK = CITYHALL_UNLOCK_BY_SIZE.small;


let currentMapSizeKey = 'small';

const TERRAIN_ICON = {forest:'🌲', mountain:'⛰️', farm:'🌱', water:'🌊', grass:''};

const TERRAIN_COLOR = {forest:'#3f6b45', mountain:'#8f6a3b', farm:'#a98a4c', water:'#3a6ea5', grass:'#6f9b5c'};


const TERRAIN_NAME = {forest:'Hutan', mountain:'Gunung', farm:'Ladang', water:'Laut', grass:'Rumput'};

const NET_COLORS = ['#e3a857','#4fb3a9','#d9695f','#8f7fd9','#5fa8d9','#c76b9c'];

const MAX_LEVEL = 3;


const MAX_HOUSE_LEVEL_BY_SIZE = {small:7, large:14};

let MAX_HOUSE_LEVEL = MAX_HOUSE_LEVEL_BY_SIZE.small;


const HOUSE_LEVELS_SMALL = [
  {name:'Tenda',            icon:'⛺', size:11},
  {name:'Gubuk',            icon:'🛖', size:14},
  {name:'Rumah Sederhana',  icon:'🏠', size:17},
  {name:'Rumah Agak Besar', icon:'🏘️', size:20},
  {name:'Rumah Besar',      icon:'🏰', size:24},
  {name:'Gedung Apartemen', icon:'🏢', size:28},
  {name:'Apartemen Mewah',  icon:'🏬', size:32}
];

const HOUSE_LEVELS_LARGE = [
  {name:'Tenda',            icon:'⛺', size:11},
  {name:'Tenda',            icon:'⛺', size:13},
  {name:'Gubuk',            icon:'🛖', size:15},
  {name:'Gubuk',            icon:'🛖', size:17},
  {name:'Rumah Sederhana',  icon:'🏠', size:19},
  {name:'Rumah Sederhana',  icon:'🏠', size:21},
  {name:'Rumah Agak Besar', icon:'🏘️', size:23},
  {name:'Rumah Agak Besar', icon:'🏘️', size:25},
  {name:'Rumah Besar',      icon:'🏰', size:27},
  {name:'Rumah Besar',      icon:'🏰', size:29},
  {name:'Gedung Apartemen', icon:'🏢', size:31},
  {name:'Gedung Apartemen', icon:'🏢', size:33},
  {name:'Apartemen Mewah',  icon:'🏬', size:35},
  {name:'Apartemen Mewah',  icon:'🏬', size:37}
];

const HOUSE_LEVELS_BY_SIZE = {small: HOUSE_LEVELS_SMALL, large: HOUSE_LEVELS_LARGE};

let HOUSE_LEVELS = HOUSE_LEVELS_BY_SIZE.small;


const HOUSE_POP_BY_LEVEL_BY_SIZE = {
  small: [2, 5, 7, 9, 10, 11, 12],
  large: [2, 5, 7, 9, 11, 13, 15, 16, 17, 18, 19, 20, 21, 22]
};

let HOUSE_POP_BY_LEVEL = HOUSE_POP_BY_LEVEL_BY_SIZE.small;


const SUPPLY_REACH_PER_LEVEL = 5;


const AMENITIES = [
  {key:'park',        type:'radius', value:1},
  {key:'sutet',       type:'radius', value:2},
  {key:'fountain',    type:'radius', value:3},
  {key:'transmitter', type:'radius', value:4},
  {key:'forestpark',  type:'radius', value:5},
  {key:'terminal',      type:'road', value:5},
  {key:'school',         type:'road', value:6},
  {key:'police',        type:'road', value:7},
  {key:'bank',           type:'road', value:8},
  {key:'hospital',       type:'road', value:9},
  {key:'gamecenter',     type:'road', value:10},
  {key:'firestation',    type:'road', value:11},
  {key:'mall',           type:'road', value:12},
  {key:'stadium',        type:'road', value:13},
  {key:'playground',     type:'road', value:14},
  {key:'resort',         type:'road', value:15}
];


const NEGATIVE_EFFECTS = [
  {label:'Bangunan industri (semua penghasil & pabrik pengolah)', icon:'🏭', radius:2, match:b=>['extractor','processor'].includes(BUILDINGS[b].category), onlyKey:null},
  {label:'Pelabuhan / Pasar', icon:'🚦', radius:1, match:b=>['port','bazaar'].includes(b), onlyKey:null},
  {label:'Halte', icon:'🚏', radius:1, match:b=>b==='terminal', onlyKey:'terminal'},
  {label:'Kantor Polisi', icon:'🚨', radius:1, match:b=>b==='police', onlyKey:'police'},
  {label:'Bank', icon:'🏦', radius:1, match:b=>b==='bank', onlyKey:'bank'},
  {label:'Pemadam Kebakaran', icon:'⛑️', radius:2, match:b=>b==='firestation', onlyKey:'firestation'},
  {label:'Sekolah', icon:'🏫', radius:1, match:b=>b==='school', onlyKey:'school'},
  {label:'Pusat Games', icon:'🎮', radius:2, match:b=>b==='gamecenter', onlyKey:'gamecenter'},
  {label:'Rumah Sakit', icon:'🏥', radius:1, match:b=>b==='hospital', onlyKey:'hospital'},
  {label:'Mall', icon:'🌃', radius:2, match:b=>b==='mall', onlyKey:'mall'},
  {label:'Stadion', icon:'🏟️', radius:2, match:b=>b==='stadium', onlyKey:'stadium'},
  {label:'Arena Bermain', icon:'🎢', radius:2, match:b=>b==='playground', onlyKey:'playground'},
  {label:'Resort Wisata', icon:'🏖️', radius:3, match:b=>b==='resort', onlyKey:'resort'}
];


const MAX_BUILDING_COUNT = {};


const BUILD_GROUP_ORDER = ['Infrastruktur dasar','Prasarana perumahan','Prasarana kota','Industri mentah','Industri pengolahan'];

