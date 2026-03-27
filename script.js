// 🔥 FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
  authDomain: "controle-gerencial-75f09.firebaseapp.com",
  databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
  projectId: "controle-gerencial-75f09"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refDados = db.ref("registros");

let dados = [];
let graficoPrincipal;
let graficos = {};


// 🔝 PLUGIN VALORES NAS BARRAS
const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
        ctx.restore();
      });
    });
  }
};


// 📊 CONFIG PADRÃO (SEM DECIMAL)
function opcoesGrafico() {
  return {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            return Number.isInteger(value) ? value : null;
          }
        }
      }
    }
  };
}


// 💾 SALVAR DADOS (COM VALIDAÇÃO FORTE)
formulario.addEventListener("submit", e => {
  e.preventDefault();

  if (!parada.value || !recLocal.value || !recImportado.value) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  const turnoValue = String(turno.value).trim();

  // 🔒 VALIDAÇÃO ANTI-BUG
  if (turnoValue !== "1" && turnoValue !== "2") {
    alert("Turno inválido!");
    console.error("Erro: Turno inválido ao salvar:", turno.value);
    return;
  }

  const registro = {
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    turno: turnoValue,

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

  refDados.push(registro);
  formulario.reset();
});


// 🔄 TEMPO REAL
refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => dados.push(child.val()));

  atualizarGraficoPrincipal();
  atualizarDashboard();
});


// 📊 GRÁFICO PRINCIPAL
function atualizarGraficoPrincipal() {

  let tc = 0;
  let outros = 0;
  let total = 0;

  dados.forEach(d => {
    let p = Number(d.parada || 0);
    total += p;

    if (["1C", "1T", "1K", "1G"].includes(d.doca)) {
      tc += p;
    } else {
      outros += p;
    }
  });

  if (graficoPrincipal) graficoPrincipal.destroy();

  graficoPrincipal = new Chart(graficoDocas, {
    type: "bar",
    data: {
      labels: ["T&C", "BODY/STAMP/PWT", "TOTAL"],
      datasets: [{
        label: "Minutos Parados",
        data: [tc, outros, total]
      }]
    },
    options: opcoesGrafico(),
    plugins: [pluginValor]
  });
}


// 📊 FUNÇÃO BASE DE GRÁFICO
function criarGrafico(id, labels, data, label) {

  if (graficos[id]) graficos[id].destroy();

  graficos[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data
      }]
    },
    options: opcoesGrafico(),
    plugins: [pluginValor]
  });
}


// 📊 DASHBOARD COMPLETO (BLINDADO)
function atualizarDashboard() {

  let turnos = { "1": {}, "2": {} };

  dados.forEach(d => {

    let turnoKey = String(d.turno).trim();

    // 🔒 ANTI-BUG FORTE
    if (turnoKey !== "1" && turnoKey !== "2") {
      console.warn("Turno inválido ignorado:", d.turno);
      return;
    }

    let t = turnos[turnoKey];

    let parada = Number(d.parada || 0);

    t.total = (t.total || 0) + parada;

    // Prédio
    t.pred = t.pred || {};
    t.pred[d.predio] = (t.pred[d.predio] || 0) + parada;

    // Dia
    t.dia = t.dia || {};
    t.dia[d.data] = (t.dia[d.data] || 0) + parada;

    // Local
    t.local = t.local || {};
    t.local[d.data] = (t.local[d.data] || 0) + Number(d.recLocal || 0);

    // Importado
    t.importado = t.importado || {};
    t.importado[d.data] = (t.importado[d.data] || 0) + Number(d.recImportado || 0);

    // Ovação
    t.ovacao = (t.ovacao || 0) + Number(d.ovacaoImportado || 0);

    // Absenteísmo
    t.abs = (t.abs || 0) + Number(d.absenteismo || 0);

    // Segurança
    t.seg = (t.seg || 0) + Number(d.acidentes || 0);
  });


  ["1", "2"].forEach(turno => {

    let sufixo = turno === "1" ? "_t1" : "_t2";
    let d = turnos[turno] || {};

    criarGrafico("g1" + sufixo, ["Total"], [d.total || 0], "Parada Total");

    criarGrafico("g2" + sufixo,
      Object.keys(d.pred || {}),
      Object.values(d.pred || {}),
      "Parada por Prédio"
    );

    criarGrafico("g3" + sufixo,
      Object.keys(d.dia || {}),
      Object.values(d.dia || {}),
      "Parada por Dia"
    );

    criarGrafico("g4" + sufixo,
      Object.keys(d.local || {}),
      Object.values(d.local || {}),
      "Recebimento Local"
    );

    criarGrafico("g5" + sufixo,
      Object.keys(d.importado || {}),
      Object.values(d.importado || {}),
      "Recebimento Importado"
    );

    criarGrafico("g6" + sufixo,
      ["Ovação"],
      [d.ovacao || 0],
      "Ovação"
    );

    criarGrafico("g7" + sufixo,
      ["Absenteísmo"],
      [d.abs || 0],
      "Absenteísmo"
    );

    criarGrafico("g8" + sufixo,
      ["Segurança"],
      [d.seg || 0],
      "Segurança"
    );

  });
}


// 🔍 FILTRO (OCULTO)
function filtrarData() {

  let f = filtroData.value;

  historico.innerHTML = "";

  dados
    .filter(d => d.data === f)
    .forEach(d => {
      historico.innerHTML += `
      <tr>
        <td>${d.data}</td>
        <td>${d.predio}</td>
        <td>${d.doca}</td>
        <td>${d.turno}</td>
        <td>${d.parada}</td>
        <td>${d.motivoParada || '-'}</td>
        <td>${d.causaParada || '-'}</td>
        <td>${d.absenteismo || 0}</td>
        <td>${d.recLocal || 0}</td>
        <td>${d.obsLocal || '-'}</td>
        <td>${d.recImportado || 0}</td>
        <td>${d.ovacaoImportado || 0}</td>
        <td>${d.obsImportado || '-'}</td>
      </tr>
      `;
    });

  tabela.style.display = "none";
}


// 📥 EXPORTAR
function exportarExcel() {

  let csv = "Data;Predio;Doca;Turno;Parada\n";

  dados.forEach(d => {
    csv += `${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`;
  });

  let blob = new Blob(["\uFEFF" + csv]);
  let a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "dados.csv";
  a.click();
}
