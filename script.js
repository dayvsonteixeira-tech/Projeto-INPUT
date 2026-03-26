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

// SALVAR REGISTRO
formulario.addEventListener("submit", e=>{
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
  dados=[];
  snapshot.forEach(child=>dados.push(child.val()));
  atualizarGraficos();
});

// FUNÇÃO GENÉRICA DE CRIAÇÃO DE GRÁFICO, GARANTINDO VISIBILIDADE
function criarGraficoVisivel(id, labels, data, label, cor){
  const ctx=document.getElementById(id).getContext('2d');
  function criar(){
    if(ctx.canvas.offsetWidth===0){ setTimeout(criar,200); return; }
    if(graficos[id]) graficos[id].destroy();
    graficos[id]=new Chart(ctx,{
      type:'bar',
      data:{labels,datasets:[{label,data,backgroundColor:cor}]},
      options:{responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}}}
    });
  }
  criar();
}

// ATUALIZAR TODOS OS GRÁFICOS
function atualizarGraficos(){
  let tc=0, outros=0, total=0;
  let diaMap={}, predioMap={'T&C':0,'Body/Stamp/PWT':0};
  let recLocalTotal=0, recImpTotal=0, absTotal=0, segTotal=0;

  dados.forEach(d=>{
    const p=Number(d.parada||0), rl=Number(d.recLocal||0), ri=Number(d.recImportado||0);
    const a=Number(d.absenteismo||0), s=Number(d.acidentes||0);

    total+=p;
    if(['1C','1T','1K','1G'].includes(d.doca)) tc+=p; else outros+=p;
    recLocalTotal+=rl; recImpTotal+=ri; absTotal+=a; segTotal+=s;

    if(['1C','1T','1K','1G'].includes(d.doca)) predioMap['T&C']+=p;
    else predioMap['Body/Stamp/PWT']+=p;

    diaMap[d.data]=(diaMap[d.data]||0)+p;
  });

  criarGraficoVisivel('graficoParadaLinha',['T&C','Body/Stamp/PWT','Total'],[tc,outros,total],'Parada Linha',['#007bff','#28a745','#ffc107']);
  criarGraficoVisivel('graficoRecebimentoLocal',['Caminhão'],[recLocalTotal],'Recebimento Local',['#28a745']);
  criarGraficoVisivel('graficoRecebimentoImportado',['Importado'],[recImpTotal],'Recebimento Importado',['#ffc107']);
  criarGraficoVisivel('graficoAbsenteismo',['Absenteísmo'],[absTotal],'Absenteísmo',['#17a2b8']);
  criarGraficoVisivel('graficoSeguranca',['Segurança'],[segTotal],'Segurança',['#dc3545']);
  criarGraficoVisivel('graficoPorPredio',Object.keys(predioMap),Object.values(predioMap),'Parada por Prédio',['#6f42c1']);
  criarGraficoVisivel('graficoPorDia',Object.keys(diaMap),Object.values(diaMap),'Parada por Dia',['#fd7e14']);
}

// FILTROS, EXPORTAR E RELATÓRIO
function filtrarData(){ /* Mesma lógica que você já tinha, atualize para os campos novos */ }
function abrirFiltroPredio(){ painelFiltro.style.display='block'; }
function filtrarPorGrupo(tipo){ /* Mesma lógica que você já tinha */ }
function abrirRelatorio(doca){ /* Mesma lógica que você já tinha */ }
function exportarExcel(){ /* Mesma lógica que você já tinha */ }
