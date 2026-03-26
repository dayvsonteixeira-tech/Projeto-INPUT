// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyDgpRxB7gluCbqEnFHIf68xDQVRmAp0dBo",
  authDomain: "controle-abastecimento-f80ed.firebaseapp.com",
  databaseURL: "https://controle-abastecimento-f80ed-default-rtdb.firebaseio.com/",
  projectId: "controle-abastecimento-f80ed",
  storageBucket: "controle-abastecimento-f80ed.firebasestorage.app",
  messagingSenderId: "129218813008",
  appId: "1:129218813008:web:d0355aae42ec4c317a0555"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const refDados = db.ref("registros");

let dados = [];
let grafico;

// ELEMENTOS
const historico = document.getElementById("historico");
const tabela = document.getElementById("tabela");
const kpisDia = document.getElementById("kpisDia");
const resultadoDiv = document.getElementById("resultadoGrupo");

// ================= SALVAR =================
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

  refDados.push(registro);
  formulario.reset();
});

// ================= TEMPO REAL =================
refDados.on("value", snapshot => {
  dados = [];

  snapshot.forEach(child => {
    dados.push(child.val());
  });

  atualizarGraficoGeral();
});

// ================= GRÁFICO =================
function atualizarGraficoGeral() {

  const grupoTC = ["1C","1T","1K","1G"];
  const grupoOutros = ["1B","30"];

  let totalTC = 0;
  let totalOutros = 0;
  let totalGeral = 0;

  const hoje = new Date();

  dados.forEach(item => {
    if (!item.data) return;

    const d = new Date(item.data);

    if (d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) {
      let p = Number(item.parada || 0);

      totalGeral += p;

      if (grupoTC.includes(item.doca)) totalTC += p;
      if (grupoOutros.includes(item.doca)) totalOutros += p;
    }
  });

  const canvas = document.getElementById("graficoDocas");

  if (grafico) grafico.destroy();

  grafico = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["T&C", "Body/Stamp/PWT", "Total Geral"],
      datasets: [{
        data: [totalTC, totalOutros, totalGeral]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ================= FILTRO DATA =================
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

// ================= FILTRO PRÉDIO =================
function abrirFiltroPredio(){
  document.getElementById("painelFiltro").style.display = "block";
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

  let html = `📊 Total de Paradas: ${soma} min<br>`;

  for (let d in docas) {
    html += `<button onclick="abrirRelatorio('${d}')">🚪 ${d} (${docas[d]} min)</button>`;
  }

  resultadoDiv.innerHTML = html;
}

// ================= RELATÓRIO =================
function abrirRelatorio(doca){
  let registros = dados.filter(d => d.doca === doca);

  let w = window.open("", "_blank");

  let html = `
    <h2>📊 Relatório da Doca ${doca}</h2>
    <table border="1">
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
  let csv = "Data;Predio;Doca;Parada\n";

  dados.forEach(d => {
    csv += `${d.data};${d.predio};${d.doca};${d.parada}\n`;
  });

  let blob = new Blob(["\uFEFF"+csv]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "relatorio.csv";
  a.click();
}
