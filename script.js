// FIREBASE
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
let grafico;

// ELEMENTOS
const formulario = document.getElementById("formulario");
const tabela = document.getElementById("tabela");
const historico = document.getElementById("historico");
const kpisDia = document.getElementById("kpisDia");
const filtroData = document.getElementById("filtroData");
const graficoDocas = document.getElementById("graficoDocas");

// INICIAR OCULTO
tabela.style.display = "none";
kpisDia.style.display = "none";

// SALVAR
formulario.addEventListener("submit", e => {
  e.preventDefault();

  if(!parada.value || !recLocal.value || !recImportado.value){
    alert("Preencha os campos obrigatórios!");
    return;
  }

  const registro = {
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
    obsImportado: obsImportado.value,

    absenteismo: absenteismo.value,
    acidentes: acidentes.value
  };

  refDados.push(registro);
  formulario.reset();
});

// TEMPO REAL
refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => dados.push(child.val()));
  atualizarGrafico();
});

// =============================
// 📊 GRÁFICO CORRETO
// =============================
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
      labels:["T&C","Body/Stamp/PWT","Total Geral"],
      datasets:[{
        label:"Minutos Parados",
        data:[tc,outros,total]
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{ display:true }
      },
      scales:{
        y:{ beginAtZero:true }
      }
    }
  });
}

// =============================
// 🔍 FILTRO COM KPI
// =============================
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
  ⚠️ Acidentes: ${ac}
  `;
}

// =============================
// 📥 EXPORTAR EXCEL
// =============================
function exportarExcel(){
  let csv="Data;Predio;Doca;Turno;Parada;Local;ObsLocal;Importado;ObsImportado\n";

  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada};${d.recLocal};"${d.obsLocal}";${d.recImportado};"${d.obsImportado}"\n`;
  });

  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
}
