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
