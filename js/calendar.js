document.addEventListener('DOMContentLoaded', function () {
    if (!window.FullCalendar) {
        console.error("❌ FullCalendar no se ha cargado correctamente.");
        return;
    }

    const Calendar = FullCalendar.Calendar;

    let calendarEl = document.getElementById('calendar');
    let popupEvento = document.getElementById('popup-evento');
    let inputTitulo = document.getElementById('evento-titulo');
    let inputFecha = document.getElementById('evento-fecha');
    let inputHora = document.getElementById('evento-hora');
    let inputCategoria = document.getElementById('evento-categoria');
    let btnGuardar = document.getElementById('guardar-evento');
    let toggleThemeBtn = document.getElementById('toggle-theme');
    let filtroCategoria = document.getElementById("filtro-categoria");

    function cargarEventosDesdeStorage() {
        try {
            return JSON.parse(localStorage.getItem("events")) || [];
        } catch (e) {
            console.error("❌ Error al cargar eventos de localStorage:", e);
            return [];
        }
    }

    function guardarEventosEnStorage(evts) {
        localStorage.setItem("events", JSON.stringify(evts));
    }

    let eventosCargados = cargarEventosDesdeStorage().map(evento => ({
        id: evento.id,
        title: evento.title,
        start: evento.start,
        color: evento.color,
        extendedProps: { 
            completed: evento.completed || false, 
            categoria: evento.categoria || "Otros" 
        }
    }));

    let calendar = new Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        firstDay: 1,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        editable: true,
        selectable: true,
        events: eventosCargados,

        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },

        dateClick: function (info) {
            inputFecha.value = info.dateStr;
            inputHora.value = "";
            inputTitulo.value = "";

            popupEvento.style.display = "flex";
            popupEvento.style.position = "absolute";
            popupEvento.style.left = `${info.jsEvent.clientX}px`;
            popupEvento.style.top = `${info.jsEvent.clientY}px`;
            inputTitulo.focus();
        },

        eventDrop: function (info) {
            let eventos = cargarEventosDesdeStorage();
            let evento = eventos.find(ev => ev.id == info.event.id);
            if (evento) {
                evento.start = info.event.start.toISOString();
                guardarEventosEnStorage(eventos);
            }
        },

        eventDidMount: function (info) {
            let acciones = document.createElement("span");
            acciones.classList.add("evento-acciones");
            acciones.style.display = "none";

            let checkIcon = document.createElement("span");
            checkIcon.innerHTML = "✔️";
            checkIcon.classList.add("evento-icono");
            checkIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                let allEvents = cargarEventosDesdeStorage();
                let evento = allEvents.find(ev => ev.id == info.event.id);
                if (evento) {
                    evento.completed = !evento.completed;
                    info.event.setProp("classNames", evento.completed ? "evento-completado" : "");
                    guardarEventosEnStorage(allEvents);
                }
            });

            let editIcon = document.createElement("span");
            editIcon.innerHTML = "✏️";
            editIcon.classList.add("evento-icono");
            editIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                let nuevoTitulo = prompt("Editar título:", info.event.title);
                if (nuevoTitulo) {
                    let allEvents = cargarEventosDesdeStorage();
                    let evento = allEvents.find(ev => ev.id == info.event.id);
                    if (evento) {
                        evento.title = nuevoTitulo;
                        info.event.setProp("title", nuevoTitulo);
                        guardarEventosEnStorage(allEvents);
                    }
                }
            });

            let deleteIcon = document.createElement("span");
            deleteIcon.innerHTML = "🗑️";
            deleteIcon.classList.add("evento-icono");
            deleteIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                if (confirm("¿Eliminar este evento?")) {
                    let allEvents = cargarEventosDesdeStorage();
                    let filtrados = allEvents.filter(ev => ev.id != info.event.id);
                    guardarEventosEnStorage(filtrados);
                    info.event.remove();
                    calendar.refetchEvents();
                }
            });

            acciones.appendChild(checkIcon);
            acciones.appendChild(editIcon);
            acciones.appendChild(deleteIcon);
            info.el.appendChild(acciones);

            info.el.addEventListener("mouseenter", function () {
                acciones.style.display = "flex";
            });

            info.el.addEventListener("mouseleave", function () {
                acciones.style.display = "none";
            });

            if (info.event.extendedProps.completed) {
                info.event.setProp("classNames", "evento-completado");
            }
        }
    });

    calendar.render();

    // 🔹 FILTRO DE EVENTOS POR CATEGORÍA (ARREGLADO)
    filtroCategoria.addEventListener("change", function () {
        let categoriaSeleccionada = this.value;
        let eventos = cargarEventosDesdeStorage();

        let eventosFiltrados = eventos.filter(evento => 
            categoriaSeleccionada === "Todos" || evento.categoria === categoriaSeleccionada
        );

        calendar.getEvents().forEach(event => event.remove()); // Elimina eventos actuales
        eventosFiltrados.forEach(evento => {
            calendar.addEvent({
                id: evento.id,
                title: evento.title,
                start: evento.start,
                color: evento.color,
                extendedProps: { categoria: evento.categoria }
            });
        });
    });

    btnGuardar.addEventListener('click', function () {
        if (inputTitulo.value.trim() === "" || inputFecha.value === "") {
            alert("⚠️ Debes ingresar un título y una fecha.");
            return;
        }

        let timeVal = inputHora.value || "00:00";
        let dateTime = `${inputFecha.value}T${timeVal}:00`;
        let catOption = inputCategoria.options[inputCategoria.selectedIndex];
        let colorVal = catOption.getAttribute("data-color") || "#E8A236";
        let newId = Date.now();

        let nuevoEvento = { 
            id: newId, 
            title: inputTitulo.value.trim(), 
            start: dateTime, 
            color: colorVal, 
            categoria: inputCategoria.value, 
            completed: false 
        };

        let evts = cargarEventosDesdeStorage();
        evts.push(nuevoEvento);
        guardarEventosEnStorage(evts);

        calendar.addEvent({
            id: newId,
            title: inputTitulo.value.trim(),
            start: dateTime,
            color: colorVal,
            extendedProps: { categoria: inputCategoria.value }
        });

        calendar.refetchEvents();
        popupEvento.style.display = "none";
        inputTitulo.value = "";
        inputFecha.value = "";
        inputHora.value = "";
    });

    function aplicarTema() {
        let tema = localStorage.getItem("tema") || "dark";
        document.body.classList.toggle("light", tema === "light");
        toggleThemeBtn.textContent = tema === "light" ? "🌙 Modo Oscuro" : "☀️ Modo Claro";
    }

    aplicarTema();
    toggleThemeBtn.addEventListener('click', function () {
        let nuevoTema = document.body.classList.contains("light") ? "dark" : "light";
        localStorage.setItem("tema", nuevoTema);
        aplicarTema();
    });
});
