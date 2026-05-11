// ============================================================
// unidades_empaque.js — Módulo de Catálogo de UE (BRAKEPAK)
// ============================================================

const LIMIT = 50;
let currentPage = 1;
let totalPages = 1;
let editingId = null;
let _searchTimer = null;

// ── TOAST ────────────────────────────────────────────────────

function showUeToast(msg, type = 'success') {
    const el = document.getElementById('ue-toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[60] shadow-xl rounded-lg px-4 py-2 text-sm font-bold text-white pointer-events-none max-w-[90vw] ${
        type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-amber-500' : 'bg-green-600'
    }`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── CARGA Y TABLA ─────────────────────────────────────────────

async function loadPage(page = 1) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    const q = document.getElementById('search-input').value.trim();
    showSkeleton();
    try {
        const data = await api.getUnidadesEmpaque({ q, page, limit: LIMIT });
        totalPages = data.pages;
        renderTable(data.items);
        renderPagination(data);
    } catch (e) {
        document.getElementById('tabla-ue').innerHTML =
            `<tr><td colspan="5" class="text-center text-red-400 py-8">${e.message || 'Error al cargar'}</td></tr>`;
        document.getElementById('pagination').classList.add('hidden');
    }
}

function showSkeleton() {
    const rows = Array.from({ length: 5 }, () =>
        `<tr class="border-b border-slate-100">
            ${Array.from({ length: 5 }, () =>
                `<td class="py-3 px-3"><div class="skeleton h-4 w-full"></div></td>`
            ).join('')}
        </tr>`
    ).join('');
    document.getElementById('tabla-ue').innerHTML = rows;
}

function renderTable(items) {
    const tbody = document.getElementById('tabla-ue');
    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-slate-400 py-10">
            Sin referencias. Importa un Excel o añade una manualmente.</td></tr>`;
        document.getElementById('pagination').classList.add('hidden');
        document.getElementById('total-counter').classList.add('hidden');
        return;
    }
    tbody.innerHTML = items.map(p => {
        const badgeClass = p.unidad_empaque > 1 ? 'badge-ue-ok' : 'badge-ue-gray';
        const fecha = p.fecha_actualizacion
            ? new Date(p.fecha_actualizacion).toLocaleDateString()
            : '—';
        return `<tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="py-3 px-3 font-mono font-bold text-slate-800">${escapeHtml(p.referencia)}</td>
            <td class="py-3 px-3 text-center">
                <span class="inline-block px-2 py-0.5 rounded-full text-xs ${badgeClass}">${p.unidad_empaque}</span>
            </td>
            <td class="py-3 px-3 text-slate-500 text-xs">${escapeHtml(p.texto_unidad_empaque || '—')}</td>
            <td class="py-3 px-3 text-right text-xs text-slate-400">${fecha}</td>
            <td class="py-3 px-3 text-center">
                <button onclick='openEditModal(${JSON.stringify(p)})'
                        class="text-slate-300 hover:text-red-600 transition-colors" title="Editar">
                    <i class="fa-solid fa-pen text-xs"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function renderPagination(data) {
    const pag = document.getElementById('pagination');
    const counter = document.getElementById('total-counter');
    pag.classList.remove('hidden');
    counter.classList.remove('hidden');

    const from = (data.page - 1) * LIMIT + 1;
    const to = Math.min(data.page * LIMIT, data.total);
    document.getElementById('pag-info').textContent = `Mostrando ${from}–${to} de ${data.total}`;
    document.getElementById('pag-pages').textContent = `Página ${data.page} de ${data.pages}`;
    counter.textContent = `${data.total} referencias`;

    document.getElementById('btn-prev').disabled = data.page <= 1;
    document.getElementById('btn-next').disabled = data.page >= data.pages;
}

// ── BÚSQUEDA ─────────────────────────────────────────────────

function debouncedSearch() {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => loadPage(1), 300);
}

// ── MODAL AÑADIR / EDITAR ─────────────────────────────────────

function openAddModal() {
    editingId = null;
    document.getElementById('modal-titulo').textContent = 'NUEVA REFERENCIA';
    document.getElementById('field-referencia').value = '';
    document.getElementById('field-referencia').disabled = false;
    document.getElementById('field-ue').value = '';
    document.getElementById('field-texto').value = '';
    document.getElementById('delete-zone').classList.add('hidden');
    clearErrors();
    document.getElementById('modal-ue').classList.remove('hidden');
    setTimeout(() => document.getElementById('field-referencia').focus(), 50);
}

function openEditModal(p) {
    editingId = p.id;
    document.getElementById('modal-titulo').textContent = 'EDITAR REFERENCIA';
    document.getElementById('field-referencia').value = p.referencia;
    document.getElementById('field-referencia').disabled = true;
    document.getElementById('field-ue').value = p.unidad_empaque;
    document.getElementById('field-texto').value = p.texto_unidad_empaque || '';
    document.getElementById('delete-zone').classList.remove('hidden');
    clearErrors();
    document.getElementById('modal-ue').classList.remove('hidden');
    setTimeout(() => document.getElementById('field-ue').focus(), 50);
}

function closeModal() {
    document.getElementById('modal-ue').classList.add('hidden');
    editingId = null;
}

function clearErrors() {
    ['referencia', 'ue'].forEach(f => {
        const el = document.getElementById(`err-${f}`);
        if (el) { el.textContent = ''; el.classList.add('hidden'); }
    });
}

function showFieldError(field, msg) {
    const el = document.getElementById(`err-${field}`);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
}

async function submitModal() {
    clearErrors();
    const ue = parseInt(document.getElementById('field-ue').value);
    const texto = document.getElementById('field-texto').value.trim();

    let valid = true;
    if (!editingId) {
        const ref = document.getElementById('field-referencia').value.trim();
        if (!ref) { showFieldError('referencia', 'La referencia es obligatoria'); valid = false; }
    }
    if (!ue || ue < 1) { showFieldError('ue', 'Debe ser un número entero ≥ 1'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        if (editingId) {
            await api.updateProductoUe(editingId, {
                unidad_empaque: ue,
                texto_unidad_empaque: texto || null,
            });
            showUeToast('Referencia actualizada');
        } else {
            const ref = document.getElementById('field-referencia').value.trim().toUpperCase();
            await api.createProductoUe({
                referencia: ref,
                unidad_empaque: ue,
                texto_unidad_empaque: texto || null,
            });
            showUeToast('Referencia creada');
        }
        closeModal();
        loadPage(currentPage);
    } catch (e) {
        if (e.message && e.message.includes('ya existe')) {
            showFieldError('referencia', 'Esta referencia ya existe');
        } else {
            showUeToast(e.message || 'Error al guardar', 'error');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'GUARDAR';
    }
}

async function confirmDelete() {
    if (!editingId) return;
    if (!confirm('¿Eliminar esta referencia del catálogo? Esta acción no se puede deshacer.')) return;
    try {
        await api.deleteProductoUe(editingId);
        showUeToast('Referencia eliminada');
        closeModal();
        loadPage(currentPage > 1 && document.querySelectorAll('#tabla-ue tr').length <= 1
            ? currentPage - 1 : currentPage);
    } catch (e) {
        if (e.status === 409) {
            showUeToast('No se puede eliminar: tiene pedidos activos', 'error');
        } else {
            showUeToast(e.message || 'Error al eliminar', 'error');
        }
    }
}

// ── IMPORT ───────────────────────────────────────────────────

let _importParsedRows = [];
let _importErrors = [];

function openImportModal() {
    _importParsedRows = [];
    _importErrors = [];
    resetImportSteps();
    document.getElementById('import-file-input').value = '';
    document.getElementById('import-validation').classList.add('hidden');
    document.getElementById('import-file-error').classList.add('hidden');
    document.getElementById('btn-do-import').disabled = true;
    document.getElementById('modal-import').classList.remove('hidden');
}

function closeImportModal() {
    document.getElementById('modal-import').classList.add('hidden');
    _importParsedRows = [];
    _importErrors = [];
}

function resetImportSteps() {
    document.getElementById('import-step-1').classList.remove('hidden');
    document.getElementById('import-step-2').classList.add('hidden');
    document.getElementById('import-step-3').classList.add('hidden');
}

function handleFileSelect(file) {
    if (!file) return;
    const errEl = document.getElementById('import-file-error');
    const valEl = document.getElementById('import-validation');
    errEl.classList.add('hidden');
    valEl.classList.add('hidden');
    document.getElementById('btn-do-import').disabled = true;
    _importParsedRows = [];

    if (file.size > 10 * 1024 * 1024) {
        errEl.textContent = 'El archivo supera el límite de 10 MB.';
        errEl.classList.remove('hidden');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(e.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (!raw.length) throw new Error('El archivo está vacío.');
            parseImportHeaders(raw);
        } catch (err) {
            errEl.textContent = err.message || 'No se pudo leer el archivo.';
            errEl.classList.remove('hidden');
        }
    };
    reader.readAsBinaryString(file);
}

function parseImportHeaders(raw) {
    const headers = (raw[0] || []).map(h => String(h || '').trim().toLowerCase());
    const idxRef = headers.findIndex(h => ['referencia', 'ref'].includes(h));
    const idxUe  = headers.findIndex(h => ['ue', 'unidad_empaque', 'unidad de empaque'].includes(h));
    const idxTxt = headers.findIndex(h => ['texto', 'texto_unidad_empaque', 'texto ue'].includes(h));

    const ok = (found) => found !== -1
        ? '<i class="fa-solid fa-check text-green-500"></i>'
        : '<i class="fa-solid fa-xmark text-red-500"></i>';

    document.getElementById('import-val-ref').innerHTML  = `${ok(idxRef)} Columna "Referencia"`;
    document.getElementById('import-val-ue').innerHTML   = `${ok(idxUe)}  Columna "UE"`;

    const valEl = document.getElementById('import-validation');
    valEl.classList.remove('hidden');

    if (idxRef === -1 || idxUe === -1) {
        document.getElementById('import-file-error').textContent =
            "Verifica que el archivo tenga columnas 'Referencia' y 'UE'.";
        document.getElementById('import-file-error').classList.remove('hidden');
        return;
    }

    // Construir filas
    _importParsedRows = raw.slice(1)
        .filter(row => row[idxRef] != null || row[idxUe] != null)
        .map(row => ({
            referencia: row[idxRef],
            unidad_empaque: row[idxUe],
            texto: idxTxt !== -1 ? (row[idxTxt] || '') : '',
        }));

    document.getElementById('import-val-rows').textContent =
        `→ ${_importParsedRows.length} filas detectadas`;
    document.getElementById('btn-do-import').disabled = _importParsedRows.length === 0;
}

async function submitImport() {
    if (!_importParsedRows.length) return;
    // Mostrar paso 2
    document.getElementById('import-step-1').classList.add('hidden');
    document.getElementById('import-step-2').classList.remove('hidden');

    const file = document.getElementById('import-file-input').files[0];
    const formData = new FormData();
    formData.append('file', file);

    // Simular progreso mientras el backend procesa
    let pct = 0;
    const progBar = document.getElementById('import-progress-bar');
    const progText = document.getElementById('import-progress-text');
    const total = _importParsedRows.length;

    const ticker = setInterval(() => {
        if (pct < 85) { pct += 3; }
        progBar.style.width = pct + '%';
        progText.textContent = `Procesando... ${Math.round(pct * total / 100)} / ${total} filas estimadas`;
    }, 300);

    try {
        const result = await api.importUnidadesEmpaque(formData);
        clearInterval(ticker);
        progBar.style.width = '100%';
        _importErrors = result.errores || [];
        showImportResult(result);
    } catch (e) {
        clearInterval(ticker);
        document.getElementById('import-step-2').classList.add('hidden');
        document.getElementById('import-step-1').classList.remove('hidden');
        document.getElementById('import-file-error').textContent = e.message || 'Error al importar.';
        document.getElementById('import-file-error').classList.remove('hidden');
    }
}

function showImportResult(result) {
    document.getElementById('import-step-2').classList.add('hidden');
    document.getElementById('import-step-3').classList.remove('hidden');
    document.getElementById('res-actualizadas').textContent = result.actualizadas;
    document.getElementById('res-creadas').textContent = result.creadas;
    document.getElementById('res-errores').textContent = result.errores.length;

    const errDetail = document.getElementById('res-errors-detail');
    if (result.errores.length > 0) {
        errDetail.classList.remove('hidden');
    } else {
        errDetail.classList.add('hidden');
    }
    // Refrescar tabla al cerrar
    loadPage(1);
    showUeToast(`Import completado: ${result.creadas} creadas, ${result.actualizadas} actualizadas`);
}

function downloadErrorsCsv() {
    if (!_importErrors.length) return;
    const lines = ['Fila,Referencia,Motivo', ..._importErrors.map(e =>
        `${e.fila},"${e.referencia}","${e.motivo}"`
    )];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'errores_import_ue.csv'; a.click();
    URL.revokeObjectURL(url);
}

function descargarPlantilla() {
    api.descargarPlantillaUe().catch(e => showUeToast(e.message || 'Error al descargar', 'error'));
}

// ── UTILIDADES ───────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── INICIALIZACIÓN ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadPage(1);
    document.getElementById('search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { clearTimeout(_searchTimer); loadPage(1); }
    });
    document.getElementById('modal-ue').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-red-400', 'bg-red-50'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-red-400', 'bg-red-50'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-red-400', 'bg-red-50');
            const file = e.dataTransfer.files[0];
            if (file) { handleFileSelect(file); }
        });
        dropZone.addEventListener('click', () => document.getElementById('import-file-input').click());
    }
});
