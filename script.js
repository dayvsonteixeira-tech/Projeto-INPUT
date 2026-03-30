document.addEventListener("DOMContentLoaded", () => {

const firebaseConfig = {
  apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
  authDomain: "controle-gerencial-75f09.firebaseapp.com",
  databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
  projectId: "controle-gerencial-75f09"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const ref = db.ref("registros");

let dados = [];
let charts = {};

function criarGrafico(id, labels, data, cor="#3498db"){
  if(charts[id]) charts[id].destroy();

  const ctx = document.getElementById(id);
  if(!ctx) return;

  charts[id] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: cor
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, ticks:{stepSize:1} } }
    }
  });
}

ref.on("value", snap=>{
  dados=[];
  snap.forEach(c=>{
    let d=c.val();
    d.turno = String(d.turno||"").replace(/\D/g,"");
    dados.push(d);
  });
  atualizar();
});

function atualizar(){

let tc=0,outros=0,total=0;
let meses={},docas={};

let turnos={
  "1":{total:0,pred:{},doca:{},dia:{},absDia:{},seg:0},
  "2":{total:0,pred:{},doca:{},dia:{},absDia:{},seg:0}
};

dados.forEach(d=>{
  let p=Number(d.parada||0);
  let mes=(d.data||"").substring(0,7);

  total+=p;
  meses[mes]=(meses[mes]||0)+p;
  docas[d.doca]=(docas[d.doca]||0)+p;

  if(["1C","1T","1K","1G"].includes(d.doca)) tc+=p;
  else outros+=p;

  let t=turnos[d.turno];
  if(!t) return;

  t.total+=p;
  t.pred[d.predio]=(t.pred[d.predio]||0)+p;
  t.doca[d.doca]=(t.doca[d.doca]||0)+p;
  t.dia[d.data]=(t.dia[d.data]||0)+p;
  t.absDia[d.data]=(t.absDia[d.data]||0)+Number(d.absenteismo||0);
  t.seg+=Number(d.acidentes||0);
});

criarGrafico("graficoAnual",["T&C","OUTROS","TOTAL"],[tc,outros,total]);
criarGrafico("graficoMensal",Object.keys(meses),Object.values(meses));
criarGrafico("graficoDoca",Object.keys(docas),Object.values(docas));

["1","2"].forEach(t=>{
  let cor=t==="1"?"#3498db":"#e67e22";
  let d=turnos[t];

  criarGrafico(`t${t}_total`,["Total"],[d.total],cor);
  criarGrafico(`t${t}_predio`,Object.keys(d.pred),Object.values(d.pred),cor);
  criarGrafico(`t${t}_doca`,Object.keys(d.doca),Object.values(d.doca),cor);
  criarGrafico(`t${t}_dia`,Object.keys(d.dia),Object.values(d.dia),cor);
  criarGrafico(`t${t}_abs`,Object.keys(d.absDia),Object.values(d.absDia),cor);
  criarGrafico(`t${t}_seg`,["Acidentes"],[d.seg],cor);
});

}

// SALVAR
document.getElementById("formulario").addEventListener("submit",e=>{
  e.preventDefault();

  const r={
    data:data.value,
    predio:predio.value,
    doca:doca.value,
    turno:turno.value,
    parada:Number(parada.value||0),
    recLocal:Number(recLocal.value||0),
    recImportado:Number(recImportado.value||0),
    ovacaoImportado:Number(ovacaoImportado.value||0),
    absenteismo:Number(absenteismo.value||0),
    acidentes:Number(acidentes.value||0),
    motivoParada:motivoParada.value,
    causaParada:causaParada.value
  };

  ref.push(r);
  e.target.reset();
  turno.value="1";
});

// FILTRO
window.filtrarData=()=>{
  let f=filtroData.value;
  let html="";
  let total=0;

  dados.filter(d=>d.data===f).forEach(d=>{
    total+=Number(d.parada||0);
    html+=`<tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${d.turno}</td>
      <td>${d.parada}</td>
    </tr>`;
  });

  historico.innerHTML=html;
  tabela.style.display="table";
  kpisDia.innerHTML="Total do dia: "+total;
};

// EXPORTAR
window.exportarExcel=()=>{
  let csv="Data;Predio;Doca;Turno;Parada\n";
  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`;
  });

  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="dados.csv";
  a.click();
};

});
