/**
 * Toast no bloqueante, borrador servidor por usuario, historial propio de validaciones.
 */

const VALIDACION_AUX = {
    DRAFT_DEBOUNCE_MS: 2000,
    BORRADOR_VERSION: 1,
    draftSaveTimer: null,
    supervisorFirmaCache: [],

    normalizeNombre(s) {
        return String(s || '').toUpperCase().trim().replace(/\s+/g, ' ');
    },

    escapeAttr(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;');
    },

    showToast(msg, type = 'info') {
        const el = document.getElementById('val-toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.remove(
            'hidden',
            'bg-slate-800',
            'bg-red-700',
            'bg-emerald-700',
            'text-white',
        );
        el.classList.add('text-white', 'px-4', 'py-2', 'rounded-lg', 'shadow-lg', 'text-sm', 'font-bold', 'max-w-md', 'text-center');
        if (type === 'error') el.classList.add('bg-red-700');
        else if (type === 'success') el.classList.add('bg-emerald-700');
        else el.classList.add('bg-slate-800');
        clearTimeout(this._toastT);
        this._toastT = setTimeout(() => el.classList.add('hidden'), 3200);
    },

    async loadSupervisoresFirmaCache() {
        try {
            this.supervisorFirmaCache = await api.getSupervisoresFirma();
        } catch {
            this.supervisorFirmaCache = [];
        }
    },

    findSupervisorIdByName(nombre) {
        const t = this.normalizeNombre(nombre);
        const r = this.supervisorFirmaCache.find((s) => this.normalizeNombre(s.nombre) === t);
        return r ? r.id : null;
    },

    buildDraftPayload(appState) {
        const obsEl = document.getElementById('input-observations');
        const obs = obsEl ? obsEl.value.trim().toUpperCase() : (appState.observations || '');
        return {
            version: this.BORRADOR_VERSION,
            orderId: appState.orderId,
            picker: appState.picker,
            clientInfo: { ...appState.clientInfo },
            orderData: appState.orderData,
            observations: obs,
            corrections: appState.corrections,
            supervisorAuthorized: appState.supervisorAuthorized,
            startTimeIso: appState.startTime ? appState.startTime.toISOString() : null,
        };
    },

    scheduleDraftSave(app) {
        const v = document.getElementById('view-validate');
        if (!v || v.classList.contains('hidden')) return;
        if (!app.validacionId || !app.orderId) return;
        clearTimeout(this.draftSaveTimer);
        this.draftSaveTimer = setTimeout(() => this.flushDraftSave(app), this.DRAFT_DEBOUNCE_MS);
    },

    async flushDraftSave(app) {
        try {
            await api.putMiBorrador({
                numero_pedido: app.orderId,
                id_validacion: app.validacionId,
                payload: this.buildDraftPayload(app),
            });
            this.showToast('Borrador guardado', 'success');
        } catch (e) {
            this.showToast('No se pudo guardar el borrador: ' + e.message, 'error');
        }
    },

    async refreshHistorial() {
        const tbody = document.getElementById('historial-validaciones-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-400 text-xs">Cargando…</td></tr>';
        try {
            const rows = await api.getMisValidaciones(40);
            if (!rows.length) {
                tbody.innerHTML =
                    '<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs">Sin validaciones cerradas aún.</td></tr>';
                return;
            }
            tbody.innerHTML = rows
                .map((r) => {
                    const fin = r.hora_fin ? new Date(r.hora_fin).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : '—';
                    const st =
                        r.estado === 'OK'
                            ? '<span class="text-emerald-600 font-bold">OK</span>'
                            : '<span class="text-amber-600 font-bold">NOVEDAD</span>';
                    return `<tr class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="py-2 px-2 font-mono font-bold">${this.escapeAttr(r.numero_pedido)}</td>
                        <td class="py-2 px-2 text-xs">${fin}</td>
                        <td class="py-2 px-2 text-center text-xs">${st}</td>
                        <td class="py-2 px-2 text-center font-mono">${r.total_unidades}</td>
                        <td class="py-2 px-2 text-center">
                            <button type="button"
                                onclick="reprintLabelFromHistory(${r.id})"
                                class="text-slate-400 hover:text-brand-red transition-colors"
                                title="Reimprimir etiqueta UM">
                                <i class="fa-solid fa-print text-xs"></i>
                            </button>
                        </td>
                        <td class="py-2 px-2 text-center text-[10px] text-slate-400">#${r.id}</td>
                    </tr>`;
                })
                .join('');
        } catch {
            tbody.innerHTML =
                '<tr><td colspan="6" class="py-4 text-center text-red-400 text-xs">Error al cargar historial</td></tr>';
        }
    },

    showDraftBanner(numeroPedido) {
        const b = document.getElementById('draft-banner');
        const t = document.getElementById('draft-banner-text');
        if (!b || !t) return;
        t.textContent = `Tienes un borrador del pedido ${numeroPedido}. Puedes continuar donde lo dejaste.`;
        b.classList.remove('hidden');
    },

    hideDraftBanner() {
        const b = document.getElementById('draft-banner');
        if (b) b.classList.add('hidden');
    },

    async probeBorradorOnUpload() {
        try {
            const bd = await api.getMiBorrador();
            if (bd && bd.numero_pedido) this.showDraftBanner(bd.numero_pedido);
            else this.hideDraftBanner();
        } catch (e) {
            if (e.status === 404) this.hideDraftBanner();
        }
    },

    async discardDraftUi() {
        if (!confirm('¿Descartar el borrador en servidor?')) return;
        try {
            await api.deleteMiBorrador();
            this.hideDraftBanner();
            this.showToast('Borrador eliminado', 'success');
        } catch (e) {
            this.showToast(e.message || 'Error al descartar', 'error');
        }
    },

    applyDraftToApp(serverBorrador, app) {
        const pl = serverBorrador.payload || {};
        app.orderId = serverBorrador.numero_pedido || pl.orderId;
        app.picker = pl.picker || null;
        app.clientInfo = pl.clientInfo || { name: '', address: '', city: '', dept: '' };
        app.orderData = Array.isArray(pl.orderData) ? pl.orderData : [];
        app.observations = pl.observations || '';
        app.corrections = Array.isArray(pl.corrections) ? pl.corrections : [];
        app.supervisorAuthorized = !!pl.supervisorAuthorized;
        app.validacionId = serverBorrador.id_validacion || null;
        app.startTime = pl.startTimeIso ? new Date(pl.startTimeIso) : new Date();
        const obs = document.getElementById('input-observations');
        if (obs) obs.value = app.observations;
    },
};
