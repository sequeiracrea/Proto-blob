// ------------------ Sélecteurs ------------------
const pageSelector=document.getElementById("pageSelector");
const realtimeBtn=document.getElementById("realtimeBtn");
const timeline=document.querySelector(".timeline");
const legendsContainer=document.querySelector(".legends");

// ------------------ Config capteurs ------------------
const sensorKeys=["pm2_5","pm10","nh3","no2","humidity","bmp_temp"];
const sensorLabels={pm2_5:"PM2.5",pm10:"PM10",nh3:"NH3",no2:"NO2",humidity:"Humidité",bmp_temp:"Temp."};
const sensorColors={pm2_5:"#FF4400",pm10:"#FF8800",nh3:"#FFDD00",no2:"#00FF80",humidity:"#FF00FF",bmp_temp:"#0080FF"};
const sensorMin={pm2_5:0,pm10:0,nh3:0,no2:0,humidity:0,bmp_temp:15};
const sensorMax={pm2_5:50,pm10:80,nh3:2,no2:2,humidity:100,bmp_temp:35};

let realtime=true;
let dataSession=[]; // <-- buffer global pour session
let aqiChart=null,pressureChart=null,humidityChart=null;
let fetchInterval=null;

// ------------------ Navigation ------------------
pageSelector.addEventListener("change",()=>{ showPage(pageSelector.value); });
realtimeBtn.addEventListener("click",()=>{
  realtime=!realtime;
  realtimeBtn.textContent=`Lecture automatique : ${realtime?"ON":"OFF"}`;
  if(realtime) scrollToLastCluster();
});

function showPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  if(page==="timeline"){ 
    document.getElementById("timelinePage").classList.add("active"); 
    generateLegends(); 
    renderTimeline(); // afficher tout le buffer
  } else if(page==="airQuality"){ 
    document.getElementById("airQualityPage").classList.add("active"); 
    startAirQualityChart(); 
  } else if(page==="pressure"){ 
    document.getElementById("pressurePage").classList.add("active"); 
    startPressureChart(); 
  } else if(page==="humidity"){ 
    document.getElementById("humidityPage").classList.add("active"); 
    startHumidityChart(); 
  } else document.getElementById("homePage").classList.add("active");
}

// ------------------ Timeline ------------------
function normalize(v,min,max){return Math.max(0,Math.min(1,(v-min)/(max-min)));}

function generateLegends(){
  legendsContainer.innerHTML="";
  sensorKeys.forEach(k=>{
    const label=document.createElement("span");
    label.textContent=sensorLabels[k];
    legendsContainer.appendChild(label);
  });
}

function createTooltip(dataItem){
  const tooltip=document.createElement("div");
  tooltip.classList.add("tooltip");
  tooltip.innerHTML=Object.entries(dataItem).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join("<br>");
  document.body.appendChild(tooltip);
  return tooltip;
}

function createBlob(sensor,value,dataItem){
  const blob=document.createElement("div");
  blob.classList.add("blob");
  blob.style.background=sensorColors[sensor];
  const norm=normalize(value,sensorMin[sensor],sensorMax[sensor]);
  const size=20+norm*80;
  blob.style.width=`${size}px`; blob.style.height=`${size}px`; blob.style.opacity=0.6+norm*0.4; blob.style.filter=`blur(${6+norm*14}px)`;
  const tooltip=createTooltip(dataItem);
  blob.addEventListener("mouseenter",()=>{ tooltip.style.opacity=1; const rect=blob.getBoundingClientRect(); tooltip.style.left=`${rect.left+rect.width/2}px`; tooltip.style.top=`${rect.top}px`; });
  blob.addEventListener("mouseleave",()=>{ tooltip.style.opacity=0; });
  return blob;
}

function addClusterToTimeline(dataItem){
  sensorKeys.forEach(k=>{ timeline.appendChild(createBlob(k,dataItem[k]??0,dataItem)); });
  if(realtime) scrollToLastCluster();
}

function renderTimeline(){
  timeline.innerHTML="";
  dataSession.forEach(d=>addClusterToTimeline(d));
}

function scrollToLastCluster(){ 
  timeline.parentElement.scrollLeft = timeline.scrollWidth; 
}
// ------------------ Récupération des données ------------------
async function fetchLatestData(){
  try {
    const resp = await fetch("https://server-online-1.onrender.com/sensor");
    const data = await resp.json();
    if(Array.isArray(data) && data.length > 0){
      const lastItem = data[data.length-1];
      dataSession.push(lastItem);            // <-- stocker globalement
      addClusterToTimeline(lastItem);        // <-- timeline
      updateCharts(lastItem);                // <-- charts
    }
  } catch(err){
    console.error("Erreur fetch JSON:", err);
  }
}

// ------------------ Charts ------------------
function updateCharts(newData){
  if(aqiChart) updateChartData(aqiChart, ['pm2_5','pm10','co2','no2'], newData);
  if(pressureChart) updateChartData(pressureChart, ['pressure'], newData);
  if(humidityChart) updateChartData(humidityChart, ['humidity','bmp_temp'], newData);
}

function updateChartData(chart, keys, dataItem){
  chart.data.labels.push(chart.data.labels.length + 1);
  keys.forEach((k, idx) => {
    chart.data.datasets[idx].data.push(dataItem[k] ?? 0);
  });
  chart.update();
}

// ------------------ Démarrage Charts ------------------
function startAirQualityChart(){
  if(aqiChart) return;
  const ctx=document.getElementById("aqiChart").getContext("2d");
  aqiChart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[
      {label:'PM2.5', data:[], borderColor:'#FF4400', fill:false},
      {label:'PM10', data:[], borderColor:'#FF8800', fill:false},
      {label:'CO2', data:[], borderColor:'#00FFAA', fill:false},
      {label:'NO2', data:[], borderColor:'#00FF80', fill:false}
    ]},
    options:{responsive:true, plugins:{legend:{position:'top'}}}
  });
  dataSession.forEach(d => updateCharts(d)); // afficher tout le buffer
}

function startPressureChart(){
  if(pressureChart) return;
  const ctx=document.getElementById("pressureChart").getContext("2d");
  pressureChart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[
      {label:'Pression hPa', data:[], borderColor:'#00AAFF', fill:false}
    ]},
    options:{responsive:true, plugins:{legend:{position:'top'}}}
  });
  dataSession.forEach(d => updateCharts(d));
}

function startHumidityChart(){
  if(humidityChart) return;
  const ctx=document.getElementById("humidityChart").getContext("2d");
  humidityChart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[
      {label:'Humidité %', data:[], borderColor:'#FF00FF', fill:false},
      {label:'Temp. °C', data:[], borderColor:'#0080FF', fill:false}
    ]},
    options:{responsive:true, plugins:{legend:{position:'top'}}}
  });
  dataSession.forEach(d => updateCharts(d));
}

// ------------------ Lancement récupération périodique ------------------
if(!fetchInterval){
  fetchLatestData(); // fetch initial
  fetchInterval = setInterval(fetchLatestData, 5000); // rafraîchissement toutes les 5s
}

// ------------------ Initial page ------------------
showPage(pageSelector.value);

