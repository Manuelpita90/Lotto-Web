// --- 1. CONFIGURACIÓN Y REFERENCIAS ---
console.log(`%c 🚀 Lotto IA Iniciado en modo: ${window.api ? 'Escritorio (Electron)' : 'Web (Navegador)'}`, 'background: #004d00; color: #00ffaa; font-size: 12px; padding: 4px; border-radius: 4px;');

const btnPredecir = document.getElementById('btn-predecir');
const btnAgregar = document.getElementById('btn-agregar');
// Removed: resultsArea (Now we use specific columns)
const btnInfo = document.querySelector('.btn-info');
const todayResults = document.getElementById('today-results');
const matchCounter = document.getElementById('match-counter');
const statusBadge = document.getElementById('connection-status');

// --- VALIDACIÓN BOTÓN PREDECIR ---
if (btnPredecir) btnPredecir.disabled = false; // Siempre habilitado en nuevo diseño
// Removed: selectSorteo listener

// Mapa de nombres exactos
const nombreAnimales = {
    '0': 'Delfín', '00': 'Ballena', '1': 'Carnero', '2': 'Toro', '3': 'Ciempiés',
    '4': 'Alacrán', '5': 'León', '6': 'Rana', '7': 'Perico', '8': 'Ratón',
    '9': 'Águila', '10': 'Tigre', '11': 'Gato', '12': 'Caballo', '13': 'Mono',
    '14': 'Paloma', '15': 'Zorro', '16': 'Oso', '17': 'Pavo', '18': 'Burro',
    '19': 'Chivo', '20': 'Cochino', '21': 'Gallo', '22': 'Camello', '23': 'Zebra',
    '24': 'Iguana', '25': 'Gallina', '26': 'Vaca', '27': 'Perro', '28': 'Zamuro',
    '29': 'Elefante', '30': 'Caimán', '31': 'Lapa', '32': 'Ardilla', '33': 'Pescado',
    '34': 'Venado', '35': 'Jirafa', '36': 'Culebra'
};

// Mapa de Iconos Visuales
const iconosAnimales = {
    'Delfín': '🐬', 'Delfin': '🐬', 'Ballena': '🐋', 'Carnero': '🐏', 'Toro': '🐂', 'Ciempiés': '🐛', 'Ciempies': '🐛',
    'Alacrán': '🦂', 'Alacran': '🦂', 'León': '🦁', 'Leon': '🦁', 'Rana': '🐸', 'Perico': '🦜', 'Ratón': '🐁', 'Raton': '🐁',
    'Águila': '🦅', 'Aguila': '🦅', 'Tigre': '🐅', 'Gato': '🐈', 'Caballo': '🐎', 'Mono': '🐒',
    'Paloma': '🕊️', 'Zorro': '🦊', 'Oso': '🐻', 'Pavo': '🦃', 'Burro': '🐐',
    'Chivo': '🐐', 'Cochino': '🐖', 'Gallo': '🐓', 'Camello': '🐪', 'Zebra': '🦓', 'Cebra': '🦓',
    'Iguana': '🦎', 'Gallina': '🐔', 'Vaca': '🐄', 'Perro': '🐕', 'Zamuro': '🦅',
    'Elefante': '🐘', 'Caimán': '🐊', 'Caiman': '🐊', 'Lapa': '🦦', 'Ardilla': '🐿️', 'Pescado': '🐟',
    'Venado': '🦌', 'Jirafa': '🦒', 'Culebra': '🐍'
};

// Variable global para guardar las predicciones actuales
let ultimasPrediccionesNombres = [];
let ultimosAciertos = 0;
let primeraCarga = true; // Para evitar sonidos al abrir la app
let notificationCount = parseInt(localStorage.getItem('lotto_notif_count')) || 0; // Contador persistente

// --- SONIDOS ---
const audioMatch = new Audio('../sounds/win.mp3');   // Sonido especial (Acierto)
const audioNotify = new Audio('../sounds/notify.mp3'); // Sonido normal (Nuevo sorteo)

// --- 2. FUNCIÓN GUARDAR (Botón +) ---
// Referencias al nuevo modal
const modalManual = document.getElementById('modal-manual-entry');
const selectManualTime = document.getElementById('manual-time');
const selectManualAnimal = document.getElementById('manual-animal');
const btnConfirmarManual = document.getElementById('btn-confirmar-manual');

window.cerrarModalManual = function () {
    modalManual.style.display = 'none';
}

function abrirModalManual() {
    // Generar opciones si está vacío (ya no podemos copiar de selectSorteo)
    if (selectManualAnimal.options.length <= 1) {
        // Ordenar por número (claves 0, 00, 1...36)
        const keys = Object.keys(nombreAnimales).sort((a, b) => {
            if (a === '00') return -1; if (b === '00') return -1;
            return parseInt(a) - parseInt(b);
        });

        keys.forEach(k => {
            const option = document.createElement('option');
            option.value = k;
            const icono = iconosAnimales[nombreAnimales[k]] || '';
            option.text = `${icono} ${k} - ${nombreAnimales[k]}`;
            selectManualAnimal.appendChild(option);
        });
    }
    modalManual.style.display = 'flex';
}

async function confirmarGuardadoManual() {
    const valor = selectManualAnimal.value;
    const hora = selectManualTime.value;

    if (!valor) {
        mostrarMensaje('Faltan datos', 'Por favor selecciona un animal.', true);
        return;
    }

    // Feedback visual
    const btnOriginal = btnConfirmarManual.innerHTML;
    btnConfirmarManual.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';
    btnConfirmarManual.disabled = true;

    const nombre = nombreAnimales[valor] || 'Desconocido';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fechaLocal = `${year}-${month}-${day}`;

    const datos = {
        fecha: fechaLocal,
        hora: hora,
        numero: parseInt(valor) || 0,
        animal: nombre
    };

    if (window.api) {
        try {
            await window.api.guardarSorteo(datos);

            mostrarMensaje('¡Guardado!', `Se registró ${nombre} a las ${hora}`, false);
            cerrarModalManual();

            // Actualizar texto del footer
            actualizarResultadosHoy();

        } catch (error) {
            mostrarMensaje('Error', error, true);
        }
    }

    // Restaurar botón
    btnConfirmarManual.innerHTML = btnOriginal;
    btnConfirmarManual.disabled = false;
}

// Asignar evento al botón de confirmar dentro del modal
if (btnConfirmarManual) {
    btnConfirmarManual.addEventListener('click', confirmarGuardadoManual);
}

// --- 3. FUNCIÓN PREDECIR (IA) ---
// --- 3. FUNCIÓN PREDECIR (IA) ---
async function predecir() {
    const listCalientes = document.getElementById('list-calientes');
    const listFijos = document.getElementById('list-fijos');
    const listExplosivos = document.getElementById('list-explosivos');

    // Mostrar estado de carga en las 3 columnas
    [listCalientes, listFijos, listExplosivos].forEach(el => {
        if (el) el.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;"><i class="fas fa-circle-notch fa-spin"></i></div>';
    });

    try {
        const predicciones = await window.api.obtenerPrediccion();

        setTimeout(() => {
            renderizarResultados(predicciones);
        }, 800);

    } catch (error) {
        console.error("Error predecir:", error);
    }
}

// --- 4. RENDERIZADO DE RESULTADOS ---
// --- 4. RENDERIZADO DE RESULTADOS ---
function renderizarResultados(lista) {
    // Referencias a las columnas
    const listCalientes = document.getElementById('list-calientes');
    const listFijos = document.getElementById('list-fijos');
    const listExplosivos = document.getElementById('list-explosivos');

    // Limpiar
    if (listCalientes) listCalientes.innerHTML = '';
    if (listFijos) listFijos.innerHTML = '';
    if (listExplosivos) listExplosivos.innerHTML = '';

    // Guardar estado
    if (lista) localStorage.setItem('lotto_last_prediction', JSON.stringify(lista));

    if (!lista || lista.length === 0) {
        // Mensaje de vacío en cada columna
        const emptyMsg = '<div class="empty-placeholder">Sin datos</div>';
        if (listCalientes) listCalientes.innerHTML = emptyMsg;
        if (listFijos) listFijos.innerHTML = emptyMsg;
        if (listExplosivos) listExplosivos.innerHTML = emptyMsg;

        ultimasPrediccionesNombres = [];
        actualizarHighlightsHoy();
        return;
    }

    // Guardar nombres para resaltar coincidencias
    ultimasPrediccionesNombres = lista.map(item => item.animal);
    actualizarHighlightsHoy();

    // Agrupar y Renderizar
    const groups = {
        'calientes': { items: lista.filter(p => p.ranking <= 2), container: listCalientes },
        'fijos': { items: lista.filter(p => p.ranking >= 3 && p.ranking <= 4), container: listFijos },
        'explosivos': { items: lista.filter(p => p.ranking >= 5), container: listExplosivos }
    };

    for (const [key, group] of Object.entries(groups)) {
        if (!group.container) continue;

        if (group.items.length === 0) {
            group.container.innerHTML = '<div class="empty-placeholder">...</div>';
            continue;
        }

        group.items.forEach(item => {
            const icono = iconosAnimales[item.animal] || '🔮';

            let etiquetaTexto = "Baja";
            const prob = parseFloat(item.probabilidad);
            if (prob > 85) etiquetaTexto = "Muy Alta";
            else if (prob > 75) etiquetaTexto = "Alta";
            else if (prob > 50) etiquetaTexto = "Media";

            let badgeHorario = '';
            // if (item.esFuertePorHorario) ...

            const html = `
                <div class="prediction-card">
                    <div class="animal-info">
                        <span class="animal-icon">${icono}</span>
                        <div>
                            <span class="animal-name">${item.numero} - ${item.animal} ${badgeHorario}</span>
                            <span class="probability">${etiquetaTexto}</span>
                        </div>
                    </div>
                    <div class="percent-badge">${item.probabilidad}%</div>
                </div>
            `;
            group.container.innerHTML += html;
        });
    }
}

// --- 5. EVENTOS ---
if (btnAgregar) btnAgregar.addEventListener('click', abrirModalManual);
if (btnPredecir) btnPredecir.addEventListener('click', predecir);

// --- NUEVO: MODAL DE INFORMACIÓN ---
const modalInfo = document.getElementById('modal-info');
const infoBody = document.getElementById('info-body');
const infoLastUpdate = document.getElementById('info-last-update');

window.cerrarModalInfo = function () {
    modalInfo.style.display = 'none';
}

async function mostrarInfo() {
    modalInfo.style.display = 'flex';

    try {
        // Obtener conteo total de registros
        const resCount = await window.api.contarRegistros();
        const totalRegistros = resCount ? resCount.count : "0";

        // Obtener la fecha del último sorteo
        const resLast = await window.api.ultimoSorteo();
        const ultimoSorteo = resLast ? `${resLast.fecha} ${resLast.hora} - ${resLast.animal}` : "No hay datos";

        infoBody.innerText = `Actualmente hay ${totalRegistros} registros en la base de datos.`;
        infoLastUpdate.innerText = `Ultima actualizacion: ${ultimoSorteo}`;

    } catch (error) {
        infoBody.innerText = `Error al obtener información: ${error}`;
        infoLastUpdate.innerText = ``;
    }
}

// Asignar evento al botón de info
if (btnInfo) {
    btnInfo.addEventListener('click', mostrarInfo);
} else {
    console.error("⚠️ El botón .btn-info no se encontró en el HTML.");
}





// --- 6. MÓDULO DE ESTADÍSTICAS ---
const modalChart = document.getElementById('modal-chart');

// Función para abrir y mostrar tabla
async function abrirEstadisticas() {
    modalChart.style.display = 'flex';
    const container = modalChart.querySelector('.chart-container');

    // Limpiar y mostrar carga
    container.innerHTML = '<div style="color:white; text-align:center; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Calculando días sin salir...</div>';
    container.style.height = 'auto'; // Permitir que crezca

    try {
        // 1. Pedir datos al backend
        const datos = await window.api.obtenerEstadisticas();

        // 2. Generar HTML de la tabla
        let html = `
            <div class="stats-table-container">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Animalito</th>
                            <th>Última Fecha</th>
                            <th>Días sin salir</th>
                            <th>Probabilidad</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        datos.forEach(d => {
            const icono = iconosAnimales[d.animal] || '🎲';
            // Resaltar en rojo si lleva más de 10 días sin salir
            const badgeClass = d.dias_sin_salir > 10 ? 'days-badge-alert' : 'days-badge-ok';

            // Color para la probabilidad
            let colorProb = '#666';
            const valProb = parseFloat(d.probabilidad);
            if (valProb >= 10) colorProb = '#00ffaa'; // Alta (Verde)
            else if (valProb >= 5) colorProb = '#ffca28'; // Media (Amarillo)

            html += `
                <tr>
                    <td><b>${d.numero}</b></td>
                    <td><span style="font-size:1.2em">${icono}</span> ${d.animal}</td>
                    <td style="color:#aaa">${d.ultima_fecha}</td>
                    <td><span class="${badgeClass}">${d.dias_sin_salir} días</span></td>
                    <td style="color:${colorProb}; font-weight:bold;">${d.probabilidad}%</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        container.innerHTML = `<div style="color:#ff5555; text-align:center;">Error: ${error}</div>`;
    }
}

// Función para cerrar modal
function cerrarModal() {
    modalChart.style.display = 'none';
}

// Asignar al botón amarillo (.btn-chart)
document.querySelector('.btn-chart').addEventListener('click', abrirEstadisticas);

// --- 6.1 HISTORIAL DE SINCRONIZACIÓN ---
const modalHistory = document.getElementById('modal-sync-history');
const historyList = document.getElementById('sync-history-list');
const btnSearch = document.querySelector('.btn-search');
const btnBell = document.querySelector('.btn-bell');

window.cerrarModalHistory = function () {
    modalHistory.style.display = 'none';
}

async function abrirHistorial() {
    if (btnSearch) {
        btnSearch.classList.remove('has-notification'); // Limpiar notificación
        btnSearch.removeAttribute('data-count');
        notificationCount = 0;
        localStorage.setItem('lotto_notif_count', 0);
    }
    modalHistory.style.display = 'flex';
    historyList.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Cargando historial...</div>';

    try {
        const logs = await window.api.obtenerHistorialSync();
        historyList.innerHTML = '';

        if (logs.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; padding:20px;">No hay registros aún.</p>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            item.style.padding = '10px 0';

            // Formato del mensaje para que se vea bien (saltos de línea)
            const mensajeHtml = log.mensaje.replace(/\n/g, '<br>');

            item.innerHTML = `
                <div style="color: var(--neon-green); font-size: 11px; margin-bottom: 4px; font-weight:bold;">${log.fecha}</div>
                <div style="color: #eee; line-height: 1.4;">${mensajeHtml}</div>
            `;
            historyList.appendChild(item);
        });
    } catch (error) {
        historyList.innerHTML = `<p style="color:#ff5555; text-align:center;">Error: ${error}</p>`;
    }
}

if (btnSearch) btnSearch.addEventListener('click', abrirHistorial);

// --- 6.2 GESTIÓN DE NOTIFICACIONES ---
let notificacionesActivas = JSON.parse(localStorage.getItem('lotto_notif_active')) ?? true;

function updateBellUI() {
    if (!btnBell) return;
    if (notificacionesActivas) {
        btnBell.style.background = 'var(--neon-green)';
        btnBell.style.color = '#004d00';
        btnBell.innerHTML = '<i class="fas fa-bell"></i>';
        btnBell.title = "Notificaciones: ACTIVAS";
    } else {
        btnBell.style.background = '#ff5555';
        btnBell.style.color = 'white';
        btnBell.innerHTML = '<i class="fas fa-bell-slash"></i>';
        btnBell.title = "Notificaciones: DESACTIVADAS";
    }
}

if (btnBell) {
    btnBell.addEventListener('click', () => {
        notificacionesActivas = !notificacionesActivas;
        localStorage.setItem('lotto_notif_active', notificacionesActivas);
        updateBellUI();
    });
    updateBellUI();
}

// --- 6.3 RECORDATORIOS AUTOMÁTICOS ---
const btnTimer = document.querySelector('.btn-timer');
let recordatoriosActivos = JSON.parse(localStorage.getItem('lotto_reminders_active')) ?? true;

function updateTimerUI() {
    if (!btnTimer) return;
    if (recordatoriosActivos) {
        btnTimer.style.background = '#ec407a';
        btnTimer.style.opacity = '1';
        btnTimer.innerHTML = '<i class="fas fa-hourglass-half"></i>';
        btnTimer.title = "Recordatorios: ACTIVOS";
    } else {
        btnTimer.style.background = '#555'; // Gris para desactivado
        btnTimer.style.opacity = '0.7';
        btnTimer.innerHTML = '<i class="fas fa-hourglass-end"></i>';
        btnTimer.title = "Recordatorios: DESACTIVADOS";
    }
    // Enviar estado al proceso principal
    if (window.api && window.api.actualizarRecordatorios) {
        window.api.actualizarRecordatorios(recordatoriosActivos);
    }
}

if (btnTimer) {
    btnTimer.addEventListener('click', () => {
        recordatoriosActivos = !recordatoriosActivos;
        localStorage.setItem('lotto_reminders_active', recordatoriosActivos);
        updateTimerUI();
    });
    // Inicializar
    updateTimerUI();
}

// --- 7. SINCRONIZACIÓN WEB ---
const btnRefresh = document.querySelector('.btn-refresh');
const progressBar = document.createElement('div');

// --- NUEVO: Lógica del Modal de Mensajes ---
const modalMessage = document.getElementById('modal-message');
const msgIcon = document.getElementById('msg-icon');
const msgTitle = document.getElementById('msg-title');
const msgBody = document.getElementById('msg-body');


window.cerrarModalMensaje = function () {
    modalMessage.style.display = 'none';
}

function mostrarMensaje(titulo, texto, esError = false) {
    msgTitle.innerText = titulo;
    msgBody.innerText = texto;

    if (esError) {
        msgIcon.innerHTML = '<i class="fas fa-times-circle" style="font-size: 48px; color: #ff5555;"></i>';
        msgTitle.style.color = '#ff5555';
    } else {
        msgIcon.innerHTML = '<i class="fas fa-check-circle" style="font-size: 48px; color: var(--neon-green);"></i>';
        msgTitle.style.color = 'var(--neon-green)';
    }
    modalMessage.style.display = 'flex';
}

function lanzarConfeti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffca28', '#00ffaa', '#ffffff']
        });
    }
}

async function sincronizarDatos(esAutomatico = false) {
    // Si viene del evento click, esAutomatico será el evento (objeto), lo tratamos como false
    const isAuto = (esAutomatico === true);

    // Si es automático y estamos OFFLINE, no intentamos sincronizar
    if (isAuto && !navigator.onLine) return;

    // Animación de carga en el botón
    const iconoOriginal = btnRefresh.innerHTML;

    if (!isAuto) {
        btnRefresh.innerHTML = '<i class="fas fa-spin fa-sync"></i>';
        btnRefresh.disabled = true;

        // Crear barra de progreso y agregarla al botón
        progressBar.classList.add('progress-bar');
        progressBar.style.width = '0%';
        btnRefresh.appendChild(progressBar);

        //Simular progreso
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    }

    try {
        // Llamada al backend
        const mensaje = await window.api.sincronizarWeb();

        // Mostrar mensaje solo si es manual o (si es auto, hay nuevos datos Y las notificaciones están activas)
        if (!isAuto || (mensaje.includes("Nuevos") && notificacionesActivas)) {
            mostrarMensaje(isAuto ? '¡Nuevo Sorteo!' : '¡Sincronización Exitosa!', mensaje, false);
        }

        // Actualizar la lista de hoy
        actualizarResultadosHoy();

    } catch (error) {
        if (!isAuto) mostrarMensaje('Error de Conexión', error, true);
        else console.error("Error Auto-Sync:", error);
    } finally {
        // Restaurar botón
        if (!isAuto) {
            btnRefresh.innerHTML = iconoOriginal;
            btnRefresh.disabled = false;
            if (btnRefresh.contains(progressBar)) btnRefresh.removeChild(progressBar);
        }
    }
}

// Asignar al botón de recargar
if (btnRefresh) {
    btnRefresh.onclick = null; // Quitamos el onclick="location.reload()" que tenía en el HTML
    btnRefresh.addEventListener('click', sincronizarDatos);
} else {
    console.error("⚠️ El botón .btn-refresh no se encontró en el HTML.");
}

// Asignar al botón flotante (FAB)
const fabReload = document.getElementById('fab-reload');
if (fabReload) {
    fabReload.addEventListener('click', async () => {
        const icon = fabReload.querySelector('i');
        icon.classList.add('fa-spin'); // Iniciar rotación
        try {
            await sincronizarDatos(false);
        } finally {
            setTimeout(() => icon.classList.remove('fa-spin'), 500); // Parar rotación
        }
    });
}

// --- 8. FUNCIÓN PARA MOSTRAR RESULTADOS DE HOY ---
async function actualizarResultadosHoy() {
    if (!window.api) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fechaHoy = `${year}-${month}-${day}`;

    try {
        const resultados = await window.api.obtenerResultadosHoy(fechaHoy);
        if (todayResults) todayResults.innerHTML = ''; // Limpiar

        if (resultados.length === 0) {
            if (todayResults) todayResults.innerHTML = '<span style="color: #666; width: 100%; text-align: right; font-size: 12px;">Sin resultados hoy</span>';
            if (matchCounter) matchCounter.innerText = 'Aciertos Hoy: 0';
            ultimosAciertos = 0;
            return;
        }

        // Auto-seleccionar el último resultado (Logic updated)
        const ultimo = resultados[0];
        let valSelect = String(ultimo.numero);
        if (ultimo.numero === 0 && ultimo.animal.toLowerCase().includes('ballena')) valSelect = "00";

        let nuevoSorteoDetectado = false;
        const lastKnown = localStorage.getItem('lotto_last_animal');

        if (lastKnown !== valSelect) {
            localStorage.setItem('lotto_last_animal', valSelect);

            // Generar predicción automáticamente al detectar nuevo sorteo
            predecir();
            nuevoSorteoDetectado = true;
        }

        // Activar indicador en el botón de historial si hay nuevo sorteo
        if (nuevoSorteoDetectado && !primeraCarga) {
            notificationCount++;
            localStorage.setItem('lotto_notif_count', notificationCount);
            if (btnSearch) {
                btnSearch.classList.add('has-notification');
                btnSearch.setAttribute('data-count', notificationCount > 99 ? '99+' : notificationCount);
            }
        }

        let aciertos = 0;
        resultados.forEach(r => {
            const icono = iconosAnimales[r.animal] || '';

            // Verificar si coincide con la predicción actual
            const esMatch = ultimasPrediccionesNombres.includes(r.animal);
            const claseMatch = esMatch ? ' highlight-match' : '';
            if (esMatch) aciertos++;

            const div = document.createElement('div');
            div.className = 'result-mini-card' + claseMatch;
            div.innerHTML = `
                <span class="mini-time">${r.hora}</span>
                <span class="mini-badge">${r.numero}</span>
                <div style="font-size: 18px; margin: 2px 0;">${icono}</div>
                <span class="mini-animal">${r.animal}</span>
            `;
            if (todayResults) todayResults.appendChild(div);
        });

        if (aciertos > ultimosAciertos) {
            lanzarConfeti();
            // Sonido de Acierto (Si no es la carga inicial)
            if (notificacionesActivas && !primeraCarga) {
                audioMatch.currentTime = 0;
                audioMatch.play().catch(() => { });

                // Repetir el sonido una vez más cuando termine el primero
                const repetirSonido = () => {
                    audioMatch.currentTime = 0;
                    audioMatch.play().catch(() => { });
                    audioMatch.removeEventListener('ended', repetirSonido);
                };
                audioMatch.addEventListener('ended', repetirSonido);
            }
        } else if (nuevoSorteoDetectado) {
            // Sonido Normal de Nuevo Sorteo
            if (notificacionesActivas && !primeraCarga) {
                audioNotify.currentTime = 0;
                audioNotify.play().catch(() => { });
            }
        }
        ultimosAciertos = aciertos;
        primeraCarga = false;

        if (matchCounter) matchCounter.innerText = `Aciertos Hoy: ${aciertos}`;
    } catch (error) {
        console.error("Error actualizando hoy:", error);
    }
}

// Función auxiliar para actualizar resaltados sin recargar todo
function actualizarHighlightsHoy() {
    if (!todayResults) return;
    const cards = todayResults.querySelectorAll('.result-mini-card');
    let aciertos = 0;
    cards.forEach(card => {
        const nombre = card.querySelector('.mini-animal').innerText;
        if (ultimasPrediccionesNombres.includes(nombre)) {
            card.classList.add('highlight-match');
            aciertos++;
        } else {
            card.classList.remove('highlight-match');
        }
    });

    if (aciertos > ultimosAciertos) {
        lanzarConfeti();
    }
    ultimosAciertos = aciertos;

    if (matchCounter) matchCounter.innerText = `Aciertos Hoy: ${aciertos}`;
}

// --- 10. MONITOR DE CONEXIÓN ---
let isSupabaseConnected = true; // Estado inicial asumo conectado

// Escuchar eventos desde main.js
if (window.api && window.api.onSupabaseStatus) {
    window.api.onSupabaseStatus((data) => {
        isSupabaseConnected = data.connected;
        updateConnectionStatus(); // Refrescar UI
    });
}

function updateConnectionStatus() {
    if (navigator.onLine) {
        if (isSupabaseConnected) {
            statusBadge.className = "status-badge status-online";
            statusBadge.innerHTML = '<i class="fas fa-wifi"></i> ONLINE';
        } else {
            statusBadge.className = "status-badge status-warning";
            statusBadge.innerHTML = '<i class="fas fa-cloud-showers-heavy"></i> NUBE OFF';
            statusBadge.title = "Hay internet, pero falla la conexión a la base de datos.";
        }
    } else {
        statusBadge.className = "status-badge status-offline";
        statusBadge.innerHTML = '<i class="fas fa-wifi-slash"></i> OFFLINE';
    }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// --- 11. MODAL ACERCA DE ---
const modalAbout = document.getElementById('modal-about');
const btnAbout = document.querySelector('.btn-about');

window.cerrarModalAbout = function () {
    modalAbout.style.display = 'none';
}

if (btnAbout) {
    btnAbout.addEventListener('click', () => {
        modalAbout.style.display = 'flex';
    });
}

// --- 9. INICIALIZACIÓN Y PERSISTENCIA ---

// POLYFILL PARA WEB/MÓVIL (Supabase Directo)
if (!window.api) {
    console.log("⚠️ Modo Web Detectado: Inicializando Supabase fallback...");

    // Credenciales (Copiadas de supabase-config.js)
    const SB_URL = "https://ojmqvkzqwnexiellqlnj.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbXF2a3pxd25leGllbGxxbG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDU4NjUsImV4cCI6MjA4NjUyMTg2NX0.8mRvyiQ43dQH01aGdezVbV8LwfA9YWlY2sjEsGvQhAY";

    try {
        const _supabase = supabase.createClient(SB_URL, SB_KEY);

        window.api = {
            test: () => "Modo Web",
            guardarSorteo: async (datos) => {
                const { error } = await _supabase.from('sorteos').upsert(datos, { onConflict: 'fecha, hora' });
                if (error) throw error.message;
                return true;
            },
            obtenerResultadosHoy: async (fecha) => {
                // FIX: Si no llega fecha, usar la de hoy (Local)
                let queryDate = fecha;
                if (!queryDate) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    queryDate = `${year}-${month}-${day}`;
                }
                const { data, error } = await _supabase
                    .from('sorteos')
                    .select('*')
                    .eq('fecha', queryDate)
                    .order('hora', { ascending: true });
                if (error) { console.error(error); return []; }
                return data;
            },
            ultimoSorteo: async () => {
                const { data, error } = await _supabase
                    .from('sorteos')
                    .select('*')
                    .order('fecha', { ascending: false })
                    .order('hora', { ascending: false })
                    .limit(1);
                return (data && data.length > 0) ? data[0] : null;
            },
            contarRegistros: async () => {
                const { count } = await _supabase.from('sorteos').select('*', { count: 'exact', head: true });
                return { count: count || 0 };
            },
            // Predicción Sincronizada (Desde BD escritorio)
            obtenerPrediccion: async () => {
                const { data, error } = await _supabase
                    .from('predicciones')
                    .select('*')
                    .order('ranking', { ascending: true });

                if (error) { console.error(error); return []; }
                if (!data || data.length === 0) return [];

                // Mapear a formato UI y conservar ranking
                return data.map(p => ({
                    animal: p.animal,
                    numero: p.numero,
                    probabilidad: p.probabilidad,
                    veces: 0,
                    esFuertePorHorario: false,
                    ranking: p.ranking // Importante para agrupar
                }));
            },
            obtenerEstadisticas: async () => {
                // FIX: Habilitar descarga de estadísticas
                const { data, error } = await _supabase
                    .from('estadisticas')
                    .select('*')
                    .order('dias_sin_salir', { ascending: false })
                    .limit(15);
                if (error) { console.error(error); return []; }
                return data;
            },
            sincronizarWeb: async () => "Sincronización solo disponible en Escritorio.",
            obtenerHistorialSync: async () => [],
            actualizarRecordatorios: async () => { }
        };

        console.log("✅ API Web (Supabase) inyectada correctamente.");

        // Eliminar splash screen manualmente por si acaso
        setTimeout(() => {
            const loading = document.querySelector('.loading-text');
            if (loading) loading.style.display = 'none';
        }, 1000);

    } catch (e) {
        console.error("Error iniciando Supabase Web:", e);
    }
}

(async function init() {
    // 1. Restaurar último animal seleccionado (Ya no necesario)
    // const savedAnimal = localStorage.getItem('lotto_last_animal');

    // 2. Restaurar última predicción mostrada
    const savedPrediction = localStorage.getItem('lotto_last_prediction');
    if (savedPrediction) {
        try { renderizarResultados(JSON.parse(savedPrediction)); } catch (e) { }
    }

    // 3. Cargar datos de hoy
    actualizarResultadosHoy();

    // 4. Verificar conexión inicial
    updateConnectionStatus();

    // 5. Sincronización Automática (Cada 10 minutos)
    setInterval(() => sincronizarDatos(true), 600000);

    // 6. Restaurar contador visual de notificaciones
    if (notificationCount > 0 && btnSearch) {
        btnSearch.classList.add('has-notification');
        btnSearch.setAttribute('data-count', notificationCount > 99 ? '99+' : notificationCount);
    }

    // 7. FALLBACK PARA WEB/MÓVIL (Evitar que se quede en Splash)
    // Si no existe window.api (estamos en un teléfono), forzamos ocultar el splash
    if (!window.api) {
        console.log("Modo Web detectado: Forzando inicio de UI.");
        setTimeout(() => {
            // Intenta encontrar el splash por ID común o clase. Ajusta 'splash' al ID real de tu index.html
            const splash = document.getElementById('splash') || document.getElementById('loader') || document.querySelector('.splash');
            if (splash) splash.style.display = 'none';
        }, 3000); // Espera 3 segundos y lo quita a la fuerza
    }
})();