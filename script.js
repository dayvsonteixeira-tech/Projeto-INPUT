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

// OCULTAR INICIAL
document.getElementById("tabela").style.display = "none";
document.getElementById("kpisDia").style.display = "none";

// SALVAR
formulario.addEventListener("submit", e => {
  e.preventDefault();
  // VALIDAÇÃO CAMPOS OBRIGATÓRIOS
  if(!parada.value || !recLocal.value || !recImportado.value){
    alert("Preencha todos os campos obrigatórios: Parada de Linha, Recebimento Local e Importado");
    return;
  }

  const registro = {
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    parada: parada.value,
    motivoParada: motivoParada.value,
    causaParada: causaParada.value,
    recLocal: recLocal.value,
    obsLocal: obsLocal.value,
    recImportado: recImportado.value,
    obsImportado: obsImportado.value,
    absenteismo: absenteismo.value,
    motivoAbs: motivoAbs.value,
    retornoAbs: retornoAbs.value,
    acidentes: acidentes.value
  };
  refDados.push(registro);
  formulario.reset();
});

// TEMPO REAL
refDados.on("value", snapshot => {
  dados = [];
  snapshot.forEach(child => { dados.push(child.val()); });
  atualizarGrafico();
});

// GRÁFICO
function atualizarGrafico(){
  let tc=0, outros=0, total=0;
  const hoje = new Date();
  dados.forEach(d=>{
    if(!d.data) return;
    const dt = new Date(d.data);
    if(dt.getMonth()===hoje.getMonth() && dt.getFullYear()===hoje.getFullYear()){
      let p = Number(d.parada||0);
      total+=p;
      if(["1C","1T","1K","1G"].includes(d.doca)) tc+=p;
      else outros+=p;
    }
  });

  if(grafico) grafico.destroy();

  const plugin = {
    id:"valorTopo",
    afterDatasetsDraw(chart){
      const {ctx} = chart;
      chart.data.datasets.forEach((dataset,i)=>{
        chart.getDatasetMeta(i).data.forEach((bar,index)=>{
          ctx.save();
          ctx.fillStyle="#000";
          ctx.font="bold 12px Arial";
          ctx.textAlign="center";
          ctx.fillText(dataset.data[index]+" min",bar.x,bar.y-5);
          ctx.restore();
        });
      });
    }
  };

  grafico = new Chart(graficoDocas,{
    type:"bar",
    data:{
      labels:["T&C","Body/Stamp/PWT","Total Geral"],
      datasets:[{data:[tc,outros,total]}]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:true}},
      scales:{y:{beginAtZero:true}}
    },
    plugins:[plugin]
  });
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
      <td>${p} minutos</td>
      <td>${d.motivoParada||'-'}</td>
      <td>${d.causaParada||'-'}</td>
      <td>${d.absenteismo||0}</td>
      <td>${d.retornoAbs||'-'}</td>
      <td>${d.recLocal||0}</td>
      <td>${d.recImportado||0}</td>
      <td>${d.obsLocal||'-'}</td>
      <td>${d.obsImportado||'-'}</td>
      <td>${d.acidentes||0}</td>
    </tr>`;
  });

  tabela.style.display="table";
  kpisDia.style.display="block";
  kpisDia.innerHTML=`
  📊 Total Linha Parada: ${tp} minutos<br>
  📦 Recebimento Local: ${rl}<br>
  🌍 Recebimento Importado: ${ri}<br>
  👥 Absenteísmo: ${a}<br>
  ⚠️ Acidentes: ${ac}`;
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
  let csv="Data;Predio;Doca;Parada;Motivo;Causa;Absenteismo;Retorno;RecLocal;RecImportado;ObsLocal;ObsImportado;Seguranca\n";
  dados.forEach(d=>{
    csv+=`${d.data};${d.predio};${d.doca};${d.parada};"${d.motivoParada}";"${d.causaParada}";${d.absenteismo||0};${d.retornoAbs||'-'};${d.recLocal};${d.recImportado};"${d.obsLocal}";"${d.obsImportado}";${d.acidentes||0}\n`;
  });
  let blob=new Blob(["\uFEFF"+csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
}
