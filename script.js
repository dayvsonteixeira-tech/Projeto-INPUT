// 🔥 (RESUMIDO PRA NÃO FICAR GIGANTE — MAS COMPLETO FUNCIONAL)

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

let dados=[];
let graficos={};

// 🔄 CARREGAR
ref.on("value", snap=>{
  dados=[];
  snap.forEach(c=>dados.push(c.val()));
  atualizar();
});

function atualizar(){

  let tc=0,outros=0,total=0,meses={},docas={};

  dados.forEach(d=>{
    let p=Number(d.parada||0);
    total+=p;

    let mes=(d.data||"").substring(0,7);

    if(mes) meses[mes]=(meses[mes]||0)+p;

    docas[d.doca]=(docas[d.doca]||0)+p;

    ["1C","1T","1K","1G"].includes(d.doca)?tc+=p:outros+=p;
  });

  criar("graficoDocas",["T&C","BODY/STAMP/PWT","TOTAL"],[tc,outros,total],["#3498db","#3498db","#e67e22"]);
  criar("graficoMensal",Object.keys(meses),Object.values(meses));
  criar("graficoDocaAnual",Object.keys(docas),Object.values(docas));

}

// 🔹 FUNÇÃO GRÁFICO
function criar(id,l,d,c="#3498db"){
  if(graficos[id]) graficos[id].destroy();
  let el=document.getElementById(id);
  if(!el)return;

  graficos[id]=new Chart(el,{
    type:"bar",
    data:{labels:l,datasets:[{data:d,backgroundColor:c}]},
    options:{responsive:true}
  });
}

// 🔍 FILTRO
window.filtrarData=function(){
  let f=filtroData.value,total=0,html="";
  dados.filter(d=>d.data===f).forEach(d=>{
    total+=Number(d.parada||0);
    html+=`<tr><td>${d.data}</td><td>${d.predio}</td><td>${d.doca}</td><td>${d.turno}</td><td>${d.parada}</td></tr>`;
  });
  historico.innerHTML=html;
  tabela.style.display="table";
  kpisDia.innerHTML="Total Geral: "+total;
};

// 📥 EXPORTAR
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

// 💾 SALVAR
formulario.addEventListener("submit",e=>{
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

  formulario.reset();
  turno.value="1";
});

});
