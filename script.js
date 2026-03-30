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
let graficos = {};

ref.on("value", snap => {
  dados = [];
  snap.forEach(c => dados.push(c.val()));
  atualizar();
});

function criarGrafico(id, labels, data, cor="#3498db"){
  if(graficos[id]) graficos[id].destroy();

  const ctx = document.getElementById(id);
  if(!ctx) return;

  graficos[id] = new Chart(ctx, {
    type:"bar",
    data:{
      labels:labels,
      datasets:[{
        data:data,
        backgroundColor:cor
      }]
    }
  });
}

function atualizar(){

  let tc=0, outros=0, total=0;
  let meses={}, docas={};

  let t1={total:0,pred:{},dia:{}};
  let t2={total:0,pred:{},dia:{}};

  dados.forEach(d=>{
    let p=Number(d.parada||0);
    let mes=(d.data||"").substring(0,7);
    let doca=d.doca||"";

    total+=p;
    meses[mes]=(meses[mes]||0)+p;
    docas[doca]=(docas[doca]||0)+p;

    if(["1C","1T","1K","1G"].includes(doca)) tc+=p;
    else outros+=p;

    let t=d.turno==="1"?t1:t2;

    t.total+=p;
    t.pred[d.predio]=(t.pred[d.predio]||0)+p;
    t.dia[d.data]=(t.dia[d.data]||0)+p;
  });

  // ANUAL
  criarGrafico("graficoAnual",
    ["T&C","OUTROS","TOTAL"],
    [tc,outros,total],
    ["#3498db","#3498db","#e67e22"]
  );

  // MENSAL
  criarGrafico("graficoMensal",
    Object.keys(meses),
    Object.values(meses)
  );

  // DOCA
  criarGrafico("graficoDoca",
    Object.keys(docas),
    Object.values(docas)
  );

  // TURNOS
  criarGrafico("g1_t1",["Total"],[t1.total]);
  criarGrafico("g2_t1",Object.keys(t1.pred),Object.values(t1.pred));
  criarGrafico("g_parada_dia_t1",Object.keys(t1.dia),Object.values(t1.dia));

  criarGrafico("g1_t2",["Total"],[t2.total],"#e67e22");
  criarGrafico("g2_t2",Object.keys(t2.pred),Object.values(t2.pred),"#e67e22");
  criarGrafico("g_parada_dia_t2",Object.keys(t2.dia),Object.values(t2.dia),"#e67e22");
}

// FILTRO
window.filtrarData=function(){
  let f=document.getElementById("filtroData").value;
  let html="", total=0;

  dados.filter(d=>d.data===f).forEach(d=>{
    total+=Number(d.parada||0);

    html+=`<tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${d.turno}</td>
      <td>${d.parada}</td>
      <td>${d.motivoParada||""}</td>
      <td>${d.causaParada||""}</td>
      <td>${d.absenteismo||0}</td>
      <td>${d.recLocal||0}</td>
      <td>${d.obsLocal||""}</td>
      <td>${d.recImportado||0}</td>
      <td>${d.ovacaoImportado||0}</td>
      <td>${d.obsImportado||""}</td>
    </tr>`;
  });

  document.getElementById("historico").innerHTML=html;
  document.getElementById("tabela").style.display="table";
  document.getElementById("kpisDia").innerHTML="TOTAL DIA: "+total;
};

// EXPORTAR
window.exportarExcel=function(){
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

// SALVAR
document.getElementById("formulario").addEventListener("submit",e=>{
  e.preventDefault();

  ref.push({
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
