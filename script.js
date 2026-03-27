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

    // 📊 CONFIGURAÇÃO PADRÃO DE ESCALAS
    function opcoesGrafico() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        };
    }

    // 🔄 LEITURA EM TEMPO REAL E NORMALIZAÇÃO
    refDados.on("value", snapshot => {
        dados = [];
        snapshot.forEach(child => {
            const item = child.val();
            // Normaliza o turno para "1" ou "2"
            item.turno = String(item.turno || "").replace(/\D/g, "").substring(0, 1);
            dados.push(item);
        });

        atualizarGraficoPrincipal(); 
        atualizarDashboard();        
    });

    // 📊 01. GRÁFICO PRINCIPAL: T&C, BODY/STAMP/PWT, TOTAL
    function atualizarGraficoPrincipal() {
        let tc = 0, outros = 0, totalGeral = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            totalGeral += p;

            const docasTC = ["1C", "1T", "1K", "1G"];
            const docaAtual = String(d.doca || "").toUpperCase().trim();

            if (docasTC.includes(docaAtual)) {
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

    // 📊 02. DASHBOARD DETALHADO (TURNOS 1 E 2)
    function atualizarDashboard() {
        // Inicializa estrutura de dados para os dois turnos
        let turnos = { 
            "1": { total: 0, abs: 0, seg: 0, ovacao: 0, pred: {}, dia: {}, recLocal: {}, recImp: {} }, 
            "2": { total: 0, abs: 0, seg: 0, ovacao: 0, pred: {}, dia: {}, recLocal: {}, recImp: {} } 
        };

        dados.forEach(d => {
            let tKey = d.turno;
            if (!turnos[tKey]) return;

            let t = turnos[tKey];
            let dataLabel = d.data || "Sem Data";

            t.total += Number(d.parada || 0);
            t.abs += Number(d.absenteismo || 0);
            t.seg += Number(d.acidentes || 0);
            t.ovacao += Number(d.ovacaoImportado || 0);

            // Agrupamentos por dia/prédio
            t.pred[d.predio] = (t.pred[d.predio] || 0) + Number(d.parada || 0);
            t.dia[dataLabel] = (t.dia[dataLabel] || 0) + Number(d.parada || 0);
            t.recLocal[dataLabel] = (t.recLocal[dataLabel] || 0) + Number(d.recLocal || 0);
            t.recImp[dataLabel] = (t.recImp[dataLabel] || 0) + Number(d.recImportado || 0);
        });

        ["1", "2"].forEach(turno => {
            let sufixo = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];
            let cor = turno === "1" ? "#3498db" : "#e67e22";

            // Ordenar datas para os gráficos ficarem cronológicos
            const datasOrdenadas = Object.keys(d.dia).sort();

            // G1: Total Parada
            criarGrafico("g1" + sufixo, ["Total Parada"], [d.total], "Minutos", cor);
            
            // G2: Parada por Prédio
            criarGrafico("g2" + sufixo, Object.keys(d.pred), Object.values(d.pred), "Minutos por Prédio", cor);
            
            // G3: Parada por Dia
            criarGrafico("g3" + sufixo, datasOrdenadas, datasOrdenadas.map(k => d.dia[k]), "Parada por Dia", cor);
            
            // G4: Recebimento Local por Dia
            criarGrafico("g4" + sufixo, datasOrdenadas, datasOrdenadas.map(k => d.recLocal[k]), "Rec. Local por Dia", "#2ecc71");
            
            // G5: Recebimento Importado por Dia
            criarGrafico("g5" + sufix
