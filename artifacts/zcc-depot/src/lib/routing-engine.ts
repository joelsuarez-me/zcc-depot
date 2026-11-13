/** Deterministic teaching model, not a live Amazon Connect scheduler. */
export type MethodId = "queue" | "skills" | "priority" | "longest" | "vip" | "preferred" | "intent" | "hours" | "overflow" | "language" | "capacity" | "external";
export type Channel = "Voice" | "Chat" | "Email" | "Task";
export type RoutingState = "Idle" | "Evaluating" | "Queued" | "Matching" | "Offered" | "Connected" | "Fallback" | "Completed";
export interface RoutingConfig {
  intent: string; language: string; tier: string; availability: string;
  proficiency: number; priority: number; delay: number; preferred: string;
  schedule: string; region: string; timeout: number; threshold: number;
  depth: number; channel: Channel; capacity: number; crossChannel: boolean;
  lookup: string; certification: string; product: string;
}
export interface Agent {
  id: string; name: string; available: boolean; profile: string; queues: string[];
  skills: Record<string, number>; certifications: string[]; products: string[];
  idle: number; active: Record<Channel, number>; capacity: Record<Channel, number>;
  eligible: boolean; reason: string;
}
export interface RoutingEvent {
  at: number; state: RoutingState; label: string; node: string; detail: string;
  eligibility?: { id: string; eligible: boolean; reason: string }[];
}
export interface WaitingContact { id: string; queue: string; age: number; priority: number; delay: number; eligible: boolean }
export interface RoutingResult {
  destination: string; selectedAgent: string | null; agents: Agent[]; events: RoutingEvent[];
  criteria: string; fallback: string; wait: number; time: number; outcome: string;
  contacts: WaitingContact[];
}
export const DEFAULT_CONFIG: RoutingConfig = {
  intent: "Support", language: "English", tier: "Standard", availability: "all",
  proficiency: 4, priority: 1, delay: 0, preferred: "a",
  schedule: "Business hours", region: "North America", timeout: 30, threshold: 5,
  depth: 8, channel: "Voice", capacity: 2, crossChannel: true,
  lookup: "Success", certification: "General", product: "Core",
};
export function createAgents(c: RoutingConfig): Agent[] {
  return [
    {id:"a",name:"Alex Morgan",profile:"Universal service",queues:["Sales","Support","Billing","VIP","Backup"],skills:{English:5,Spanish:2,French:1},certifications:["General","Payments"],products:["Core","Enterprise"],idle:180,active:{Voice:0,Chat:1,Email:0,Task:0}},
    {id:"b",name:"Sofia Chen",profile:"Multilingual service",queues:["Sales","Support","Billing","VIP","Backup"],skills:{English:4,Spanish:5,French:3},certifications:["General","Payments"],products:["Core"],idle:95,active:{Voice:0,Chat:0,Email:0,Task:0}},
    {id:"c",name:"Camille Dubois",profile:"Advanced service",queues:["Support","Billing","Backup"],skills:{English:4,Spanish:1,French:5},certifications:["General","Technical"],products:["Core","Enterprise"],idle:240,active:{Voice:0,Chat:0,Email:1,Task:0}},
  ].map(a=>({...a, available:c.availability!=="none" && c.availability!==a.id,
    capacity:{Voice:1,Chat:c.capacity,Email:c.capacity,Task:c.capacity},
    eligible:false,reason:"Not evaluated"}));
}
export function simulateRouting(method: MethodId, c: RoutingConfig): RoutingResult {
  const agents = createAgents(c);
  // Most scenarios isolate routing decisions with idle agents. Capacity deliberately adds active work.
  if(method!=="capacity") agents.forEach(a=>a.active={Voice:0,Chat:0,Email:0,Task:0});
  const events: RoutingEvent[] = [];
  let clock=0, wait=0, fallback="Not required", destination=c.intent, criteria="Queue membership + available status + channel capacity";
  const add=(state:RoutingState,label:string,node:string,detail:string,advance=1)=>{
    clock+=advance; events.push({at:clock,state,label,node,detail});
  };
  add("Idle","Incoming contact received","customer",`Illustrative ${c.channel.toLowerCase()} contact`,0);
  add("Evaluating","Entry point invokes contact flow","entry","No live AWS connection");
  add("Evaluating","Evaluate configured flow","flow","Flow logic selects a queue before agent matching");
  const contacts: WaitingContact[] = [];
  let relaxed=false, preferredFallback=false, alternate=false;
  if(method==="queue") criteria=`IVR selected ${c.intent}; routing profile must include selected queue`;
  if(method==="intent") {
    criteria=`Amazon Lex identifies ${c.intent} intent; the Connect flow checks Lex output`;
    add("Evaluating",`Amazon Lex: ${c.intent} intent`,"decision","Lex classifies the utterance; Amazon Connect applies the configured branch");
  }
  if(method==="vip") {
    destination=c.tier==="VIP"?"VIP":c.intent;
    criteria=`CRM attribute tier=${c.tier}; configured Check contact attributes branch`;
    add("Evaluating",`Customer tier: ${c.tier}`,"decision","Caller lookup is not identity authentication");
  }
  if(method==="external") {
    add("Evaluating","Invoke AWS Lambda","integration","Scoped function calls a CRM or database and returns routing attributes");
    if(c.lookup==="Success") { destination=c.tier==="VIP"?"VIP":c.intent; criteria=`Lambda returned ${c.tier} / ${c.intent}; explicit flow branch`; }
    else {destination="Support";fallback=`Lambda ${c.lookup.toLowerCase()}: configured error branch to Support`; add("Fallback",fallback,"integration","A failed lookup must not silently grant VIP status",c.lookup==="Timeout"?Math.min(8,c.timeout):1);}
  }
  if(method==="hours") {
    criteria=`Check hours of operation: ${c.region} / ${c.schedule}`;
    add("Evaluating","Evaluate regional operating schedule","decision",criteria);
    if(c.schedule!=="Business hours") {destination=c.schedule==="After hours"?"Alternate regional team":"Voicemail"; alternate=true; fallback=`Explicit ${c.schedule.toLowerCase()} flow branch`; add("Fallback",fallback,"decision","Configured region time zone and holiday overrides determine the destination");}
  }
  if(method==="overflow") {
    criteria=`Queue depth ${c.depth}; configured threshold ${c.threshold}`;
    if(c.depth>=c.threshold) { destination="Backup";fallback="Configured queue-metrics check and transfer to Backup";add("Fallback","Primary threshold reached","decision","Explicit flow or integration logic, not automatic overflow");}
  }
  if(method==="priority") {
    contacts.push(
      {id:"C-101",queue:"Sales",age:20,priority:c.priority,delay:c.delay,eligible:20>=c.delay},
      {id:"C-102",queue:"Support",age:60,priority:2,delay:0,eligible:true},
      {id:"C-103",queue:"Billing",age:40,priority:3,delay:0,eligible:true},
    );
    const first=contacts.filter(x=>x.eligible).sort((a,b)=>a.priority-b.priority||b.age-a.age)[0];
    destination=first.queue;
    criteria=`${first.id} selected across queues in one shared routing profile: lower numerical priority first, then oldest contact; delay must expire`;
    add("Evaluating","Compare waiting contacts","decision",criteria);
  }
  add("Queued",`Contact enters ${destination}`,"queue",alternate?"Configured alternate destination, no queue-agent match attempted":"Queue holds the waiting contact");
  const evaluate=(relax:boolean, preferredOnly:boolean)=>{
    agents.forEach(a=>{
      let reason="";
      if(!a.available) reason="Unavailable status";
      else if(!a.queues.includes(destination)) reason="Queue not in routing profile";
      else if(a.active[c.channel]>=a.capacity[c.channel]) reason=`${c.channel} capacity reached`;
      else if(!c.crossChannel && Object.entries(a.active).some(([ch,n])=>ch!==c.channel&&n>0)) reason="Cross-channel concurrency disabled";
      else if((method==="skills"||method==="language") && a.skills[c.language]<(relax?1:c.proficiency)) reason=`${c.language} proficiency below ${relax?1:c.proficiency}`;
      else if(method==="skills"&&!a.certifications.includes(c.certification)) reason=`Missing ${c.certification} certification`;
      else if(method==="skills"&&!a.products.includes(c.product)) reason=`Missing ${c.product} product knowledge`;
      else if(preferredOnly&&a.id!==c.preferred) reason="Preferred-agent step restricts matching";
      a.eligible=!reason; a.reason=reason||"Available, queue/channel eligible; criteria satisfied";
    });
  };
  if(method==="skills"||method==="language") {
    criteria=`${c.language} proficiency ≥ ${c.proficiency}${method==="skills"?`, ${c.certification} certification + ${c.product} knowledge`:""}`;
  }
  evaluate(false,method==="preferred");
  add("Matching","Evaluate routing profile and agents","eligibility",criteria);
  events[events.length-1].eligibility=agents.map(a=>({id:a.id,eligible:a.eligible,reason:a.reason}));
  if(method==="preferred") {
    criteria=`Preferred agent ${agents.find(a=>a.id===c.preferred)?.name}; restriction expires after ${c.timeout}s`;
    if(!agents.some(a=>a.eligible)) {
      preferredFallback=true;wait+=c.timeout;fallback="Preferred-agent step expired; broaden to eligible queue agents";
      add("Fallback","Preferred-agent timer expires","decision",fallback,c.timeout);
      evaluate(false,false);
      events[events.length-1].eligibility=agents.map(a=>({id:a.id,eligible:a.eligible,reason:a.reason}));
    }
  }
  if((method==="skills"||method==="language")&&!agents.some(a=>a.eligible)){
    relaxed=true;wait+=c.timeout;fallback="Initial proficiency step expired; configured next step lowers language minimum to 1 (other requirements remain)";
    add("Fallback","Routing criteria expire and relax","decision",fallback,c.timeout);
    evaluate(true,false);
    events[events.length-1].eligibility=agents.map(a=>({id:a.id,eligible:a.eligible,reason:a.reason}));
  }
  const eligible=agents.filter(a=>a.eligible).sort((a,b)=>{
    const total=(x:Agent)=>Object.values(x.active).reduce((p,n)=>p+n,0);
    return total(a)-total(b)||b.idle-a.idle||a.id.localeCompare(b.id);
  });
  let selectedAgent: string|null=null, outcome:string;
  if(alternate) {agents.forEach(a=>{a.eligible=false;a.reason="Contact sent to configured alternate destination"});outcome=`Transferred to ${destination}`;}
  else if(eligible.length){
    selectedAgent=eligible[0].id;
    if(method==="longest") criteria="All eligible agents have zero active contacts; longest Available duration wins";
    if(method==="capacity") criteria=`${c.channel} capacity and cross-channel policy; fewest active contacts across channels, longest Available breaks ties`;
    add("Offered",`Contact offered to ${eligible[0].name}`,"agent",eligible[0].reason);
    add("Connected","Agent accepts contact","agent","Acceptance is simulated, not a live event");
    outcome=`Connected to ${eligible[0].name}${relaxed?" after criteria relaxation":preferredFallback?" after preferred-agent fallback":""}`;
  } else {
    wait+=c.timeout;fallback= fallback==="Not required"?"No eligible agents within illustrative window; configured voicemail fallback":fallback+"; still no eligible agent, configured voicemail fallback";
    add("Fallback","No eligible agent before timeout","queue",fallback,c.timeout);
    destination="Voicemail";outcome="Transferred to configured voicemail fallback";
  }
  add("Completed","Simulation completed","outcome",outcome);
  return {destination,selectedAgent,agents,events,criteria,fallback,wait,time:clock,outcome,contacts};
}

export interface Playback { index: number; running: boolean }
export type PlaybackAction = "start" | "pause" | "resume" | "next" | "previous" | "reset" | "replay" | "tick";
export function advancePlayback(p: Playback, action: PlaybackAction, length: number): Playback {
  const last=Math.max(0,length-1);
  switch(action){
    case "start": case "replay":return {index:0,running:true};
    case "reset":return {index:0,running:false};
    case "pause":return {...p,running:false};
    case "resume":return {...p,running:p.index<last};
    case "previous":return {index:Math.max(0,p.index-1),running:false};
    case "next":return {index:Math.min(last,p.index+1),running:false};
    case "tick":return !p.running?p:{index:Math.min(last,p.index+1),running:p.index+1<last};
  }
}
