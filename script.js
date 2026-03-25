let dados = JSON.parse(localStorage.getItem("registros")) || [];
let grafico;

const historico = document.getElementById("historico");
const tabela = document.getElementById("tabela");
const kpisDia = document.getElementById("kpisDia");

function salvar() {
  localStorage.setItem("registros", JSON.stringify(dados));
}

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
  formulario.reset();
});

function filtrarData() {
  const dataFiltro = document.getElementById("filtroData").value;
  const filtrado = dados.filter(d => d.data === dataFiltro);

  historico.innerHTML = "";

  let totalParadas = 0;
  let totalReceb = 0;
  let totalAbs = 0;
  let totalAcidentes = 0;

  let docas = {};

  filtrado.forEach(item => {
    let parada = Number(item.parada || 0);
    let receb = Number(item.recLocal || 0) + Number(item.recImportado || 0);

    totalParadas += parada;
    totalReceb += receb;
    totalAbs += Number(item.absenteismo || 0);
    totalAcidentes += Number(item.acidentes || 0);

    let classe = parada > 30 ? "parada-alta" : "";

    historico.innerHTML += `
      <tr class="${classe}">
        <td>${item.data}</td>
        <td>${item.predio}</td>
        <td>${item.doca}</td>
        <td>${parada}</td>
        <td>${receb}</td>
      </tr>
    `;

    if (!docas[item.doca]) docas[item.doca] = 0;
    docas[item.doca] += parada;
  });

  tabela.style.display = "table";

  kpisDia.style.display = "block";
  kpisDia.innerHTML = `
    📊 Total Paradas: ${totalParadas} min<br>
    📦 Recebimento: ${totalReceb}<br>
    👥 Absenteísmo: ${totalAbs}<br>
    ⚠️ Acidentes: ${totalAcidentes}
  `;

  const labels = Object.keys(docas);
  const valores = Object.values(docas);

  const canvas = document.getElementById("graficoDocas");
  canvas.style.display = "block";

  if (grafico) grafico.destroy();

  grafico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Paradas por Doca",
        data: valores
      }]
    }
  });
}

function abrirFiltroPredio() {
  document.getElementById("painelFiltro").style.display = "block";
}

function filtrarPorGrupo(tipo) {
  const resultadoDiv = document.getElementById("resultadoGrupo");

  const grupoTC = ["1C", "1T", "1K", "1G"];
  const grupoOutros = ["1B", "30"];

  let docasValidas = tipo === "TC" ? grupoTC : grupoOutros;

  let somaTotal = 0;
  let docas = {};

  dados.forEach(item => {
    let parada = Number(item.parada || 0);

    if (docasValidas.includes(item.doca)) {
      somaTotal += parada;

      if (!docas[item.doca]) docas[item.doca] = 0;
      docas[item.doca] += parada;
    }
  });

  let html = `<p>📊 Total de Paradas: ${somaTotal} min</p>`;
  html += `<p>👉 Clique na doca:</p>`;

  for (let d in docas) {
    html += `<button onclick="abrirRelatorio('${d}')">🚪 ${d} (${docas[d]} min)</button>`;
  }

  resultadoDiv.innerHTML = html;
}

function abrirRelatorio(docaSelecionada) {
  let registros = dados.filter(d => d.doca === docaSelecionada);

  let janela = window.open("", "_blank");

  let html = `
    <h2>Relatório da Doca ${docaSelecionada}</h2>
    <table border="1" style="width:100%">
    <tr><th>Data</th><th>Parada</th><th>Prédio</th></tr>
  `;

  registros.forEach(r => {
    html += `<tr><td>${r.data}</td><td>${r.parada}</td><td>${r.predio}</td></tr>`;
  });

  html += "</table>";

  janela.document.write(html);
}

function exportarExcel() {
  let csv = "Data,Predio,Doca,Parada,Recebimento\n";

  dados.forEach(d => {
    let receb = Number(d.recLocal || 0) + Number(d.recImportado || 0);
    csv += `${d.data},${d.predio},${d.doca},${d.parada},${receb}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio.csv";
  link.click();
}
