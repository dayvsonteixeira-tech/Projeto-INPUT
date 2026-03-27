document.addEventListener("DOMContentLoaded", () => {

  // 🔥 DOM
  const formulario = document.getElementById("formulario");
  const data = document.getElementById("data");
  const predio = document.getElementById("predio");
  const doca = document.getElementById("doca");
  const turno = document.getElementById("turno");

  const parada = document.getElementById("parada");
  const recLocal = document.getElementById("recLocal");
  const recImportado = document.getElementById("recImportado");
  const ovacaoImportado = document.getElementById("ovacaoImportado");
  const absenteismo = document.getElementById("absenteismo");
  const acidentes = document.getElementById("acidentes");

  const graficoCanvas = document.getElementById("graficoDocas");

  if (!graficoCanvas) {
    console.error("Canvas não encontrado!");
    return;
  }

  // 🔥 FIREBASE
  const firebaseConfig = {
    apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
    authDomain: "controle-gerencial-75f09.firebaseapp.com",
    databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
    projectId: "controle-gerencial-75f09"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const ref = db.ref("registros");

  let dados = [];
  let grafico;

  // 📊 CONFIG DO GRÁFICO
  function criarGrafico(t1, t2) {

    if (grafico) grafico.destroy();

    const ctx = graficoCanvas.getContext("2d");

    grafico = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["1º Turno", "2º Turno"],
        datasets: [{
          label: "Parada de Linha",
          data: [t1, t2]
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  // 💾 SALVAR
  formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    const turnoValue = document.getElementById("turno").value;

    // 🔒 validação
    if (!["1", "2"].includes(turnoValue)) {
      alert("Turno inválido!");
      return;
    }

    const registro = {
      data: data.value,
      predio: predio.value,
      doca: doca.value,
      turno: turnoValue,

      parada: Number(parada.value || 0),
      recLocal: Number(recLocal.value || 0),
      recImportado: Number(recImportado.value || 0),
      ovacaoImportado: Number(ovacaoImportado.value || 0),
      absenteismo: Number(absenteismo.value || 0),
      acidentes: Number(acidentes.value || 0)
    };

    ref.push(registro);

    formulario.reset();
    turno.value = "1";
  });

  // 🔄 ATUALIZAÇÃO EM TEMPO REAL
  ref.on("value", (snapshot) => {

    dados = [];

    snapshot.forEach(child => {
      dados.push(child.val());
    });

    atualizarGrafico();

  });

  // 📊 PROCESSAR DADOS
  function atualizarGrafico() {

    let turno1 = 0;
    let turno2 = 0;

    dados.forEach(d => {

      let t = String(d.turno).trim();

      if (t === "1") turno1 += Number(d.parada || 0);
      if (t === "2") turno2 += Number(d.parada || 0);

    });

    criarGrafico(turno1, turno2);
  }

});
