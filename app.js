const MAJOR = ["SiO2","Al2O3","Fe2O3","MgO","CaO","Na2O","K2O"];
let rows = [];
let columns = [];

const $ = id => document.getElementById(id);

function normalizeName(s){
  return String(s ?? "").trim().replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>"0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(c)])
    .replace(/\s+/g,"").replace(/%/g,"").replace(/^FeO\*?$/i,"Fe2O3").replace(/^Fe2O3T$/i,"Fe2O3");
}
function findColumn(target){
  const n = normalizeName(target).toLowerCase();
  return columns.find(c => normalizeName(c).toLowerCase()===n) ||
         columns.find(c => normalizeName(c).toLowerCase().replace(/[^a-z0-9]/g,"")===n.replace(/[^a-z0-9]/g,""));
}
function toNumber(v){
  if(v===null || v===undefined || String(v).trim()==="") return NaN;
  return Number(String(v).trim().replace(/,/g,""));
}
function parseCSV(text){
  const lines=[]; let row=[], cell="", quote=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(ch === '"'){
      if(quote && next === '"'){cell+='"';i++} else quote=!quote;
    }else if(ch===',' && !quote){row.push(cell);cell=""}
    else if((ch==="\n" || ch==="\r") && !quote){
      if(ch==="\r" && next==="\n") i++;
      row.push(cell);cell=""; if(row.some(x=>String(x).trim()!=="")) lines.push(row); row=[];
    }else cell+=ch;
  }
  if(cell!=="" || row.length){row.push(cell);lines.push(row)}
  if(lines.length<2) throw new Error("CSV needs a header row and at least one data row.");
  const headers=lines[0].map(h=>String(h).trim());
  return lines.slice(1).map(r=>{
    const o={}; headers.forEach((h,i)=>o[h]=(r[i]??"").trim()); return o;
  }).filter(o=>Object.values(o).some(v=>v!==""));
}
function detectSampleColumn(){
  const candidates=["Sample_ID","SampleID","Sample","ID","Name","SampleName"];
  return candidates.map(findColumn).find(Boolean) || columns[0];
}
function updateUI(){
  const y=$("ySelect"); y.innerHTML="";
  columns.filter(c=>c!==findColumn("SiO2")).forEach(c=>{
    const opt=document.createElement("option"); opt.value=c; opt.textContent=c; y.appendChild(opt);
  });
  const preferred=["Al2O3","Fe2O3","MgO","CaO","Na2O","K2O"].map(findColumn).filter(Boolean);
  if(preferred[0]) y.value=preferred[0];
  $("columns").innerHTML=columns.map(c=>`<span class="chip">${escapeHTML(c)}</span>`).join("");
  $("sampleCount").textContent=`${rows.length} sample${rows.length===1?"":"s"}`;
  const numeric=columns.filter(c=>rows.some(r=>Number.isFinite(toNumber(r[c]))));
  $("summary").innerHTML=`<div><b>Rows:</b> ${rows.length}</div><div><b>Numeric columns:</b> ${numeric.length}</div><div><b>Sample ID:</b> ${escapeHTML(detectSampleColumn())}</div>`;
  render();
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function loadText(text){
  try{
    rows=parseCSV(text); columns=Object.keys(rows[0]||{});
    const missing=MAJOR.filter(m=>!findColumn(m));
    $("status").textContent=missing.length ? `Loaded ${rows.length} rows. Missing major columns: ${missing.join(", ")}.` : `Loaded ${rows.length} rows successfully.`;
    updateUI();
  }catch(e){$("status").textContent=`CSV error: ${e.message}`}
}
$("loadPaste").onclick=()=>loadText($("csvText").value);
$("csvFile").onchange=async e=>{const f=e.target.files[0];if(f) loadText(await f.text())};
$("clearData").onclick=()=>{rows=[];columns=[];$("plot").innerHTML="";$("status").textContent="No data loaded.";$("ySelect").innerHTML="";$("columns").innerHTML="";$("summary").textContent="Load a CSV to see detected columns and sample statistics.";};
$("loadDemo").onclick=()=>{
  const demo=`Sample_ID,SiO2,Al2O3,Fe2O3,MgO,CaO,Na2O,K2O,Ni,Cr
S01,48.2,18.1,10.2,7.5,11.4,2.3,0.8,105,230
S02,50.4,17.5,9.4,6.8,10.5,2.6,0.9,92,210
S03,52.0,17.0,8.7,6.0,9.6,2.9,1.0,80,190
S04,54.3,16.4,8.1,5.3,8.8,3.2,1.2,68,170
S05,56.1,15.9,7.5,4.8,8.0,3.5,1.4,55,145
S06,58.0,15.4,6.9,4.2,7.3,3.8,1.7,48,128
S07,60.5,14.7,6.2,3.7,6.5,4.1,2.0,40,112
S08,63.2,14.0,5.6,3.0,5.7,4.5,2.4,31,95
S09,66.0,13.2,5.0,2.5,5.0,4.9,2.8,25,82
S10,69.1,12.5,4.3,2.0,4.4,5.2,3.2,18,70`;
  $("csvText").value=demo;loadText(demo);
};
$("ySelect").onchange=render;
$("fieldSelect").onchange=render;
$("symbolSelect").onchange=render;
$("downloadPng").onclick=()=>Plotly.downloadImage($("plot"),{format:"png",width:1500,height:950,filename:"harker-diagram"});

function harkerField(kind){
  // Deliberately schematic. Harker diagrams do not have a universal field boundary
  // for these three magma series; formal boundaries depend on the chosen classification.
  const x=[35,45,50,55,60,65,70,75,80];
  const make=(y1,y2,fill,name,dash)=>{
    const ys=x.map(v=>y1+(v-35)*(y2-y1)/45);
    return {x:[...x,...x.slice().reverse()],y:[...ys,...ys.slice().reverse().map(v=>v+1.8)],
      type:"scatter",mode:"lines",fill:"toself",fillcolor:fill,line:{color:fill.replace(/0\.\d+\)/,"1)").replace("rgba","rgb"),dash},name,hoverinfo:"skip",opacity:.25,showlegend:true};
  };
  if(kind==="calcalkaline") return [make(4.5,2.2,"rgba(76,175,80,.20)","Calc-alkaline","solid")];
  if(kind==="tholeiitic") return [make(8.5,5.0,"rgba(255,152,0,.20)","Tholeiitic","dash")];
  if(kind==="alkaline") return [make(1.5,3.8,"rgba(156,39,176,.18)","Alkaline","dot")];
  if(kind==="all") return [
    make(4.5,2.2,"rgba(76,175,80,.20)","Calc-alkaline","solid"),
    make(8.5,5.0,"rgba(255,152,0,.20)","Tholeiitic","dash"),
    make(1.5,3.8,"rgba(156,39,176,.18)","Alkaline","dot")
  ];
  return [];
}
function render(){
  if(!rows.length) return;
  const xCol=findColumn("SiO2"), yCol=$("ySelect").value;
  if(!xCol || !yCol) return;
  const sid=detectSampleColumn();
  const x=[],y=[],labels=[],hover=[];
  rows.forEach((r,i)=>{
    const xv=toNumber(r[xCol]), yv=toNumber(r[yCol]);
    if(Number.isFinite(xv)&&Number.isFinite(yv)){
      x.push(xv);y.push(yv);labels.push(r[sid]||`Sample ${i+1}`);
      hover.push(`<b>${escapeHTML(r[sid]||`Sample ${i+1}`)}</b><br>SiO₂: ${xv}<br>${escapeHTML(yCol)}: ${yv}`);
    }
  });
  const trace={x,y,type:"scatter",mode:"markers",name:"Samples",
    text:labels,customdata:hover,hovertemplate:"%{customdata}<extra></extra>",
    marker:{size:10,symbol:$("symbolSelect").value,line:{width:1,color:"#071018"},opacity:.9}};
  const layout={
    title:{text:"",font:{color:"#e9eef5"}},paper_bgcolor:"#0d1219",plot_bgcolor:"#090e14",
    font:{color:"#b8c5d6"},hoverlabel:{bgcolor:"#101822",font:{color:"#fff"}},
    xaxis:{title:"SiO₂ (wt. %)",gridcolor:"#263342",zerolinecolor:"#3a4a5d",fixedrange:false},
    yaxis:{title:`${yCol} (wt. %)`,gridcolor:"#263342",zerolinecolor:"#3a4a5d",fixedrange:false},
    margin:{l:70,r:25,t:20,b:65},legend:{orientation:"h",y:1.08,x:0},
    dragmode:"zoom",showlegend:true
  };
  $("plotTitle").textContent=`Harker: SiO₂ vs ${yCol}`;
  Plotly.react("plot",[...harkerField($("fieldSelect").value),trace],layout,{responsive:true,displaylogo:false,modeBarButtonsToAdd:["resetScale2d"]});
}
