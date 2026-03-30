body{
  font-family:Arial;
  background:#f4f6f9;
  padding:15px;
  margin:0;
}

h1{
  text-align:center;
}

form{
  background:#fff;
  padding:20px;
  border-radius:10px;
  display:flex;
  flex-direction:column;
  gap:15px;
}

.linha-dupla{
  display:flex;
  gap:15px;
}

.linha-dupla div{
  display:flex;
  align-items:center;
  gap:8px;
  width:50%;
}

input,select{
  padding:6px;
  width:100%;
}

fieldset{
  border:2px solid #007bff;
  border-radius:8px;
  padding:10px;
}

legend{
  color:#007bff;
  font-weight:bold;
}

button{
  padding:10px;
  background:#007bff;
  color:#fff;
  border:none;
  cursor:pointer;
  border-radius:5px;
}

.dashboard{
  display:flex;
  gap:20px;
}

.coluna{
  width:50%;
}

canvas{
  background:#fff;
  margin-top:15px;
  padding:10px;
  border-radius:10px;
}

@media(max-width:768px){
  .dashboard{
    flex-direction:column;
  }

  .coluna{
    width:100%;
  }

  .linha-dupla{
    flex-direction:column;
  }
}
