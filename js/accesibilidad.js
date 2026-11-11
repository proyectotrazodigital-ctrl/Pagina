
(function () {
    "use strict";

    var CLAVE = "modoDaltonismo";
    var MODOS = ["protanopia", "deuteranopia", "tritanopia", "acromatopsia"];
    var OPCIONES = [
        { modo: "protanopia", texto: "Protanopia" },
        { modo: "deuteranopia", texto: "Deuteranopia" },
        { modo: "tritanopia", texto: "Tritanopia" },
        { modo: "acromatopsia", texto: "Acromatopsia" },
        { modo: "normal", texto: "Restaurar colores normales" }
    ];

    function leerModo() {
        try {
            var guardado = localStorage.getItem(CLAVE);
            return MODOS.indexOf(guardado) !== -1 ? guardado : "normal";
        } catch (e) {
            return "normal";
        }
    }

    function guardarModo(modo) {
        try {
            localStorage.setItem(CLAVE, modo);
        } catch (e) {  }
    }

    function aplicarModo(modo) {
        MODOS.forEach(function (m) {
            document.body.classList.remove("modo-" + m);
        });
        if (modo !== "normal") {
            document.body.classList.add("modo-" + modo);
        }

        document.querySelectorAll(".opcion-daltonismo").forEach(function (opcion) {
            opcion.setAttribute("aria-pressed", String(opcion.dataset.modo === modo));
        });
    }

    function crearWidget() {
        if (document.getElementById("boton-accesibilidad")) return;

        var contenedor = document.createElement("div");
        contenedor.className = "accesibilidad";

        var botonesHtml = OPCIONES.map(function (o) {
            return '<button class="opcion-daltonismo" type="button" data-modo="' +
                o.modo + '" aria-pressed="false">' + o.texto + "</button>";
        }).join("");

        contenedor.innerHTML =
            '<button id="boton-accesibilidad" type="button" aria-expanded="false" ' +
            'aria-controls="menu-accesibilidad" aria-haspopup="true">' +
            '<i class="fas fa-eye" aria-hidden="true"></i> Accesibilidad</button>' +
            '<div id="menu-accesibilidad" role="group" aria-label="Opciones de daltonismo">' +
            botonesHtml + "</div>";

        document.body.appendChild(contenedor);
    }

    function iniciar() {
        crearWidget();

        var boton = document.getElementById("boton-accesibilidad");
        var menu = document.getElementById("menu-accesibilidad");
        if (!boton || !menu) return;

        function abrirCerrar(abrir) {
            menu.classList.toggle("mostrar", abrir);
            boton.setAttribute("aria-expanded", String(abrir));
        }

        aplicarModo(leerModo());

        boton.addEventListener("click", function (e) {
            e.stopPropagation();
            abrirCerrar(!menu.classList.contains("mostrar"));
        });

        document.addEventListener("click", function (e) {
            if (!menu.contains(e.target) && !boton.contains(e.target)) {
                abrirCerrar(false);
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && menu.classList.contains("mostrar")) {
                abrirCerrar(false);
                boton.focus();
            }
        });

        menu.querySelectorAll(".opcion-daltonismo").forEach(function (opcion) {
            opcion.addEventListener("click", function () {
                var modo = this.dataset.modo;
                aplicarModo(modo);
                guardarModo(modo);
                abrirCerrar(false);
            });
        });

        
        window.addEventListener("storage", function (e) {
            if (e.key === CLAVE) aplicarModo(leerModo());
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
