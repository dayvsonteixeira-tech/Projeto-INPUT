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

    // 💡 ELEMENTOS DO DOM
    const formulario = document.getElementById("formulario");
    let dados = [];
    let graficoPrincipal;
    let graficos = {};

    // 🔝 PLUGIN PARA MOSTRAR VALORES NO TOPO DAS BARRAS
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

    // 📊 CONFIGURAÇÃO PADRÃO DE ESCALAS
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

    // 💾 SALVAR NO FIREBASE
    formulario.addEventListener("submit", e => {
        e.preventDefault();

        // Pegando valores dos inputs
        const turnoElem = document.getElementById("turno");
        const dataElem = document.getElementById("data");
        const predioElem = document.getElementById("predio");
        const docaElem = document.getElementById("doca");
        const paradaElem = document.getElementById("parada");

        if (!paradaElem.value) {
            alert("Preencha os campos obrigatórios!");
            return;
        }

        const turnoValue = String(turnoElem.value).replace(/\D/g, "").trim();

        const registro = {
            data: dataElem.value,
            predio: predioElem.value,
            doca: docaElem.value,
            turno: turnoValue,
            parada: Number(paradaElem.value || 0),
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
        
        // Valores padrão após reset
        turnoElem.value = "1";
        predioElem.value = "T&C";
    });

    // 🔄 LEITURA EM TEMPO REAL
    refDados.on("value", snapshot => {
        dados = [];
        snapshot.forEach(child => {
            dados.push(child.val());
        });

        atualizarGraficoPrincipal();
        atualizarDashboard();
    });

    // 📊 GRÁFICO PRINCIPAL: COMPARAÇÃO 1º vs 2º TURNO
    function atualizarGraficoPrincipal() {
        let t1 = 0, t2 = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            let turno = String(d.turno).trim();

            if (turno === "1") t1 += p;
            else if (turno === "2") t2 += p;
        });

        if (graficoPrincipal) graficoPrincipal.destroy();

        const canvas = document.getElementById("graficoDocas");
        if (!canvas) return;

        graficoPrincipal = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["1º Turno", "2º Turno"],
                datasets: [{
                    label: "Minutos Parados (Total)",
                    data: [t1, t2],
                    backgroundColor: ["#3498db", "#e67e22"]
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 📊 FUNÇÃO GENÉRICA PARA DASHBOARD
    function criarGrafico(id, labels, data, label) {
        if (graficos[id]) graficos[id].destroy();

        const canvas = document.getElementById(id);
        if (!canvas) return;

        graficos[id] = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: "#2ecc71"
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 📊 PROCESSAR DASHBOARD DETALHADO POR TURNO
    function atualizarDashboard() {
        let turnos = { "1": {}, "2": {} };

        dados.forEach(d => {
            let turnoKey = String(d.turno).replace(/\D/g, "").trim();
            if (!turnos[turnoKey]) return;

            let t = turnos[turnoKey];
            let p = Number(d.parada || 0);

            t.total = (t.total || 0) + p;
            
            t.pred = t.pred || {};
            t.pred[d.predio] = (t.pred[d.predio] || 0) + p;

            t.dia = t.dia || {};
            t.dia[d.data] = (t.dia[d.data] || 0) + p;
            
            // Outras métricas
            t.abs = (t.abs || 0) + Number(d.absenteismo || 0);
            t.seg = (t.seg || 0) + Number(d.acidentes || 0);
        });

        ["1", "2"].forEach(turno => {
            let s = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];

            criarGrafico("g1" + s, ["Total Parada"], [d.total || 0], "Minutos");
            criarGrafico("g2" + s, Object.keys(d.pred || {}), Object.values(d.pred || {}), "Parada por Prédio");
            criarGrafico("g3" + s, Object.keys(d.dia || {}), Object.values(d.dia || {}), "Parada por Dia");
            criarGrafico("g7" + s, ["Absenteísmo"], [d.abs || 0], "Faltas");
            criarGrafico("g8" + s, ["Segurança"], [d.seg || 0], "Acidentes");
        });
    }
});
