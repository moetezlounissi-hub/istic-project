const $ = id => document.getElementById(id);
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem('istic.' + key)) ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem('istic.' + key, JSON.stringify(value));
let english = read('english', false);
const t = (fr, en) => english ? en : fr;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const demo = {student:{role:'student',name:'Étudiant ISTIC',email:'etudiant@ucar.tn'},company:{role:'company',name:'Nova Labs',email:'recrutement@novalabs.example'}};
const types = {intern:['Stage','Internship'],pfe:['Stage PFE','Final-year internship'],job:['Emploi','Full-time job'],part:['Temps partiel','Part-time job']};
const sample = [
 ['Nova Labs','Développement Full Stack','Full Stack Development','pfe','Tunis','React · Node.js','Créer et tester des fonctionnalités pour une application web.','Build and test features for a web application.'],
 ['Carthage Systems','Stage Cloud & DevOps','Cloud & DevOps Internship','intern','Borj Cédria','AWS · Docker','Automatiser le déploiement d’une application et documenter son infrastructure.','Automate an application deployment and document its infrastructure.'],
 ['Medina Digital','Analyste de données junior','Junior Data Analyst','job','Sfax','Python · SQL','Préparer des tableaux de bord et analyser des données opérationnelles.','Build dashboards and analyze operational data.'],
 ['Atlas Networks','Technicien réseau','Network Technician','part','Tunis','Linux · TCP/IP','Participer au support et à la supervision du réseau.','Help support and monitor the network.'],
 ['Pixel Studio','Stage UI/UX','UI/UX Internship','intern','Sousse','Figma · Recherche UX','Concevoir des prototypes et mener des tests utilisateurs.','Design prototypes and conduct user testing.'],
 ['Nova Labs','Développement mobile Flutter','Flutter Mobile Development','pfe','Tunis','Flutter · Firebase','Développer et tester un parcours dans une application mobile.','Develop and test a user flow in a mobile application.']
].map(([company,fr,en,type,city,skills,description,descriptionEn],id)=>({company,fr,en,type,city,skills,description,descriptionEn,id:'sample-'+id,owner:company==='Nova Labs'?demo.company.email:null}));
let account = read('account', null);
let offers = read('offers', []);
let applications = read('applications', []);
let saved = read('saved', {});
let page = 'home';
let filters = {query:'',type:'',city:''};
const all = () => [...offers,...sample];
const title = offer => t(offer.fr,offer.en || offer.fr);
const kind = key => t(...types[key]);
const slug = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const button = (label, action, kind = 'secondary') => `<button type="button" class="${kind}" data-action="${action}">${label}</button>`;
const selectTypes = () => Object.keys(types).map(key=>`<option value="${key}" ${key===filters.type?'selected':''}>${kind(key)}</option>`).join('');
const msg = message => {
  $('toast').textContent = message;
  clearTimeout(msg.timer);
  msg.timer = setTimeout(()=>$('toast').textContent='',3400);
};
function navigate(target) {
  page=target;
  render();
  window.scrollTo(0,0);
}
function setAccount(user) {
  account=user;
  write('account',user);
  $('dialog').close();
  navigate(user?.role==='company'?'company':'home');
}
function modal(heading, content) {
  $('modal').innerHTML = button('✕','close','plain close') + `<h2 id="modal-title">${heading}</h2>` + content;
  $('modal').querySelector('.close').setAttribute('aria-label',t('Fermer','Close'));
  if (!$('dialog').open) $('dialog').showModal();
}
function form(id, fields, submit) {
  return `<form id="${id}">${fields}<button class="primary">${submit}</button></form>`;
}
function field(label, name, options='required', type='text') {
  return `<label>${label}<input name="${name}" type="${type}" ${options}></label>`;
}
function textarea(label,name,required='required') {
  return `<label>${label}<textarea name="${name}" rows="3" maxlength="1500" ${required}></textarea></label>`;
}
function auth(role='student') {
  modal(t('Accès démo','Demo access'), `<p class="muted">${t('Les actions restent dans ce navigateur. Utilisez des données fictives.','Actions stay in this browser. Use fictional information.')}</p><div class="actions">${button(t('Démo étudiant','Student demo'),'demo:student')}${button(t('Démo entreprise','Company demo'),'demo:company')}</div><p><strong>${role==='student'?t('Compte étudiant','Student account'):t('Compte entreprise','Company account')}</strong></p>` +
  form('auth',`<input type="hidden" name="role" value="${role}">`+field(role==='student'?t('Nom complet','Full name'):t('Nom de l’entreprise','Company name'),'name','required maxlength="80"')+field(role==='student'?t('Adresse UCAR','UCAR email') : t('Adresse professionnelle','Work email'),'email','required maxlength="120" '+(role==='student'?'placeholder="etudiant@ucar.tn"':''),'email'),t('Ouvrir le compte démo','Open demo account'))+
  `<p>${button(role==='student'?t('Accès entreprise','Company access'):t('Accès étudiant','Student access'),'auth:'+(role==='student'?'company':'student'),'plain')}</p>`);
}
function post() {
  if(account?.role!=='company') return auth('company');
  modal(t('Publier une offre','Post an opening'),form('post',
    field(t('Intitulé en français','Title in French'),'fr','required maxlength="90"')+
    field(t('Intitulé en anglais (facultatif)','Title in English (optional)'),'en','maxlength="90"')+
    `<label>${t('Type de contrat','Contract type')}<select name="type">${selectTypes()}</select></label>`+
    field(t('Ville ou télétravail','City or remote'),'city','required maxlength="65"')+
    field(t('Compétences (facultatif)','Skills (optional)'),'skills','maxlength="110"')+
    textarea(t('Description en français','Description in French'),'description')+
    textarea(t('Description en anglais (facultatif)','Description in English (optional)'),'descriptionEn',''),t('Publier l’offre','Publish opening')));
}
function offerDetails(offer) {
  const applied = account && applications.some(a=>a.offer===offer.id && a.email===account.email);
  modal(esc(title(offer)), `<p class="muted">${esc(offer.company)} · ${esc(offer.city)} · ${kind(offer.type)}</p><p>${esc(t(offer.description,offer.descriptionEn||offer.description))}</p><p>${esc(offer.skills)}</p>`+
  (offer.owner && offer.owner===account?.email && account.role==='company'?'':applied?`<span class="pill">${t('Candidature envoyée','Application submitted')}</span>`:button(t('Postuler','Apply'),'apply:'+offer.id,'primary')));
}
function apply(offer) {
  if(account?.role!=='student') return auth('student');
  if(applications.some(a=>a.offer===offer.id && a.email===account.email)) return offerDetails(offer);
  modal(t('Postuler','Apply'),`<p>${esc(title(offer))} · ${esc(offer.company)}</p>`+form('apply',`<input type="hidden" name="offer" value="${esc(offer.id)}">`+textarea(t('Message à l’entreprise','Message to the employer'),'message')+
  field(t('Nom du fichier CV (facultatif)','CV filename (optional)'),'cv','maxlength="120" placeholder="CV.pdf"')+t('Envoyer la candidature démo','Submit demo application')));
}
const bookmarked = id=>account?.role==='student' && (saved[account.email]??[]).includes(id);
function card(offer) {
  return `<article class="card"><div class="card-head"><span class="logo" aria-hidden="true">${esc(offer.company.split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase())}</span><span class="pill">${kind(offer.type)}</span></div><h3>${esc(title(offer))}</h3><div class="meta">${esc(offer.company)} · ${esc(offer.city)}</div><div class="tags">${esc(offer.skills)}</div><div class="actions">${button(t('Voir l’offre','View opening'),'offer:'+offer.id)}${account?.role!=='company'?button(bookmarked(offer.id)?t('★ Enregistrée','★ Saved'):t('☆ Enregistrer','☆ Save'),'save:'+offer.id,'plain'):''}</div></article>`;
}
function grid(items, empty) {
  return items.length?items.map(card).join(''):`<div class="empty">${empty}</div>`;
}
function updateList() {
  const query=slug(filters.query.trim());
  const items=all().filter(offer=>(!filters.type||offer.type===filters.type)&&(!filters.city||offer.city===filters.city)&&slug([offer.fr,offer.en,offer.company,offer.city,offer.skills].join(' ')).includes(query));
  $('result').textContent=t('Offres trouvées','Openings found')+' · '+items.length;
  $('list').innerHTML=grid(items,t('Aucune offre ne correspond à votre recherche.','No openings match your search.'));
}
function home() {
  const cities=[...new Set(all().map(offer=>offer.city))].sort();
  return `<div class="shell"><section class="hero"><div><span class="eyebrow">${t('Plateforme carrière · ISTIC','Career portal · ISTIC')}</span><h1>${t('Trouvez votre<br><em>prochaine opportunité.</em>','Find your<br><em>next opportunity.</em>')}</h1><p>${t('Stages, projets de fin d’études et premiers emplois pour les étudiants de l’ISTIC en Tunisie.','Internships, final-year projects and first jobs for ISTIC students in Tunisia.')}</p><div class="actions"><a class="primary" href="#opportunities">${t('Explorer les offres','Explore openings')}</a>${button(t('Publier une offre','Post an opening'),'post')}</div></div><div class="art" aria-hidden="true"><div class="orbit"></div><div class="tile">✳</div><div class="spark">✧</div><div class="spark small">✦</div></div></section>
  <section class="section" id="opportunities"><h2>${t('Offres à découvrir','Explore opportunities')}</h2><p>${t('Recherchez par domaine, ville ou type de contrat.','Search by field, city or contract type.')}</p><div class="filters"><input type="search" id="query" aria-label="${t('Rechercher','Search')}" placeholder="${t('Métier, entreprise ou compétence','Role, company or skill')}" value="${esc(filters.query)}"><select id="type" aria-label="${t('Type de contrat','Contract type')}"><option value="">${t('Tous les contrats','All contracts')}</option>${selectTypes()}</select><select id="city" aria-label="${t('Ville','City')}"><option value="">${t('Toutes les villes','All locations')}</option>${cities.map(city=>`<option ${city===filters.city?'selected':''}>${esc(city)}</option>`).join('')}</select>${button(t('Réinitialiser','Reset'),'reset','plain')}</div><p class="result" id="result" aria-live="polite"></p><div id="list" class="grid"></div></section></div>`;
}
function dashboard() {
  const company=page==='company';
  const owned=all().filter(offer=>offer.owner===account.email);
  const received=applications.filter(a=>company?owned.some(o=>o.id===a.offer):a.email===account.email);
  const items=company?owned:all().filter(offer=>bookmarked(offer.id));
  return `<section class="shell section"><h2>${company?t('Espace entreprise','Company dashboard'):t('Espace étudiant','Student dashboard')}</h2><p>${esc(account.name)} · ${esc(account.email)}</p><div class="actions">${company?button(t('Publier une offre','Post an opening'),'post','primary'):button(t('Explorer les offres','Explore openings'),'browse','primary')}${button(t('Se déconnecter','Sign out'),'logout')}</div><div class="application-list"><h3>${company?t('Vos offres','Your openings'):t('Offres enregistrées','Saved openings')}</h3><div class="grid">${grid(items,t('Aucune offre pour le moment.','No openings yet.'))}</div><h3>${company?t('Candidatures reçues','Received applications'):t('Mes candidatures','My applications')}</h3><div class="grid">${received.length?received.map(a=>`<article class="card"><h3>${esc(title(all().find(o=>o.id===a.offer)))}</h3><div class="meta">${esc(company?a.name+' · '+a.email:all().find(o=>o.id===a.offer).company)}</div><div>${esc(a.message)}</div>${a.cv?`<div class="muted">CV · ${esc(a.cv)}</div>`:''}<div><span class="pill">${t('Envoyée','Submitted')}</span></div></article>`).join(''):`<div class="empty">${t('Aucune candidature pour le moment.','No applications yet.')}</div>`}</div></div></section>`;
}
function render() {
  document.documentElement.lang=english?'en':'fr';
  $('language').textContent=english?'FR':'EN';
  $('language').setAttribute('aria-label',english?'Passer au français':'Switch to English');
  $('account').textContent=account?t('Mon espace','Dashboard'):t('Connexion démo','Demo sign-in');
  $('nav').innerHTML=button(t('Offres','Openings'),'browse','plain')+button(t('Étudiants','Students'),'dashboard:student','plain')+button(t('Entreprises','Employers'),'dashboard:company','plain');
  $('footnote').textContent=t('Projet étudiant · Offres de démonstration','Student project · Demo listings');
  $('main').innerHTML=page==='home'?home():dashboard();
  if(page==='home'){
    updateList();
    for(const key of ['query','type','city']) $(key).addEventListener('input',event=>{filters[key]=event.target.value;updateList();});
  }
}
$('language').onclick=()=>{english=!english;write('english',english);render();};
$('home').onclick=event=>{event.preventDefault();navigate('home');};
$('account').onclick=()=>account?navigate(account.role):auth();
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');
  if(!target)return;
  const [action,id]=target.dataset.action.split(':');
  const offer=all().find(item=>item.id===id);
  switch(action){
    case 'browse': navigate('home');$('opportunities').scrollIntoView();break;
    case 'dashboard': if(account?.role===id)navigate(id);else auth(id);break;
    case 'demo': setAccount(demo[id]);break;
    case 'auth': auth(id);break;
    case 'post': post();break;
    case 'offer': offerDetails(offer);break;
    case 'apply': apply(offer);break;
    case 'close': $('dialog').close();break;
    case 'logout': setAccount(null);break;
    case 'reset': filters={query:'',type:'',city:''};render();$('query').focus();break;
    case 'save': {
      if(account?.role!=='student'){auth('student');break;}
      const current=saved[account.email]??[];
      const wasSaved=current.includes(id);
      saved[account.email]=wasSaved?current.filter(value=>value!==id):[...current,id];
      write('saved',saved);
      render();
      document.querySelector('[data-action="save:'+id+'"]')?.focus();
      msg(wasSaved?t('Offre retirée.','Opening removed.'):t('Offre enregistrée.','Opening saved.'));
      break;
    }
  }
});
$('dialog').addEventListener('submit',event=>{
  event.preventDefault();
  const data=Object.fromEntries([...new FormData(event.target)].map(([key,value])=>[key,value.trim()]));
  if(event.target.id==='auth'){
    data.email=data.email.toLowerCase();
    const email=event.target.elements.email;
    if(data.role==='student'&&!/@(?:[a-z0-9-]+\.)*ucar\.tn$/.test(data.email)){
      email.setCustomValidity(t('Utilisez une adresse @ucar.tn ou un sous-domaine UCAR.','Use an @ucar.tn address or a UCAR subdomain.'));
      email.reportValidity();
      email.addEventListener('input',()=>email.setCustomValidity(''),{once:true});
      return;
    }
    if(!data.name)return msg(t('Saisissez un nom.','Enter a name.'));
    setAccount(data);
  }
  if(event.target.id==='post'&&account?.role==='company'){
    if(!data.fr||!data.city||!data.description)return msg(t('Complétez les champs obligatoires.','Complete all required fields.'));
    offers=[{...data,id:'local-'+Date.now(),owner:account.email,company:account.name},...offers];
    write('offers',offers);
    $('dialog').close();
    navigate('company');
    msg(t('Offre publiée dans ce navigateur.','Opening published in this browser.'));
  }
  if(event.target.id==='apply'&&account?.role==='student'){
    if(!data.message)return msg(t('Ajoutez un message.','Enter a message.'));
    if(applications.some(a=>a.offer===data.offer&&a.email===account.email))return;
    applications=[{...data,email:account.email,name:account.name},...applications];
    write('applications',applications);
    $('dialog').close();
    navigate('student');
    msg(t('Candidature enregistrée dans ce navigateur.','Application saved in this browser.'));
  }
});
render();

