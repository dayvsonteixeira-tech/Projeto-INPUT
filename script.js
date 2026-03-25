let dados = JSON.parse(localStorage.getItem("registros")) || [];

const historico = document.getElementById("historico");

function salvar() {
  localStorage.setItem("registros", JSON.stringify(dados));
}

function renderizar(lista = dados) {
  historico.innerHTML = "";

  let totalParadas = 0;
  let totalReceb = 0;
  let totalAbs = 0;
  let totalAcidentes = 0;

  lista.forEach(item => {

    let parada = Number(item.parada || 0);
    let receb = Number(item.recLocal || 0) + Number(item.recImportado || 0);

    totalParadas += parada;
    totalReceb += receb;
    totalAbs += Number(item.absenteismo || 0);
    totalAcidentes += Number(item.acidentes || 0);

    let classe = parada > 30 ? "parada-alta" : "";

    historico.innerHTML += `
      <tr class="${classe}">
        <td>${item.data}</td>
        <td>${item.predio}</td>
        <td>${item.doca}</td>
        <td>${parada}</td>
        <td>${receb}</td>
      </tr>
    `;
  });

  document.getElementById("totalParadas").innerText = totalParadas;
  document.getElementById("totalReceb").innerText = totalReceb;
  document.getElementById("totalAbs").innerText = totalAbs;
  document.getElementById("totalAcidentes").innerText = totalAcidentes;
}

document.getElementById("formulario").addEventListener("submit", e => {
  e.preventDefault();

  const registro = {
    data: data.value,
    predio: predio.value,
    doca: doca.value,
    parada: parada.value,
    recLocal: recLocal.value,
    recImportado: recImportado.value,
    absenteismo: absenteismo.value,
    acidentes: acidentes.value
  };

  dados.push(registro);
  salvar();
  renderizar();
  formulario.reset();
});

function filtrar() {
  const dataFiltro = document.getElementById("filtroData").value;
  const filtrado = dados.filter(d => d.data === dataFiltro);
  renderizar(filtrado);
}

function exportarExcel() {
  let csv = "Data,Predio,Doca,Parada,Recebimento\n";

  dados.forEach(d => {
    let receb = Number(d.recLocal || 0) + Number(d.recImportado || 0);
    csv += `${d.data},${d.predio},${d.doca},${d.parada},${receb}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio.csv";
  link.click();
}

renderizar();
