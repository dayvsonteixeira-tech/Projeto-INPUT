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
                    ctx.font = "bold 11px Arial";
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
                    ticks: { stepSize: 1 }
                }
            }
        };
    }

    // 🔄 ATUALIZAÇÃO EM TEMPO REAL
    refDados.on("value", snapshot => {
        dados = [];
        snapshot.forEach(child => {
            const item = child.val();
            // Normaliza o turno para garantir que "1", "1º" ou 1 vire sempre "1"
            item.turno = String(item.turno || "").replace(/\D/g, "").substring(0, 1);
            dados.push(item);
        });

        atualizarGraficoPrincipal(); 
        atualizarDashboard();        
    });

    // 📊 GRÁFICO PRINCIPAL: T&C, BODY/STAMP/PWT, TOTAL
    function atualizarGraficoPrincipal() {
        let tc = 0;
        let outros = 0;
        let totalGeral = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            totalGeral += p;

            // Lógica das Docas (T&C vs Resto)
            const docasTC = ["1C", "1T", "1K", "1G"];
            if (docasTC.includes(String(d.doca).toUpperCase().trim())) {
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
                    data: [tc, outros, totalGeral],
                    backgroundColor: ["#3498db", "#e74c3c", "#2ecc71"]
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 📊 DASHBOARD (DETALHE POR TURNO)
    function atualizarDashboard() {
        // Inicializa os objetos para não dar erro de 'undefined'
        let turnos = { 
            "1": { total: 0, abs: 0, seg: 0, pred: {}, dia: {} }, 
            "2": { total: 0, abs: 0, seg: 0, pred: {}, dia: {} } 
        };

        dados.forEach(d => {
            let tKey = d.turno; // Já normalizado no 'on value'
            if (!turnos[tKey]) return;

            let t = turnos[tKey];
            let p = Number(d.parada || 0);

            t.total += p;
            t.abs += Number(d.absenteismo || 0);
            t.seg += Number(d.acidentes || 0);

            if (d.predio) t.pred[d.predio] = (t.pred[d.predio] || 0) + p;
            if (d.data) t.dia[d.data] = (t.dia[d.data] || 0) + p;
        });

        ["1", "2"].forEach(turno => {
            let sufixo = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];

            criarGrafico("g1" + sufixo, ["Total"], [d.total], "Minutos Parados");
            criarGrafico("g2" + sufixo, Object.keys(d.pred), Object.values(d.pred), "Por Prédio");
            criarGrafico("g7" + sufixo, ["Absenteísmo"], [d.abs], "Faltas");
            criarGrafico("g8" + sufixo, ["Segurança"], [d.seg], "Acidentes");
        });
    }

    // 📊 CRIAR GRÁFICOS DO DASHBOARD
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
                    backgroundColor: id.includes("_t1") ? "#3498db" : "#e67e22" 
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 💾 SALVAMENTO
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
                motivoParada: document.getElementById("motivoParada")?.value || "",
                causaParada: document.getElementById("causaParada")?.value || ""
            };

            refDados.push(registro);
            formulario.reset();
            document.getElementById("turno").value = "1"; // Reset padrão
        });
    }
});
