// 🔥 REFERÊNCIAS DO DOM (OBRIGATÓRIO)
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

const filtroData = document.getElementById("filtroData");
const tabela = document.getElementById("tabela");
const historico = document.getElementById("historico");


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


// 🔝 PLUGIN VALORES
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


// 📊 CONFIG
function opcoesGrafico() {
  return {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: v => Number.isInteger(v) ? v : null
        }
      }
    }
  };
}


// 💾 SALVAR
formulario.addEventListener("submit", e => {
  e.preventDefault();

  if (!parada.value || !recLocal.value || !recImportado.value) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  const turnoValue = String(turno.value).replace(/\D/g, "").trim();

  if (!["1", "2"].includes(turnoValue)) {
    alert("Turno inválido!");
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

  // 🔒 evitar bug select
  turno.value = "1";
  predio.value = "T&C";
  doca.value = "1C";
});


// 🔄 TEMPO REAL
refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => dados.push(child.val()));

  atualizarGraficoPrincipal();
  atualizarDashboard();
});


// 📊 PRINCIPAL
function atualizarGraficoPrincipal() {

  let tc = 0, outros = 0, total = 0;

  dados.forEach(d => {
    let p = Number(d.parada || 0);
    total += p;

    if (["1C","1T","1K","1G"].includes(d.doca)) tc += p;
    else outros += p;
  });

  if (graficoPrincipal) graficoPrincipal.destroy();

  const ctx = graficoDocas.getContext("2d");

  graficoPrincipal = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["T&C", "BODY/STAMP/PWT", "TOTAL"],
      datasets: [{
        label: "Minutos",
        data: [tc, outros, total]
      }]
    },
    options: opcoesGrafico(),
    plugins: [pluginValor]
  });
}


// 📊 BASE
function criarGrafico(id, labels, data, label) {

  if (graficos[id]) graficos[id].destroy();

  const canvas = document.getElementById(id);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  graficos[id] = new Chart(ctx, {
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


// 📊 DASHBOARD
function atualizarDashboard() {

  let turnos = { "1": {}, "2": {} };

  dados.forEach(d => {

    let tKey = String(d.turno).replace(/\D/g, "").trim();
    if (!["1","2"].includes(tKey)) return;

    let t = turnos[tKey];
    let p = Number(d.parada || 0);

    t.total = (t.total || 0) + p;

    t.pred = t.pred || {};
    t.pred[d.predio] = (t.pred[d.predio] || 0) + p;

    t.dia = t.dia || {};
    t.dia[d.data] = (t.dia[d.data] || 0) + p;

    t.local = t.local || {};
    t.local[d.data] = (t.local[d.data] || 0) + Number(d.recLocal || 0);

    t.importado = t.importado || {};
    t.importado[d.data] = (t.importado[d.data] || 0) + Number(d.recImportado || 0);

    t.ovacao = (t.ovacao || 0) + Number(d.ovacaoImportado || 0);
    t.abs = (t.abs || 0) + Number(d.absenteismo || 0);
    t.seg = (t.seg || 0) + Number(d.acidentes || 0);
  });


  ["1","2"].forEach(turno => {

    let s = turno === "1" ? "_t1" : "_t2";
    let d = turnos[turno] || {};

    criarGrafico("g1"+s, ["Total"], [d.total||0], "Total");
    criarGrafico("g2"+s, Object.keys(d.pred||{}), Object.values(d.pred||{}), "Prédio");
    criarGrafico("g3"+s, Object.keys(d.dia||{}), Object.values(d.dia||{}), "Dia");
    criarGrafico("g4"+s, Object.keys(d.local||{}), Object.values(d.local||{}), "Local");
    criarGrafico("g5"+s, Object.keys(d.importado||{}), Object.values(d.importado||{}), "Importado");
    criarGrafico("g6"+s, ["Ovação"], [d.ovacao||0], "Ovação");
    criarGrafico("g7"+s, ["Abs"], [d.abs||0], "Absenteísmo");
    criarGrafico("g8"+s, ["Seg"], [d.seg||0], "Segurança");

  });
}


// 🔍 FILTRO
function filtrarData(){
  tabela.style.display="none";
}


// 📥 EXPORTAR
function exportarExcel(){

  let csv="Data;Predio;Doca;Turno;Parada\n";

  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`;
  });

  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");

  a.href=URL.createObjectURL(blob);
  a.download="dados.csv";
  a.click();
}
