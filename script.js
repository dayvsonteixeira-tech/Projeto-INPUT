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
let graficos = {};

// OCULTAR TABELA E KPIs INICIAL
document.getElementById("tabela").style.display = "none";
document.getElementById("kpisDia").style.display = "none";

// SALVAR
formulario.addEventListener("submit", e => {
  e.preventDefault();
  const registro = {
    data:data.value,
    predio:predio.value,
    doca:doca.value,
    parada:parada.value,
    motivoParada:motivoParada.value,
    causaParada:causaParada.value,
    recLocal:recLocal.value,
    recImportado:recImportado.value,
    absenteismo:absenteismo.value,
    motivoAbs:motivoAbs.value,
    acidentes:acidentes.value
  };
  refDados.push(registro);
  formulario.reset();
});

// TEMPO REAL
refDados.on("value", snapshot=>{
  dados = [];
  snapshot.forEach(child=>dados.push(child.val()));
  atualizarGraficos();
});

// FUNÇÃO PARA CRIAR GRÁFICO RESPONSIVO
function criarGrafico(id, labels, data, label, cor){
  if(graficos[id]) graficos[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  graficos[id] = new Chart(ctx,{
    type:'bar',
    data:{labels,datasets:[{label,data,backgroundColor:cor}]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:true}},
      scales:{y:{beginAtZero:true}}
    }
  });
}

// ATUALIZAR TODOS OS GRÁFICOS
function atualizarGraficos(){
  let tc=0, outros=0, total=0;
  let diaMap={}, predioMap={'T&C':0,'Body/Stamp/PWT':0};
  let recLocalTotal=0, recImpTotal=0, absTotal=0, segTotal=0;

  dados.forEach(d=>{
    const p=Number(d.parada||0), rl=Number(d.recLocal||0), ri=Number(d.recImportado||0);
    const a=Number(d.absenteismo||0), s=Number(d.acidentes||0);

    // Totais gerais
    total+=p; if(['1C','1T','1K','1G'].includes(d.doca)) tc+=p; else outros+=p;
    recLocalTotal+=rl; recImpTotal+=ri; absTotal+=a; segTotal+=s;

    // Por prédio
    if(['1C','1T','1K','1G'].includes(d.doca)) predioMap['T&C']+=p;
    else predioMap['Body/Stamp/PWT']+=p;

    // Por dia
    diaMap[d.data]=(diaMap[d.data]||0)+p;
  });

  criarGrafico('graficoParadaLinha',['T&C','Body/Stamp/PWT','Total'],[tc,outros,total],'Parada Linha','#007bff');
  criarGrafico('graficoRecebimentoLocal',['Caminhão'],[recLocalTotal],'Recebimento Local','#28a745');
  criarGrafico('graficoRecebimentoImportado',['Importado'],[recImpTotal],'Recebimento Importado','#ffc107');
  criarGrafico('graficoAbsenteismo',['Absenteísmo'],[absTotal],'Absenteísmo','#17a2b8');
  criarGrafico('graficoSeguranca',['Segurança'],[segTotal],'Segurança','#dc3545');
  criarGrafico('graficoPorPredio',Object.keys(predioMap),Object.values(predioMap),'Parada por Prédio','#6f42c1');
  criarGrafico('graficoPorDia',Object.keys(diaMap),Object.values(diaMap),'Parada por Dia','#fd7e14');
}

// FILTROS, EXPORTAR, RELATÓRIO (mesmo código que você já tinha, atualizado campos)
function filtrarData(){ /* ... mesmo do seu código ... */ }
function abrirFiltroPredio(){ painelFiltro.style.display='block'; }
function filtrarPorGrupo(tipo){ /* ... mesmo do seu código ... */ }
function abrirRelatorio(doca){ /* ... mesmo do seu código ... */ }
function exportarExcel(){ /* ... mesmo do seu código ... */ }
