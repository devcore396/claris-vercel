// ==================================================
//  CLARIS - Frontend para Vercel
//  Con animación y conexión al backend
// ==================================================

(function() {
    'use strict';

    // ============ CONFIGURACIÓN ============
    const API_URL = '/api/chat';

    // ============ DOM REFS ============
    const dom = {
        clarisImage: document.getElementById('clarisImage'),
        statusText: document.getElementById('statusText'),
        statusDot: document.getElementById('statusDot'),
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        chatSend: document.getElementById('chatSend'),
        logMessages: document.getElementById('logMessages'),
        carouselTrack: document.getElementById('carouselTrack'),
        carouselDots: document.getElementById('carouselDots'),
        btnHablar: document.getElementById('btnHablar'),
        btnParpadeo: document.getElementById('btnParpadeo'),
        btnSilencio: document.getElementById('btnSilencio')
    };

    // ============ IMÁGENES ============
    const IMAGENES = {
        reposo: 'assets/claris/reposo.png',
        hablando: 'assets/claris/hablando.png',
        parpadeo: 'assets/claris/parpadeo.png'
    };

    // ============ ESTADO ============
    const state = {
        estado: 'reposo',
        timeoutHablando: null,
        timeoutParpadeo: null,
        historial: []
    };

    // ============ LOG ============
    function addLog(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        dom.logMessages.appendChild(entry);
        dom.logMessages.scrollTop = dom.logMessages.scrollHeight;
    }

    // ============ CLARIS ANIMACIÓN ============
    const claris = {
        setEstado(estado) {
            if (state.estado === estado && estado !== 'reposo') return;
            state.estado = estado;

            let src = IMAGENES.reposo;
            let statusText = 'Reposo';

            switch (estado) {
                case 'hablando':
                    src = IMAGENES.hablando;
                    statusText = '🗣️ Hablando';
                    dom.clarisImage.classList.add('hablando');
                    break;
                case 'parpadeo':
                    src = IMAGENES.parpadeo;
                    statusText = '👁️ Parpadeando';
                    break;
                default:
                    src = IMAGENES.reposo;
                    statusText = '💤 Reposo';
                    dom.clarisImage.classList.remove('hablando');
                    break;
            }

            dom.clarisImage.src = src;
            dom.statusText.textContent = statusText;
        },

        hablar(duracion = 2500) {
            if (state.timeoutHablando) clearTimeout(state.timeoutHablando);
            if (state.timeoutParpadeo) clearTimeout(state.timeoutParpadeo);

            this.setEstado('hablando');
            addLog('🗣️ Claris está hablando');

            state.timeoutHablando = setTimeout(() => {
                this.setEstado('reposo');
                addLog('⏸️ Claris volvió a reposo');
                this.iniciarParpadeo();
            }, duracion);
        },

        parpadear() {
            this.setEstado('parpadeo');
            setTimeout(() => {
                if (state.estado === 'parpadeo') {
                    this.setEstado('reposo');
                }
            }, 150);
        },

        iniciarParpadeo() {
            if (state.timeoutParpadeo) clearTimeout(state.timeoutParpadeo);

            if (state.estado !== 'reposo') return;

            const parpadear = () => {
                if (state.estado === 'reposo') {
                    this.parpadear();
                }
                const intervalo = 3000 + Math.random() * 2000;
                state.timeoutParpadeo = setTimeout(parpadear, intervalo);
            };

            state.timeoutParpadeo = setTimeout(parpadear, 2000);
        },

        detener() {
            if (state.timeoutHablando) clearTimeout(state.timeoutHablando);
            if (state.timeoutParpadeo) clearTimeout(state.timeoutParpadeo);
            this.setEstado('reposo');
            addLog('🛑 Claris detenida');
        }
    };

    // ============ CHAT ============
    function addMessage(texto, tipo) {
        const el = document.createElement('div');
        el.className = `msg ${tipo}`;
        el.textContent = texto;
        dom.chatMessages.appendChild(el);
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
        return el;
    }

    async function enviarMensaje() {
        const texto = dom.chatInput.value.trim();
        if (!texto) return;

        dom.chatInput.value = '';
        addMessage(texto, 'user');

        state.historial.push({ role: 'user', content: texto });

        claris.hablar(800);

        const temp = addMessage('...', 'bot');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: texto, 
                    history: state.historial.slice(-10) 
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            temp.textContent = data.texto;

            state.historial.push({ role: 'assistant', content: data.texto });

            claris.hablar(Math.min(3000, 800 + texto.length * 50));
            addLog(`💬 Claris respondió (${data.fuente || 'api'})`);

        } catch (error) {
            temp.textContent = '⚠️ Error de conexión. ¿El servidor está corriendo?';
            claris.setEstado('reposo');
            addLog(`❌ Error: ${error.message}`);
        }
    }

    // ============ CARRUSEL ============
    let currentSlide = 0;
    let autoSlideInterval;

    function goToSlide(index) {
        const track = dom.carouselTrack;
        const totalSlides = track.children.length;
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentSlide = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function iniciarCarousel() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 5000);
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.addEventListener('click', () => {
                clearInterval(autoSlideInterval);
                goToSlide(i);
                iniciarCarousel();
            });
        });
    }

    // ============ EVENTOS ============
    dom.chatSend.addEventListener('click', enviarMensaje);
    dom.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensaje();
    });

    dom.btnHablar.addEventListener('click', () => claris.hablar(3000));
    dom.btnParpadeo.addEventListener('click', () => claris.parpadear());
    dom.btnSilencio.addEventListener('click', () => claris.detener());

    // ============ INICIALIZACIÓN ============
    document.addEventListener('DOMContentLoaded', () => {
        claris.setEstado('reposo');
        claris.iniciarParpadeo();
        addLog('🟢 Claris iniciada');

        iniciarCarousel();

        setTimeout(() => {
            addMessage('¡Hola! Soy Claris, tu asistente dental. ¿En qué puedo ayudarte? 🦷', 'bot');
        }, 500);
    });

})();