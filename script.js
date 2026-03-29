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

function formatarTempo(v){
  if(v>=1440) return (v/1440).toFixed(1)+"d";
  if(v>=60) return (v/60).toFixed(1)+"h";
  return v+"m";
}

const pluginValor={
  id:"valorTopo",
  afterDatasetsDraw(chart){
    const {ctx}=chart;
    chart.data.datasets.forEach((d,i)=>{
      chart.getDatasetMeta(i).data.forEach((bar,idx)=>{
        ctx.fillText(formatarTempo(d.data[idx]),bar.x,bar.y-5);
      });
    });
  }
};

function criar(id,labels,data,label){
  if(graficos[id]) graficos[id].destroy();
  let el=document.getElementById(id);
  if(!el) return;

  graficos[id]=new Chart(el,{
    type:"bar",
    data:{labels,datasets:[{label,data}]},
    plugins:[pluginValor]
  });
}

ref.on("value",snap=>{
  dados=[];
  snap.forEach(c=>dados.push(c.val()));
  atualizar();
});

function atualizar(){

let meses={};

dados.forEach(d=>{
  let mes=d.data?.substring(0,7);
  meses[mes]=(meses[mes]||0)+Number(d.parada||0);
});

criar("graficoMensal",Object.keys(meses),Object.values(meses),"Parada Mensal");

// TURNOS
let turnos={"1":{}, "2":{}};

dados.forEach(d=>{
  let t=turnos[d.turno];
  if(!t) return;

  let p=Number(d.parada||0);

  t.total=(t.total||0)+p;

  t.pred=t.pred||{};
  t.pred[d.predio]=(t.pred[d.predio]||0)+p;

  let mes=d.data?.substring(0,7);
  t.predMes=t.predMes||{};
  t.predMes[mes]=(t.predMes[mes]||0)+p;

  t.doca=t.doca||{};
  t.doca[d.doca]=(t.doca[d.doca]||0)+p;
});

["1","2"].forEach(t=>{
  let s=t==="1"?"_t1":"_t2";
  let d=turnos[t];

  criar("g1"+s,["Total"],[d.total||0],"Parada Total ANUAL");
  criar("g2"+s,Object.keys(d.pred||{}),Object.values(d.pred||{}),"Parada por Prédio ANUAL");
  criar("g2m"+s,Object.keys(d.predMes||{}),Object.values(d.predMes||{}),"Parada por Prédio Mensal");
  criar("g_doca"+s,Object.keys(d.doca||{}),Object.values(d.doca||{}),"Parada por Doca ANUAL");
});

}

// BOTÃO TURNOS
window.mostrarTurno=function(t){
  let t1=document.getElementById("turno1");
  let t2=document.getElementById("turno2");

  if(t==="1"){t1.classList.remove("oculto");t2.classList.add("oculto");}
  else if(t==="2"){t2.classList.remove("oculto");t1.classList.add("oculto");}
  else{t1.classList.remove("oculto");t2.classList.remove("oculto");}
};

// FILTRO
window.filtrarData=function(){
  let f=filtroData.value;
  let html="";
  dados.filter(d=>d.data===f).forEach(d=>{
    html+=`<tr><td>${d.data}</td><td>${d.predio}</td><td>${d.doca}</td></tr>`;
  });
  historico.innerHTML=html;
  tabela.style.display="table";
};

// EXPORTAR
window.exportarExcel=function(){
  let csv="Data;Predio;Doca\n";
  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca}\n`;
  });
  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="dados.csv";
  a.click();
};

// SALVAR
formulario.addEventListener("submit",e=>{
  e.preventDefault();

  ref.push({
    data:data.value,
    predio:predio.value,
    doca:doca.value,
    turno:turno.value,
    parada:parada.value,
    motivoParada:motivoParada.value,
    causaParada:causaParada.value,
    recLocal:recLocal.value,
    obsLocal:obsLocal.value,
    recImportado:recImportado.value,
    ovacaoImportado:ovacaoImportado.value,
    obsImportado:obsImportado.value,
    absenteismo:absenteismo.value,
    acidentes:acidentes.value
  });

  formulario.reset();
});

});
