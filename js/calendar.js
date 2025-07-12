document.addEventListener('DOMContentLoaded', function () {
    if (!window.FullCalendar) {
        console.error("❌ FullCalendar no se ha cargado correctamente.");
        return;
    }

    const Calendar = FullCalendar.Calendar;

    const calendarEl = document.getElementById('calendar');
    const popupEvento = document.getElementById('popup-evento');
    const inputTitulo = document.getElementById('evento-titulo');
    const inputFecha = document.getElementById('evento-fecha');
    const inputHora = document.getElementById('evento-hora');
    const inputCategoria = document.getElementById('evento-categoria');
    const btnGuardar = document.getElementById('guardar-evento');
    const filtroCategoria = document.getElementById("filtro-categoria");
    const selectorTema = document.getElementById("selector-tema");

    // 🔸 Eventos: localStorage
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

    const eventosCargados = cargarEventosDesdeStorage().map(evento => ({
        id: evento.id,
        title: evento.title,
        start: evento.start,
        color: evento.color,
        extendedProps: {
            completed: evento.completed || false,
            categoria: evento.categoria || "Otros"
        }
    }));

    const calendar = new Calendar(calendarEl, {
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
            const eventos = cargarEventosDesdeStorage();
            const evento = eventos.find(ev => ev.id == info.event.id);
            if (evento) {
                evento.start = info.event.start.toISOString();
                guardarEventosEnStorage(eventos);
            }
        },

        eventDidMount: function (info) {
            const acciones = document.createElement("span");
            acciones.classList.add("evento-acciones");
            acciones.style.display = "none";

            const checkIcon = document.createElement("span");
            checkIcon.innerHTML = "✔️";
            checkIcon.classList.add("evento-icono");
            checkIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                const allEvents = cargarEventosDesdeStorage();
                const evento = allEvents.find(ev => ev.id == info.event.id);
                if (evento) {
                    evento.completed = !evento.completed;
                    info.event.setProp("classNames", evento.completed ? "evento-completado" : "");
                    guardarEventosEnStorage(allEvents);
                }
            });

            const editIcon = document.createElement("span");
            editIcon.innerHTML = "✏️";
            editIcon.classList.add("evento-icono");
            editIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                const nuevoTitulo = prompt("Editar título:", info.event.title);
                if (nuevoTitulo) {
                    const allEvents = cargarEventosDesdeStorage();
                    const evento = allEvents.find(ev => ev.id == info.event.id);
                    if (evento) {
                        evento.title = nuevoTitulo;
                        info.event.setProp("title", nuevoTitulo);
                        guardarEventosEnStorage(allEvents);
                    }
                }
            });

            const deleteIcon = document.createElement("span");
            deleteIcon.innerHTML = "🗑️";
            deleteIcon.classList.add("evento-icono");
            deleteIcon.addEventListener("click", function (e) {
                e.stopPropagation();
                if (confirm("¿Eliminar este evento?")) {
                    const allEvents = cargarEventosDesdeStorage();
                    const filtrados = allEvents.filter(ev => ev.id != info.event.id);
                    guardarEventosEnStorage(filtrados);
                    info.event.remove();
                    calendar.refetchEvents();
                }
            });

            acciones.appendChild(checkIcon);
            acciones.appendChild(editIcon);
            acciones.appendChild(deleteIcon);
            info.el.appendChild(acciones);

            info.el.addEventListener("mouseenter", () => {
                acciones.style.display = "flex";
            });

            info.el.addEventListener("mouseleave", () => {
                acciones.style.display = "none";
            });

            if (info.event.extendedProps.completed) {
                info.event.setProp("classNames", "evento-completado");
            }
        }
    });

    calendar.render();

    // 🔹 Guardar nuevo evento
    btnGuardar.addEventListener('click', function () {
        if (inputTitulo.value.trim() === "" || inputFecha.value === "") {
            alert("⚠️ Debes ingresar un título y una fecha.");
            return;
        }

        const timeVal = inputHora.value || "00:00";
        const dateTime = `${inputFecha.value}T${timeVal}:00`;
        const catOption = inputCategoria.options[inputCategoria.selectedIndex];
        const colorVal = catOption.getAttribute("data-color") || "#E8A236";
        const newId = Date.now();

        const nuevoEvento = {
            id: newId,
            title: inputTitulo.value.trim(),
            start: dateTime,
            color: colorVal,
            categoria: inputCategoria.value,
            completed: false
        };

        const evts = cargarEventosDesdeStorage();
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

    // 🔸 Filtro por categoría
    filtroCategoria.addEventListener("change", function () {
        const categoriaSeleccionada = this.value;
        const eventos = cargarEventosDesdeStorage();
        const eventosFiltrados = eventos.filter(evento =>
            categoriaSeleccionada === "Todos" || evento.categoria === categoriaSeleccionada
        );

        calendar.getEvents().forEach(event => event.remove());
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

    // 🔸 Temas personalizados (5 estilos)
    function aplicarTema(nombreTema) {
        document.body.className = ""; // limpia todas las clases
        document.body.classList.add(`theme-${nombreTema}`);
        localStorage.setItem("tema", nombreTema);
        if (selectorTema) selectorTema.value = nombreTema;
    }

    if (selectorTema) {
        selectorTema.addEventListener("change", e => aplicarTema(e.target.value));
    }

    aplicarTema(localStorage.getItem("tema") || "default");
});

// 🔹 Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('✅ Service Worker registrado', reg))
        .catch(err => console.error('❌ Error al registrar el Service Worker', err));
}
