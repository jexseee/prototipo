// js/main.js
// Control de permisos, textos por ubicación, TTS y manejo de marker events.

const permStatus = document.getElementById('permStatus');
const locationLabel = document.getElementById('locationLabel');
const instrList = document.getElementById('instrList');
const playBtn = document.getElementById('playStep');
const nextBtn = document.getElementById('nextStep');
const prevBtn = document.getElementById('prevStep');

const marker = document.getElementById('pangui-marker');
const dialog = document.getElementById('dialog');
const panguiImg = document.getElementById('pangui-image');

// --- Configuración de guiones por ubicación (puedes ampliar)
const scripts = {
  "entrada-principal": [
    "¡Hola! Soy Pangui. Si hay un sismo, recuerda: agáchate, cúbrete y afírmate.",
    "En esta entrada, el mejor refugio son las columnas robustas y las zonas abiertas. Evita las vitrinas.",
    "Cuando el sismo termine, dirígete con calma hacia la salida principal y sigue las indicaciones del personal."
  ],
  "sala-estudio": [
    "¡Hola! En este espacio, aléjate de las estanterías y busca un escritorio sólido.",
    "Agáchate bajo el escritorio, cúbrete con el brazo y sujétate. Mantén la calma.",
    "Si estás en pasillo, aléjate de las repisas y busca una zona segura señalizada."
  ],
  // default
  "default": [
    "¡Hola! Estás en un punto de información. En caso de sismo: Agáchate, Cúbrete y Afírmate.",
    "Identifica la salida más cercana y las zonas de seguridad del campus.",
    "Si tienes dudas, sigue las instrucciones del personal de emergencia."
  ]
};

// Determina la 'location' desde la URL (ej: ?loc=sala-estudio)
function getLocationFromURL(){
  const params = new URLSearchParams(window.location.search);
  return params.get('loc') || 'default';
}

let currentScript = [];
let stepIndex = 0;
const loc = getLocationFromURL();
locationLabel.textContent = 'Ubicación: ' + loc;
currentScript = scripts[loc] || scripts['default'];

function updateDialog(){
  const text = currentScript[stepIndex] || "";
  dialog.setAttribute('text', `value: ${text}; align: center; width: 2.2; color: #fff; wrapCount: 30;`);
}

updateDialog();

// TTS simple
function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang = 'es-CL';
  ut.rate = 1.0;
  window.speechSynthesis.speak(ut);
}

// Buttons
playBtn.addEventListener('click', () => { speak(currentScript[stepIndex]); });
nextBtn.addEventListener('click', () => {
  if(stepIndex < currentScript.length - 1) stepIndex++;
  updateDialog();
  speak(currentScript[stepIndex]);
});
prevBtn.addEventListener('click', () => {
  if(stepIndex > 0) stepIndex--;
  updateDialog();
  speak(currentScript[stepIndex]);
});

// Permisos de cámara: solicitamos para mejorar UX
async function requestCamera(){
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    permStatus.textContent = 'Cámara: activa';
  } catch (err) {
    console.warn('Acceso a cámara denegado', err);
    permStatus.textContent = 'Cámara: denegada';
    document.getElementById('message-bottom').innerText = 'Permiso de cámara denegado. Habilite la cámara para usar la experiencia.';
  }
}

window.addEventListener('load', () => {
  // Pedir permiso con pequeño delay para no bloquear UI
  setTimeout(requestCamera, 300);
});

// Mostrar mensaje al detectar el marker
if(marker){
  marker.addEventListener('markerFound', () => {
    console.log('marker found');
    document.getElementById('message-bottom').style.background = 'linear-gradient(90deg,#06384b,#0b6b63)';
    document.getElementById('message-bottom').innerText = 'Pangui detectado — siga las instrucciones.';

    // Reproducir el primer texto automát.
    stepIndex = 0;
    updateDialog();
    speak(currentScript[stepIndex]);
  });
  marker.addEventListener('markerLost', () => {
    console.log('marker lost');
    document.getElementById('message-bottom').style.background = 'rgba(0,0,0,0.25)';
    document.getElementById('message-bottom').innerText = 'No detecto el marcador. Ajuste la distancia o iluminación.';
    window.speechSynthesis.cancel();
  });
}

// Soporta cargar pangui.png desde parámetro ?img=URL (útil para CDN)
(function loadPanguiFromParam(){
  const params = new URLSearchParams(window.location.search);
  const img = params.get('img');
  if(img){
    panguiImg.setAttribute('src', img);
  } else {
    // fallback: ensure assets/pangui.png exists in repo
    panguiImg.setAttribute('src','assets/pangui.png');
  }
})();
