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

// OCULTAR INICIAL
document.getElementById("tabela").style.display = "none";
document.getElementById("kpisDia").style.display = "none";

// SALVAR
formulario.addEventListener("submit", e => {
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
    acidentes: acidentes.value
  };
  refDados.push(registro);
  formulario.reset();
});

// TEMPO REAL
refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => { dados.push(child.val()); });
  atualizarGraficos();
});

// FUNÇÃO CRIAR GRÁFICO RESPONSIVO
function criarGrafico(id, labels, data, label, cor) {
  if(graficos[id]) graficos[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  graficos[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{label, data, backgroundColor: cor}] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ATUALIZAR TODOS OS GRÁFICOS
function atualizarGraficos() {
  let tc=0, outros=0, total=0;
  let diaMap={}, predioMap={T&C:0, 'Body/Stamp/PWT':0};

  let paradaArr=[], recLocalArr=[], recImpArr=[], absArr=[], segArr=[];

  dados.forEach(d=>{
    let dt = new Date(d.data);
    let p = Number(d.parada||0);
    let rl = Number(d.recLocal||0);
    let ri = Number(d.recImportado||0);
    let a = Number(d.absenteismo||0);
    let s = Number(d.acidentes||0);

    // Por prédio
    if(["1C","1T","1K","1G"].includes(d.doca)) predioMap['T&C'] += p;
    else predioMap['Body/Stamp/PWT'] += p;

    // Por dia
    diaMap[d.data] = (diaMap[d.data]||0) + p;

    // Total
    total += p;
    if(["1C","1T","1K","1G"].includes(d.doca)) tc += p;
    else outros += p;

    paradaArr.push(p);
    recLocalArr.push(rl);
    recImpArr.push(ri);
    absArr.push(a);
    segArr.push(s);
  });

  criarGrafico('graficoParadaLinha',['T&C','Body/Stamp/PWT','Total'],[tc,outros,total],'Parada Linha','#007bff');
  criarGrafico('graficoRecebimentoLocal',['Caminhão'],[recLocalArr.reduce((a,b)=>a+b,0)],'Recebimento Local','#28a745');
  criarGrafico('graficoRecebimentoImportado',['Importado'],[recImpArr.reduce((a,b)=>a+b,0)],'Recebimento Importado','#ffc107');
  criarGrafico('graficoAbsenteismo',['Absenteísmo'],[absArr.reduce((a,b)=>a+b,0)],'Absenteísmo','#17a2b8');
  criarGrafico('graficoSeguranca',['Segurança'],[segArr.reduce((a,b)=>a+b,0)],'Segurança','#dc3545');

  criarGrafico('graficoPorPredio',Object.keys(predioMap),Object.values(predioMap),'Parada por Prédio','#6f42c1');
  criarGrafico('graficoPorDia',Object.keys(diaMap),Object.values(diaMap),'Parada por Dia','#fd7e14');
}

// FILTRO DATA
function filtrarData(){
  const f = filtroData.value;
  historico.innerHTML="";
  let tp=0, rl=0, ri=0, a=0, ac=0;
  dados.filter(d=>d.data===f).forEach(d=>{
    let p=Number(d.parada||0);
    tp+=p; rl+=Number(d.recLocal||0); ri+=Number(d.recImportado||0);
    a+=Number(d.absenteismo||0); ac+=Number(d.acidentes||0);

    historico.innerHTML+=`
    <tr>
      <td>${d.data}</td>
      <td>${d.predio}</td>
      <td>${d.doca}</td>
      <td>${p} min</td>
      <td>${d.motivoParada||'-'}</td>
      <td>${d.causaParada||'-'}</td>
      <td>${d.absenteismo||0}</td>
      <td>${d.acidentes||0}</td>
      <td>${d.recLocal||0}</td>
      <td>${d.recImportado||0}</td>
    </tr>`;
  });

  tabela.style.display="table";
  kpisDia.style.display="block";
  kpisDia.innerHTML=`
  📊 Total Linha Parada: ${tp} minutos<br>
  🚚 Caminhão: ${rl}<br>
  🌍 Importado: ${ri}<br>
  👥 Absenteísmo: ${a}<br>
  ⚠️ Segurança: ${ac}`;
}

// FILTRO PRÉDIO
function abrirFiltroPredio(){ painelFiltro.style.display="block"; }

function filtrarPorGrupo(tipo){
  let grupo = tipo==="TC"?["1C","1T","1K","1G"]:["1B","30"];
  let total=0, docas={};
  dados.forEach(d=>{
    if(grupo.includes(d.doca)){
      let p=Number(d.parada||0);
      total+=p;
      docas[d.doca]=(docas[d.doca]||0)+p;
    }
  });
  let html=`📊 Total: ${total} min<br>`;
  for(let d in docas){
    html+=`<button onclick="abrirRelatorio('${d}')">🚪 ${d} (${docas[d]} min)</button>`;
  }
  resultadoGrupo.innerHTML=html;
}

// RELATÓRIO
function abrirRelatorio(doca){
  let lista = dados.filter(d=>d.doca===doca);
  let w=window.open("");
  let html=`<h2>📊 Doca ${doca}</h2><table border="1">
  <tr><th>Data</th><th>Motivo</th><th>Causa</th></tr>`;
  lista.forEach(d=>{
    html+=`<tr>
      <td>${d.data}</td>
      <td>${d.motivoParada}</td>
      <td>${d.causaParada}</td>
    </tr>`;
  });
  html+="</table>";
  w.document.write(html);
}

// EXPORTAR EXCEL
function exportarExcel(){
  let csv="Data;Predio;Doca;Parada;Motivo;Causa;Absenteismo;Seguranca;Caminhao;Importado\n";
  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.parada};"${d.motivoParada}";"${d.causaParada}";${d.absenteismo};${d.acidentes};${d.recLocal};${d.recImportado}\n`;
  });
  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
}
