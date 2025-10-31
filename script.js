const modeSelector = document.getElementById("modeSelector");
const timeline = document.querySelector(".timeline");
const legendsContainer = document.querySelector(".legends");
const realtimeBtn = document.getElementById("realtimeBtn");

const sensorKeys = ["pm2_5","pm10","nh3","no2","humidity","bmp_temp"];
const sensorLabels = { pm2_5:"PM2.5", pm10:"PM10", nh3:"NH3", no2:"NO2", humidity:"Humidité", bmp_temp:"Temp."};
const sensorColors = { pm2_5:"#FF4400", pm10:"#FF8800", nh3:"#FFDD00", no2:"#00FF80", humidity:"#FF00FF", bmp_temp:"#0080FF"};
const sensorMin = { pm2_5:0, pm10:0, nh3:0, no2:0, humidity:0, bmp_temp:15 };
const sensorMax = { pm2_5:50, pm10:80, nh3:2, no2:2, humidity:100, bmp_temp:35 };

let currentMode = modeSelector.value;
let realtime = true;

realtimeBtn.addEventListener("click", () => {
  realtime = !realtime;
  realtimeBtn.textContent = `Lecture automatique : ${realtime ? "ON" : "OFF"}`;
  if (realtime) scrollToLastCluster();
});

modeSelector.addEventListener("change", () => {
  currentMode = modeSelector.value;
  if(currentMode === "B") startTimelineMode();
  else timeline.innerHTML = "";
});

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
  blob.style.width=`${size}px`;
  blob.style.height=`${size}px`;
  blob.style.opacity=0.6+norm*0.4;
  blob.style.filter=`blur(${6+norm*14}px)`;

  const tooltip=createTooltip(dataItem);
  blob.addEventListener("mouseenter", e=>{
    tooltip.style.opacity=1;
    const rect = blob.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width/2 + "px";
    tooltip.style.top = rect.top + "px";
  });
  blob.addEventListener("mouseleave", e=>{
    tooltip.style.opacity=0;
  });

  return blob;
}

function addCluster(dataItem){
  sensorKeys.forEach((k,i)=>{
    const blob=createBlob(k,dataItem[k]??0,dataItem);
    timeline.appendChild(blob);
  });
  if(realtime) scrollToLastCluster();
}

function scrollToLastCluster(){
  const container=timeline.parentElement;
  container.scrollLeft=timeline.scrollWidth;
}

async function fetchLatestData(){
  try{
    const resp=await fetch("https://server-online-1.onrender.com/sensor");
    const data=await resp.json();
    if(Array.isArray(data) && data.length>0){
      const lastItem=data[data.length-1];
      addCluster(lastItem);
    }
  }catch(err){console.error("Erreur fetch JSON:",err);}
}

function startTimelineMode(){
  timeline.innerHTML="";
  generateLegends();
  fetchLatestData();
  setInterval(()=>{
    if(currentMode==="B") fetchLatestData();
  },5000);
}

if(currentMode==="B") startTimelineMode();
