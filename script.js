document.addEventListener("DOMContentLoaded", () => {

    // 🔥 FIREBASE
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

    // 🔝 VALORES NAS BARRAS
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

    // 📊 CONFIG
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

    // 🔄 CARREGAMENTO (CORRIGIDO 100%)
    refDados.on("value", snapshot => {

        dados = [];

        snapshot.forEach(child => {
            let item = child.val();

            // 🔥 CORREÇÃO DO TURNO (ESSA ERA A FALHA)
            let turnoLimpo = String(item.turno || "")
                .replace(/\D/g, "")
                .trim();

            if (turnoLimpo !== "1" && turnoLimpo !== "2") {
                console.warn("Turno inválido ignorado:", item.turno);
                return;
            }

            item.turno = turnoLimpo;

            dados.push(item);
        });

        console.log("DADOS OK:", dados);

        atualizarGraficoPrincipal();
        atualizarDashboard();
    });

    // 📊 GRÁFICO PRINCIPAL
    function atualizarGraficoPrincipal() {

        let tc = 0;
        let outros = 0;
        let total = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            total += p;

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
                    data: [tc, outros, total],
                    backgroundColor: ["#3498db", "#3498db", "#e67e22"]
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // 📊 DASHBOARD
    function atualizarDashboard() {

        let turnos = {
            "1": { total: 0, abs: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {} },
            "2": { total: 0, abs: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {} }
        };

        dados.forEach(d => {

            let tKey = d.turno;
            if (!turnos[tKey]) return;

            let t = turnos[tKey];

            let p = Number(d.parada || 0);
            let rl = Number(d.recLocal || 0);
            let ri = Number(d.recImportado || 0);
            let ov = Number(d.ovacaoImportado || 0);

            t.total += p;
            t.abs += Number(d.absenteismo || 0);
            t.seg += Number(d.acidentes || 0);

            if (d.predio) {
                t.pred[d.predio] = (t.pred[d.predio] || 0) + p;
            }

            if (d.data) {
                t.dia[d.data] = (t.dia[d.data] || 0) + p;
                t.recLocal[d.data] = (t.recLocal[d.data] || 0) + rl;
                t.recImportado[d.data] = (t.recImportado[d.data] || 0) + ri;
                t.ovacao[d.data] = (t.ovacao[d.data] || 0) + ov;
            }
        });

        ["1", "2"].forEach(turno => {

            let s = turno === "1" ? "_t1" : "_t2";
            let d = turnos[turno];

            const dias = Object.keys(d.dia).sort();

            criarGrafico("g1" + s, ["Total"], [d.total], "Parada Total");
            criarGrafico("g2" + s, Object.keys(d.pred), Object.values(d.pred), "Parada por Prédio");

            criarGrafico("g7" + s, dias, dias.map(x => d.abs), "Absenteísmo por Dia");
            criarGrafico("g8" + s, ["Segurança"], [d.seg], "Acidentes");

            criarGrafico("g_parada_dia" + s, dias, dias.map(x => d.dia[x]), "Parada por Dia (MINUTOS)");
            criarGrafico("g_rec_local_dia" + s, dias, dias.map(x => d.recLocal[x]), "Recebimento Local por Dia");
            criarGrafico("g_rec_importado_dia" + s, dias, dias.map(x => d.recImportado[x]), "Recebimento Importado por Dia");
            criarGrafico("g_ovacao_dia" + s, dias, dias.map(x => d.ovacao[x]), "Ovação por Dia");
        });
    }

    // 📊 CRIAR GRÁFICO
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

    // 💾 SALVAR
    const formulario = document.getElementById("formulario");

    if (formulario) {
        formulario.addEventListener("submit", e => {
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

            formulario.reset();

            turno.value = "1";
        });
    }

});
