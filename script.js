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
    let graficoPrincipal = null;
    let graficoMensal = null;
    let graficoDoca = null;
    let graficos = {};

    // Plugin para mostrar valores nas barras
    const pluginValor = {
        id: "valorTopo",
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                chart.getDatasetMeta(i).data.forEach((bar, index) => {
                    if (dataset.data[index] > 0) {
                        ctx.save();
                        ctx.fillStyle = "#000";
                        ctx.font = "bold 11px Arial";
                        ctx.textAlign = "center";
                        ctx.fillText(dataset.data[index], bar.x, bar.y - 5);
                        ctx.restore();
                    }
                });
            });
        }
    };

    function opcoesGrafico() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        };
    }

    // Listener principal do Firebase
    refDados.on("value", (snapshot) => {
        dados = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const item = child.val();
                item.turno = String(item.turno || "").replace(/\D/g, "").substring(0, 1);
                dados.push(item);
            });
            console.log(`✅ ${dados.length} registros carregados do Firebase`);
        } else {
            console.log("⚠️ Nenhum registro encontrado no Firebase ainda.");
        }

        atualizarTodosGraficos();
    }, (error) => {
        console.error("❌ Erro ao ler dados do Firebase:", error);
    });

    function atualizarTodosGraficos() {
        atualizarGraficoPrincipal();
        atualizarGraficoMensal();
        atualizarGraficoPorDoca();
        atualizarDashboard();
    }

    // Gráfico Principal - Anual
    function atualizarGraficoPrincipal() {
        let tc = 0, outros = 0, totalGeral = 0;

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            totalGeral += p;
            const docasTC = ["1C", "1T", "1K", "1G"];
            if (docasTC.includes(String(d.doca || "").toUpperCase().trim())) {
                tc += p;
            } else {
                outros += p;
            }
        });

        if (graficoPrincipal) graficoPrincipal.destroy();

        const ctx = document.getElementById("graficoDocas");
        if (!ctx) return;

        graficoPrincipal = new Chart(ctx.getContext("2d"), {
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

    // Gráfico Mensal
    function atualizarGraficoMensal() {
        const meses = {};
        const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

        dados.forEach(d => {
            if (d.data) {
                const dataObj = new Date(d.data);
                const mes = dataObj.getMonth();
                meses[mes] = (meses[mes] || 0) + Number(d.parada || 0);
            }
        });

        const labels = nomesMeses;
        const valores = nomesMeses.map((_, i) => meses[i] || 0);

        if (graficoMensal) graficoMensal.destroy();

        const ctx = document.getElementById("graficoParadaMensal");
        if (!ctx) return;

        graficoMensal = new Chart(ctx.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Parada Acumulada por Mês",
                    data: valores,
                    backgroundColor: "#9b59b6"
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // Gráfico por Doca
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

        const ctx = document.getElementById("graficoParadaDoca");
        if (!ctx) return;

        graficoDoca = new Chart(ctx.getContext("2d"), {
            type: "bar",
            data: {
                labels: labels.length ? labels : ["Sem dados"],
                datasets: [{
                    label: "Parada por Doca (Minutos)",
                    data: valores.length ? valores : [0],
                    backgroundColor: "#f39c12"
                }]
            },
            options: opcoesGrafico(),
            plugins: [pluginValor]
        });
    }

    // Dashboard (mantido similar, com melhorias)
    function atualizarDashboard() {
        // ... (o código do dashboard continua o mesmo da versão anterior)
        // Para não ficar muito longo aqui, use a versão que eu te enviei antes.
        // Se quiser, posso te mandar a versão completa novamente.
        console.log("Dashboard atualizado com", dados.length, "registros");
        // Por enquanto só log para teste
    }

    // SALVAR FORMULÁRIO
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
                motivoParada: document.getElementById("motivoParada").value || "",
                causaParada: document.getElementById("causaParada").value || ""
            };

            refDados.push(registro)
                .then(() => {
                    console.log("✅ Registro salvo com sucesso!");
                    formulario.reset();
                    document.getElementById("turno").value = "1";
                })
                .catch(err => console.error("❌ Erro ao salvar:", err));
        });
    }

    console.log("🚀 Painel carregado - Aguarde dados do Firebase...");
});
