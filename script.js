// ══════════════════════════════════════════════
// ⚙️ INSTELLINGEN: hier pas je alles aan
// ══════════════════════════════════════════════
const NAAM = "Ella";
const MIJN_NAAM = "Cédric";
const INSTAGRAM = "cedric2007_vhw";   // zonder @
const EERSTE_DAG = new Date(2026, 10, 14);   // 14 november 2026 (maand 10 = november, want januari = 0)
const LAATSTE_DAG = new Date(2026, 10, 30);  // 30 november 2026

const MUSEA = [
    { icoon: "🎻", naam: "MIM, muziekinstrumentenmuseum", tekst: "Brussel. Instrumenten bekijken en beluisteren met een koptelefoon." },
    { icoon: "🌹", naam: "Museum Van Buuren", tekst: "Brussel. Art-decohuis met een grote tuin om daarna in te praten." },
    { icoon: "🏠", naam: "Horta Museum", tekst: "Brussel. Het huis van de art-nouveau-architect Victor Horta." },
    { icoon: "🧸", naam: "Speelgoedmuseum Mechelen", tekst: "Mechelen. Speels en laagdrempelig." },
    { icoon: "🕯️", naam: "Kazerne Dossin", tekst: "Mechelen. Indrukwekkend en geschiedkundig." },
    { icoon: "🖼️", naam: "Museum Mayer van den Bergh", tekst: "Antwerpen. Kunst in een historische woning." },
    { icoon: "🎨", naam: "Rubenshuis", tekst: "Antwerpen. Het huis en atelier van Rubens." },
    { icoon: "🦕", naam: "Museum voor Natuurwetenschappen", tekst: "Brussel. Dinosauriërs en veel meer." },
    { icoon: "🗿", naam: "Middelheim Museum", tekst: "Antwerpen. Beelden in een rustig park." }
];

const KAART_ICONEN = ["🎻", "🧸", "🌹", "🦕", "🎨", "🏛️", "🎷", "🕰️"];

// ══════════════════════════════════════════════
// Staat opslaan (zodat ze verder kan als ze de pagina sluit)
// ══════════════════════════════════════════════
const STORAGE_KEY = "museumdate_v1";
const app = document.getElementById("app");
const $ = (id) => document.getElementById(id);

let state = { page: "start", museum: "", days: [], note: "" };
let lastMessage = "";

function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const s = JSON.parse(raw);
        state.page = s.page || "start";
        state.museum = s.museum || "";
        state.days = s.days || [];
        state.note = s.note || "";
        return true;
    } catch (e) {
        return false;
    }
}

function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function goTo(page) {
    state.page = page;
    saveState();
    render();
}

function render() {
    switch (state.page) {
        case "game":     renderGame(); break;
        case "question": renderQuestion(); break;
        case "museums":  renderMuseums(); break;
        case "days":     renderDays(); break;
        case "summary":  renderSummary(); break;
        default:         renderStart();
    }
    window.scrollTo(0, 0);
}

function startOver() {
    if (!confirm("Wil je helemaal opnieuw beginnen? Alle keuzes worden gewist. 💗")) return;
    clearState();
    window.location.reload();
}

// ══════════════════════════════════════════════
// Muziek
// ══════════════════════════════════════════════
let musicPlaying = false;

function updateMusicButton() {
    $("music-toggle").textContent = musicPlaying ? "🔊" : "🔇";
}

function startMusic() {
    const audio = $("bg-music");
    audio.volume = 0.35;
    audio.play().then(() => {
        musicPlaying = true;
        updateMusicButton();
    }).catch(() => {});
}

function toggleMusic() {
    const audio = $("bg-music");
    if (musicPlaying) {
        audio.pause();
        musicPlaying = false;
        updateMusicButton();
    } else {
        startMusic();
    }
}

$("music-toggle").addEventListener("click", toggleMusic);

// ══════════════════════════════════════════════
// Laadscherm en hervatten
// ══════════════════════════════════════════════
window.addEventListener("load", () => {
    const hasSaved = loadState();
    // Midden in het spel hervatten heeft geen zin: terug naar het begin
    if (state.page === "game") state.page = "start";
    const shouldResume = hasSaved && state.page !== "start";

    render();

    setTimeout(() => {
        const screen = $("loading-screen");
        screen.style.opacity = "0";
        setTimeout(() => { screen.style.display = "none"; }, 500);
    }, shouldResume ? 400 : 2000);
});

// ══════════════════════════════════════════════
// Scherm 1: start
// ══════════════════════════════════════════════
function renderStart() {
    app.innerHTML = `
        <p class="tag">Made for ${NAAM} 💗</p>
        <h1>Heyy ${NAAM}... </h1>
        <p>Ik heb een vraag voor je, maar om ze te stellen moet je eerst effe dit spel winnen.</p>
        <button class="btn" id="start">Start het spel</button>
    `;
    $("start").addEventListener("click", () => {
        startMusic();           // muziek mag pas starten na een klik
        goTo("game");
    });
}

// ══════════════════════════════════════════════
// Scherm 2: memoryspel
// ══════════════════════════════════════════════
function renderGame() {
    app.innerHTML = `
        <h1>Vind de paartjes</h1>
        <div class="bar"><span id="mv">Beurten: 0</span><span id="pr">0 / 8</span></div>
        <div class="grid" id="grid"></div>
    `;

    const deck = KAART_ICONEN.concat(KAART_ICONEN).sort(() => Math.random() - 0.5);
    let first = null, lock = false, moves = 0, found = 0;

    deck.forEach((icoon, i) => {
        const b = document.createElement("button");
        b.className = "c";
        b.setAttribute("aria-label", "Kaart " + (i + 1));
        b.textContent = "?";

        b.addEventListener("click", () => {
            if (lock || b.classList.contains("open") || b.classList.contains("done")) return;

            b.classList.add("open");
            b.textContent = icoon;

            if (!first) { first = b; return; }

            moves++;
            $("mv").textContent = "Beurten: " + moves;
            const a = first;
            first = null;

            if (a.textContent === icoon) {
                a.classList.replace("open", "done");
                b.classList.replace("open", "done");
                found++;
                $("pr").textContent = found + " / 8";
                if (found === 8) setTimeout(() => goTo("question"), 700);
            } else {
                lock = true;
                setTimeout(() => {
                    a.className = "c"; b.className = "c";
                    a.textContent = "?"; b.textContent = "?";
                    lock = false;
                }, 800);
            }
        });

        $("grid").appendChild(b);
    });
}

// ══════════════════════════════════════════════
// Scherm 3: de vraag (Nee springt weg)
// ══════════════════════════════════════════════
function renderQuestion() {
    app.innerHTML = `
        <h1>Gewonnen! 🎉</h1>
        <p>Dan nu mijn vraag: Wil je met mij op date naar een museum?</p>
        <div class="row">
            <button class="btn" id="yes">Ja 💗</button>
            <button class="btn alt" id="no">Nee 🙈</button>
        </div>
        <p id="nomsg" class="hide">Die knop is stuk. Probeer de andere eens. 😄</p>
    `;

    let tries = 0;
    function moveNoButton() {
        tries++;
        if (tries >= 4) { $("nomsg").classList.remove("hide"); return; }
        const x = Math.round((Math.random() - 0.5) * 160);
        const y = Math.round((Math.random() - 0.5) * 50);
        $("no").style.transform = `translate(${x}px, ${y}px)`;
    }

    $("no").addEventListener("pointerenter", moveNoButton);
    $("no").addEventListener("click", moveNoButton);
    $("yes").addEventListener("click", () => goTo("museums"));
}

// ══════════════════════════════════════════════
// Scherm 4: museum kiezen
// ══════════════════════════════════════════════
function renderMuseums() {
    app.innerHTML = `
        <h2>Waar wil je naartoe?</h2>
        <p>Kies het museum dat jou het leukst lijkt.</p>
        <div class="list" id="list"></div>
    `;

    MUSEA.forEach((m) => {
        const b = document.createElement("button");
        b.className = "card-btn";
        b.innerHTML = `<span class="e">${m.icoon}</span><span><b></b><span class="t"></span></span>`;
        b.querySelector("b").textContent = m.naam;
        b.querySelector(".t").textContent = m.tekst;
        b.addEventListener("click", () => {
            state.museum = m.naam;
            goTo("days");
        });
        $("list").appendChild(b);
    });
}

// ══════════════════════════════════════════════
// Scherm 5: dagen kiezen
// ══════════════════════════════════════════════
function komendeDagen() {
    const namen = ["ZO", "MA", "DI", "WO", "DO", "VR", "ZA"];
    const maanden = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const lijst = [];
    const d = new Date(EERSTE_DAG);
    while (d <= LAATSTE_DAG) {
        lijst.push({ dag: namen[d.getDay()], datum: d.getDate() + " " + maanden[d.getMonth()] });
        d.setDate(d.getDate() + 1);
    }
    return lijst;
}

function renderDays() {
    app.innerHTML = `
        <button class="back-button" id="back">← Opnieuw beginnen</button>
        <h2>Wanneer kan je?</h2>
        <p>Je koos <strong id="mname"></strong>. Kies alle dagen die voor jou goed uitkomen.</p>
        <div class="days" id="days"></div>
        <textarea id="note" rows="3" placeholder="Opmerking, bijvoorbeeld: liefst na 17u"></textarea>
        <button class="btn full" id="next">Verder</button>
    `;

    $("mname").textContent = state.museum;
    $("note").value = state.note;
    $("back").addEventListener("click", startOver);

    function updateNext() { $("next").disabled = state.days.length === 0; }

    komendeDagen().forEach((d) => {
        const label = d.dag + " " + d.datum;
        const b = document.createElement("button");
        b.className = "day" + (state.days.includes(label) ? " selected" : "");
        b.innerHTML = `<strong>${d.dag}</strong><span>${d.datum}</span>`;
        b.addEventListener("click", () => {
            if (state.days.includes(label)) {
                state.days = state.days.filter((x) => x !== label);
                b.classList.remove("selected");
            } else {
                state.days.push(label);
                b.classList.add("selected");
            }
            saveState();
            updateNext();
        });
        $("days").appendChild(b);
    });

    $("note").addEventListener("input", () => {
        state.note = $("note").value;
        saveState();
    });

    updateNext();
    $("next").addEventListener("click", () => goTo("summary"));
}

// ══════════════════════════════════════════════
// Scherm 6: samenvatting en versturen
// ══════════════════════════════════════════════
function buildMessage() {
    let msg = `Hey ${MIJN_NAAM}! 💗 Ik kies ${state.museum}.\n\nDeze dagen kunnen voor mij:\n`;
    state.days.forEach((d) => { msg += `📅 ${d}\n`; });
    if (state.note.trim()) msg += `\n📝 ${state.note.trim()}\n`;
    msg += "\nTot dan! 🥰";
    return msg;
}

function renderSummary() {
    lastMessage = buildMessage();
    launchConfetti();

    app.innerHTML = `
        <button class="back-button" id="back">← Opnieuw beginnen</button>
        <h1>Afgesproken! 🥰</h1>
        <p>Bijna klaar. Kopieer dit bericht en stuur het naar ${MIJN_NAAM}:</p>
        <div class="out" id="msg"></div>
        <p class="status" id="status"></p>
        <button class="btn full" id="copy">📋 Kopieer bericht</button>
        <button class="btn full alt" id="insta">📸 Open Instagram van ${MIJN_NAAM}</button>
        <button class="btn full alt" id="wa">💬 Liever via WhatsApp</button>
    `;

    $("msg").textContent = lastMessage;
    $("back").addEventListener("click", startOver);
    $("copy").addEventListener("click", () => {
        copyToClipboard(lastMessage);
        $("status").textContent = "Gekopieerd! 📋";
    });
    $("insta").addEventListener("click", openInstagram);
    $("wa").addEventListener("click", shareWhatsApp);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); } catch (e) { prompt("Kopieer handmatig:", text); }
    document.body.removeChild(ta);
}

function openInstagram() {
    copyToClipboard(lastMessage);
    $("status").textContent = "Gekopieerd! Plak het in de chat. 📋";
    const url = `https://www.instagram.com/${INSTAGRAM}/`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = `instagram://user?username=${INSTAGRAM}`;
        setTimeout(() => { window.location.href = url; }, 1200);
    } else {
        window.location.href = url;
    }
}

function shareWhatsApp() {
    window.location.href = `https://wa.me/?text=${encodeURIComponent(lastMessage)}`;
}

// ══════════════════════════════════════════════
// Confetti
// ══════════════════════════════════════════════
function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = ["💗", "💕", "💖", "✨", "🎉", "🌸"];

    for (let i = 0; i < 40; i++) {
        const el = document.createElement("div");
        el.textContent = items[Math.floor(Math.random() * items.length)];
        el.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-40px;` +
            `font-size:${16 + Math.random() * 22}px;pointer-events:none;z-index:3000;`;
        document.body.appendChild(el);

        const duration = 2500 + Math.random() * 2000;
        const drift = (Math.random() - 0.5) * 200;
        const rotate = (Math.random() - 0.5) * 720;

        el.animate(
            [
                { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
                { transform: `translate(${drift}px, 110vh) rotate(${rotate}deg)`, opacity: 0 }
            ],
            { duration: duration, easing: "cubic-bezier(.25,.7,.4,1)" }
        );
        setTimeout(() => el.remove(), duration + 100);
    }
}