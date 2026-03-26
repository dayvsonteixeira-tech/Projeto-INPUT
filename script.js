let dados = JSON.parse(localStorage.getItem("registros")) || [];
let grafico;

const historico = document.getElementById("historico");
const tabela = document.getElementById("tabela");
const kpisDia = document.getElementById("kpisDia");
const resultadoDiv = document.getElementById("resultadoGrupo");

function salvar() {
  localStorage.setItem("registros", JSON.stringify(dados));
}

// SALVAR
document.getElementById("formulario").addEventListener("submit", e => {
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

  dados.push(registro);
  salvar();
  atualizarGraficoGeral();
  formulario.reset();
});

// GRÁFICO
function atualizarGraficoGeral() {
  const grupoTC = ["1C","1T","1K","1G"];
  const grupoOutros = ["1B","30"];

  let totalTC=0,totalOutros=0,totalGeral=0;
  const hoje = new Date();

  dados.forEach(item=>{
    if(!item.data) return;
    const d = new Date(item.data);

    if(d.getMonth()===hoje.getMonth() && d.getFullYear()===hoje.getFullYear()){
      let p=Number(item.parada||0);
      totalGeral+=p;
      if(grupoTC.includes(item.doca)) totalTC+=p;
      if(grupoOutros.includes(item.doca)) totalOutros+=p;
    }
  });

  const canvas=document.getElementById("graficoDocas");
  if(grafico) grafico.destroy();

  grafico=new Chart(canvas,{
    type:"bar",
    data:{
      labels:["T&C","Body/Stamp/PWT","Total Geral"],
      datasets:[{data:[totalTC,totalOutros,totalGeral]}]
    }
  });
}

// FILTRO DATA
function filtrarData(){
  const f=document.getElementById("filtroData").value;
  const filtrado=dados.filter(d=>d.data===f);

  historico.innerHTML="";
  let tp=0,rl=0,ri=0,a=0,ac=0;

  filtrado.forEach(i=>{
    let p=Number(i.parada||0);

    tp+=p;
    rl+=Number(i.recLocal||0);
    ri+=Number(i.recImportado||0);
    a+=Number(i.absenteismo||0);
    ac+=Number(i.acidentes||0);

    historico.innerHTML+=`
    <tr>
      <td>${i.data}</td>
      <td>${i.predio}</td>
      <td>${i.doca}</td>
      <td>${p} minutos</td>
      <td>${i.motivoParada || '-'}</td>
      <td>${i.causaParada || '-'}</td>
      <td>${i.absenteismo || 0}</td>
      <td>${i.retornoAbs || '-'}</td>
      <td>${i.recLocal || 0}</td>
      <td>${i.recImportado || 0}</td>
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
function abrirFiltroPredio(){
  const painel=document.getElementById("painelFiltro");
  const grafico=document.getElementById("graficoDocas");

  painel.style.display="block";
  grafico.parentNode.insertBefore(painel,grafico);
}

function filtrarPorGrupo(tipo){
  const grupoTC=["1C","1T","1K","1G"];
  const grupoOutros=["1B","30"];

  let validas = tipo==="TC"?grupoTC:grupoOutros;
  let soma=0,docas={};

  dados.forEach(i=>{
    let p=Number(i.parada||0);
    if(validas.includes(i.doca)){
      soma+=p;
      docas[i.doca]=(docas[i.doca]||0)+p;
    }
  });

  let html=`📊 Total de Paradas: ${soma} min<br>`;

  for(let d in docas){
    html+=`<button onclick="abrirRelatorio('${d}')">🚪 ${d} (${docas[d]} min)</button>`;
  }

  resultadoDiv.innerHTML=html;

  const grafico=document.getElementById("graficoDocas");
  grafico.parentNode.insertBefore(resultadoDiv,grafico);
}

// RELATÓRIO
function abrirRelatorio(d){
  let w=window.open("");
  let r=dados.filter(x=>x.doca===d);

  let html="<table border='1'><tr><th>Data</th><th>Parada</th></tr>";
  r.forEach(x=>{
    html+=`<tr><td>${x.data}</td><td>${x.parada}</td></tr>`;
  });

  w.document.write(html);
}

// EXPORTAR
function exportarExcel(){
  let csv="Data,Predio,Doca,Parada\n";
  dados.forEach(d=>{
    csv+=`${d.data},${d.predio},${d.doca},${d.parada}\n`;
  });

  let blob=new Blob([csv]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="relatorio.csv";
  a.click();
}

// INICIAR
atualizarGraficoGeral();
