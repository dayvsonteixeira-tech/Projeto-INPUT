let dados = JSON.parse(localStorage.getItem("registros")) || [];
let grafico;

const historico = document.getElementById("historico");
const tabela = document.getElementById("tabela");
const kpisDia = document.getElementById("kpisDia");
const resultadoDiv = document.getElementById("resultadoGrupo");

function salvar() {
  localStorage.setItem("registros", JSON.stringify(dados));
}

// ================== SALVAR ==================
document.getElementById("formulario").addEventListener("submit", e => {
  e.preventDefault();

  const registro = {
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    parada: parada.value,
    recLocal: recLocal.value,
    recImportado: recImportado.value,
    absenteismo: absenteismo.value,
    acidentes: acidentes.value
  };

  dados.push(registro);
  salvar();
  atualizarGraficoGeral();
  formulario.reset();
});

// ================== GRÁFICO MENSAL ==================
function atualizarGraficoGeral() {
  const grupoTC = ["1C","1T","1K","1G"];
  const grupoOutros = ["1B","30"];

  let totalTC = 0;
  let totalOutros = 0;
  let totalGeral = 0;

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  dados.forEach(item => {
    if (!item.data) return;

    const dataItem = new Date(item.data);

    if (dataItem.getMonth() === mesAtual && dataItem.getFullYear() === anoAtual) {
      let parada = Number(item.parada || 0);

      totalGeral += parada;
      if (grupoTC.includes(item.doca)) totalTC += parada;
      if (grupoOutros.includes(item.doca)) totalOutros += parada;
    }
  });

  const canvas = document.getElementById("graficoDocas");

  if (grafico) grafico.destroy();

  const pluginLabels = {
    id: 'labelsTopo',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;

      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);

        meta.data.forEach((bar, index) => {
          const value = dataset.data[index];

          ctx.save();
          ctx.font = "bold 12px Arial";
          ctx.fillStyle = "#000";
          ctx.textAlign = "center";

          ctx.fillText(value + " min", bar.x, bar.y - 5);

          ctx.restore();
        });
      });
    }
  };

  grafico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["T&C", "Body/Stamp/PWT", "Total Geral"],
      datasets: [{
        label: "Paradas (mês atual)",
        data: [totalTC, totalOutros, totalGeral]
      }]
    },
    plugins: [pluginLabels]
  });
}

// ================== FILTRO POR DATA ==================
function filtrarData() {
  const dataFiltro = document.getElementById("filtroData").value;
  const filtrado = dados.filter(d => d.data === dataFiltro);

  historico.innerHTML = "";

  let totalParadas = 0;
  let totalRecLocal = 0;
  let totalRecImp = 0;
  let totalAbs = 0;
  let totalAcid = 0;

  filtrado.forEach(item => {
    let parada = Number(item.parada || 0);
    let recL = Number(item.recLocal || 0);
    let recI = Number(item.recImportado || 0);

    totalParadas += parada;
    totalRecLocal += recL;
    totalRecImp += recI;
    totalAbs += Number(item.absenteismo || 0);
    totalAcid += Number(item.acidentes || 0);

    let classe = parada > 30 ? "parada-alta" : "";

    historico.innerHTML += `
      <tr class="${classe}">
        <td>${item.data}</td>
        <td>${item.predio}</td>
        <td>${item.doca}</td>
        <td>${parada} minutos</td>
        <td>${recL}</td>
        <td>${recI}</td>
      </tr>
    `;
  });

  tabela.style.display = "table";
  kpisDia.style.display = "block";

  kpisDia.innerHTML = `
    📊 Total Linha Parada: ${totalParadas} minutos<br>
    📦 Recebimento Local: ${totalRecLocal}<br>
    🌍 Recebimento Importado: ${totalRecImp}<br>
    👥 Absenteísmo: ${totalAbs}<br>
    ⚠️ Acidentes: ${totalAcid}
  `;
}

// ================== FILTRO POR PRÉDIO ==================
function abrirFiltroPredio() {
  document.getElementById("painelFiltro").style.display = "block";
}

function filtrarPorGrupo(tipo) {
  const grupoTC = ["1C","1T","1K","1G"];
  const grupoOutros = ["1B","30"];

  let docasValidas = tipo === "TC" ? grupoTC : grupoOutros;

  let soma = 0;
  let docas = {};

  dados.forEach(item => {
    let parada = Number(item.parada || 0);

    if (docasValidas.includes(item.doca)) {
      soma += parada;

      if (!docas[item.doca]) docas[item.doca] = 0;
      docas[item.doca] += parada;
    }
  });

  let html = `<p>📊 Total de Paradas: ${soma} min</p>`;
  html += `<p>👉 Clique na doca:</p>`;

  for (let d in docas) {
    html += `<button onclick="abrirRelatorio('${d}')">${d} (${docas[d]} min)</button>`;
  }

  resultadoDiv.innerHTML = html;

  // 🔥 POSICIONA ACIMA DO GRÁFICO
  const graficoCanvas = document.getElementById("graficoDocas");
  graficoCanvas.parentNode.insertBefore(resultadoDiv, graficoCanvas);
}

// ================== RELATÓRIO ==================
function abrirRelatorio(doca) {
  let registros = dados.filter(d => d.doca === doca);

  let w = window.open("", "_blank");

  let html = `
    <h2>Relatório da Doca ${doca}</h2>
    <table border="1" style="width:100%">
    <tr><th>Data</th><th>Parada</th><th>Prédio</th></tr>
  `;

  registros.forEach(r => {
    html += `<tr><td>${r.data}</td><td>${r.parada}</td><td>${r.predio}</td></tr>`;
  });

  html += "</table>";

  w.document.write(html);
}

// ================== EXPORTAR ==================
function exportarExcel() {
  let csv = "Data,Predio,Doca,Parada,Recebimento\n";

  dados.forEach(d => {
    let receb = Number(d.recLocal || 0) + Number(d.recImportado || 0);
    csv += `${d.data},${d.predio},${d.doca},${d.parada},${receb}\n`;
  });

  let blob = new Blob([csv]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "relatorio.csv";
  a.click();
}

// ================== INICIAR ==================
atualizarGraficoGeral();
