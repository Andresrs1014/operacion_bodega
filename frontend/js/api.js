// ==========================================
// CLIENTE API - BRAKEPAK
// Gestiona token JWT y comunicación con el backend
// ==========================================

// En producción Nginx hace el proxy /api/ → backend:8000
// En desarrollo local cambiar a "http://localhost:8000"
const API_BASE = "/api";
const TOKEN_KEY = "bp_token";
const USER_KEY  = "bp_user";

const api = {

    // ── Token ────────────────────────────────────────────────────────────────

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    saveSession(tokenData) {
        localStorage.setItem(TOKEN_KEY, tokenData.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify({
            cedula: tokenData.cedula,
            nombre: tokenData.nombre,
            rol:    tokenData.rol,
        }));
    },

    clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // ── Request base ─────────────────────────────────────────────────────────

    async request(method, path, body = null) {
        const token = this.getToken();
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(API_BASE + path, opts);

        if (res.status === 401) {
            this.clearSession();
            window.location.href = "/login.html";
            return;
        }

        if (!res.ok) {
            let errBody;
            try {
                errBody = await res.json();
            } catch {
                errBody = { detail: "Error de red" };
            }
            const detail = errBody.detail;
            const msg =
                typeof detail === "string"
                    ? detail
                    : Array.isArray(detail)
                        ? detail.map((d) => (d.msg ? d.msg : JSON.stringify(d))).join("; ")
                        : detail != null
                            ? JSON.stringify(detail)
                            : res.statusText || "Error";
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }

        if (res.status === 204) return null;
        return res.json();
    },

    // ── Auth ─────────────────────────────────────────────────────────────────

    async login(cedula, password) {
        const data = await this.request("POST", "/auth/login", { cedula, password });
        this.saveSession(data);
        return data;
    },

    logout() {
        this.clearSession();
        window.location.href = "/login.html";
    },

    // ── Empaque ───────────────────────────────────────────────────────────────

    async getSecuencia() {
        return this.request("GET", "/empaque/secuencia");
    },

    async registrarEmpaques(items) {
        return this.request("POST", "/empaque/", items);
    },

    async getEmpaquesTurno() {
        return this.request("GET", "/empaque/turno");
    },

    // ── Validación ────────────────────────────────────────────────────────────

    async getEmpleados() {
        return this.request("GET", "/validacion/empleados");
    },

    async iniciarAlistamiento(numeroPedido, horaInicio) {
        return this.request("POST", "/validacion/alistamiento", {
            numero_pedido: numeroPedido,
            hora_inicio: horaInicio,
        });
    },

    async cerrarAlistamiento(alistamientoId, horaFin) {
        return this.request("PATCH", `/validacion/alistamiento/${alistamientoId}/cerrar`, {
            hora_fin: horaFin,
        });
    },

    async iniciarValidacion(numeroPedido, horaInicio, idAlistador = null) {
        return this.request("POST", "/validacion/", {
            numero_pedido: numeroPedido,
            hora_inicio: horaInicio,
            id_alistador: idAlistador,
        });
    },

    async cerrarValidacion(validacionId, payload) {
        return this.request("PATCH", `/validacion/${validacionId}/cerrar`, payload);
    },

    async registrarCorreccion(validacionId, correccion) {
        return this.request("POST", `/validacion/${validacionId}/correccion`, correccion);
    },

    async getSupervisoresFirma() {
        return this.request("GET", "/validacion/supervisores-firma");
    },

    async getMisValidaciones(limit = 50) {
        return this.request("GET", `/validacion/mias?limit=${limit}`);
    },

    async getMiBorrador() {
        return this.request("GET", "/validacion/mi-borrador");
    },

    async putMiBorrador(borradorBody) {
        return this.request("PUT", "/validacion/mi-borrador", borradorBody);
    },

    async deleteMiBorrador() {
        return this.request("DELETE", "/validacion/mi-borrador");
    },

    async getLabelSnapshot(validacionId) {
        return this.request("GET", `/validacion/${validacionId}/label-snapshot`);
    },

    async cancelarAlistamiento(alistamientoId, horaFin = null) {
        return this.request("PATCH", `/validacion/alistamiento/${alistamientoId}/cancelar`, {
            hora_fin: horaFin,
        });
    },

    // ── CATÁLOGO UNIDADES DE EMPAQUE ──────────────────────────────────────────────
    async getUnidadesEmpaque({ q = '', page = 1, limit = 50 } = {}) {
        const params = new URLSearchParams({ page, limit });
        if (q) params.set('q', q);
        return this.request('GET', `/productos/ue?${params}`);
    },

    async createProductoUe(body) {
        return this.request('POST', '/productos/ue', body);
    },

    async updateProductoUe(id, body) {
        return this.request('PATCH', `/productos/ue/${id}`, body);
    },

    async deleteProductoUe(id) {
        return this.request('DELETE', `/productos/ue/${id}`);
    },

    async batchUnidadesEmpaque(referencias) {
        return this.request('POST', '/productos/ue/batch', { referencias });
    },

    async importUnidadesEmpaque(formData) {
        const token = this.getToken();
        const res = await fetch(`${API_BASE}/productos/ue/import`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!res.ok) {
            let detail = 'Error al importar';
            try { detail = (await res.json()).detail || detail; } catch {}
            const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
            err.status = res.status;
            throw err;
        }
        return res.json();
    },

    async descargarPlantillaUe() {
        const token = this.getToken();
        const res = await fetch(`${API_BASE}/productos/ue/plantilla`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('No se pudo descargar la plantilla');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'plantilla_ue.xlsx'; a.click();
        URL.revokeObjectURL(url);
    },
};
