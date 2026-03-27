document.addEventListener("DOMContentLoaded", () => {

    // =============================================
    // 🔥 FIREBASE
    // =============================================
    const firebaseConfig = {
        apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
        authDomain: "controle-gerencial-75f09.firebaseapp.com",
        databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
        projectId: "controle-gerencial-75f09"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const refDados = db.ref("registros");

    let dados = [];
    let graficoPrincipal;
    let graficos = {};

    // =============================================
    // 🗓️ DATA NO HEADER
    // =============================================
    const headerDate = document.getElementById("headerDate");
    if (headerDate) {
        const now = new Date();
        headerDate.textContent = now.toLocaleDateString("pt-BR", {
            weekday: "short", day: "2-digit", month: "short", year: "numeric"
        }).toUpperCase();
    }

    // =============================================
    // 🎨 PALETA DE CORES PREMIUM
    // =============================================
    const CORES = {
        blue:   "#3b82f6",
        red:    "#ef4444",
        green:  "#10b981",
        gold:   "#f59e0b",
        purple: "#8b5cf6",
        cyan:   "#06b6d4",
        t1:     "#3b82f6",
        t2:     "#f59e0b",
    };

    function rgba(hex, alpha) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // =============================================
    // 🔝 PLUGIN: VALORES NAS BARRAS
    // =============================================
    const pluginValor = {
        id: "valorTopo",
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                chart.getDatasetMeta(i).data.forEach((bar, index) => {
                    const val = dataset.data[index];
                    if (!val && val !== 0) return;
                    const { x, y, base } = bar;
                    const midY = y + (base - y) / 2;
                    ctx.save();
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "700 12px 'DM Sans', sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.shadowColor = "rgba(0,0,0,0.35)";
                    ctx.shadowBlur = 4;
                    ctx.fillText(val, x, midY);
                    ctx.restore();
                });
            });
        }
    };

    // =============================================
    // ⚙️ OPÇÕES BASE DOS GRÁFICOS
    // =============================================
    function opcoesBase(corAccent) {
        return {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 600, easing: "easeOutQuart" },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e5ea",
                    borderWidth: 1,
                    titleColor: "#1a1d23",
                    bodyColor: "#4a5166",
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: "'DM Sans'", weight: "600", size: 13 },
                    bodyFont:  { family: "'JetBrains Mono'", size: 12 },
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }
            },
            scales: {
                x: {
                    grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
                    ticks: {
                        color: "#8a92a6",
                        font: { family: "'JetBrains Mono'", size: 10 },
                        maxRotation: 45,
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
                    ticks: {
                        color: "#8a92a6",
                        font: { family: "'JetBrains Mono'", size: 10 },
                        stepSize: 1,
                    }
                }
            }
        };
    }

    // =============================================
    // 🔄 TEMPO REAL FIREBASE
    // =============================================
    refDados.on("value", snapshot => {
        dados = [];
        snapshot.forEach(child => {
            const item = child.val();
            item.turno = String(item.turno || "").replace(/\D/g, "").substring(0, 1);
            dados.push(item);
        });
        atualizarGraficoPrincipal();
        atualizarDashboard();
        atualizarKPIs();
    });

    // =============================================
    // 📊 GRÁFICO PRINCIPAL
    // =============================================
    function atualizarGraficoPrincipal() {
        let tc = 0, outros = 0, totalGeral = 0;
        const docasTC = ["1C", "1T", "1K", "1G"];

        dados.forEach(d => {
            let p = Number(d.parada || 0);
            totalGeral += p;
            if (docasTC.includes(String(d.doca).toUpperCase().trim())) {
                tc += p;
            } else {
                outros += p;
            }
        });

        if (graficoPrincipal) graficoPrincipal.destroy();
        const canvas = document.getElementById("graficoDocas");
        if (!canvas) return;

        const labels = ["T&C", "BODY / STAMP / PWT", "TOTAL GERAL"];
        const values = [tc, outros, totalGeral];
        const cores  = [CORES.blue, CORES.red, CORES.green];

        graficoPrincipal = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Parada de Linha (min)",
                    data: values,
                    backgroundColor: cores.map(c => rgba(c, 0.25)),
                    borderColor:     cores,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                ...opcoesBase(),
                plugins: {
                    ...opcoesBase().plugins,
                    legend: { display: false }
                }
            },
            plugins: [pluginValor]
        });
    }

    // =============================================
    // 📈 KPIs DO DIA
    // =============================================
    function atualizarKPIs() {
        const container = document.getElementById("kpisDia");
        if (!container) return;

        const hoje = new Date().toISOString().split("T")[0];
        const registrosHoje = dados.filter(d => d.data === hoje);

        const totalParada    = registrosHoje.reduce((s,d) => s + Number(d.parada||0), 0);
        const totalRecLocal  = registrosHoje.reduce((s,d) => s + Number(d.recLocal||0), 0);
        const totalRecImp    = registrosHoje.reduce((s,d) => s + Number(d.recImportado||0), 0);
        const totalAbs       = registrosHoje.reduce((s,d) => s + Number(d.absenteismo||0), 0);
        const totalAcidentes = registrosHoje.reduce((s,d) => s + Number(d.acidentes||0), 0);

        const kpis = [
            { label: "Parada Hoje (min)", value: totalParada,    color: CORES.red    },
            { label: "Rec. Local Hoje",   value: totalRecLocal,  color: CORES.blue   },
            { label: "Rec. Importado",    value: totalRecImp,    color: CORES.gold   },
            { label: "Absenteísmo",       value: totalAbs,       color: CORES.purple },
            { label: "Acidentes",         value: totalAcidentes, color: CORES.cyan   },
        ];

        container.innerHTML = kpis.map(k => `
            <div class="kpi-card" style="border-top: 2px solid ${k.color};">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value" style="color: ${k.color};">${k.value}</div>
            </div>
        `).join("");
    }

    // =============================================
    // 📊 DASHBOARD POR TURNO
    // =============================================
    function atualizarDashboard() {
        let turnos = {
            "1": { total: 0, abs: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {} },
            "2": { total: 0, abs: 0, seg: 0, pred: {}, dia: {}, recLocal: {}, recImportado: {}, ovacao: {} }
        };

        dados.forEach(d => {
            let tKey = d.turno;
            if (!turnos[tKey]) return;
            let t  = turnos[tKey];
            let p  = Number(d.parada        || 0);
            let rl = Number(d.recLocal      || 0);
            let ri = Number(d.recImportado  || 0);
            let ov = Number(d.ovacaoImportado || 0);

            t.total += p;
            t.abs   += Number(d.absenteismo || 0);
            t.seg   += Number(d.acidentes   || 0);

            if (d.predio) t.pred[d.predio]      = (t.pred[d.predio]      || 0) + p;
            if (d.data)   t.dia[d.data]          = (t.dia[d.data]          || 0) + p;
            if (d.data)   t.recLocal[d.data]     = (t.recLocal[d.data]     || 0) + rl;
            if (d.data)   t.recImportado[d.data] = (t.recImportado[d.data] || 0) + ri;
            if (d.data)   t.ovacao[d.data]       = (t.ovacao[d.data]       || 0) + ov;
        });

        ["1", "2"].forEach(turno => {
            const sufixo = turno === "1" ? "_t1" : "_t2";
            const cor    = turno === "1" ? CORES.t1 : CORES.t2;
            const d      = turnos[turno];

            const sortDates = obj => Object.keys(obj).sort();
            const diasParada  = sortDates(d.dia);
            const diasLocal   = sortDates(d.recLocal);
            const diasImp     = sortDates(d.recImportado);
            const diasOvacao  = sortDates(d.ovacao);

            // Formata datas dd/mm
            const fmtDia = iso => {
                const [,m,dd] = iso.split("-");
                return `${dd}/${m}`;
            };

            criarGrafico("g1" + sufixo,
                ["Total Paradas"],
                [d.total],
                "Minutos Parados",
                cor, true
            );

            criarGrafico("g2" + sufixo,
                Object.keys(d.pred),
                Object.values(d.pred),
                "Por Prédio",
                cor, false
            );

            criarGrafico("g7" + sufixo,
                ["Absenteísmo"],
                [d.abs],
                "Faltas",
                CORES.purple, true
            );

            criarGrafico("g8" + sufixo,
                ["Acidentes"],
                [d.seg],
                "Acidentes",
                CORES.red, true
            );

            criarGrafico("g_parada_dia" + sufixo,
                diasParada.map(fmtDia),
                diasParada.map(dia => d.dia[dia]),
                "Parada por Dia (min)",
                CORES.red, false
            );

            criarGrafico("g_rec_local_dia" + sufixo,
                diasLocal.map(fmtDia),
                diasLocal.map(dia => d.recLocal[dia]),
                "Rec. Local por Dia",
                cor, false
            );

            criarGrafico("g_rec_importado_dia" + sufixo,
                diasImp.map(fmtDia),
                diasImp.map(dia => d.recImportado[dia]),
                "Rec. Importado por Dia",
                CORES.gold, false
            );

            criarGrafico("g_ovacao_dia" + sufixo,
                diasOvacao.map(fmtDia),
                diasOvacao.map(dia => d.ovacao[dia]),
                "Ovação por Dia",
                CORES.green, false
            );
        });
    }

    // =============================================
    // 🖌️ CRIAR GRÁFICO INDIVIDUAL
    // =============================================
    function criarGrafico(id, labels, data, label, cor, isSingle) {
        if (graficos[id]) graficos[id].destroy();
        const canvas = document.getElementById(id);
        if (!canvas) return;

        // Gradiente para gráficos com várias barras
        const ctx = canvas.getContext("2d");

        let bgColors, borderColors;

        if (isSingle) {
            bgColors     = [rgba(cor, 0.25)];
            borderColors = [cor];
        } else {
            // Paleta variada para múltiplas barras
            const palette = [
                CORES.blue, CORES.gold, CORES.green,
                CORES.red,  CORES.purple, CORES.cyan
            ];
            bgColors     = data.map((_, i) => rgba(palette[i % palette.length], 0.25));
            borderColors = data.map((_, i) => palette[i % palette.length]);
        }

        graficos[id] = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    backgroundColor: bgColors,
                    borderColor:     borderColors,
                    borderWidth: 2,
                    borderRadius: 5,
                    borderSkipped: false,
                }]
            },
            options: opcoesBase(cor),
            plugins: [pluginValor]
        });
    }

    // =============================================
    // 💾 SALVAMENTO
    // =============================================
    const formulario = document.getElementById("formulario");
    if (formulario) {
        formulario.addEventListener("submit", e => {
            e.preventDefault();

            const registro = {
                data:             document.getElementById("data").value,
                predio:           document.getElementById("predio").value,
                doca:             document.getElementById("doca").value,
                turno:            document.getElementById("turno").value,
                parada:           Number(document.getElementById("parada").value || 0),
                recLocal:         Number(document.getElementById("recLocal").value || 0),
                recImportado:     Number(document.getElementById("recImportado").value || 0),
                ovacaoImportado:  Number(document.getElementById("ovacaoImportado").value || 0),
                absenteismo:      Number(document.getElementById("absenteismo").value || 0),
                acidentes:        Number(document.getElementById("acidentes").value || 0),
                motivoParada:     document.getElementById("motivoParada")?.value || "",
                causaParada:      document.getElementById("causaParada")?.value || "",
            };

            refDados.push(registro);

            // Feedback visual no botão
            const btn = formulario.querySelector(".btn-primary");
            const original = btn.textContent;
            btn.textContent = "✅ Salvo!";
            btn.style.background = "#10b981";
            setTimeout(() => {
                btn.textContent = original;
                btn.style.background = "";
            }, 2000);

            formulario.reset();
            document.getElementById("turno").value = "1";
        });
    }

});
