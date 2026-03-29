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

ref.on("value", snap=>{
  dados=[];
  snap.forEach(c=>dados.push(c.val()));
  atualizar();
});

function formatarTempo(min){
  if(min >= 1440) return (min/1440).toFixed(1)+" dias";
  if(min >= 60) return (min/60).toFixed(1)+" h";
  return min+" min";
}

function criar(id, labels, valores){
  if(graficos[id]) graficos[id].destroy();

  graficos[id] = new Chart(document.getElementById(id),{
    type:"bar",
    data:{
      labels:labels,
      datasets:[{data:valores}]
    },
    options:{
      responsive:true,
      plugins:{
        tooltip:{
          callbacks:{
            label:(ctx)=>formatarTempo(ctx.raw)
          }
        }
      }
    }
  });
}

function atualizar(){

  let turnos = {"1":{}, "2":{}};

  dados.forEach(d=>{
    let t = turnos[d.turno];
    if(!t) return;

    let p = Number(d.parada||0);

    t.total=(t.total||0)+p;

    t.pred=t.pred||{};
    t.pred[d.predio]=(t.pred[d.predio]||0)+p;

    let mes = d.data?.substring(0,7);

    t.predMes=t.predMes||{};
    t.predMes[mes]=(t.predMes[mes]||0)+p;

    t.doca=t.doca||{};
    t.doca[d.doca]=(t.doca[d.doca]||0)+p;
  });

  ["1","2"].forEach(t=>{
    let s = t==="1"?"t1":"t2";
    let d = turnos[t];

    criar(`${s}_total`,["Total"],[d.total||0]);
    criar(`${s}_predio`,Object.keys(d.pred||{}),Object.values(d.pred||{}));
    criar(`${s}_predio_mes`,Object.keys(d.predMes||{}),Object.values(d.predMes||{}));
    criar(`${s}_doca`,Object.keys(d.doca||{}),Object.values(d.doca||{}));
  });

}

window.mostrarTurno=function(t){
  const t1=document.getElementById("turno1");
  const t2=document.getElementById("turno2");

  if(t==="1"){
    t1.classList.remove("oculto");
    t2.classList.add("oculto");
  }else if(t==="2"){
    t2.classList.remove("oculto");
    t1.classList.add("oculto");
  }else{
    t1.classList.remove("oculto");
    t2.classList.remove("oculto");
  }
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
});

});
