document.addEventListener("DOMContentLoaded", () => {
    // 🔥 CONFIGURAÇÃO FIREBASE
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

    // 🔝 PLUGIN VALORES NAS BARRAS
    const pluginValor = {
        id: "valorTopo",
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                chart.getDatasetMeta(i).data.forEach((bar, index) => {
                    ctx.save();
                    ctx.fillStyle = "#000";
                    ctx.font = "bold 12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
                    ctx.restore();
                });
            });
        }
    };

    // 📊 CONFIG PADRÃO
    function opcoesGrafico() {
        return {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: value => Number.isInteger(value) ? value : null
                    }
                }
            }
        };
    }

    // 🔄 ATUALIZAÇÃO EM TEMPO REAL
    refDados.on("value", snapshot => {
        dados = [];
        snapshot.forEach(child => dados.push(child.val()));

        atualizarGraficoPrincipal(); // Aqui mostramos T&C, BODY, TOTAL
        atualizarDashboard();        // Aqui mostramos os Turnos 1 e 2
    });

    // 📊 GRÁFICO PRINCIPAL (CORRIGIDO: ÁREAS E TOTAL)
    function atualizarGraficoPrincipal() {
        let tc = 0, outros = 0, total = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            total += p;

            // Filtro por Doca para definir se é T&C ou as outras áreas
            if (["1C", "1T", "1K", "1G"].includes(d.doca)) {
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
                    backgroundColor: ["#3498db", "#e74c3c", "#2ecc71"] // Cores diferentes para cada barra
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 📊 DASHBOARD (POR TURNO)
    function atualizarDashboard() {
        let turnos = { "1": { total: 0, abs: 0, seg: 0, pred: {}, dia: {} }, 
                       "2": { total: 0, abs: 0, seg: 0, pred: {}, dia: {} } };

        dados.forEach(d => {
            let turnoKey = String(d.turno).replace(/\D/g, "").trim();
            if (!turnos[turnoKey]) return;

            let t = turnos[turnoKey];
            let p = Number(d.parada || 0);

            t.total += p;
            t.pred[d.predio] = (t.pred[d.predio] || 0) + p;
            t.dia[d.data] = (t.dia[d.data] || 0) + p;
            t.abs += Number(d.absenteismo || 0);
            t.seg += Number(d.acidentes || 0);
        });

        ["1", "2"].forEach(turno => {
            let s = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];

            criarGrafico("g1" + s, ["Total Parada"], [d.total], "Minutos");
            criarGrafico("g2" + s, Object.keys(d.pred), Object.values(d.pred), "Por Prédio");
            criarGrafico("g3" + s, Object.keys(d.dia), Object.values(d.dia), "Por Dia");
            criarGrafico("g7" + s, ["Absenteísmo"], [d.abs], "Faltas");
            criarGrafico("g8" + s, ["Segurança"], [d.seg], "Acidentes");
        });
    }

    // 📊 CRIAR GRÁFICO (GENÉRICO)
    function criarGrafico(id, labels, data, label) {
        if (graficos[id]) graficos[id].destroy();
        const canvas = document.getElementById(id);
        if (!canvas) return;

        graficos[id] = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{ label: label, data: data, backgroundColor: "#9b59b6" }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 💾 SALVAR (FORMULÁRIO)
    const formulario = document.getElementById("formulario");
    if (formulario) {
        formulario.addEventListener("submit", e => {
            e.preventDefault();
            
            const registro = {
                data: document.getElementById("data").value,
                predio: document.getElementById("predio").value,
                doca: document.getElementById("doca").value,
                turno: document.getElementById("turno").value,
                parada: Number(document.getElementById("parada").value || 0),
                recLocal: Number(document.getElementById("recLocal").value || 0),
                recImportado: Number(document.getElementById("recImportado").value || 0),
                ovacaoImportado: Number(document.getElementById("ovacaoImportado").value || 0),
                absenteismo: Number(document.getElementById("absenteismo").value || 0),
                acidentes: Number(document.getElementById("acidentes").value || 0),
                motivoParada: document.getElementById("motivoParada").value,
                causaParada: document.getElementById("causaParada").value
            };

            refDados.push(registro);
            formulario.reset();
            document.getElementById("turno").value = "1";
        });
    }
});
