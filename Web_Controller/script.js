// --- CONFIGURATION ---
// À l'IUT : Remplacez par l'URL fournie par ngrok (ex: 'wss://xyz.ngrok-free.app')
// En local : Utilisez 'ws://localhost:8080'
const SERVER_URL = 'ws://localhost:8080'; 

const socket = new WebSocket(SERVER_URL);
const curseur = document.getElementById('curseur');
const cases = document.querySelectorAll('.case-score');
const ecran = document.getElementById('ecran-cliquable');

let position = 0;
let direction = 1;
let estArrete = false;
const vitesse = 1.5; 

// --- LOGIQUE DU JEU ---

/**
 * Mélange aléatoirement les chiffres de 1 à 6 dans les cases
 */
function melangerChiffres() {
    let chiffres = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    cases.forEach((elementCase, index) => {
        elementCase.innerText = chiffres[index];
        elementCase.dataset.valeur = chiffres[index]; 
    });
}

/**
 * Gère l'animation de va-et-vient du curseur
 */
function animer() {
    if (estArrete) return;

    position += vitesse * direction;
    
    // Rebond sur les bords (0% à 100%)
    if (position >= 100) { position = 100; direction = -1; }
    else if (position <= 0) { position = 0; direction = 1; }
    
    curseur.style.left = position + "%";

    // Allumage visuel de la case survolée (divisé en 6 segments)
    let index = Math.min(Math.floor(position / (100 / 6)), 5);
    cases.forEach((c, i) => {
        if (i === index) {
            c.classList.add('case-active');
        } else {
            c.classList.remove('case-active');
        }
    });

    requestAnimationFrame(animer);
}

// --- GESTION RÉSEAU & CLICS ---

// Initialisation
melangerChiffres();
animer();

/**
 * Action lors du clic sur l'écran
 */
ecran.onclick = () => {
    // On vérifie que le jeu n'est pas déjà arrêté et que le socket est ouvert
    if (!estArrete && socket.readyState === WebSocket.OPEN) {
        estArrete = true;
        
        // Identification du score sous le curseur
        let indexArret = Math.min(Math.floor(position / (100 / 6)), 5);
        let scoreObtenu = cases[indexArret].innerText;
        
        // Envoi au serveur Godot (Format "CLIC:VALEUR")
        // Le calcul final doit être validé côté serveur pour éviter la triche
        socket.send("CLIC:" + scoreObtenu);
        console.log("Score envoyé : " + scoreObtenu);
        
        // Feedback visuel (Flash Vert)
        document.body.style.backgroundColor = "#4caf50"; 
        
        // Réinitialisation après un court délai
        setTimeout(() => { 
            document.body.style.transition = "background-color 0.5s";
            document.body.style.backgroundColor = "#1a1a1a";
            
            setTimeout(() => { 
                document.body.style.transition = "none";
                estArrete = false; 
                melangerChiffres(); 
                animer(); 
            }, 2000);
        }, 150);
    } else if (socket.readyState !== WebSocket.OPEN) {
        alert("Erreur : Connexion au serveur perdue ou impossible !");
    }
};

// Gestion des erreurs socket
socket.onopen = () => console.log("Connecté au serveur Godot !");
socket.onerror = (error) => console.error("Erreur WebSocket : ", error);
socket.onclose = () => console.log("Connexion fermée.");