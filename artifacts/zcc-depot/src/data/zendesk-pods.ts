/** Reference data for the Zendesk Architecture Overview section.
 *  Figures and locations come from a supplied reference slide; they are not live or independently verified. */
export type PodRegion = {
  id: string; name: string; area: "Americas" | "EMEA" | "APAC"; lon: number; lat: number;
  dx: number; dy: number; anchor: "start" | "end"; note: string;
};

export const POD_REGIONS: PodRegion[] = [
  { id: "oregon", name: "Oregon", area: "Americas", lon: -120.5, lat: 44, dx: -14, dy: 4, anchor: "end", note: "West-coast North America reference location." },
  { id: "ohio", name: "Ohio", area: "Americas", lon: -82.9, lat: 40.2, dx: -10, dy: -14, anchor: "end", note: "Central North America reference location." },
  { id: "n-virginia", name: "N. Virginia", area: "Americas", lon: -77.5, lat: 38.6, dx: 12, dy: 18, anchor: "start", note: "East-coast North America reference location." },
  { id: "ireland", name: "Ireland", area: "EMEA", lon: -6.3, lat: 53.3, dx: -12, dy: -14, anchor: "end", note: "Western Europe reference location." },
  { id: "london", name: "London", area: "EMEA", lon: -0.1, lat: 51.5, dx: -16, dy: 22, anchor: "end", note: "United Kingdom reference location." },
  { id: "frankfurt", name: "Frankfurt", area: "EMEA", lon: 8.7, lat: 50.1, dx: 12, dy: 16, anchor: "start", note: "Central Europe reference location." },
  { id: "tokyo", name: "Tokyo", area: "APAC", lon: 139.7, lat: 35.7, dx: 12, dy: -8, anchor: "start", note: "Eastern Japan reference location." },
  { id: "osaka", name: "Osaka", area: "APAC", lon: 135.5, lat: 34.7, dx: -10, dy: 18, anchor: "end", note: "Western Japan reference location." },
  { id: "sydney", name: "Sydney", area: "APAC", lon: 151.2, lat: -33.9, dx: 12, dy: 4, anchor: "start", note: "Australia reference location." },
];

export const REFERENCE_FIGURES = [
  { v: "3.3B", l: "users" },
  { v: "100,000+", l: "customers" },
  { v: "2.8T", l: "annual requests" },
];

export const REFERENCE_FOOTPRINT = [
  { v: "15", l: "Pods" },
  { v: "9", l: "regions" },
  { v: "3", l: "availability zones per Pod" },
];

export const POD_PRINCIPLES = [
  { k: "Foundation", t: "Built on AWS", d: "Zendesk runs on Amazon Web Services infrastructure, designed to scale at each tier." },
  { k: "Pods", t: "Self-contained Points of Delivery", d: "Geographically separated Pods each run their own service stack for a set of accounts." },
  { k: "Blast radius", t: "Incidents stay smaller", d: "Pod design aims to contain an incident to one Pod. Shared dependencies can still affect several Pods; isolation is not absolute." },
  { k: "Placement", t: "Region, residency, latency", d: "Data center preference may be available by product, plan, and contract. It is not a promise that every data type stays local or that latency is lowest." },
];

/** Simplified continent outlines as [lon, lat] vertices. */
export const LAND: [number, number][][] = [
  [[-168,66],[-162,70],[-140,70],[-125,70],[-110,73],[-95,72],[-85,70],[-80,63],[-90,58],[-82,52],[-78,58],[-70,60],[-62,58],[-56,52],[-60,46],[-66,44],[-70,42],[-76,38],[-76,35],[-81,31],[-80,26],[-82,28],[-84,30],[-90,29],[-97,27],[-97,22],[-92,18],[-87,21],[-88,16],[-83,10],[-79,8],[-82,8],[-86,12],[-92,14],[-105,20],[-110,24],[-112,30],[-115,30],[-117,33],[-121,35],[-124,41],[-124,48],[-130,54],[-137,58],[-147,60],[-155,58],[-165,55],[-160,60],[-166,62]],
  [[-73,78],[-60,82],[-30,83],[-20,78],[-22,70],[-40,65],[-44,60],[-52,64],[-56,72],[-70,76]],
  [[-80,8],[-72,12],[-62,10],[-52,5],[-35,-5],[-39,-15],[-48,-26],[-58,-35],[-65,-42],[-68,-54],[-72,-50],[-74,-40],[-71,-28],[-70,-18],[-76,-14],[-81,-5],[-80,0]],
  [[-10,36],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[10,57],[5,58],[6,62],[14,67],[25,71],[40,68],[45,68],[60,70],[70,73],[80,73],[100,78],[115,74],[130,72],[140,73],[160,70],[180,68],[180,65],[170,60],[160,60],[156,51],[142,47],[136,43],[130,42],[127,38],[126,35],[122,40],[118,38],[122,31],[120,25],[110,21],[108,16],[109,12],[105,9],[100,13],[101,3],[104,1],[98,8],[98,16],[92,22],[87,21],[80,15],[77,8],[73,18],[67,25],[57,25],[59,22],[52,16],[44,12],[42,16],[35,28],[33,31],[35,36],[27,37],[24,40],[22,37],[19,41],[13,45],[16,40],[12,38],[8,44],[3,43],[-2,37]],
  [[-17,21],[-10,30],[-6,36],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[40,-3],[40,-15],[35,-25],[27,-34],[19,-35],[13,-20],[12,-6],[9,4],[-5,5],[-13,8],[-17,15]],
  [[-6,50],[1,51],[2,53],[-2,57],[-5,59],[-6,56],[-3,54],[-5,52]],
  [[-10,52],[-6,52],[-6,55],[-10,54]],
  [[130,31],[136,34],[140,36],[142,40],[141,45],[145,44],[140,41],[139,38],[136,36],[131,34]],
  [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[141,-38],[136,-35],[130,-32],[115,-34]],
  [[95,5],[105,-6],[115,-8],[120,-9],[118,0],[117,7],[109,2],[103,-2]],
  [[172,-35],[178,-38],[174,-42],[167,-46],[172,-41]],
  [[44,-25],[50,-16],[49,-12],[44,-17]],
  [[-24,64],[-14,65],[-14,66],[-22,66]],
];
