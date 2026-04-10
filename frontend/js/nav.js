// ============================================================
// nav.js — Navegación dinámica BRAKEPAK
// Reemplaza todos los headers hardcodeados.
// Uso: <div id="bp-nav"></div>  +  initNav('SECCIÓN', 'page-key')
// ============================================================

const NAV_LINKS = {
    dashboard:  { label: 'DASHBOARD',   href: '/dashboard.html',             roles: ['admin', 'supervisor'] },
    empaque:    { label: 'EMPAQUE',     href: '/index_estructura.html',      roles: ['admin', 'supervisor', 'operario'] },
    validacion: { label: 'VALIDACIÓN',  href: '/validacion_estructura.html', roles: ['admin', 'supervisor', 'operario'] },
    usuarios:   { label: 'USUARIOS',    href: '/usuarios.html',              roles: ['admin'] },
};

function initNav(section, currentPage) {
    if (!api.isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    const user = api.getUser();
    const rol  = user.rol;

    const buttons = Object.entries(NAV_LINKS)
        .filter(([key, link]) => key !== currentPage && link.roles.includes(rol))
        .map(([, link]) =>
            `<a href="${link.href}"
                class="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                ${link.label}
             </a>`)
        .join('');

    document.getElementById('bp-nav').innerHTML = `
        <header class="bg-red-700 text-white px-6 py-3 flex justify-between items-center shadow-lg z-30 shrink-0">
            <div class="flex items-center gap-4">
                <span class="font-black text-xl tracking-widest">BRAKEPAK</span>
                <span class="text-red-200 text-xs font-mono border-l border-red-500 pl-4">${section} · LOGIMAT</span>
            </div>
            <div class="flex items-center gap-4">
                <span id="bp-reloj" class="font-mono text-red-100 text-xs hidden sm:inline"></span>
                <span class="text-sm font-bold text-red-100">${user.nombre}</span>
                ${buttons}
                <button onclick="api.logout()"
                    class="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                    SALIR
                </button>
            </div>
        </header>`;

    // Reloj en tiempo real
    (function tick() {
        const el = document.getElementById('bp-reloj');
        if (el) el.textContent = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    })();
    setInterval(() => {
        const el = document.getElementById('bp-reloj');
        if (el) el.textContent = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }, 1000);
}
