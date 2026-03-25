const form = document.getElementById("formulario");
const historico = document.getElementById("historico");

let dados = JSON.parse(localStorage.getItem("registros")) || [];

function renderizar() {
  historico.innerHTML = "";

  dados.forEach(item => {
    let linha = `
      <tr>
        <td>${item.data}</td>
        <td>${item.doca}</td>
        <td>${item.parada}</td>
      </tr>
    `;
    historico.innerHTML += linha;
  });
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const registro = {
    data: document.getElementById("data").value,
    predio: document.getElementById("predio").value,
    doca: document.getElementById("doca").value,
    parada: document.getElementById("parada").value,
    motivo: document.getElementById("motivoParada").value,
    causa: document.getElementById("causaParada").value,
    recLocal: document.getElementById("recLocal").value,
    recImportado: document.getElementById("recImportado").value,
    previsto: document.getElementById("previsto").value,
    real: document.getElementById("real").value,
    absenteismo: document.getElementById("absenteismo").value,
    motivoAbs: document.getElementById("motivoAbs").value,
    retorno: document.getElementById("retorno").value,
    acidentes: document.getElementById("acidentes").value
  };

  dados.push(registro);
  localStorage.setItem("registros", JSON.stringify(dados));

  renderizar();
  form.reset();
});

renderizar();
