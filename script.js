document.addEventListener("DOMContentLoaded", () => {

const firebaseConfig = {
    apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
    authDomain: "controle-gerencial-75f09.firebaseapp.com",
    databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
    projectId: "controle-gerencial-75f09"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const refDados = db.ref("registros");

let dados = [];
let graficoPrincipal;
let graficos = {};

// 🔥 CORREÇÃO PRINCIPAL: evitar erro no Chart
function criarGrafico(id, labels, data, label) {

    const canvas = document.getElementById(id);
    if (!canvas) return; // NÃO QUEBRA MAIS

    if (graficos[id]) graficos[id].destroy();

    graficos[id] = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: id.includes("_t1") ? "#3498db" : "#e67e22"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// 🔄 FIREBASE
refDados.on("value", snapshot => {

    dados = [];

    snapshot.forEach(child => {
        const item = child.val();

        // 🔥 CORREÇÃO DO TURNO (ESSENCIAL)
        item.turno = String(item.turno || "").replace(/\D/g, "").substring(0,1);

        dados.push(item);
    });

    atualizarGraficoPrincipal();
    atualizarDashboard();
});


// 📊 GRÁFICO PRINCIPAL (SEU ORIGINAL)
function atualizarGraficoPrincipal() {

    let tc = 0;
    let outros = 0;
    let total = 0;

    dados.forEach(d => {

        let p = Number(d.parada || 0);
        total += p;

        const doca = (d.doca || "").toUpperCase();

        if (["1C","1T","1K","1G"].includes(doca)) {
            tc += p;
        } else {
            outros += p;
        }
    });

    if (graficoPrincipal) graficoPrincipal.destroy();

    const canvas = document.getElementById("graficoDocas");
    if (!canvas) return;

    graficoPrincipal = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["T&C", "BODY/STAMP/PWT", "TOTAL"],
            datasets: [{
                label: "Parada de Linha Total (Minutos)",
                data: [tc, outros, total],
                backgroundColor: ["#3498db", "#3498db", "#e67e22"]
            }]
        }
    });
}


// 📊 DASHBOARD TURNOS (SEM MEXER NA SUA ESTRUTURA)
function atualizarDashboard() {

    let turnos = {
        "1": { total:0, pred:{}, dia:{}, absDia:{}, seg:0 },
        "2": { total:0, pred:{}, dia:{}, absDia:{}, seg:0 }
    };

    dados.forEach(d => {

        let tKey = d.turno;
        if (!turnos[tKey]) return;

        let t = turnos[tKey];

        let p = Number(d.parada || 0);

        t.total += p;

        if (d.predio) {
            t.pred[d.predio] = (t.pred[d.predio] || 0) + p;
        }

        if (d.data) {
            t.dia[d.data] = (t.dia[d.data] || 0) + p;

            // 🔥 ABSENTEISMO POR DIA
            t.absDia[d.data] = (t.absDia[d.data] || 0) + Number(d.absenteismo || 0);
        }

        t.seg += Number(d.acidentes || 0);
    });

    ["1","2"].forEach(turno => {

        let sufixo = turno === "1" ? "_t1" : "_t2";
        let d = turnos[turno];

        criarGrafico("g1" + sufixo, ["Total"], [d.total], "Parada Total");

        criarGrafico("g2" + sufixo,
            Object.keys(d.pred),
            Object.values(d.pred),
            "Parada por Prédio"
        );

        criarGrafico("g_parada_dia" + sufixo,
            Object.keys(d.dia),
            Object.values(d.dia),
            "Parada por Dia (MINUTOS)"
        );

        // 🔥 ABSENTEISMO CORRIGIDO
        criarGrafico("g7" + sufixo,
            Object.keys(d.absDia),
            Object.values(d.absDia),
            "Absenteísmo por Dia"
        );

        // 🔥 ACIDENTES CORRIGIDO
        criarGrafico("g8" + sufixo,
            ["Acidentes"],
            [d.seg],
            "Segurança"
        );
    });
}


// 💾 SALVAR (SEU ORIGINAL)
document.getElementById("formulario").addEventListener("submit", e => {
    e.preventDefault();

    const registro = {
        data: data.value,
        predio: predio.value,
        doca: doca.value,
        turno: turno.value,
        parada: Number(parada.value || 0),
        recLocal: Number(recLocal.value || 0),
        recImportado: Number(recImportado.value || 0),
        ovacaoImportado: Number(ovacaoImportado.value || 0),
        absenteismo: Number(absenteismo.value || 0),
        acidentes: Number(acidentes.value || 0),
        motivoParada: motivoParada.value,
        causaParada: causaParada.value,
        obsLocal: obsLocal.value,
        obsImportado: obsImportado.value
    };

    refDados.push(registro);
    e.target.reset();
    turno.value = "1";
});

});
