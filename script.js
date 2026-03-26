let dados = JSON.parse(localStorage.getItem("registros")) || [];
let grafico;

// ELEMENTOS
const historico = document.getElementById("historico");
const tabela = document.getElementById("tabela");
const kpisDia = document.getElementById("kpisDia");
const resultadoDiv = document.getElementById("resultadoGrupo");

// SALVAR LOCAL
function salvar() {
  localStorage.setItem("registros", JSON.stringify(dados));
}

// ================= SALVAR REGISTRO =================
document.getElementById("formulario").addEventListener("submit", e => {
  e.preventDefault();

  const registro = {
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    parada: parada.value,
    motivoParada: motivoParada.value,
    causaParada: causaParada.value,
    recLocal: recLocal.value,
    recImportado: recImportado.value,
    absenteismo: absenteismo.value,
    motivoAbs: motivoAbs.value,
    retornoAbs: retornoAbs.value,
    acidentes: acidentes.value
  };

  dados.push(registro);
  salvar();
  atualizarGraficoGeral();
  formulario.reset();
});

// ================= GRÁFICO =================
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

    const d = new Date(item.data);

    if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
      let p = Number(item.parada || 0);

      totalGeral += p;

      if (grupoTC.includes(item.doca)) totalTC += p;
      if (grupoOutros.includes(item.doca)) totalOutros += p;
    }
  });

  const canvas = document.getElementById("graficoDocas");

  if (grafico) grafico.destroy();

  const pluginLabels = {
    id: "labelsTopo",
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
        label: "Paradas no mês atual",
        data: [totalTC, totalOutros, totalGeral],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    },
    plugins: [pluginLabels]
  });
}

// ================= FILTRO POR DATA =================
function filtrarData(){
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

    totalParadas += parada;
    totalRecLocal += Number(item.recLocal || 0);
    totalRecImp += Number(item.recImportado || 0);
    totalAbs += Number(item.absenteismo || 0);
    totalAcid += Number(item.acidentes || 0);

    historico.innerHTML += `
      <tr>
        <td>${item.data}</td>
        <td>${item.predio}</td>
        <td>${item.doca}</td>
        <td>${parada} minutos</td>
        <td>${item.motivoParada || '-'}</td>
        <td>${item.causaParada || '-'}</td>
        <td>${item.absenteismo || 0}</td>
        <td>${item.retornoAbs || '-'}</td>
        <td>${item.recLocal || 0}</td>
        <td>${item.recImportado || 0}</td>
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

// ================= FILTRO POR PRÉDIO =================
function abrirFiltroPredio(){
  const painel = document.getElementById("painelFiltro");
  const grafico = document.getElementById("graficoDocas");

  painel.style.display = "block";
  grafico.parentNode.insertBefore(painel, grafico);
}

function filtrarPorGrupo(tipo){
  const grupoTC = ["1C","1T","1K","1G"];
  const grupoOutros = ["1B","30"];

  let validas = tipo === "TC" ? grupoTC : grupoOutros;
  let soma = 0;
  let docas = {};

  dados.forEach(item => {
    let p = Number(item.parada || 0);

    if (validas.includes(item.doca)) {
      soma += p;
      docas[item.doca] = (docas[item.doca] || 0) + p;
    }
  });

  let html = `📊 Total de Paradas: ${soma} min<br>👉 Clique na doca:<br>`;

  for (let d in docas) {
    html += `<button onclick="abrirRelatorio('${d}')">🚪 ${d} (${docas[d]} min)</button>`;
  }

  resultadoDiv.innerHTML = html;

  const grafico = document.getElementById("graficoDocas");
  grafico.parentNode.insertBefore(resultadoDiv, grafico);
}

// ================= RELATÓRIO =================
function abrirRelatorio(doca){
  let registros = dados.filter(d => d.doca === doca);

  let w = window.open("", "_blank");

  let html = `
    <h2>📊 Relatório da Doca ${doca}</h2>
    <table border="1" style="width:100%; border-collapse:collapse; text-align:center;">
    <tr>
      <th>Data</th>
      <th>Prédio</th>
      <th>Parada</th>
      <th>Motivo</th>
      <th>Causa</th>
    </tr>
  `;

  registros.forEach(r => {
    html += `
      <tr>
        <td>${r.data}</td>
        <td>${r.predio}</td>
        <td>${r.parada} min</td>
        <td>${r.motivoParada || '-'}</td>
        <td>${r.causaParada || '-'}</td>
      </tr>
    `;
  });

  html += "</table>";

  w.document.write(html);
}

// ================= EXPORTAR =================
function exportarExcel(){
  let csv = "Data,Predio,Doca,Parada\n";

  dados.forEach(d => {
    csv += `${d.data},${d.predio},${d.doca},${d.parada}\n`;
  });

  let blob = new Blob([csv]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "relatorio.csv";
  a.click();
}

// ================= INICIAR =================
atualizarGraficoGeral();
