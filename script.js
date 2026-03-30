document.addEventListener("DOMContentLoaded", () => {

const firebaseConfig = {
  apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
  authDomain: "controle-gerencial-75f09.firebaseapp.com",
  databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
  projectId: "controle-gerencial-75f09"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const refDados = db.ref("registros");

let dados = [];
let graficoPrincipal;
let graficos = {};

const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
        ctx.restore();
      });
    });
  }
};

function opcoesGrafico() {
  return {
    responsive: true,
    scales: { y: { beginAtZero: true } }
  };
}

refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => {
    const item = child.val();
    item.turno = String(item.turno || "").replace(/\D/g, "").substring(0,1);
    dados.push(item);
  });

  atualizarGraficoPrincipal();
  atualizarDashboard();
});

function atualizarGraficoPrincipal() {

  let tc=0, outros=0, total=0;
  let meses={}, docas={};

  dados.forEach(d=>{
    let p=Number(d.parada||0);
    total+=p;

    if(["1C","1T","1K","1G"].includes(d.doca)) tc+=p;
    else outros+=p;

    if(d.data){
      let mes=d.data.substring(0,7);
      meses[mes]=(meses[mes]||0)+p;
    }

    docas[d.doca]=(docas[d.doca]||0)+p;
  });

  if(graficoPrincipal) graficoPrincipal.destroy();

  graficoPrincipal=new Chart(document.getElementById("graficoDocas"),{
    type:"bar",
    data:{
      labels:["T&C","BODY/STAMP/PWT","TOTAL"],
      datasets:[{
        data:[tc,outros,total],
        backgroundColor:["#3498db","#3498db","#e67e22"]
      }]
    },
    options:opcoesGrafico(),
    plugins:[pluginValor]
  });

  if(graficos.mensal) graficos.mensal.destroy();
  graficos.mensal=new Chart(document.getElementById("graficoMensal"),{
    type:"bar",
    data:{
      labels:Object.keys(meses),
      datasets:[{
        data:Object.values(meses),
        backgroundColor:"#3498db"
      }]
    },
    options:opcoesGrafico(),
    plugins:[pluginValor]
  });

  if(graficos.doca) graficos.doca.destroy();
  graficos.doca=new Chart(document.getElementById("graficoDocaAnual"),{
    type:"bar",
    data:{
      labels:Object.keys(docas),
      datasets:[{
        data:Object.values(docas),
        backgroundColor:"#3498db"
      }]
    },
    options:opcoesGrafico(),
    plugins:[pluginValor]
  });
}

// 🔥 NÃO MEXI NOS TURNOS
function atualizarDashboard() {

  let turnos = {
    "1": { total:0, pred:{}, dia:{} },
    "2": { total:0, pred:{}, dia:{} }
  };

  dados.forEach(d=>{
    let t=turnos[d.turno];
    if(!t) return;

    let p=Number(d.parada||0);

    t.total+=p;
    t.pred[d.predio]=(t.pred[d.predio]||0)+p;
    t.dia[d.data]=(t.dia[d.data]||0)+p;
  });

  function criar(id,labels,data,cor){
    if(graficos[id]) graficos[id].destroy();
    graficos[id]=new Chart(document.getElementById(id),{
      type:"bar",
      data:{labels:labels,datasets:[{data:data,backgroundColor:cor}]}
    });
  }

  criar("g1_t1",["Total"],[turnos["1"].total],"#3498db");
  criar("g2_t1",Object.keys(turnos["1"].pred),Object.values(turnos["1"].pred),"#3498db");
  criar("g_parada_dia_t1",Object.keys(turnos["1"].dia),Object.values(turnos["1"].dia),"#3498db");

  criar("g1_t2",["Total"],[turnos["2"].total],"#e67e22");
  criar("g2_t2",Object.keys(turnos["2"].pred),Object.values(turnos["2"].pred),"#e67e22");
  criar("g_parada_dia_t2",Object.keys(turnos["2"].dia),Object.values(turnos["2"].dia),"#e67e22");
}

document.getElementById("formulario").addEventListener("submit",e=>{
  e.preventDefault();

  refDados.push({
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
    causaParada:causaParada.value,
    obsLocal:obsLocal.value,
    obsImportado:obsImportado.value
  });

  e.target.reset();
});

});
