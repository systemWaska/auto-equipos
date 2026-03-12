if(sessionStorage.getItem('ithub_session'))window.location.href='dashboard.html';
function doLogin(){
  const name=document.getElementById('login-name').value.trim();
  const pass=document.getElementById('login-pass').value;
  const err=document.getElementById('login-error');
  err.style.display='none';
  if(!name){err.textContent='Ingresa tu nombre.';err.style.display='block';return;}
  const stored=localStorage.getItem('pass_admin')||'admin123';
  if(pass!==stored){err.textContent='Contraseña incorrecta.';err.style.display='block';return;}
  sessionStorage.setItem('ithub_session',JSON.stringify({name,role:'admin',ts:Date.now()}));
  window.location.href='dashboard.html';
}
