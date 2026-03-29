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
let graficos = {};


// 🔹 FORMATAR TEMPO (min → h → dias)
function formatarTempo(min){
  if(min >= 1440) return (min/1440).toFixed(1)+"d";
  if(min >= 60) return (min/60).toFixed(1)+"h";
  return min+"m";
}


// 🔹 PLUGIN VALORES
const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        let valor = dataset.data[index];

        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(formatarTempo(valor), bar.x, bar.y - 5);
        ctx.restore();
      });
    });
  }
};


// 🔹 CRIAR GRÁFICO (SEM BUG)
function criarGrafico(id, labels, data, label){

  const canvas = document.getElementById(id);
  if(!canvas) return;

  if(graficos[id]){
    graficos[id].destroy();
  }

  graficos[id] = new Chart(canvas.getContext("2d"),{
    type:"bar",
    data:{
      labels: labels,
      datasets:[{
        label: label,
        data: data
      }]
    },
    options:{
      responsive:true,
      scales:{
        y:{
          beginAtZero:true,
          ticks:{ stepSize:1 }
        }
      }
    },
    plugins:[pluginValor]
  });
}


// 🔹 ATUALIZAÇÃO GERAL
refDados.on("value", snapshot => {

  dados = [];
  snapshot.forEach(child => {
    let d = child.val();

    // 🔒 normalizar turno (CORREÇÃO DO BUG)
    d.turno = String(d.turno || "").replace(/\D/g,"").substring(0,1);

    dados.push(d);
  });

  atualizarDashboard();
  atualizarMensal();
});


// 🔹 GRÁFICO MENSAL PRINCIPAL
function atualizarMensal(){

  let meses = {};

  dados.forEach(d=>{
    if(!d.data) return;

    let mes = d.data.substring(0,7);
    meses[mes] = (meses[mes] || 0) + Number(d.parada || 0);
  });

  criarGrafico(
    "graficoMensal",
    Object.keys(meses),
    Object.values(meses),
    "Parada Acumulada (Mensal)"
  );
}


// 🔹 DASHBOARD POR TURNO (SEM QUEBRAR NADA)
function atualizarDashboard(){

  let turnos = {
    "1": { total:0, pred:{}, predMes:{}, doca:{} },
    "2": { total:0, pred:{}, predMes:{}, doca:{} }
  };

  dados.forEach(d=>{

    let t = turnos[d.turno];
    if(!t) return;

    let parada = Number(d.parada || 0);

    // TOTAL
    t.total += parada;

    // PRÉDIO ANUAL
    t.pred[d.predio] = (t.pred[d.predio] || 0) + parada;

    // PRÉDIO MENSAL
    if(d.data){
      let mes = d.data.substring(0,7);
      t.predMes[mes] = (t.predMes[mes] || 0) + parada;
    }

    // DOCA ANUAL
    t.doca[d.doca] = (t.doca[d.doca] || 0) + parada;
  });


  ["1","2"].forEach(turno=>{

    let suf = turno === "1" ? "_t1" : "_t2";
    let d = turnos[turno];

    // 🔥 GRÁFICOS (EXATAMENTE COMO VOCÊ PEDIU)
    criarGrafico("g1"+suf, ["Total"], [d.total], "Parada Total ANUAL");

    criarGrafico(
      "g2"+suf,
      Object.keys(d.pred),
      Object.values(d.pred),
      "Parada por Prédio ANUAL"
    );

    criarGrafico(
      "g2m"+suf,
      Object.keys(d.predMes),
      Object.values(d.predMes),
      "Parada por Prédio Mensal"
    );

    criarGrafico(
      "g_doca"+suf,
      Object.keys(d.doca),
      Object.values(d.doca),
      "Parada por Doca ANUAL"
    );

  });

}


// 🔹 BOTÃO TURNOS (CORRIGIDO)
window.mostrarTurno = function(tipo){

  const t1 = document.getElementById("turno1");
  const t2 = document.getElementById("turno2");

  if(!t1 || !t2) return;

  if(tipo === "1"){
    t1.classList.remove("oculto");
    t2.classList.add("oculto");
  }
  else if(tipo === "2"){
    t2.classList.remove("oculto");
    t1.classList.add("oculto");
  }
  else{
    t1.classList.remove("oculto");
    t2.classList.remove("oculto");
  }
};


// 🔹 FILTRO (MANTIDO)
window.filtrarData = function(){

  let f = filtroData.value;
  historico.innerHTML = "";

  dados.filter(d=>d.data === f).forEach(d=>{
    historico.innerHTML += `
      <tr>
        <td>${d.data}</td>
        <td>${d.predio}</td>
        <td>${d.doca}</td>
        <td>${d.turno}</td>
        <td>${d.parada}</td>
      </tr>`;
  });

  tabela.style.display = "table";
};


// 🔹 EXPORTAR (MANTIDO)
window.exportarExcel = function(){

  let csv = "Data;Predio;Doca;Turno;Parada\n";

  dados.forEach(d=>{
    csv += `${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`;
  });

  let blob = new Blob(["\uFEFF"+csv]);
  let a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "dados.csv";
  a.click();
};


// 🔹 SALVAR (SEM BUG)
formulario.addEventListener("submit", e => {
  e.preventDefault();

  refDados.push({
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    turno: turno.value,
    parada: Number(parada.value || 0),

    motivoParada: motivoParada.value,
    causaParada: causaParada.value,

    recLocal: Number(recLocal.value || 0),
    obsLocal: obsLocal.value,

    recImportado: Number(recImportado.value || 0),
    ovacaoImportado: Number(ovacaoImportado.value || 0),
    obsImportado: obsImportado.value,

    absenteismo: Number(absenteismo.value || 0),
    acidentes: Number(acidentes.value || 0)
  });

  formulario.reset();
  turno.value = "1";
});

});
