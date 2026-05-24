document.addEventListener("DOMContentLoaded", () => {
    let inicioData = {};

    // Nodos Críticos del DOM
    const contentArea    = document.getElementById("content-area");
    const menuToggle     = document.getElementById("menuToggle");
    const closeSidebar   = document.getElementById("closeSidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const themeToggle    = document.getElementById("themeToggle");
    const themeIcon      = document.getElementById("themeIcon");
    const themeText      = document.getElementById("themeText");
    const sidebarMateriasList = document.getElementById("sidebar-materias-list");
    const navHomeBtn     = document.getElementById("nav-home-btn");

    // Mapeo seguro de archivos JSON por materia
    const rutaMaterias = {
        "Programación II":           "programacion.json",
        "Mantenimiento y Reparación":"mantenimiento.json",
        "Producciones Digitales":    "producciones.json",
        "Diseño Web":                "diseno.json",
        "Redes Informáticas":        "redes.json",
        "Gestión Empresarial":       "gestion.json"
    };

    // Paleta Oficial — inmune a modos claro/oscuro
    const coloresMaterias = {
        "Programación II":            "#3b82f6",
        "Mantenimiento y Reparación": "#ef4444",
        "Producciones Digitales":     "#f97316",
        "Diseño Web":                 "#06b6d4",
        "Redes Informáticas":         "#8b5cf6",
        "Gestión Empresarial":        "#10b981"
    };

    // ── Barra lateral ──────────────────────────────────────────────────
    function toggleBarraLateral() {
        if (window.innerWidth > 1024) {
            document.body.classList.toggle("sidebar-closed");
        } else {
            document.body.classList.toggle("sidebar-open");
        }
    }
    function cerrarBarraLateralMóvil() {
        document.body.classList.remove("sidebar-open");
    }
    if (menuToggle)     menuToggle.addEventListener("click", toggleBarraLateral);
    if (closeSidebar)   closeSidebar.addEventListener("click", cerrarBarraLateralMóvil);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", cerrarBarraLateralMóvil);

    // ── Tema claro / oscuro ────────────────────────────────────────────
    const temaGuardado = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", temaGuardado);
    actualizarInterfazTema(temaGuardado);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const actual  = document.documentElement.getAttribute("data-theme");
            const nuevo   = actual === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", nuevo);
            localStorage.setItem("theme", nuevo);
            actualizarInterfazTema(nuevo);
        });
    }
    function actualizarInterfazTema(tema) {
        if (!themeIcon || !themeText) return;
        themeIcon.textContent = tema === "dark" ? "☀️" : "🌙";
        themeText.textContent = tema === "dark" ? "Modo Claro" : "Modo Oscuro";
    }

    // ── Inicialización ─────────────────────────────────────────────────
    async function inicializarApp() {
        try {
            const res = await fetch("data/inicio.json");
            if (!res.ok) throw new Error("No se pudo cargar inicio.json");
            inicioData = await res.json();
            // JSON usa "resumen_materias", no "materias"
            construirMenuMaterias(inicioData.resumen_materias);
            renderizarInicio();
        } catch (err) {
            console.error("Error crítico:", err);
            contentArea.innerHTML = `
                <div class="alert-box alert-no">
                    <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
                    <p>No se pudo cargar la configuración de la plataforma.</p>
                </div>`;
        }
    }

    // ── Menú lateral ───────────────────────────────────────────────────
    function construirMenuMaterias(materias) {
        if (!sidebarMateriasList || !materias) return;
        sidebarMateriasList.innerHTML = "";
        materias.forEach(m => {
            const li = document.createElement("li");
            li.className = "nav-item";
            li.innerHTML = `
                <img src="assets/icons/${m.icono}" class="sidebar-icon"
                     onerror="this.style.display='none'">
                <span>${m.nombre}</span>
            `;
            li.addEventListener("click", () => {
                desactivarTodosElementosMenu();
                li.classList.add("active");
                cerrarBarraLateralMóvil();
                cargarModuloMateria(m.nombre, m.icono);
            });
            sidebarMateriasList.appendChild(li);
        });
    }

    function desactivarTodosElementosMenu() {
        document.querySelectorAll(".nav-list .nav-item").forEach(el => el.classList.remove("active"));
        if (navHomeBtn) navHomeBtn.classList.remove("active");
    }

    if (navHomeBtn) {
        navHomeBtn.addEventListener("click", () => {
            desactivarTodosElementosMenu();
            navHomeBtn.classList.add("active");
            cerrarBarraLateralMóvil();
            renderizarInicio();
        });
    }

    // ── Carga del módulo de materia ────────────────────────────────────
    async function cargarModuloMateria(nombreMateria, iconoMateria) {
        const colorHex = coloresMaterias[nombreMateria] || "#2563eb";
        document.documentElement.style.setProperty("--subject-color", colorHex);

        contentArea.innerHTML = `
            <div style="text-align:center;padding:3rem;">
                <i class="fas fa-spinner fa-spin fa-2x"
                   style="color:var(--subject-color)"></i>
            </div>`;

        const archivo = rutaMaterias[nombreMateria];
        if (!archivo) {
            renderizarEstructuraMateria(nombreMateria, iconoMateria, null);
            return;
        }
        try {
            const res = await fetch(`data/${archivo}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            renderizarEstructuraMateria(nombreMateria, iconoMateria, data);
        } catch {
            renderizarEstructuraMateria(nombreMateria, iconoMateria, null);
        }
    }

    // ── Estructura de materia (Banner + Tabs) ──────────────────────────
    // El banner y las pestañas NUNCA se vuelven a renderizar al cambiar de tab.
    // Solo cambia el contenido de #subject-tab-content-wrapper.
    function renderizarEstructuraMateria(nombre, icono, data) {
        contentArea.innerHTML = "";

        // 1. BANNER FIJO ─────────────────────────────────────────────
        const banner = document.createElement("div");
        banner.className = "subject-banner-container";
        banner.innerHTML = `
            <img src="assets/icons/${icono}" class="subject-banner-icon"
                 onerror="this.src='https://placehold.co/50?text=${encodeURIComponent(nombre[0])}'">
            <div class="subject-banner-info">
                <nav class="subject-breadcrumb">
                    <span class="breadcrumb-home" id="breadcrumb-home-btn">Materias</span>
                    <i class="fas fa-chevron-right breadcrumb-sep"></i>
                    <span class="breadcrumb-current">${nombre}</span>
                </nav>
                <h2>${nombre}</h2>
            </div>
        `;
        banner.querySelector("#breadcrumb-home-btn").addEventListener("click", () => {
            desactivarTodosElementosMenu();
            if (navHomeBtn) navHomeBtn.classList.add("active");
            renderizarInicio();
        });
        contentArea.appendChild(banner);

        // 2. PESTAÑAS (4 obligatorias por materia) ────────────────────
        const tabsContainer = document.createElement("div");
        tabsContainer.className = "subject-tabs";

        const tabsInfo = [
            { id: "general",   nombre: "General",  icono: "fas fa-circle-info"   },
            { id: "teoria",    nombre: "Teoría",   icono: "fas fa-table-cells"   },
            { id: "trabajos",  nombre: "Trabajos", icono: "fas fa-file-lines"    },
            { id: "examen",    nombre: "Examen",   icono: "fas fa-graduation-cap"}
        ];

        tabsInfo.forEach((tab, index) => {
            const btn = document.createElement("button");
            btn.className = `subject-tab-btn${index === 0 ? " active" : ""}`;
            btn.innerHTML = `<i class="${tab.icono}"></i> ${tab.nombre}`;
            btn.addEventListener("click", () => {
                document.querySelectorAll(".subject-tab-btn")
                        .forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                renderizarContenidoPestaña(tab.id, data);
            });
            tabsContainer.appendChild(btn);
        });
        contentArea.appendChild(tabsContainer);

        // 3. CONTENEDOR DE CONTENIDO (único elemento que muta) ────────
        const wrapper = document.createElement("div");
        wrapper.id = "subject-tab-content-wrapper";
        contentArea.appendChild(wrapper);

        // Pestaña inicial: General
        renderizarContenidoPestaña("general", data);
    }

    // ── Renderizado del contenido de cada pestaña ──────────────────────
    function renderizarContenidoPestaña(tabId, data) {
        const wrapper = document.getElementById("subject-tab-content-wrapper");
        if (!wrapper) return;

        switch (tabId) {

            case "general": {
                if (!data) { wrapper.innerHTML = placeholderSeccion("general"); return; }
                let html = "";
                if (data.introduccion) {
                    html += `<p class="subject-intro-text">${data.introduccion}</p>`;
                }
                if (data.titulo_lista) {
                    html += `<h3 class="subject-heading">
                                <i class="fas fa-list-ul"></i> ${data.titulo_lista}
                             </h3>`;
                }
                if (data.items && data.items.length) {
                    html += `<ul class="subject-items-list">`;
                    data.items.forEach(item => {
                        html += `<li>
                                    <i class="fas fa-circle-dot"
                                       style="color:var(--subject-color)"></i>
                                    <span>${item}</span>
                                 </li>`;
                    });
                    html += `</ul>`;
                }
                if (data.conclusion) {
                    html += `<p class="subject-conclusion-text">${data.conclusion}</p>`;
                }
                wrapper.innerHTML = html;
                break;
            }

            case "teoria": {
                if (!data || !data.teoria || !data.teoria.length) {
                    wrapper.innerHTML = placeholderSeccion("teoria");
                    return;
                }
                let html = `<h3 class="subject-heading">
                                <i class="fas fa-book-open"></i> Material Teórico
                            </h3>`;
                data.teoria.forEach(t => {
                    html += `
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <span class="accordion-title">${t.titulo}</span>
                                <i class="fas fa-chevron-down accordion-arrow"></i>
                            </div>
                            <div class="accordion-body">
                                <p>${t.contenido || t.descripcion || ""}</p>
                            </div>
                        </div>`;
                });
                wrapper.innerHTML = html;
                // Acordeones interactivos
                wrapper.querySelectorAll(".accordion-header").forEach(header => {
                    header.addEventListener("click", () => {
                        header.parentElement.classList.toggle("open");
                    });
                });
                break;
            }

            case "trabajos": {
                if (!data || !data.trabajos || !data.trabajos.length) {
                    // Si la conclusión menciona "teórica", mensaje específico
                    const esTeórica = data?.conclusion?.toLowerCase().includes("teóric");
                    if (esTeórica) {
                        wrapper.innerHTML = `
                            <div class="subject-empty-notice">
                                <i class="fas fa-check-circle subject-empty-icon"></i>
                                <p>Esta materia es 100% teórica este parcial.<br>
                                   No se asignaron trabajos prácticos.</p>
                            </div>`;
                    } else {
                        wrapper.innerHTML = placeholderSeccion("trabajos");
                    }
                    return;
                }
                let html = `<h3 class="subject-heading">
                                <i class="fas fa-tasks"></i> Asignaciones y Tareas
                            </h3>`;
                data.trabajos.forEach(t => {
                    html += `
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <span class="accordion-title">${t.titulo}</span>
                                <i class="fas fa-chevron-down accordion-arrow"></i>
                            </div>
                            <div class="accordion-body">
                                <p>${t.descripcion || ""}</p>
                            </div>
                        </div>`;
                });
                wrapper.innerHTML = html;
                wrapper.querySelectorAll(".accordion-header").forEach(h => {
                    h.addEventListener("click", () => h.parentElement.classList.toggle("open"));
                });
                break;
            }

            case "examen": {
                if (!data || !data.examen || !data.examen.length) {
                    wrapper.innerHTML = placeholderSeccion("examen");
                    return;
                }
                let html = `<h3 class="subject-heading">
                                <i class="fas fa-graduation-cap"></i> Evaluaciones
                            </h3>`;
                data.examen.forEach(e => {
                    html += `
                        <div class="alert-box alert-blue"
                             style="border-left:5px solid var(--subject-color);">
                            <i class="fas fa-file-alt"
                               style="color:var(--subject-color);font-size:1.3rem;"></i>
                            <div>
                                <h4 class="subject-heading"
                                    style="margin:0;font-size:1.05rem;">${e.titulo}</h4>
                                <p style="font-size:0.9rem;margin-top:0.4rem;">
                                    ${e.descripcion || "Evaluación del parcial."}</p>
                            </div>
                        </div>`;
                });
                wrapper.innerHTML = html;
                break;
            }
        }
    }

    // Mensaje de sección vacía
    function placeholderSeccion(tabId) {
        const msgs = {
            general:   "El contenido general de esta materia estará disponible próximamente.",
            teoria:    "El material teórico de esta materia estará disponible próximamente.",
            trabajos:  "Los trabajos prácticos de esta materia se cargarán próximamente.",
            examen:    "La información del examen estará disponible próximamente."
        };
        return `
            <div class="subject-empty-notice">
                <i class="fas fa-folder-open subject-empty-icon"></i>
                <h3 class="subject-heading" style="justify-content:center;margin-bottom:.4rem;">
                    Sección en desarrollo
                </h3>
                <p>${msgs[tabId] || "Contenido próximamente."}</p>
            </div>`;
    }

    // ── Pantalla de Inicio ─────────────────────────────────────────────
    function renderizarInicio() {
        document.documentElement.style.setProperty("--subject-color", "#2563eb");
        if (!inicioData.bienvenida) return;

        const b = inicioData.bienvenida;
        let html = `
            <div class="welcome-card">
                <span class="top-date-badge"
                      style="background:rgba(255,255,255,0.15);color:inherit;
                             margin-bottom:1rem;display:inline-block;">
                    ${b.badge}
                </span>
                <h1>${b.titulo}</h1>
                <p style="margin-top:.75rem;line-height:1.7;opacity:.9;">
                    ${b.mensaje || b.descripcion || ""}
                </p>
            </div>`;

        // ¿Qué vas a encontrar?
        if (inicioData.que_encontraran?.length) {
            html += `
                <div class="home-card" style="margin-bottom:1.5rem;">
                    <h3 style="color:var(--accent);font-weight:700;margin-bottom:1rem;">
                        <i class="fas fa-star"></i> ¿Qué vas a encontrar aquí?
                    </h3>
                    <ul class="custom-list">`;
            inicioData.que_encontraran.forEach(item => {
                html += `<li>
                            <i class="fas fa-check-circle"
                               style="color:var(--accent);margin-top:3px;"></i>
                            <span>${item}</span>
                         </li>`;
            });
            html += `</ul></div>`;
        }

        // Lo que NO está aquí
        if (inicioData.lo_que_no_esta) {
            const lqne = inicioData.lo_que_no_esta;
            html += `
                <div class="alert-box alert-orange" style="margin-bottom:1.5rem;">
                    <i class="fas fa-info-circle"
                       style="color:#f97316;font-size:1.2rem;flex-shrink:0;"></i>
                    <div>
                        <h4 style="font-weight:700;margin-bottom:.35rem;">${lqne.titulo}</h4>
                        <p style="font-size:.92rem;line-height:1.5;">${lqne.mensaje}</p>
                    </div>
                </div>`;
        }

        html += `
            <h3 class="icon-section-title">
                <i class="fas fa-th-large"></i> Asignaturas del Parcial
            </h3>
            <p class="icon-grid-subtitle">
                Selecciona una materia desde aquí o desde el menú lateral.
            </p>
            <div class="subject-grid" id="subject-cards-container"></div>`;

        contentArea.innerHTML = html;
        renderizarTarjetasMateriasHome(inicioData.resumen_materias);
    }

    // Tarjetas en el inicio
    function renderizarTarjetasMateriasHome(materias) {
        const container = document.getElementById("subject-cards-container");
        if (!container || !materias) return;
        container.innerHTML = "";
        materias.forEach((m, index) => {
            const color = coloresMaterias[m.nombre] || "#2563eb";
            const card  = document.createElement("div");
            card.className = "subject-home-card";
            card.style.cssText = `--card-color:${color}`;
            card.innerHTML = `
                <div class="sub-left">
                    <div class="sub-icon-wrapper"
                         style="border:2px solid ${color}30;">
                        <img src="assets/icons/${m.icono}" alt="${m.nombre}"
                             onerror="this.src='https://placehold.co/26'">
                    </div>
                    <div>
                        <div class="sub-name">${m.nombre}</div>
                        <div class="sub-desc">${m.trabajos} trabajos establecidos</div>
                    </div>
                </div>
                <span class="sub-status status-${m.clase_estado}">${m.estado}</span>`;
            card.addEventListener("click", () => {
                const items = sidebarMateriasList?.querySelectorAll(".nav-item");
                if (items?.[index]) items[index].click();
            });
            container.appendChild(card);
        });
    }

    // ── Iniciar la app ─────────────────────────────────────────────────
    inicializarApp();
});
