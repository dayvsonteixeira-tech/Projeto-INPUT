// FIREBASE CONFIG (CORRIGIDO)
const firebaseConfig = {
  apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
  authDomain: "controle-gerencial-75f09.firebaseapp.com",
  databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
  projectId: "controle-gerencial-75f09"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refDados = db.ref("registros");

// VARIÁVEIS
let dados = [];
let grafico;

// ELEMENTOS
const formulario = document.getElementById("formulario");
const tabela = document.getElementById("tabela");
const historico = document.getElementById("historico");
const kpisDia = document.getElementById("kpisDia");
const filtroData = document.getElementById("filtroData");
const graficoDocas = document.getElementById("graficoDocas");

// OCULTAR INICIAL
tabela.style.display = "none";
kpisDia.style.display = "none";

// =========================
// 💾 SALVAR
// =========================
formulario.addEventListener("submit", e => {
  e.preventDefault();

  if(!parada.value || !recLocal.value || !recImportado.value){
    alert("Preencha os campos obrigatórios!");
    return;
  }

  refDados.push({
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    turno: turno.value,
    parada: parada.value,
    motivoParada: motivoParada.value,
    causaParada: causaParada.value,
    recLocal: recLocal.value,
    obsLocal: obsLocal.value,
    recImportado: recImportado.value,
    ovacaoImportado: ovacaoImportado.value,
    obsImportado: obsImportado.value,
    absenteismo: absenteismo.value,
    acidentes: acidentes.value
  });

  formulario.reset();
});

// =========================
// 🔄 TEMPO REAL
// =========================
refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => dados.push(child.val()));
  atualizarGrafico();
});

// =========================
// 📊 GRÁFICO
// =========================
function atualizarGrafico(){
  let tc = 0;
  let outros = 0;
  let total = 0;

  const hoje = new Date();

  dados.forEach(d => {
    if(!d.data) return;

    const dt = new Date(d.data);

    if(dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear()){
      let p = Number(d.parada || 0);
      total += p;

      if(["1C","1T","1K","1G"].includes(d.doca)){
        tc += p;
      } else {
        outros += p;
      }
    }
  });

  if(grafico) grafico.destroy();

  grafico = new Chart(graficoDocas,{
    type:"bar",
    data:{
      labels:["T&C","Body/Stamp/PWT","Total"],
      datasets:[{
        label:"Minutos Parados",
        data:[tc,outros,total]
      }]
    },
    options:{
      responsive:true,
      scales:{
        y:{ beginAtZero:true }
      }
    }
  });
}

// =========================
// 🔍 FILTRO DATA + KPI
// =========================
function filtrarData(){
  const f = filtroData.value;
  historico.innerHTML = "";

  let tp=0, rl=0, ri=0, a=0, ac=0;

  dados.filter(d => d.data === f).forEach(d => {

    let p = Number(d.parada || 0);

    tp += p;
    rl += Number(d.recLocal || 0);
    ri += Number(d.recImportado || 0);
    a += Number(d.absenteismo || 0);
    ac += Number(d.acidentes || 0);

    historico.innerHTML += `
    <tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${d.turno}</td>
      <td>${p}</td>
      <td>${d.motivoParada||'-'}</td>
      <td>${d.causaParada||'-'}</td>
      <td>${d.absenteismo||0}</td>
      <td>${d.recLocal||0}</td>
      <td>${d.obsLocal||'-'}</td>
      <td>${d.recImportado||0}</td>
      <td>${d.ovacaoImportado||'-'}</td>
      <td>${d.obsImportado||'-'}</td>
    </tr>`;
  });

  tabela.style.display = "table";
  kpisDia.style.display = "block";

  kpisDia.innerHTML = `
  📊 Total Linha Parada: ${tp} min<br>
  📦 Recebimento Local: ${rl}<br>
  🌍 Recebimento Importado: ${ri}<br>
  👥 Absenteísmo: ${a}<br>
  ⚠️ Acidentes: ${ac}`;
}

// =========================
// 🏢 FILTRO GRUPO
// =========================
function abrirFiltroPredio(){
  painelFiltro.style.display = "block";
}

function filtrarPorGrupo(tipo){

  let grupo = tipo === "TC"
    ? ["1C","1T","1K","1G"]
    : ["1B","30"];

  let total = 0;
  let docas = {};

  dados.forEach(d => {
    if(grupo.includes(d.doca)){
      let p = Number(d.parada || 0);
      total += p;
      docas[d.doca] = (docas[d.doca] || 0) + p;
    }
  });

  let html = `📊 Total: ${total} min<br>`;

  for(let d in docas){
    html += `<button onclick="abrirRelatorio('${d}')">🚪 ${d} (${docas[d]} min)</button> `;
  }

  resultadoGrupo.innerHTML = html;
}

// =========================
// 📄 RELATÓRIO
// =========================
function abrirRelatorio(doca){
  let lista = dados.filter(d => d.doca === doca);
  let w = window.open("");

  let html = `
  <h2>📊 Doca ${doca}</h2>
  <table border="1">
  <tr>
    <th>Data</th>
    <th>Turno</th>
    <th>Motivo</th>
    <th>Causa</th>
  </tr>`;

  lista.forEach(d => {
    html += `
    <tr>
      <td>${d.data}</td>
      <td>${d.turno}</td>
      <td>${d.motivoParada||'-'}</td>
      <td>${d.causaParada||'-'}</td>
    </tr>`;
  });

  html += "</table>";
  w.document.write(html);
}

// =========================
// 📥 EXPORTAR EXCEL
// =========================
function exportarExcel(){
  let csv="Data;Predio;Doca;Turno;Parada;Importado;Ovacao;Obs\n";

  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada};${d.recImportado};${d.ovacaoImportado};"${d.obsImportado}"\n`;
  });

  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
}
