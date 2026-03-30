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
    let graficoMensal;
    let graficoDoca;
    let graficos = {};

    // Nomes dos meses em português
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

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
        atualizarGraficoDoca();
        atualizarDashboard();
    });

    // ─────────────────────────────────────────────────────────────
    // 📊 GRÁFICO ANUAL: T&C, BODY/STAMP/PWT, TOTAL
    // ─────────────────────────────────────────────────────────────
    function atualizarGraficoPrincipal() {
        let tc = 0;
        let outros = 0;
        let totalGeral = 0;

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

    // ─────────────────────────────────────────────────────────────
    // 📅 GRÁFICO MENSAL: soma de paradas por mês (todos os prédios)
    // ─────────────────────────────────────────────────────────────
    function atualizarGraficoMensal() {
        // Acumula paradas por "YYYY-MM" para manter a ordem correta
        const porMesMap = {};

        dados.forEach(d => {
            if (!d.data) return;
            const mesKey = d.data.substring(0, 7); // "YYYY-MM"
            porMesMap[mesKey] = (porMesMap[mesKey] || 0) + Number(d.parada || 0);
        });

        // Ordena as chaves cronologicamente
        const chaves = Object.keys(porMesMap).sort();

        // Converte "YYYY-MM" em nome legível
        const labels = chaves.map(k => {
            const [ano, mes] = k.split("-");
            return `${MESES[parseInt(mes, 10) - 1]}/${ano}`;
        });
        const valores = chaves.map(k => porMesMap[k]);

        if (graficoMensal) graficoMensal.destroy();

        const canvas = document.getElementById("graficoMensal");
        if (!canvas) return;

        graficoMensal = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Parada Acumulada (min)",
                    data: valores,
                    backgroundColor: "#9b59b6"
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 🚢 GRÁFICO POR DOCA ANUAL: soma total de paradas por doca
    // ─────────────────────────────────────────────────────────────
    function atualizarGraficoDoca() {
        const porDoca = {};

        dados.forEach(d => {
            const doca = String(d.doca || "").toUpperCase().trim();
            if (!doca) return;
            porDoca[doca] = (porDoca[doca] || 0) + Number(d.parada || 0);
        });

        // Ordena as docas alfabeticamente
        const docas = Object.keys(porDoca).sort();
        const valores = docas.map(dc => porDoca[dc]);

        // Paleta de cores cíclica
        const cores = ["#1abc9c", "#e67e22", "#3498db", "#e74c3c", "#9b59b6", "#f39c12"];

        if (graficoDoca) graficoDoca.destroy();

        const canvas = document.getElementById("graficoDoca");
        if (!canvas) return;

        graficoDoca = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: docas,
                datasets: [{
                    label: "Parada por Doca (min)",
                    data: valores,
                    backgroundColor: docas.map((_, i) => cores[i % cores.length])
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 📊 DASHBOARD (DETALHE POR TURNO)
    // ─────────────────────────────────────────────────────────────
    function atualizarDashboard() {
        let turnos = {
            "1": { total: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {}, absDia: {} },
            "2": { total: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {}, absDia: {} }
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
            t.seg += Number(d.acidentes || 0);

            if (d.predio) t.pred[d.predio] = (t.pred[d.predio] || 0) + p;

            if (d.data) {
                t.dia[d.data]       = (t.dia[d.data] || 0) + p;
                t.recLocal[d.data]  = (t.recLocal[d.data] || 0) + rl;
                t.recImportado[d.data] = (t.recImportado[d.data] || 0) + ri;
                t.ovacao[d.data]    = (t.ovacao[d.data] || 0) + ov;
                // ← Absenteísmo acumulado por dia
                t.absDia[d.data]    = (t.absDia[d.data] || 0) + abs;
            }
        });

        ["1", "2"].forEach(turno => {
            let sufixo = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];

            const diasOrdenados            = Object.keys(d.dia).sort();
            const diasRecLocalOrdenados    = Object.keys(d.recLocal).sort();
            const diasRecImportadoOrdenados = Object.keys(d.recImportado).sort();
            const diasOvacaoOrdenados      = Object.keys(d.ovacao).sort();
            const diasAbsOrdenados         = Object.keys(d.absDia).sort();

            // Gráficos originais (mantidos)
            criarGrafico("g1" + sufixo, ["Total"], [d.total], "Minutos Parados");
            criarGrafico("g2" + sufixo, Object.keys(d.pred), Object.values(d.pred), "Por Prédio");

            // Absenteísmo agora por dia
            criarGrafico(
                "g7" + sufixo,
                diasAbsOrdenados,
                diasAbsOrdenados.map(dia => d.absDia[dia]),
                "Absenteísmo por Dia"
            );

            criarGrafico("g8" + sufixo, ["Segurança"], [d.seg], "Acidentes");

            // Novos gráficos por dia
            criarGrafico(
                "g_parada_dia" + sufixo,
                diasOrdenados,
                diasOrdenados.map(dia => d.dia[dia]),
                "Parada de Linha por Dia (min)"
            );

            criarGrafico(
                "g_rec_local_dia" + sufixo,
                diasRecLocalOrdenados,
                diasRecLocalOrdenados.map(dia => d.recLocal[dia]),
                "Recebimento Local por Dia"
            );

            criarGrafico(
                "g_rec_importado_dia" + sufixo,
                diasRecImportadoOrdenados,
                diasRecImportadoOrdenados.map(dia => d.recImportado[dia]),
                "Recebimento Importado por Dia"
            );

            criarGrafico(
                "g_ovacao_dia" + sufixo,
                diasOvacaoOrdenados,
                diasOvacaoOrdenados.map(dia => d.ovacao[dia]),
                "Ovação por Dia"
            );
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
            document.getElementById("turno").value = "1";
        });
    }
});
