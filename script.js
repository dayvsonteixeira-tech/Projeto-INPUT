document.addEventListener("DOMContentLoaded", () => {

// 🔥 FIREBASE CONFIG (COMPLETO)
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
const ref = db.ref("registros");

let dados = [];
let graficos = {};

// 🔝 PLUGIN VALORES
const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        let valor = dataset.data[index];

        function formatar(v){
          if(v >= 1440) return (v/1440).toFixed(1)+"d";
          if(v >= 60) return (v/60).toFixed(1)+"h";
          return v+"m";
        }

        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(formatar(valor), bar.x, bar.y - 5);
        ctx.restore();
      });
    });
  }
};

// 📊 FUNÇÃO BASE (CORRIGIDA)
function criarGrafico(id, labels, data, label, cor="#3498db"){

  if (graficos[id]) graficos[id].destroy();

  const canvas = document.getElementById(id);
  if (!canvas) return;

  graficos[id] = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: Array.isArray(cor) ? cor : cor
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    },
    plugins: [pluginValor]
  });
}

// 🔄 CARREGAR DADOS
ref.on("value", snapshot => {
  dados = [];

  snapshot.forEach(c => {
    let d = c.val();

    // 🔒 NORMALIZA TURNO
    d.turno = String(d.turno || "").replace(/\D/g, "").substring(0,1);

    dados.push(d);
  });

  atualizarTudo();
});

// 🔥 ATUALIZAÇÃO GERAL (CORRIGIDA)
function atualizarTudo(){

  let tc=0, outros=0, total=0;
  let meses={}, docas={}, docaMes={};

  let turnos = {
    "1": { total:0, pred:{}, predMes:{}, doca:{}, docaMes:{}, dia:{}, absDia:{}, seg:0 },
    "2": { total:0, pred:{}, predMes:{}, doca:{}, docaMes:{}, dia:{}, absDia:{}, seg:0 }
  };

  dados.forEach(d=>{
    let p = Number(d.parada||0);
    let data = d.data || "";
    let mes = data.substring(0,7);
    let doca = d.doca || "N/A";
    let turno = d.turno;

    total += p;

    if(mes){
      meses[mes] = (meses[mes]||0)+p;
    }

    docas[doca] = (docas[doca]||0)+p;

    if(!docaMes[doca]) docaMes[doca]={};
    if(mes) docaMes[doca][mes]=(docaMes[doca][mes]||0)+p;

    if(["1C","1T","1K","1G"].includes(doca)) tc+=p;
    else outros+=p;

    // TURNOS
    if(turnos[turno]){
      let t = turnos[turno];

      t.total += p;

      if(d.predio){
        t.pred[d.predio]=(t.pred[d.predio]||0)+p;
      }

      if(mes){
        t.predMes[mes]=(t.predMes[mes]||0)+p;
      }

      t.doca[doca]=(t.doca[doca]||0)+p;

      if(!t.docaMes[doca]) t.docaMes[doca]={};
      if(mes) t.docaMes[doca][mes]=(t.docaMes[doca][mes]||0)+p;

      if(data){
        t.dia[data]=(t.dia[data]||0)+p;
        t.absDia[data]=(t.absDia[data]||0)+Number(d.absenteismo||0);
      }

      t.seg += Number(d.acidentes||0);
    }

  });

  // 🔥 ANUAL
  criarGrafico("graficoAnual",
    ["T&C","BODY/STAMP/PWT","TOTAL"],
    [tc,outros,total],
    "Parada Acumulada",
    ["#3498db","#3498db","#e67e22"]
  );

  // 🔥 MENSAL
  criarGrafico("graficoMensal",
    Object.keys(meses),
    Object.values(meses),
    "Parada Mensal"
  );

  // 🔥 DOCA ANUAL
  criarGrafico("graficoDocaAnual",
    Object.keys(docas),
    Object.values(docas),
    "Parada por Doca"
  );

  // 🔥 DOCA MENSAL MULTI DATASET (CORRIGIDO)
  let labelsMes = Object.keys(meses);

  if(graficos["graficoDocaMensal"]) graficos["graficoDocaMensal"].destroy();

  const canvasDocaMensal = document.getElementById("graficoDocaMensal");
  if(canvasDocaMensal){
    graficos["graficoDocaMensal"] = new Chart(
      canvasDocaMensal.getContext("2d"),
      {
        type:"bar",
        data:{
          labels:labelsMes,
          datasets:Object.keys(docaMes).map(doca=>({
            label:doca,
            data:labelsMes.map(m=>docaMes[doca][m]||0)
          }))
        },
        options:{responsive:true},
        plugins:[pluginValor]
      }
    );
  }

  // 🔥 TURNOS
  ["1","2"].forEach(t=>{
    let d = turnos[t];

    criarGrafico(`t${t}_total`,["Total"],[d.total],"Parada Total ANUAL");

    criarGrafico(`t${t}_predio`,
      Object.keys(d.pred),
      Object.values(d.pred),
      "Parada por Prédio ANUAL"
    );

    criarGrafico(`t${t}_predio_mes`,
      Object.keys(d.predMes),
      Object.values(d.predMes),
      "Parada por Prédio Mensal"
    );

    criarGrafico(`t${t}_doca`,
      Object.keys(d.doca),
      Object.values(d.doca),
      "Parada por Doca ANUAL"
    );

    // 🔥 DOCA MENSAL CORRIGIDO
    let mesesTurno = Object.keys(d.predMes);

    criarGrafico(`t${t}_doca_mes`,
      mesesTurno,
      mesesTurno.map(m=>{
        return Object.keys(d.doca).reduce((acc, doca)=>{
          return acc + ((d.docaMes[doca] && d.docaMes[doca][m]) || 0);
        },0);
      }),
      "Parada por Doca Mensal"
    );

    criarGrafico(`t${t}_dia`,
      Object.keys(d.dia),
      Object.values(d.dia),
      "Parada por Dia (MINUTOS)"
    );

    criarGrafico(`t${t}_abs`,
      Object.keys(d.absDia),
      Object.values(d.absDia),
      "Absenteísmo por Dia"
    );

    criarGrafico(`t${t}_seg`,
      ["Acidentes"],
      [d.seg],
      "Segurança"
    );

  });

}

// 🔍 FILTRO DIA (MANTIDO)
window.filtrarData = function(){

  let f = document.getElementById("filtroData").value;
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

  document.getElementById("historico").innerHTML=html;
  document.getElementById("tabela").style.display="table";
  document.getElementById("kpisDia").innerHTML="Total Geral do Dia: "+total;
};

// 📥 EXPORTAR (MANTIDO)
window.exportarExcel=function(){

  let tipo=prompt("1=Dia / 2=Tudo");

  let lista=dados;

  if(tipo==="1"){
    let f=document.getElementById("filtroData").value;
    lista=dados.filter(d=>d.data===f);
  }

  let csv="Data;Predio;Doca;Turno;Parada\n";

  lista.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`;
  });

  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
};

// 🔥 BOTÃO TURNO (CORRIGIDO)
window.mostrarTurno=function(t){
  const t1 = document.getElementById("turno1");
  const t2 = document.getElementById("turno2");

  if(t==="1"){
    t1.classList.remove("oculto");
    t2.classList.add("oculto");
  }
  else if(t==="2"){
    t2.classList.remove("oculto");
    t1.classList.add("oculto");
  }
  else{
    t1.classList.remove("oculto");
    t2.classList.remove("oculto");
  }
};

// 💾 SALVAR (COMPLETO)
document.getElementById("formulario").addEventListener("submit",e=>{
  e.preventDefault();

  const registro = {
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    turno: turno.value,

    parada: Number(parada.value||0),

    motivoParada: motivoParada.value,
    causaParada: causaParada.value,

    recLocal: Number(recLocal.value||0),
    obsLocal: obsLocal.value,

    recImportado: Number(recImportado.value||0),
    ovacaoImportado: Number(ovacaoImportado.value||0),
    obsImportado: obsImportado.value,

    absenteismo: Number(absenteismo.value||0),
    acidentes: Number(acidentes.value||0)
  };

  ref.push(registro);
  e.target.reset();
  turno.value="1";
});

});
