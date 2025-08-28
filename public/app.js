const API_BASE = ''; // same origin (your Heroku app)

function setToken(t){ localStorage.setItem('token', t) }
function getToken(){ return localStorage.getItem('token') }
function setUser(u){ localStorage.setItem('user', JSON.stringify(u)) }
function getUser(){ try{ return JSON.parse(localStorage.getItem('user')||'{}') }catch{ return {} } }

async function api(path, opts={}) {
  const token = getToken();
  const headers = Object.assign({ 'Content-Type':'application/json' }, (opts.headers||{}));
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
  const data = await res.json().catch(()=>({ok:false,error:'Bad JSON'}));
  if (!res.ok) { throw new Error(data.error||('HTTP '+res.status)) }
  return data;
}
