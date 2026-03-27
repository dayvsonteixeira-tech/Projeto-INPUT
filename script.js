// FIREBASE
const firebaseConfig = {
apiKey:"AIzaSyCefOmHF_vpkXlG-aNlk-T83Qv-dahJPAo",
authDomain:"controle-gerencial-75f09.firebaseapp.com",
databaseURL:"https://controle-gerencial-75f09-default-rtdb.firebaseio.com",
projectId:"controle-gerencial-75f09"
};

firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const refDados=db.ref("registros");

let dados=[],grafico,graficos={};

// PLUGIN VALORES NAS BARRAS
const pluginValor={
id:"valorTopo",
afterDatasetsDraw(chart){
const {ctx}=chart;
chart.data.datasets.forEach((dataset,i)=>{
chart.getDatasetMeta(i).data.forEach((bar,index)=>{
ctx.fillStyle="#000";
ctx.font="bold 12px Arial";
ctx.textAlign="center";
ctx.fillText(dataset.data[index],bar.x,bar.y-5);
});
});
}
};

// CONFIG PADRÃO DOS GRÁFICOS (SEM DECIMAL)
function opcoesGrafico(){
return {
responsive:true,
scales:{
y:{
beginAtZero:true,
ticks:{
callback: function(value){
return Number.isInteger(value) ? value : null;
},
stepSize:1
}
}
}
};
}

// SALVAR
formulario.addEventListener("submit",e=>{
e.preventDefault();

if(!parada.value||!recLocal.value||!recImportado.value){
alert("Preencha obrigatórios");return;
}

refDados.push({
data:data.value,predio:predio.value,doca:doca.value,turno:turno.value,
parada:parada.value,motivoParada:motivoParada.value,causaParada:causaParada.value,
recLocal:recLocal.value,obsLocal:obsLocal.value,
recImportado:recImportado.value,ovacaoImportado:ovacaoImportado.value,obsImportado:obsImportado.value,
absenteismo:absenteismo.value,acidentes:acidentes.value
});

formulario.reset();
});

// TEMPO REAL
refDados.on("value",snap=>{
dados=[];
snap.forEach(c=>dados.push(c.val()));
atualizarGrafico();
atualizarTodosGraficos();
});

// GRÁFICO PRINCIPAL
function atualizarGrafico(){

let tc=0,outros=0,total=0;
const hoje=new Date();

dados.forEach(d=>{
if(!d.data)return;
let dt=new Date(d.data);

if(dt.getMonth()===hoje.getMonth()){
let p=Number(d.parada||0);
total+=p;
["1C","1T","1K","1G"].includes(d.doca)?tc+=p:outros+=p;
}
});

if(grafico)grafico.destroy();

grafico=new Chart(graficoDocas,{
type:"bar",
data:{
labels:["T&C","BODY/STAMP/PWT","TOTAL"],
datasets:[{label:"Minutos",data:[tc,outros,total]}]
},
options:opcoesGrafico(),
plugins:[pluginValor]
});
}

// FUNÇÃO BASE
function criarGrafico(id,labels,data,label){

if(graficos[id])graficos[id].destroy();

graficos[id]=new Chart(document.getElementById(id),{
type:"bar",
data:{
labels:labels,
datasets:[{
label:label,
data:data
}]
},
options:opcoesGrafico(),
plugins:[pluginValor]
});
}

// DASHBOARD
function atualizarTodosGraficos(){

let t={"1":{},"2":{}};

dados.forEach(d=>{
let x=t[d.turno];
if(!x)return;

x.total=(x.total||0)+Number(d.parada||0);

x.pred=x.pred||{};
x.pred[d.predio]=(x.pred[d.predio]||0)+Number(d.parada||0);

x.dia=x.dia||{};
x.dia[d.data]=(x.dia[d.data]||0)+Number(d.parada||0);

x.loc=x.loc||{};
x.loc[d.data]=(x.loc[d.data]||0)+Number(d.recLocal||0);

x.imp=x.imp||{};
x.imp[d.data]=(x.imp[d.data]||0)+Number(d.recImportado||0);

x.ova=(x.ova||0)+Number(d.ovacaoImportado||0);
x.abs=(x.abs||0)+Number(d.absenteismo||0);
x.seg=(x.seg||0)+Number(d.acidentes||0);
});

["1","2"].forEach(tu=>{
let s=tu==="1"?"_t1":"_t2";
let d=t[tu]||{};

criarGrafico("g1"+s,["Total"],[d.total||0],"Parada");
criarGrafico("g2"+s,Object.keys(d.pred||{}),Object.values(d.pred||{}),"Prédio");
criarGrafico("g3"+s,Object.keys(d.dia||{}),Object.values(d.dia||{}),"Dia");
criarGrafico("g4"+s,Object.keys(d.loc||{}),Object.values(d.loc||{}),"Local");
criarGrafico("g5"+s,Object.keys(d.imp||{}),Object.values(d.imp||{}),"Importado");
criarGrafico("g6"+s,["Ovacao"],[d.ova||0],"Ovacao");
criarGrafico("g7"+s,["Abs"],[d.abs||0],"Absenteísmo");
criarGrafico("g8"+s,["Segurança"],[d.seg||0],"Segurança");
});
}

// FILTRO
function filtrarData(){
let f=filtroData.value;
historico.innerHTML="";
dados.filter(d=>d.data===f).forEach(d=>{
historico.innerHTML+=`<tr>
<td>${d.data}</td><td>${d.predio}</td><td>${d.doca}</td><td>${d.turno}</td>
<td>${d.parada}</td><td>${d.motivoParada||'-'}</td><td>${d.causaParada||'-'}</td>
<td>${d.absenteismo||0}</td><td>${d.recLocal||0}</td><td>${d.obsLocal||'-'}</td>
<td>${d.recImportado||0}</td><td>${d.ovacaoImportado||'-'}</td><td>${d.obsImportado||'-'}</td>
</tr>`;
});
tabela.style.display="table";
}

// EXPORTAR
function exportarExcel(){
let csv="Data;Predio;Doca;Turno;Parada\n";
dados.forEach(d=>{
csv+=`${d.data};${d.predio};${d.doca};${d.turno};${d.parada}\n`;
});
let blob=new Blob(["\uFEFF"+csv]);
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="dados.csv";
a.click();
}

// LIMPAR
function limparTudo(){
if(confirm("Apagar tudo?")){
refDados.remove();
}
}
