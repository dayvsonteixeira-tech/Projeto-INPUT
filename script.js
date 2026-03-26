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

const formulario = document.getElementById("formulario");

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

// GRÁFICO
function atualizarGrafico(){
  let total = 0;
  dados.forEach(d=> total += Number(d.parada || 0));

  if(grafico) grafico.destroy();

  grafico = new Chart(graficoDocas,{
    type:"bar",
    data:{
      labels:["Total Parada"],
      datasets:[{data:[total]}]
    }
  });
}

// FILTRO
function filtrarData(){
  const f = filtroData.value;
  historico.innerHTML="";

  dados.filter(d=>d.data===f).forEach(d=>{
    historico.innerHTML+=`
    <tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${d.turno}</td>
      <td>${d.parada}</td>
      <td>${d.motivoParada||'-'}</td>
      <td>${d.causaParada||'-'}</td>
      <td>${d.absenteismo||0}</td>
      <td>${d.recLocal||0}</td>
      <td>${d.obsLocal||'-'}</td>
      <td>${d.recImportado||0}</td>
      <td>${d.obsImportado||'-'}</td>
    </tr>`;
  });
}

// EXPORTAR
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
