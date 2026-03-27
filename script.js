document.addEventListener("DOMContentLoaded", () => {

// 🔥 DOM
const formulario = document.getElementById("formulario");
const data = document.getElementById("data");
const predio = document.getElementById("predio");
const doca = document.getElementById("doca");
const turno = document.getElementById("turno");

const parada = document.getElementById("parada");
const motivoParada = document.getElementById("motivoParada");
const causaParada = document.getElementById("causaParada");

const recLocal = document.getElementById("recLocal");
const obsLocal = document.getElementById("obsLocal");

const recImportado = document.getElementById("recImportado");
const ovacaoImportado = document.getElementById("ovacaoImportado");
const obsImportado = document.getElementById("obsImportado");

const absenteismo = document.getElementById("absenteismo");
const acidentes = document.getElementById("acidentes");

const graficoDocas = document.getElementById("graficoDocas");


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


// 🔝 PLUGIN
const pluginValor = {
  id: "valorTopo",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
      });
    });
  }
};


// 📊 CONFIG
function opcoesGrafico() {
  return {
    responsive: true,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };
}


// 💾 SALVAR
formulario.addEventListener("submit", e => {
  e.preventDefault();

  const turnoValue = turno.value;

  refDados.push({
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    turno: turnoValue,

    parada: Number(parada.value || 0),
    recLocal: Number(recLocal.value || 0),
    recImportado: Number(recImportado.value || 0),
    ovacaoImportado: Number(ovacaoImportado.value || 0),
    absenteismo: Number(absenteismo.value || 0),
    acidentes: Number(acidentes.value || 0)
  });

  formulario.reset();
  turno.value = "1";
});


// 🔄 TEMPO REAL
refDados.on("value", snap => {
  dados = [];
  snap.forEach(c => dados.push(c.val()));

  desenhar();
});


// 📊 DESENHAR TUDO
function desenhar() {

  let t1 = 0, t2 = 0;

  dados.forEach(d => {
    if (d.turno === "1") t1 += Number(d.parada || 0);
    if (d.turno === "2") t2 += Number(d.parada || 0);
  });

  if (graficoPrincipal) graficoPrincipal.destroy();

  const ctx = graficoDocas.getContext("2d");

  graficoPrincipal = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1º Turno", "2º Turno"],
      datasets: [{
        label: "Parada",
        data: [t1, t2]
      }]
    },
    options: opcoesGrafico(),
    plugins: [pluginValor]
  });

}

});
