document.addEventListener("DOMContentLoaded", () => {

    // ─── FIREBASE ───────────────────────────────────────────────
    const firebaseConfig = {
        apiKey: "AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
        authDomain: "controle-gerencial-75f09.firebaseapp.com",
        databaseURL: "https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
        projectId: "controle-gerencial-75f09"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db      = firebase.database();
    const refDados = db.ref("registros");

    let dados = [];
    let graficoPrincipal, graficoMensal, graficoDoca;
    let graficos = {};

    const COR_AZUL    = "#3498db";
    const COR_LARANJA = "#e67e22";

    const MESES = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];

    // ─── PLUGIN VALORES NAS BARRAS ──────────────────────────────
    const pluginValor = {
        id: "valorTopo",
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                chart.getDatasetMeta(i).data.forEach((bar, index) => {
                    const val = dataset.data[index];
                    if (!val && val !== 0) return;
                    ctx.save();
                    ctx.fillStyle  = "#000";
                    ctx.font       = "bold 11px Arial";
                    ctx.textAlign  = "center";
                    ctx.fillText(val, bar.x, bar.y - 5);
                    ctx.restore();
                });
            });
        }
    };

    function opcoesGrafico() {
        return {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        };
    }

    // ─── FIREBASE LISTENER ──────────────────────────────────────
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

    // ─── GRÁFICO ANUAL ──────────────────────────────────────────
    function atualizarGraficoPrincipal() {
        let tc = 0, outros = 0, totalGeral = 0;
        dados.forEach(d => {
            let p = Number(d.parada || 0);
            totalGeral += p;
            const docasTC = ["1C","1T","1K","1G"];
            if (docasTC.includes(String(d.doca).toUpperCase().trim())) tc += p;
            else outros += p;
        });
        if (graficoPrincipal) graficoPrincipal.destroy();
        const canvas = document.getElementById("graficoDocas");
        if (!canvas) return;
        graficoPrincipal = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["T&C","BODY/STAMP/PWT","TOTAL"],
                datasets: [{ label: "Parada de Linha Total (Minutos)", data: [tc, outros, totalGeral],
                    backgroundColor: [COR_AZUL, COR_AZUL, COR_LARANJA] }]
            },
            options: opcoesGrafico(), plugins: [pluginValor]
        });
    }

    // ─── GRÁFICO MENSAL ─────────────────────────────────────────
    function atualizarGraficoMensal() {
        const porMes = {};
        dados.forEach(d => {
            if (!d.data) return;
            const k = d.data.substring(0, 7);
            porMes[k] = (porMes[k] || 0) + Number(d.parada || 0);
        });
        const chaves = Object.keys(porMes).sort();
        const labels = chaves.map(k => {
            const [ano, mes] = k.split("-");
            return `${MESES[parseInt(mes,10)-1]}/${ano}`;
        });
        if (graficoMensal) graficoMensal.destroy();
        const canvas = document.getElementById("graficoMensal");
        if (!canvas) return;
        graficoMensal = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: { labels, datasets: [{ label: "Parada Acumulada (min)",
                data: chaves.map(k => porMes[k]), backgroundColor: COR_AZUL }] },
            options: opcoesGrafico(), plugins: [pluginValor]
        });
    }

    // ─── GRÁFICO POR DOCA ───────────────────────────────────────
    function atualizarGraficoDoca() {
        const porDoca = {};
        dados.forEach(d => {
            const doca = String(d.doca || "").toUpperCase().trim();
            if (!doca) return;
            porDoca[doca] = (porDoca[doca] || 0) + Number(d.parada || 0);
        });
        const docas  = Object.keys(porDoca).sort();
        if (graficoDoca) graficoDoca.destroy();
        const canvas = document.getElementById("graficoDoca");
        if (!canvas) return;
        graficoDoca = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: { labels: docas, datasets: [{ label: "Parada por Doca (min)",
                data: docas.map(d => porDoca[d]), backgroundColor: COR_AZUL }] },
            options: opcoesGrafico(), plugins: [pluginValor]
        });
    }

    // ─── DASHBOARD ──────────────────────────────────────────────
    function atualizarDashboard() {
        const turnos = {
            "1": { total:0, seg:0, pred:{}, dia:{}, recLocal:{}, recImportado:{}, ovacao:{}, absDia:{} },
            "2": { total:0, seg:0, pred:{}, dia:{}, recLocal:{}, recImportado:{}, ovacao:{}, absDia:{} }
        };
        dados.forEach(d => {
            const t = turnos[d.turno];
            if (!t) return;
            const p   = Number(d.parada || 0);
            const rl  = Number(d.recLocal || 0);
            const ri  = Number(d.recImportado || 0);
            const ov  = Number(d.ovacaoImportado || 0);
            const abs = Number(d.absenteismo || 0);
            t.total += p;
            t.seg   += Number(d.acidentes || 0);
            if (d.predio) t.pred[d.predio] = (t.pred[d.predio] || 0) + p;
            if (d.data) {
                t.dia[d.data]          = (t.dia[d.data] || 0) + p;
                t.recLocal[d.data]     = (t.recLocal[d.data] || 0) + rl;
                t.recImportado[d.data] = (t.recImportado[d.data] || 0) + ri;
                t.ovacao[d.data]       = (t.ovacao[d.data] || 0) + ov;
                t.absDia[d.data]       = (t.absDia[d.data] || 0) + abs;
            }
        });

        ["1","2"].forEach(turno => {
            const sx = turno === "1" ? "_t1" : "_t2";
            const d  = turnos[turno];
            const ord  = k => Object.keys(k).sort();

            criarGrafico("g1"+sx,  ["Total"],               [d.total],                "Minutos Parados");
            criarGrafico("g2"+sx,  Object.keys(d.pred),     Object.values(d.pred),    "Por Prédio");
            criarGrafico("g_parada_dia"+sx,       ord(d.dia),          ord(d.dia).map(x=>d.dia[x]),          "Parada de Linha por Dia (min)");
            criarGrafico("g_rec_local_dia"+sx,    ord(d.recLocal),     ord(d.recLocal).map(x=>d.recLocal[x]),    "Recebimento Local por Dia");
            criarGrafico("g_rec_importado_dia"+sx,ord(d.recImportado), ord(d.recImportado).map(x=>d.recImportado[x]),"Recebimento Importado por Dia");
            criarGrafico("g_ovacao_dia"+sx,       ord(d.ovacao),       ord(d.ovacao).map(x=>d.ovacao[x]),       "Ovação por Dia");
            criarGrafico("g7"+sx,  ord(d.absDia),           ord(d.absDia).map(x=>d.absDia[x]),   "Absenteísmo por Dia");
            criarGrafico("g8"+sx,  ["Acidentes"],           [d.seg],                  "Acidentes");
        });
    }

    function criarGrafico(id, labels, data, label) {
        if (graficos[id]) graficos[id].destroy();
        const canvas = document.getElementById(id);
        if (!canvas) return;
        graficos[id] = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: { labels, datasets: [{ label, data,
                backgroundColor: id.includes("_t1") ? COR_AZUL : COR_LARANJA }] },
            options: opcoesGrafico(), plugins: [pluginValor]
        });
    }

    // ════════════════════════════════════════════════════════════
    //  FILTRAR POR DIA  (mostra painel detalhado)
    // ════════════════════════════════════════════════════════════
    window.filtrarData = function () {
        const data = document.getElementById("filtroData").value;
        if (!data) { alert("Selecione uma data para filtrar."); return; }
        const registros = dados.filter(d => d.data === data);
        mostrarPainelFiltro(`📅 Detalhes do dia: ${formatarData(data)}`, registros, "dia");
    };

    // ════════════════════════════════════════════════════════════
    //  FILTRAR POR PRÉDIO  (todos os dias, agrupados)
    // ════════════════════════════════════════════════════════════
    window.filtrarPredio = function (tipo) {
        const data = document.getElementById("filtroData").value;

        let registros, titulo;
        if (tipo === "TC") {
            const docasTC = ["1C","1T","1K","1G"];
            registros = dados.filter(d => docasTC.includes(String(d.doca).toUpperCase().trim()));
            titulo    = data
                ? `🏭 T&C — Dia: ${formatarData(data)}`
                : "🏭 T&C — Todos os dias";
            if (data) registros = registros.filter(d => d.data === data);
        } else {
            const docasBody = ["1B","30"];
            registros = dados.filter(d => docasBody.includes(String(d.doca).toUpperCase().trim()));
            titulo    = data
                ? `🏗 BODY/STAMP/PWT — Dia: ${formatarData(data)}`
                : "🏗 BODY/STAMP/PWT — Todos os dias";
            if (data) registros = registros.filter(d => d.data === data);
        }
        mostrarPainelFiltro(titulo, registros, data ? "dia" : "predio");
    };

    // ════════════════════════════════════════════════════════════
    //  LIMPAR FILTRO
    // ════════════════════════════════════════════════════════════
    window.limparFiltro = function () {
        document.getElementById("painelFiltro").style.display = "none";
        document.getElementById("filtroData").value = "";
    };

    // ════════════════════════════════════════════════════════════
    //  MONTAR PAINEL DE RESULTADOS
    // ════════════════════════════════════════════════════════════
    function mostrarPainelFiltro(titulo, registros, modo) {
        const painel    = document.getElementById("painelFiltro");
        const cabecalho = document.getElementById("cabecalhoFiltro");
        const resultado = document.getElementById("resultadoFiltro");

        painel.style.display = "block";
        cabecalho.innerHTML  = `<h2 class="titulo-painel">${titulo}</h2>`;

        if (!registros.length) {
            resultado.innerHTML = `<p class="sem-dados">Nenhum registro encontrado.</p>`;
            return;
        }

        // Ordena por data → turno
        registros = [...registros].sort((a, b) => {
            if (a.data < b.data) return -1;
            if (a.data > b.data) return 1;
            return Number(a.turno) - Number(b.turno);
        });

        if (modo === "dia") {
            // Mostra cada registro como card individual
            resultado.innerHTML = registros.map(r => cardRegistro(r)).join("");
        } else {
            // Agrupa por dia
            const porDia = {};
            registros.forEach(r => {
                if (!porDia[r.data]) porDia[r.data] = [];
                porDia[r.data].push(r);
            });
            resultado.innerHTML = Object.keys(porDia).sort().map(dia => `
                <div class="grupo-dia">
                    <h3 class="subtitulo-dia">📆 ${formatarData(dia)}</h3>
                    ${porDia[dia].map(r => cardRegistro(r)).join("")}
                </div>
            `).join("");
        }

        // Rola até o painel
        painel.scrollIntoView({ behavior: "smooth" });
    }

    function cardRegistro(r) {
        return `
        <div class="card-registro">
            <div class="card-topo">
                <span class="tag-predio">${r.predio || "—"}</span>
                <span class="tag-doca">Doca ${r.doca || "—"}</span>
                <span class="tag-turno turno-${r.turno}">${r.turno}º Turno</span>
                <span class="tag-data">${formatarData(r.data)}</span>
            </div>
            <div class="card-grid">
                <div class="card-item destaque">
                    <span class="card-label">⏱ Parada de Linha</span>
                    <span class="card-valor">${r.parada || 0} min</span>
                </div>
                <div class="card-item">
                    <span class="card-label">📋 Motivo</span>
                    <span class="card-valor">${r.motivoParada || "—"}</span>
                </div>
                <div class="card-item">
                    <span class="card-label">🔍 Causa</span>
                    <span class="card-valor">${r.causaParada || "—"}</span>
                </div>
                <div class="card-item destaque">
                    <span class="card-label">📦 Receb. Local</span>
                    <span class="card-valor">${r.recLocal || 0}</span>
                </div>
                <div class="card-item">
                    <span class="card-label">📝 Obs. Local</span>
                    <span class="card-valor">${r.obsLocal || "—"}</span>
                </div>
                <div class="card-item destaque">
                    <span class="card-label">✈️ Receb. Importado</span>
                    <span class="card-valor">${r.recImportado || 0}</span>
                </div>
                <div class="card-item">
                    <span class="card-label">🎉 Ovação</span>
                    <span class="card-valor">${r.ovacaoImportado || "—"}</span>
                </div>
                <div class="card-item">
                    <span class="card-label">📝 Obs. Importado</span>
                    <span class="card-valor">${r.obsImportado || "—"}</span>
                </div>
                <div class="card-item">
                    <span class="card-label">🏥 Absenteísmo</span>
                    <span class="card-valor">${r.absenteismo || 0}</span>
                </div>
                <div class="card-item">
                    <span class="card-label">⚠️ Acidentes</span>
                    <span class="card-valor">${r.acidentes || 0}</span>
                </div>
            </div>
        </div>`;
    }

    // ════════════════════════════════════════════════════════════
    //  EXPORTAR EXCEL — todos os registros, ordenados
    // ════════════════════════════════════════════════════════════
    window.exportarExcel = function () {
        if (!dados.length) { alert("Nenhum dado para exportar."); return; }

        const ordenados = [...dados].sort((a, b) => {
            if (a.data < b.data) return -1;
            if (a.data > b.data) return 1;
            return Number(a.turno) - Number(b.turno);
        });

        const linhas = ordenados.map(r => ({
            "Data":                  formatarData(r.data),
            "Prédio":                r.predio || "",
            "Doca":                  r.doca   || "",
            "Turno":                 r.turno ? `${r.turno}º Turno` : "",
            "Parada (min)":          Number(r.parada         || 0),
            "Motivo Parada":         r.motivoParada          || "",
            "Causa Parada":          r.causaParada           || "",
            "Receb. Local":          Number(r.recLocal       || 0),
            "Obs. Local":            r.obsLocal              || "",
            "Receb. Importado":      Number(r.recImportado   || 0),
            "Ovação":                r.ovacaoImportado       || "",
            "Obs. Importado":        r.obsImportado          || "",
            "Absenteísmo":           Number(r.absenteismo    || 0),
            "Acidentes":             Number(r.acidentes      || 0)
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(linhas);

        // Largura das colunas
        ws["!cols"] = [
            {wch:14},{wch:14},{wch:8},{wch:10},{wch:12},{wch:22},{wch:22},
            {wch:14},{wch:22},{wch:16},{wch:14},{wch:22},{wch:13},{wch:10}
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Registros");

        // Aba de resumo por mês
        const porMes = {};
        ordenados.forEach(r => {
            if (!r.data) return;
            const k = r.data.substring(0,7);
            if (!porMes[k]) porMes[k] = { parada:0, recLocal:0, recImportado:0, absenteismo:0, acidentes:0 };
            porMes[k].parada       += Number(r.parada       || 0);
            porMes[k].recLocal     += Number(r.recLocal     || 0);
            porMes[k].recImportado += Number(r.recImportado || 0);
            porMes[k].absenteismo  += Number(r.absenteismo  || 0);
            porMes[k].acidentes    += Number(r.acidentes    || 0);
        });

        const linhasMes = Object.keys(porMes).sort().map(k => {
            const [ano, mes] = k.split("-");
            return {
                "Mês":               `${MESES[parseInt(mes,10)-1]}/${ano}`,
                "Parada Total (min)":porMes[k].parada,
                "Receb. Local":      porMes[k].recLocal,
                "Receb. Importado":  porMes[k].recImportado,
                "Absenteísmo":       porMes[k].absenteismo,
                "Acidentes":         porMes[k].acidentes
            };
        });

        const wsMes = XLSX.utils.json_to_sheet(linhasMes);
        wsMes["!cols"] = [{wch:18},{wch:16},{wch:14},{wch:16},{wch:13},{wch:10}];
        XLSX.utils.book_append_sheet(wb, wsMes, "Resumo Mensal");

        XLSX.writeFile(wb, "Painel_Logístico.xlsx");
    };

    // ─── UTILITÁRIO DATA ────────────────────────────────────────
    function formatarData(data) {
        if (!data) return "—";
        const [a, m, d] = data.split("-");
        return `${d}/${m}/${a}`;
    }

    // ─── SALVAMENTO ─────────────────────────────────────────────
    const formulario = document.getElementById("formulario");
    if (formulario) {
        formulario.addEventListener("submit", e => {
            e.preventDefault();
            const registro = {
                data:            document.getElementById("data").value,
                predio:          document.getElementById("predio").value,
                doca:            document.getElementById("doca").value,
                turno:           document.getElementById("turno").value,
                parada:          Number(document.getElementById("parada").value      || 0),
                recLocal:        Number(document.getElementById("recLocal").value    || 0),
                recImportado:    Number(document.getElementById("recImportado").value|| 0),
                ovacaoImportado: document.getElementById("ovacaoImportado")?.value  || "",
                obsLocal:        document.getElementById("obsLocal")?.value          || "",
                obsImportado:    document.getElementById("obsImportado")?.value      || "",
                absenteismo:     Number(document.getElementById("absenteismo").value || 0),
                acidentes:       Number(document.getElementById("acidentes").value   || 0),
                motivoParada:    document.getElementById("motivoParada")?.value      || "",
                causaParada:     document.getElementById("causaParada")?.value       || ""
            };
            refDados.push(registro);
            formulario.reset();
            document.getElementById("turno").value = "1";
        });
    }
});
