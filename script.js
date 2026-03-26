// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
  authDomain: "controle-gerencial-75f09.firebaseapp.com",
  databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
  projectId: "controle-gerencial-75f09",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const refDados = db.ref("registros");

let dados = [];
let grafico;

const historico = document.getElementById("historico");
const kpisDia = document.getElementById("kpisDia");

// SALVAR
document.getElementById("formulario").addEventListener("submit", e=>{
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

// TEMPO REAL
refDados.on("value", snapshot=>{
  dados = [];
  snapshot.forEach(child=>{
    dados.push(child.val());
  });

  atualizarGrafico();
});

// GRÁFICO
function atualizarGrafico(){
  let tc=0, outros=0, total=0;

  dados.forEach(d=>{
    let p = Number(d.parada||0);
    total += p;

    if(["1C","1T","1K","1G"].includes(d.doca)) tc+=p;
    else outros+=p;
  });

  if(grafico) grafico.destroy();

  grafico = new Chart(document.getElementById("graficoDocas"), {
    type: "bar",
    data: {
      labels:["T&C","Outros","Total"],
      datasets:[{data:[tc,outros,total]}]
    }
  });
}

// FILTRO DATA
function filtrarData(){
  const f = filtroData.value;

  historico.innerHTML="";
  let total=0;

  dados.filter(d=>d.data===f).forEach(d=>{
    total += Number(d.parada||0);

    historico.innerHTML+=`
    <tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${d.parada} min</td>
      <td>${d.motivoParada}</td>
      <td>${d.causaParada}</td>
      <td>${d.absenteismo}</td>
      <td>${d.retornoAbs}</td>
      <td>${d.recLocal}</td>
      <td>${d.recImportado}</td>
    </tr>`;
  });

  kpisDia.innerHTML = `Total parada: ${total} min`;
}

// FILTRO PRÉDIO
function abrirFiltroPredio(){
  painelFiltro.style.display="block";
}

function filtrarPorGrupo(tipo){
  let grupo = tipo==="TC"
  ? ["1C","1T","1K","1G"]
  : ["1B","30"];

  let total=0;

  dados.forEach(d=>{
    if(grupo.includes(d.doca)){
      total += Number(d.parada||0);
    }
  });

  resultadoGrupo.innerHTML = `Total: ${total} min`;
}

// EXPORTAR
function exportarExcel(){
  let csv="Data;Predio;Doca;Parada\n";

  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.parada}\n`;
  });

  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
}
