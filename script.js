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


// 🔝 PLUGIN VALORES
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


// 📊 CRIAR GRÁFICO
function criarGrafico(id, labels, data, label, cor) {

  if (graficos[id]) graficos[id].destroy();

  const el = document.getElementById(id);
  if (!el) return;

  graficos[id] = new Chart(el, {
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
ref.on("value", snap => {

  dados = [];

  snap.forEach(c => {
    let d = c.val();

    dados.push({
      data: d.data || "",
      predio: d.predio || "",
      doca: d.doca || "",
      turno: String(d.turno || "").replace(/\D/g, "").substring(0,1),
      parada: Number(d.parada || 0),
      recLocal: Number(d.recLocal || 0),
      recImportado: Number(d.recImportado || 0),
      ovacaoImportado: Number(d.ovacaoImportado || 0),
      absenteismo: Number(d.absenteismo || 0),
      acidentes: Number(d.acidentes || 0),
      motivoParada: d.motivoParada || "",
      causaParada: d.causaParada || "",
      obsLocal: d.obsLocal || "",
      obsImportado: d.obsImportado || ""
    });
  });

  atualizar();
});


// 🔥 ATUALIZAÇÃO GERAL
function atualizar(){

  let tc = 0, outros = 0, total = 0;
  let meses = {};
  let docas = {};

  let turnos = {
    "1": { total:0, pred:{}, doca:{}, dia:{}, ovacao:{}, abs:{}, seg:0 },
    "2": { total:0, pred:{}, doca:{}, dia:{}, ovacao:{}, abs:{}, seg:0 }
  };

  dados.forEach(d => {

    let p = d.parada;
    let data = d.data;
    let mes = data.substring(0,7);
    let doca = d.doca;
    let t = d.turno;

    total += p;

    meses[mes] = (meses[mes] || 0) + p;
    docas[doca] = (docas[doca] || 0) + p;

    if (["1C","1T","1K","1G"].includes(doca)) tc += p;
    else outros += p;

    if (turnos[t]) {
      let turno = turnos[t];

      turno.total += p;

      turno.pred[d.predio] = (turno.pred[d.predio] || 0) + p;
      turno.doca[doca] = (turno.doca[doca] || 0) + p;
      turno.dia[data] = (turno.dia[data] || 0) + p;
      turno.ovacao[data] = (turno.ovacao[data] || 0) + d.ovacaoImportado;
      turno.abs[data] = (turno.abs[data] || 0) + d.absenteismo;
      turno.seg += d.acidentes;
    }

  });


  // 🔥 PRINCIPAL
  criarGrafico("graficoDocas",
    ["T&C","BODY/STAMP/PWT","TOTAL"],
    [tc,outros,total],
    "Parada Acumulada",
    ["#3498db","#3498db","#e67e22"]
  );


  // 🔥 MENSAL
  criarGrafico("graficoMensal",
    Object.keys(meses).sort(),
    Object.keys(meses).sort().map(m => meses[m]),
    "Parada Mensal",
    "#3498db"
  );


  // 🔥 DOCA
  criarGrafico("graficoDocaAnual",
    Object.keys(docas),
    Object.values(docas),
    "Parada por Doca",
    "#3498db"
  );


  // 🔥 TURNOS
  ["1","2"].forEach(t => {

    let s = t === "1" ? "_t1" : "_t2";
    let cor = t === "1" ? "#3498db" : "#e67e22";
    let d = turnos[t];

    criarGrafico("g1"+s, ["Total"], [d.total], "Parada Total ANUAL", cor);

    criarGrafico("g2"+s,
      Object.keys(d.pred),
      Object.values(d.pred),
      "Parada por Prédio ANUAL",
      cor
    );

    criarGrafico("g_parada_dia"+s,
      Object.keys(d.dia).sort(),
      Object.keys(d.dia).sort().map(x => d.dia[x]),
      "Parada por Dia (MINUTOS)",
      cor
    );

    criarGrafico("g_ovacao_dia"+s,
      Object.keys(d.ovacao).sort(),
      Object.keys(d.ovacao).sort().map(x => d.ovacao[x]),
      "Ovação por Dia",
      cor
    );

    criarGrafico("g7"+s,
      Object.keys(d.abs).sort(),
      Object.keys(d.abs).sort().map(x => d.abs[x]),
      "Absenteísmo por Dia",
      cor
    );

    criarGrafico("g8"+s,
      ["Acidentes"],
      [d.seg],
      "Segurança",
      cor
    );

  });

}


// 🔍 FILTRO
window.filtrarData = function(){

  let f = document.getElementById("filtroData").value;

  let html = "";
  let total = 0;

  dados.filter(d => d.data === f).forEach(d => {

    total += d.parada;

    html += `
    <tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${d.turno}</td>
      <td>${d.parada}</td>
      <td>${d.motivoParada}</td>
      <td>${d.causaParada}</td>
      <td>${d.absenteismo}</td>
      <td>${d.recLocal}</td>
      <td>${d.obsLocal}</td>
      <td>${d.recImportado}</td>
      <td>${d.ovacaoImportado}</td>
      <td>${d.obsImportado}</td>
    </tr>`;
  });

  document.getElementById("historico").innerHTML = html;
  document.getElementById("tabela").style.display = "table";
  document.getElementById("kpisDia").innerHTML = "Total do dia: " + total;

};


// 📥 EXPORTAR
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


// 💾 SALVAR
document.getElementById("formulario").addEventListener("submit", e => {
  e.preventDefault();

  const registro = {
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
  };

  ref.push(registro);
  e.target.reset();
  turno.value = "1";
});

});
