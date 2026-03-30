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


// 🔝 VALORES NAS BARRAS
const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
        ctx.restore();
      });
    });
  }
};


// 📊 FUNÇÃO PADRÃO
function criarGrafico(id, labels, data, label, cor="#3498db"){
  if (graficos[id]) graficos[id].destroy();

  const el = document.getElementById(id);
  if (!el) return;

  graficos[id] = new Chart(el.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: cor
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    },
    plugins: [pluginValor]
  });
}


// 🔄 CARREGAMENTO
ref.on("value", snap => {
  dados = [];

  snap.forEach(c => {
    let d = c.val();

    d.turno = String(d.turno || "").replace(/\D/g, "").substring(0,1);

    dados.push(d);
  });

  atualizarTudo();
});


// 🔥 ATUALIZAÇÃO TOTAL
function atualizarTudo(){

  let total=0, tc=0, outros=0;
  let meses={}, docas={};

  let turnos = {
    "1": { total:0, pred:{}, doca:{}, dia:{}, ovacao:{}, absDia:{}, seg:0 },
    "2": { total:0, pred:{}, doca:{}, dia:{}, ovacao:{}, absDia:{}, seg:0 }
  };

  dados.forEach(d=>{

    let p = Number(d.parada||0);
    let data = d.data || "";
    let mes = data.substring(0,7);
    let doca = d.doca || "";
    let turno = d.turno;

    total += p;
    meses[mes] = (meses[mes]||0)+p;
    docas[doca] = (docas[doca]||0)+p;

    if(["1C","1T","1K","1G"].includes(doca)) tc+=p;
    else outros+=p;

    if(turnos[turno]){
      let t = turnos[turno];

      t.total += p;
      t.pred[d.predio] = (t.pred[d.predio]||0)+p;
      t.doca[doca] = (t.doca[doca]||0)+p;
      t.dia[data] = (t.dia[data]||0)+p;
      t.ovacao[data] = (t.ovacao[data]||0)+Number(d.ovacaoImportado||0);
      t.absDia[data] = (t.absDia[data]||0)+Number(d.absenteismo||0);
      t.seg += Number(d.acidentes||0);
    }

  });

  // 🔥 PRINCIPAL ANUAL
  criarGrafico("graficoDocas",
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


  // 🔥 TURNOS
  ["1","2"].forEach(t=>{
    let s = t==="1"?"_t1":"_t2";
    let cor = t==="1"?"#3498db":"#e67e22";
    let d = turnos[t];

    criarGrafico("g1"+s,["Total"],[d.total],"Parada Total ANUAL",cor);

    criarGrafico("g2"+s,
      Object.keys(d.pred),
      Object.values(d.pred),
      "Parada por Prédio ANUAL",
      cor
    );

    criarGrafico("g_doca"+s,
      Object.keys(d.doca),
      Object.values(d.doca),
      "Parada por Doca ANUAL",
      cor
    );

    criarGrafico("g_parada_dia"+s,
      Object.keys(d.dia),
      Object.values(d.dia),
      "Parada por Dia (MINUTOS)",
      cor
    );

    criarGrafico("g_ovacao_dia"+s,
      Object.keys(d.ovacao),
      Object.values(d.ovacao),
      "Ovação por Dia",
      cor
    );

    criarGrafico("g_abs_dia"+s,
      Object.keys(d.absDia),
      Object.values(d.absDia),
      "Absenteísmo por Dia",
      cor
    );

    criarGrafico("g_seg"+s,
      ["Acidentes"],
      [d.seg],
      "Segurança",
      cor
    );

  });

}


// 🔍 FILTRO COMPLETO
window.filtrarData = function(){

  let f = document.getElementById("filtroData").value;
  let total=0;
  let html="";

  dados.filter(d=>d.data===f).forEach(d=>{
    total+=Number(d.parada||0);

    html+=`
    <tr>
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

  document.getElementById("historico").innerHTML = html;
  document.getElementById("tabela").style.display = "table";
  document.getElementById("kpisDia").innerHTML =
    "<b>Total do Dia:</b> "+total;
};


// 📥 EXPORTAR
window.exportarExcel = function(){

  let csv = "Data;Predio;Doca;Turno;Parada;Motivo;Causa;Abs;Local;ObsLocal;Importado;Ovacao;ObsImportado\n";

  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada};
    ${d.motivoParada||""};${d.causaParada||""};
    ${d.absenteismo||0};${d.recLocal||0};
    ${d.obsLocal||""};${d.recImportado||0};
    ${d.ovacaoImportado||0};${d.obsImportado||""}\n`;
  });

  let blob = new Blob(["\uFEFF"+csv]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "relatorio.csv";
  a.click();
};


// 💾 SALVAR
document.getElementById("formulario").addEventListener("submit", e=>{
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
