document.addEventListener("DOMContentLoaded", () => {

const firebaseConfig = {
  apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
  authDomain: "controle-gerencial-75f09.firebaseapp.com",
  databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
  projectId: "controle-gerencial-75f09"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const ref = db.ref("registros");

let dados = [];
let graficos = {};

const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset) => {
      chart.getDatasetMeta(0).data.forEach((bar, index) => {
        ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
      });
    });
  }
};

function criarGrafico(id, labels, data, label, cor){
  if (graficos[id]) graficos[id].destroy();
  const el = document.getElementById(id);
  if (!el) return;

  graficos[id] = new Chart(el, {
    type: "bar",
    data: { labels, datasets: [{ label, data, backgroundColor: cor }] },
    options: { responsive:true, scales:{ y:{beginAtZero:true} } },
    plugins:[pluginValor]
  });
}

ref.on("value", snap=>{
  dados=[];
  snap.forEach(c=>dados.push(c.val()));
  atualizar();
});

function atualizar(){

let meses={}, docas={}, total=0, tc=0, outros=0;

let turnos={
"1":{total:0,pred:{},dia:{},ov:{},abs:{},seg:0},
"2":{total:0,pred:{},dia:{},ov:{},abs:{},seg:0}
};

dados.forEach(d=>{
let p=Number(d.parada||0);
let mes=(d.data||"").substring(0,7);
let doca=d.doca||"";
let t=String(d.turno||"");

total+=p;
meses[mes]=(meses[mes]||0)+p;
docas[doca]=(docas[doca]||0)+p;

if(["1C","1T","1K","1G"].includes(doca)) tc+=p;
else outros+=p;

if(turnos[t]){
let x=turnos[t];
x.total+=p;
x.pred[d.predio]=(x.pred[d.predio]||0)+p;
x.dia[d.data]=(x.dia[d.data]||0)+p;
x.ov[d.data]=(x.ov[d.data]||0)+Number(d.ovacaoImportado||0);
x.abs[d.data]=(x.abs[d.data]||0)+Number(d.absenteismo||0);
x.seg+=Number(d.acidentes||0);
}
});

criarGrafico("graficoDocas",["T&C","BODY/STAMP/PWT","TOTAL"],[tc,outros,total],"Total",["#3498db","#3498db","#e67e22"]);
criarGrafico("graficoMensal",Object.keys(meses),Object.values(meses),"Mensal","#3498db");
criarGrafico("graficoDocaAnual",Object.keys(docas),Object.values(docas),"Doca","#3498db");

["1","2"].forEach(t=>{
let s=t==="1"?"_t1":"_t2";
let cor=t==="1"?"#3498db":"#e67e22";
let d=turnos[t];

criarGrafico("g1"+s,["Total"],[d.total], "Total",cor);
criarGrafico("g2"+s,Object.keys(d.pred),Object.values(d.pred),"Prédio",cor);
criarGrafico("g_parada_dia"+s,Object.keys(d.dia),Object.values(d.dia),"Parada Dia",cor);
criarGrafico("g_ovacao_dia"+s,Object.keys(d.ov),Object.values(d.ov),"Ovação",cor);
criarGrafico("g7"+s,Object.keys(d.abs),Object.values(d.abs),"Absenteísmo",cor);
criarGrafico("g8"+s,["Acidentes"],[d.seg],"Segurança",cor);
});

}

window.filtrarData=function(){
let f=filtroData.value,html="",total=0;

dados.filter(d=>d.data===f).forEach(d=>{
total+=Number(d.parada||0);
html+=`<tr>
<td>${d.data}</td><td>${d.predio}</td><td>${d.doca}</td>
<td>${d.turno}</td><td>${d.parada}</td>
<td>${d.motivoParada}</td><td>${d.causaParada}</td>
<td>${d.absenteismo}</td><td>${d.recLocal}</td>
<td>${d.obsLocal}</td><td>${d.recImportado}</td>
<td>${d.ovacaoImportado}</td><td>${d.obsImportado}</td>
</tr>`;
});

historico.innerHTML=html;
tabela.style.display="table";
kpisDia.innerHTML="Total do dia: "+total;
};

window.exportarExcel=function(){
let csv="Data;Predio;Doca;Turno;Parada\n";
dados.forEach(d=>csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`);
let blob=new Blob(["\uFEFF"+csv]);
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="dados.csv";
a.click();
};

formulario.addEventListener("submit",e=>{
e.preventDefault();

ref.push({
data:data.value,
predio:predio.value,
doca:doca.value,
turno:turno.value,
parada:Number(parada.value||0),
motivoParada:motivoParada.value,
causaParada:causaParada.value,
recLocal:Number(recLocal.value||0),
obsLocal:obsLocal.value,
recImportado:Number(recImportado.value||0),
ovacaoImportado:Number(ovacaoImportado.value||0),
obsImportado:obsImportado.value,
absenteismo:Number(absenteismo.value||0),
acidentes:Number(acidentes.value||0)
});

formulario.reset();
turno.value="1";
});

});
