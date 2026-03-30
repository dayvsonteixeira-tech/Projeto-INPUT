document.addEventListener("DOMContentLoaded", () => {
    // 🔥 CONFIGURAÇÃO FIREBASE (mantida igual)
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
    let graficoPrincipal, graficoMensal, graficoDoca;
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
            item.turno = String(item.turno || "").replace(/\D/g, "").substring(0, 1);
            dados.push(item);
        });

        atualizarGraficoPrincipal();
        atualizarGraficoMensal();
        atualizarGraficoPorDoca();
        atualizarDashboard();
    });

    // ====================== NOVOS GRÁFICOS ======================

    // 1. Gráfico Principal - Anual (T&C vs BODY/STAMP/PWT)
    function atualizarGraficoPrincipal() {
        let tc = 0, outros = 0, totalGeral = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            totalGeral += p;
            const docasTC = ["1C", "1T", "1K", "1G"];
            if (docasTC.includes(String(d.doca).toUpperCase().trim())) {
                tc += p;
            } else {
                outros += p;
            }
        });

        if (graficoPrincipal) graficoPrincipal.destroy();

        graficoPrincipal = new Chart(document.getElementById("graficoDocas").getContext("2d"), {
            type: "bar",
            data: {
                labels: ["T&C", "BODY/STAMP/PWT", "TOTAL"],
                datasets: [{
                    label: "Parada Acumulada (Minutos)",
                    data: [tc, outros, totalGeral],
                    backgroundColor: ["#3498db", "#e74c3c", "#2ecc71"]
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 2. Gráfico de Parada Acumulada (Mensal)
    function atualizarGraficoMensal() {
        const meses = {};
        const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        dados.forEach(d => {
            if (d.data) {
                const data = new Date(d.data);
                const mes = data.getMonth(); // 0 a 11
                meses[mes] = (meses[mes] || 0) + Number(d.parada || 0);
            }
        });

        const labels = [];
        const valores = [];

        for (let i = 0; i < 12; i++) {
            labels.push(nomesMeses[i]);
            valores.push(meses[i] || 0);
        }

        if (graficoMensal) graficoMensal.destroy();

        graficoMensal = new Chart(document.getElementById("graficoParadaMensal").getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Parada Acumulada por Mês (Minutos)",
                    data: valores,
                    backgroundColor: "#9b59b6"
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 3. Gráfico de Parada Acumulada por Doca (ANUAL)
    function atualizarGraficoPorDoca() {
        const porDoca = {};

        dados.forEach(d => {
            const doca = String(d.doca || "").trim().toUpperCase();
            if (doca) {
                porDoca[doca] = (porDoca[doca] || 0) + Number(d.parada || 0);
            }
        });

        const labels = Object.keys(porDoca);
        const valores = Object.values(porDoca);

        if (graficoDoca) graficoDoca.destroy();

        graficoDoca = new Chart(document.getElementById("graficoParadaDoca").getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Parada Acumulada por Doca (Minutos)",
                    data: valores,
                    backgroundColor: "#f39c12"
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // ====================== DASHBOARD ======================
    function atualizarDashboard() {
        let turnos = {
            "1": { total: 0, abs: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {}, absDia: {} },
            "2": { total: 0, abs: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {}, absDia: {} }
        };

        dados.forEach(d => {
            let tKey = d.turno;
            if (!turnos[tKey]) return;

            let t = turnos[tKey];
            let p = Number(d.parada || 0);
            let rl = Number(d.recLocal || 0);
            let ri = Number(d.recImportado || 0);
            let ov = Number(d.ovacaoImportado || 0);
            let abs = Number(d.absenteismo || 0);

            t.total += p;
            t.abs += abs;
            t.seg += Number(d.acidentes || 0);

            if (d.predio) t.pred[d.predio] = (t.pred[d.predio] || 0) + p;
            if (d.data) {
                t.dia[d.data] = (t.dia[d.data] || 0) + p;
                t.recLocal[d.data] = (t.recLocal[d.data] || 0) + rl;
                t.recImportado[d.data] = (t.recImportado[d.data] || 0) + ri;
                t.ovacao[d.data] = (t.ovacao[d.data] || 0) + ov;
                t.absDia[d.data] = (t.absDia[d.data] || 0) + abs;   // ← Novo: absenteísmo por dia
            }
        });

        ["1", "2"].forEach(turno => {
            let sufixo = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];

            const diasOrdenados = Object.keys(d.dia).sort();
            const diasAbsOrdenados = Object.keys(d.absDia).sort();

            // Gráficos existentes
            criarGrafico("g1" + sufixo, ["Total"], [d.total], "Minutos Parados");
            criarGrafico("g2" + sufixo, Object.keys(d.pred), Object.values(d.pred), "Por Prédio");
            criarGrafico("g8" + sufixo, ["Segurança"], [d.seg], "Acidentes");

            // Absenteísmo agora por dia
            criarGrafico(
                "g7" + sufixo,
                diasAbsOrdenados,
                diasAbsOrdenados.map(dia => d.absDia[dia]),
                "Absenteísmo por Dia"
            );

            // Novos gráficos por dia (mantidos)
            criarGrafico("g_parada_dia" + sufixo, diasOrdenados, diasOrdenados.map(dia => d.dia[dia]), "Parada de Linha por Dia (min)");
            criarGrafico("g_rec_local_dia" + sufixo, Object.keys(d.recLocal).sort(), Object.keys(d.recLocal).sort().map(dia => d.recLocal[dia]), "Recebimento Local por Dia");
            criarGrafico("g_rec_importado_dia" + sufixo, Object.keys(d.recImportado).sort(), Object.keys(d.recImportado).sort().map(dia => d.recImportado[dia]), "Recebimento Importado por Dia");
            criarGrafico("g_ovacao_dia" + sufixo, Object.keys(d.ovacao).sort(), Object.keys(d.ovacao).sort().map(dia => d.ovacao[dia]), "Ovação por Dia");
        });
    }

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

    // 💾 SALVAMENTO (mantido igual)
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
            document.getElementById("turno").value = "1";
        });
    }
});
