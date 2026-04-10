// ==========================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================

// Base de datos en memoria de pedidos cargados desde Excel
let db = [];

// Objeto de sesión que almacena información del cliente actual y pedidos escaneados
let session = {
    client: null,    // Nombre del cliente
    addr: null,      // Dirección de entrega
    city: null,      // Ciudad
    depto: null,     // Departamento
    phone: null,     // Teléfono de contacto
    orders: []       // Array de IDs de pedidos asociados
};

// Registro histórico del turno (se sincroniza con el backend al imprimir)
let dailyLog = [];

// ==========================================
// BASE DE DATOS GEOGRÁFICA
// ==========================================
// Mapeo de ciudades a departamentos para autocompletar información geográfica
// Esta base de datos se utiliza cuando el Excel no incluye el departamento
const GEO_DB = {
    "EL ENCANTO": "AMAZONAS",
    "LETICIA": "AMAZONAS",
    "MEDELLÍN": "ANTIOQUIA",
    "BOGOTÁ D.C.": "BOGOTÁ D.C.",
    "CALI": "VALLE DEL CAUCA",
    "BARRANQUILLA": "ATLÁNTICO",
    "CARTAGENA": "BOLIVAR",
    // ... (El resto de tu lista completa va aquí, el código V20 ya la tenía) ...
    "CUMARIBO": "VICHADA" // Ejemplo final
};

/**
 * Busca el departamento correspondiente a una ciudad en la base de datos geográfica
 * @param {string} city - Nombre de la ciudad a buscar
 * @returns {string} Nombre del departamento o cadena vacía si no se encuentra
 */
function getDepto(city) {
    return GEO_DB[city] || "";
}

/**
 * Función de inicialización que se ejecuta al cargar la página
 * - Verifica la disponibilidad de librerías externas
 * - Actualiza el ID de etiqueta siguiente
 * - Configura el listener para el evento Enter en el campo de PIN
 */
window.onload = () => {
    if (typeof XLSX === 'undefined') {
        alert('⚠️ Sin conexión a internet. Las librerías no cargaron correctamente.');
    }
    updateNextID();
};


/**
 * Maneja la carga del archivo Excel seleccionado por el usuario
 * Lee el archivo, lo convierte a formato JSON y carga los datos en la base de datos
 * @param {HTMLInputElement} input - Elemento input de tipo file
 */
function handleFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    
    // Manejo de error si el archivo está abierto o bloqueado
    reader.onerror = function(ex) {
        alert("ERROR: No se pudo leer el archivo. Cierra el Excel.");
    };
    
    // Procesamiento del archivo una vez cargado
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, {
                type: 'array'
            });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws, {
                header: 1  // Lee como array de arrays sin encabezados
            });
            if (!json || json.length === 0) throw new Error("Archivo vacío");
            loadDB(json, true);
            document.getElementById('dataTime').textContent = "Cargado: " + new Date().toLocaleTimeString();
        } catch (err) {
            alert("ERROR DE FORMATO: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';  // Limpia el input para permitir cargar el mismo archivo nuevamente
}

/**
 * Carga los datos del Excel en la base de datos en memoria
 * Procesa cada fila extrayendo información de pedidos y clientes
 * Intenta auto-completar el departamento usando la base de datos geográfica
 * @param {Array} json - Array de arrays con los datos del Excel
 * @param {boolean} alertUser - Si debe mostrar alertas al usuario sobre el resultado
 * 
 * Estructura esperada del Excel (por índice de columna):
 * [1] = Número de Pedido
 * [2] = Cliente
 * [3] = Dirección
 * [4] = Ciudad
 * [6] = Departamento (opcional, se autocompleta si está vacío)
 * [9] = Teléfono
 */
function loadDB(json, alertUser) {
    db = [];
    let count = 0;
    json.forEach(row => {
        if (row.length > 4) {
            const p = row[1] ? String(row[1]).trim() : "";
            const c = row[2] ? String(row[2]).trim() : "";
            
            // Filtrar filas válidas (con pedido y cliente, excluyendo encabezados)
            if (p && c && !p.toUpperCase().includes('PEDIDO')) {
                let rawCity = row[4] ? String(row[4]).trim() : "";
                // Intenta obtener el depto de la columna G, si no existe lo busca en GEO_DB
                let depto = row[6] ? String(row[6]).trim() : (GEO_DB[rawCity.toUpperCase()] || "");

                db.push({
                    id: p,
                    client: c,
                    addr: row[3] ? String(row[3]).trim() : "",
                    city: rawCity,
                    depto: depto,
                    tel: row[9] ? String(row[9]).trim() : ""
                });
                count++;
            }
        }
    });
    
    // Habilitar el campo de escaneo si se cargaron pedidos exitosamente
    if (count > 0) {
        document.getElementById('scanInput').disabled = false;
        document.getElementById('scanInput').focus();
        if (alertUser) alert(`✅ ÉXITO: ${count} pedidos cargados.`);
    } else if (alertUser) {
        alert("⚠️ Archivo sin pedidos válidos.");
    }
}

/**
 * Maneja el evento de presionar Enter en el campo de escaneo
 * @param {KeyboardEvent} e - Evento del teclado
 */
function handleEnter(e) {
    if (e.key === 'Enter') {
        scanOrder(e.target.value.trim());
        e.target.select();  // Selecciona el texto para facilitar el siguiente escaneo
    }
}

/**
 * Procesa el código de pedido escaneado
 * Valida que:
 * - El pedido exista en la base de datos
 * - Si ya hay pedidos en la sesión, el nuevo pedido sea del mismo cliente y dirección
 * - El pedido no haya sido escaneado previamente
 * Si es el primer pedido, inicia una nueva sesión con los datos del cliente
 * @param {string} code - Código del pedido escaneado
 */
function scanOrder(code) {
    if (!code) return;
    
    // Buscar el pedido en la base de datos
    const found = db.find(r => r.id == code);
    if (!found) {
        alert(`⚠ PEDIDO ${code} NO ENCONTRADO`);
        return;
    }
    
    // Validar que todos los pedidos sean del mismo cliente y dirección
    if (session.orders.length > 0) {
        if (found.client !== session.client || found.addr !== session.addr) {
            alert(`⛔ ERROR: CLIENTE DIFERENTE`);
            return;
        }
    }
    
    // Evitar duplicados
    if (session.orders.includes(found.id)) return;
    
    // Si es el primer pedido, inicializar la sesión
    if (session.orders.length === 0) {
        session.client = found.client;
        session.addr = found.addr;
        session.city = found.city;
        session.depto = found.depto;
        session.phone = found.tel;
        enableControls();
    }
    
    // Agregar pedido a la sesión y actualizar UI
    session.orders.push(found.id);
    renderList();
    updateUI();
    
    // Feedback visual de escaneo exitoso
    const inp = document.getElementById('scanInput');
    inp.classList.add('scan-success');
    setTimeout(() => inp.classList.remove('scan-success'), 300);
}

/**
 * Renderiza la lista de pedidos escaneados en la interfaz
 * Muestra los pedidos en orden inverso (más reciente primero)
 */
function renderList() {
    const list = document.getElementById('scanList');
    list.innerHTML = session.orders.slice().reverse().map(o => `<div class="flex justify-between bg-white border border-green-200 p-1 rounded text-xs shadow-sm"><span class="font-bold text-gray-700">📦 ${o}</span><span class="text-green-600">OK</span></div>`).join('');
}

// ==========================================
// LÓGICA DE EMPAQUE (CAJAS Y ESTIBAS)
// ==========================================

/**
 * Actualiza el modo de empaque según la selección del usuario (CAJA o ESTIBA)
 * Si el modo es ESTIBA, genera inputs dinámicos para ingresar la cantidad de cajas por estiba
 * Si el modo es CAJA, oculta los inputs de estiba
 */
function updatePackMode() {
    const type = document.querySelector('input[name="packType"]:checked').value;
    const container = document.getElementById('estibaInputsContainer');
    const qtyLabel = document.getElementById('qtyLabel');
    const lblType = document.getElementById('lbl-type-text');
    const lblInternal = document.getElementById('lbl-internal-box');

    if (type === 'estiba') {
        container.classList.remove('hidden');
        container.classList.add('flex');
        qtyLabel.textContent = "Total Estibas";
        lblType.textContent = "ESTIBA";
        lblInternal.classList.remove('hidden');
        renderEstibaInputs(); // Generar campos dinámicos
    } else {
        container.classList.add('hidden');
        container.classList.remove('flex');
        qtyLabel.textContent = "Total Cajas";
        lblType.textContent = "CAJA";
        lblInternal.classList.add('hidden');
    }
    updatePreview();
}

/**
 * Genera dinámicamente los campos de entrada para cada estiba
 * Crea un input por cada estiba donde el usuario puede ingresar cuántas cajas contiene
 * Preserva los valores ingresados previamente al redibujar (útil cuando aumenta la cantidad)
 */
function renderEstibaInputs() {
    const qty = parseInt(document.getElementById('boxQty').value) || 1;
    const container = document.getElementById('estibaInputsContainer');

    // Guardar valores previos para no perderlos al redibujar
    const prevValues = {};
    const existingInputs = container.querySelectorAll('input');
    existingInputs.forEach(inp => {
        prevValues[inp.id] = inp.value;
    });

    container.innerHTML = '';

    // Crear un input por cada estiba
    for (let i = 1; i <= qty; i++) {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2 bg-blue-100 p-1 rounded estiba-input-row";

        const inputId = `estiba_count_${i}`;
        const val = prevValues[inputId] || ""; // Recuperar valor previo o dejar vacío

        div.innerHTML = `
            <span class="text-[10px] font-bold text-blue-800 w-14">Estiba ${i}:</span>
            <input type="number" id="${inputId}" value="${val}" class="w-full bg-white border border-blue-300 rounded px-1 text-center text-sm font-bold text-blue-900 outline-none focus:ring-1 focus:ring-blue-500" placeholder="# Cajas" oninput="if(this.value=='') this.value=0; updatePreview()">
        `;
        container.appendChild(div);
    }
}

/**
 * Limpia la sesión actual y reinicia todos los controles
 * Solicita confirmación al usuario antes de proceder
 * Resetea todos los campos y controles a su estado inicial
 */
function clearSession() {
    if (confirm("¿Terminar este cliente?")) {
        // Reiniciar objeto de sesión
        session = {
            client: null,
            addr: null,
            city: null,
            depto: null,
            phone: null,
            orders: []
        };
        
        // Limpiar interfaz
        document.getElementById('scanList').innerHTML = '';
        document.getElementById('scanInput').value = '';
        document.getElementById('scanInput').focus();
        document.getElementById('lbl-client').textContent = "---";
        document.getElementById('lbl-address').textContent = "---";
        document.getElementById('lbl-city').textContent = "---";
        document.getElementById('lbl-depto').textContent = "---";
        document.getElementById('lbl-phone').textContent = "---";
        document.getElementById('lbl-orders').textContent = "---";

        // Resetear controles de empaque
        document.querySelector('input[name="packType"][value="caja"]').checked = true;
        updatePackMode(); // Limpia los inputs de estiba
        document.getElementById('boxQty').value = 1;

        // Deshabilitar controles hasta que se escanee un pedido
        document.getElementById('boxControl').classList.add('opacity-50', 'pointer-events-none');
        document.getElementById('printBtn').classList.add('opacity-50', 'pointer-events-none');
        updatePreview();
        updateNextID();
    }
}

/**
 * Habilita los controles de empaque e impresión
 * Se llama cuando se escanea el primer pedido de una sesión
 */
function enableControls() {
    document.getElementById('boxControl').classList.remove('opacity-50', 'pointer-events-none');
    document.getElementById('printBtn').classList.remove('opacity-50', 'pointer-events-none');
}

/**
 * Actualiza la interfaz con los datos del cliente actual
 * Muestra: cliente, dirección, ciudad, departamento, teléfono y pedidos asociados
 */
function updateUI() {
    document.getElementById('lbl-client').textContent = session.client;
    document.getElementById('lbl-address').textContent = session.addr;
    document.getElementById('lbl-city').textContent = session.city;
    document.getElementById('lbl-depto').textContent = session.depto;
    document.getElementById('lbl-phone').textContent = session.phone;
    document.getElementById('lbl-orders').textContent = session.orders.join(', ');
}

/**
 * Modifica la cantidad de cajas/estibas
 * @param {number} n - Número a sumar o restar (positivo o negativo)
 * Asegura que la cantidad mínima sea 1
 * Si está en modo estiba, regenera los inputs para cada estiba
 */
function modBox(n) {
    const inp = document.getElementById('boxQty');
    let v = parseInt(inp.value) || 1;
    v = Math.max(1, v + n);  // No permitir valores menores a 1
    inp.value = v;

    // Si está en modo estiba, regenerar inputs para la nueva cantidad
    const type = document.querySelector('input[name="packType"]:checked').value;
    if (type === 'estiba') {
        renderEstibaInputs();
    }
    updatePreview();
}

/**
 * Actualiza la vista previa de la etiqueta con los valores actuales
 * Muestra el total de cajas/estibas y el número de cajas de la primera estiba si aplica
 */
function updatePreview() {
    document.getElementById('lbl-total').textContent = document.getElementById('boxQty').value;
    
    // Si está en modo estiba, mostrar la cantidad de cajas de la primera estiba
    const firstEstibaInput = document.getElementById('estiba_count_1');
    if (firstEstibaInput && !firstEstibaInput.closest('.hidden')) {
        document.getElementById('lbl-internal-val').textContent = firstEstibaInput.value || "--";
    }
}

// Caché de secuencia traída del backend
let _secuenciaCache = null;

/**
 * Obtiene la secuencia del día desde el backend (con caché local).
 */
async function fetchSecuencia() {
    if (!_secuenciaCache) {
        _secuenciaCache = await api.getSecuencia();
    }
    return _secuenciaCache;
}

/**
 * Actualiza la vista previa del siguiente ID de empaque y genera su código de barras.
 */
async function updateNextID() {
    try {
        const seq = await fetchSecuencia();
        document.getElementById('lbl-id').textContent = seq.siguiente_codigo;
        JsBarcode("#bcPreview", seq.siguiente_codigo, {
            format: "CODE128",
            width: 1.5,
            height: 30,
            displayValue: false,
            margin: 0
        });
    } catch (e) {
        console.warn("Sin conexión al backend, usando modo offline");
    }
}

/**
 * Genera e imprime las etiquetas de empaque.
 * Los códigos los asigna el backend para garantizar secuencia sin colisiones.
 */
async function printLabels() {
    const total = parseInt(document.getElementById('boxQty').value);
    const packType = document.querySelector('input[name="packType"]:checked').value;
    const typeLabel = packType === 'estiba' ? 'ESTIBA' : 'CAJA';

    // Construir el payload para el backend
    const payload = [];
    for (let i = 1; i <= total; i++) {
        let cajasInternas = null;
        if (packType === 'estiba') {
            const inputEl = document.getElementById(`estiba_count_${i}`);
            cajasInternas = inputEl ? parseInt(inputEl.value || "0") : 0;
        }
        payload.push({
            tipo_empaque: typeLabel,
            numero_caja: i,
            total_cajas: total,
            cajas_internas: cajasInternas,
            pedidos_asociados: session.orders.join(', '),
            cliente: session.client,
            direccion: session.addr,
            ciudad: session.city,
            departamento: session.depto,
            telefono: session.phone,
        });
    }

    let empaques;
    try {
        empaques = await api.registrarEmpaques(payload);
        _secuenciaCache = null; // Invalidar caché para la próxima impresión
    } catch (err) {
        alert("Error al registrar empaques: " + err.message);
        return;
    }

    // Renderizar etiquetas con los códigos asignados por el backend
    const queue = document.getElementById('finalPrintQueue');
    queue.innerHTML = '';

    empaques.forEach((emp, idx) => {
        const i = idx + 1;
        const id = emp.codigo_empaque;
        let internalHtml = '';

        if (packType === 'estiba' && emp.cajas_internas != null) {
            internalHtml = `<div style="margin-top:4px; font-size:14px; font-weight:900; border-top:2px solid black;"># CAJAS: ${emp.cajas_internas}</div>`;
        }

        const div = document.createElement('div');
        div.className = 'print-page';
        div.innerHTML = `<div class="label-container"><div class="info-section"><div class="data-row"><div class="field-label">CLIENTE:</div><div class="field-value huge">${session.client}</div></div><div class="data-row"><div class="field-label">DIRECCIÓN:</div><div class="field-value address">${session.addr}</div></div><div class="location-row"><div class="loc-col border-r" style="width: 35%;"><div class="field-label">CIUDAD:</div><div class="field-value">${session.city}</div></div><div class="loc-col border-r" style="width: 35%;"><div class="field-label">DEPTO:</div><div class="field-value">${session.depto}</div></div><div class="loc-col" style="width: 30%;"><div class="field-label">TEL:</div><div class="field-value">${session.phone}</div></div></div></div><div class="orders-row"><div class="orders-content"><div class="field-label">PEDIDOS ASOCIADOS:</div><div class="orders-value">${session.orders.join(', ')}</div></div><div style="text-align:center;"><div class="field-label" style="margin-bottom:2px;">${typeLabel}</div><div class="box-indicator">${i}/${total}</div>${internalHtml}</div></div><div class="footer-zone"><div class="barcode-area"><svg class="bc-${id}"></svg><div class="barcode-text">${id}</div></div><div class="logos-area"><img src="BRAKEPAKlogo.png" class="logo-img"><img src="LOGIMAT PNG.png" class="logo-img" style="margin-top:2mm;"></div></div></div>`;
        queue.appendChild(div);

        JsBarcode(div.querySelector(`.bc-${id}`), id, {
            format: "CODE128", width: 1.5, height: 30, displayValue: false, margin: 0
        });

        dailyLog.push({ id, pedido: session.orders.join(', '), cliente: session.client, tipo_empaque: typeLabel });
    });

    window.print();
    setTimeout(() => clearSession(), 500);
}

/**
 * Descarga el registro del turno actual como CSV.
 * Los datos vienen del backend (todos los empaques del día del usuario).
 */
async function downloadDailyLog() {
    let registros;
    try {
        registros = await api.getEmpaquesTurno();
    } catch (e) {
        alert("Error al obtener el reporte: " + e.message);
        return;
    }

    if (!registros || registros.length === 0) return alert("Sin registros en este turno.");

    let csv = "NUMERO EMPAQUE,FECHA Y HORA,PEDIDO,CLIENTE,TIPO,CAJA\n";
    registros.forEach(r => {
        const pClean = (r.pedidos_asociados || "").replace(/,/g, ' / ');
        const cClean = (r.cliente || "").replace(/,/g, ' ');
        csv += `${r.codigo_empaque},"${r.fecha_hora}","${pClean}","${cClean}","${r.tipo_empaque}","${r.numero_caja}/${r.total_cajas}"\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = `DTEMPQ_TURNO_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}