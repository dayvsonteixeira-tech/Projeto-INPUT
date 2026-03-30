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

function criarGrafico(id, labels, data, label, cor){
  if(graficos[id]) graficos[id].destroy();

  const ctx = document.getElementById(id);
  if(!ctx) return;

  graficos[id] = new Chart(ctx,{
    type:"bar",
    data:{
      labels,
      datasets:[{
        label,
        data,
        backgroundColor:cor
      }]
    }
  });
}

ref.on("value", snap=>{
  dados=[];
  snap.forEach(c=>dados.push(c.val()));
  atualizar();
});

function atualizar(){

  let tc=0, outros=0, total=0;
  let meses={}, docas={};

  let turnos={
    "1":{total:0,pred:{},doca:{},dia:{},abs:{},seg:0},
    "2":{total:0,pred:{},doca:{},dia:{},abs:{},seg:0}
  };

  dados.forEach(d=>{

    let p=Number(d.parada||0);
    let mes=d.data?.substring(0,7)||"";
    let doca=d.doca||"";

    total+=p;
    meses[mes]=(meses[mes]||0)+p;
    docas[doca]=(docas[doca]||0)+p;

    if(["1C","1T","1K","1G"].includes(doca)) tc+=p;
    else outros+=p;

    let t=turnos[d.turno];
    if(t){
      t.total+=p;
      t.pred[d.predio]=(t.pred[d.predio]||0)+p;
      t.doca[doca]=(t.doca[doca]||0)+p;
      t.dia[d.data]=(t.dia[d.data]||0)+p;
      t.abs[d.data]=(t.abs[d.data]||0)+Number(d.absenteismo||0);
      t.seg+=Number(d.acidentes||0);
    }

  });

  // PRINCIPAIS
  criarGrafico("graficoAnual",
    ["T&C","BODY/STAMP/PWT","TOTAL"],
    [tc,outros,total],
    "Parada Acumulada",
    ["#3498db","#3498db","#e67e22"]
  );

  criarGrafico("graficoMensal",
    Object.keys(meses),
    Object.values(meses),
    "Parada Mensal",
    "#3498db"
  );

  criarGrafico("graficoDoca",
    Object.keys(docas),
    Object.values(docas),
    "Parada por Doca",
    "#3498db"
  );

  // TURNOS
  ["1","2"].forEach(t=>{
    let cor = t==="1" ? "#3498db" : "#e67e22";
    let d = turnos[t];

    criarGrafico(`t${t}_total`,["Total"],[d.total],"Parada Total",cor);
    criarGrafico(`t${t}_predio`,Object.keys(d.pred),Object.values(d.pred),"Parada por Prédio",cor);
    criarGrafico(`t${t}_doca`,Object.keys(d.doca),Object.values(d.doca),"Parada por Doca",cor);
    criarGrafico(`t${t}_dia`,Object.keys(d.dia),Object.values(d.dia),"Parada por Dia (MINUTOS)",cor);
    criarGrafico(`t${t}_abs`,Object.keys(d.abs),Object.values(d.abs),"Absenteísmo por Dia",cor);
    criarGrafico(`t${t}_seg`,["Acidentes"],[d.seg],"Segurança",cor);
  });

}

// FILTRO
window.filtrarData=function(){
  let f=document.getElementById("filtroData").value;
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
  document.getElementById("kpisDia").innerHTML="Total do dia: "+total;
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
  a.download="relatorio.csv";
  a.click();
};

// SALVAR
document.getElementById("formulario").addEventListener("submit",e=>{
  e.preventDefault();

  const registro={
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
  };

  ref.push(registro);
  e.target.reset();
});
});
