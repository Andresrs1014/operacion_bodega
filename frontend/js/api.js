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
            const err = await res.json().catch(() => ({ detail: "Error de red" }));
            throw new Error(err.detail || "Error desconocido");
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
};
