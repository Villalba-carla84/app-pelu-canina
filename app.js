const form = document.getElementById("dogForm");
const loginScreen = document.getElementById("loginScreen");
const appRoot = document.getElementById("appRoot");
const loginForm = document.getElementById("loginForm");
const loginUserInput = document.getElementById("loginUser");
const loginPasswordInput = document.getElementById("loginPassword");
const showPasswordInput = document.getElementById("showPassword");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");
const fotoInput = document.getElementById("foto");
const nombreInput = document.getElementById("nombre");
const razaInput = document.getElementById("raza");
const caracterInput = document.getElementById("caracter");
const pelajeInput = document.getElementById("pelaje");
const duenoNombreInput = document.getElementById("duenoNombre");
const duenoTelefonoInput = document.getElementById("duenoTelefono");
const duenoDireccionInput = document.getElementById("duenoDireccion");
const duenoNotasInput = document.getElementById("duenoNotas");
const servicioInput = document.getElementById("servicio");
const fechaServicioInput = document.getElementById("fechaServicio");

const filtroNombreInput = document.getElementById("filtroNombre");
const filtroDuenoInput = document.getElementById("filtroDueno");
const filtroTelefonoInput = document.getElementById("filtroTelefono");
const dogsCountLabel = document.getElementById("dogsCount");
const dogList = document.getElementById("dogList");

const tabTurnosButton = document.getElementById("tabTurnos");
const tabPerritosButton = document.getElementById("tabPerritos");
const panelTurnos = document.getElementById("panelTurnos");
const panelPerritos = document.getElementById("panelPerritos");

const appointmentForm = document.getElementById("appointmentForm");
const turnoTelefonoInput = document.getElementById("turnoTelefono");
const buscarPorTelefonoButton = document.getElementById("buscarPorTelefono");
const turnoDogIdInput = document.getElementById("turnoDogId");
const turnoFechaInput = document.getElementById("turnoFecha");
const turnoHoraInput = document.getElementById("turnoHora");
const turnoServicioInput = document.getElementById("turnoServicio");
const turnoNotasInput = document.getElementById("turnoNotas");
const agendaFechaInput = document.getElementById("agendaFecha");
const appointmentList = document.getElementById("appointmentList");

const nuevoPerroTurno = document.getElementById("nuevoPerroTurno");
const nuevoPerroNombreInput = document.getElementById("nuevoPerroNombre");
const nuevoPerroRazaInput = document.getElementById("nuevoPerroRaza");
const nuevoPerroCaracterInput = document.getElementById("nuevoPerroCaracter");
const nuevoPerroPelajeInput = document.getElementById("nuevoPerroPelaje");
const nuevoDuenoNombreInput = document.getElementById("nuevoDuenoNombre");
const nuevoDuenoDireccionInput = document.getElementById("nuevoDuenoDireccion");
const nuevoDuenoNotasInput = document.getElementById("nuevoDuenoNotas");

const exportExcelButton = document.getElementById("exportExcel");
const exportPdfButton = document.getElementById("exportPdf");

const DOGS_API = "/api/dogs";
const APPOINTMENTS_API = "/api/appointments";
const AUTH_STORAGE_KEY = "narices_frias_token";

let currentAppointments = [];
let authToken = localStorage.getItem(AUTH_STORAGE_KEY) || "";

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toCsvValue(value) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function daysBetween(dateA, dateB) {
  const first = new Date(`${dateA}T00:00:00`);
  const second = new Date(`${dateB}T00:00:00`);
  const ms = Math.abs(first.getTime() - second.getTime());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function toggleNewDogForm(visible) {
  if (visible) {
    nuevoPerroTurno.classList.remove("hidden");
    return;
  }
  nuevoPerroTurno.classList.add("hidden");
}

function showLoginError(message = "") {
  loginError.textContent = message;
  loginError.classList.toggle("hidden", !message);
}

function setAuthToken(token = "") {
  authToken = token;
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    return;
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function setLoggedInState(isLoggedIn) {
  loginScreen.classList.toggle("hidden", isLoggedIn);
  appRoot.classList.toggle("hidden", !isLoggedIn);
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken("");
    setLoggedInState(false);
    throw new Error("Sesión expirada. Volvé a iniciar sesión.");
  }

  return response;
}

async function login(username, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo iniciar sesión");
  }

  const data = await response.json();
  setAuthToken(data.token);
}

async function logout() {
  if (authToken) {
    await apiFetch("/api/auth/logout", { method: "POST" });
  }
  setAuthToken("");
}

async function validateSession() {
  if (!authToken) return false;

  try {
    const response = await apiFetch("/api/auth/me");
    return response.ok;
  } catch {
    return false;
  }
}

function setActiveTab(tabName) {
  const isTurnos = tabName === "turnos";

  panelTurnos.classList.toggle("tab-hidden", !isTurnos);
  panelPerritos.classList.toggle("tab-hidden", isTurnos);

  tabTurnosButton.classList.toggle("active", isTurnos);
  tabPerritosButton.classList.toggle("active", !isTurnos);
}

function setDogSelectOptions(dogs) {
  if (!dogs.length) {
    turnoDogIdInput.innerHTML = "<option value=''>No hay perros con ese teléfono</option>";
    return;
  }

  turnoDogIdInput.innerHTML = dogs
    .map(
      (dog) =>
        `<option value="${dog.id}">${escapeHtml(dog.nombre)} · ${escapeHtml(dog.dueno_nombre)} (${escapeHtml(
          dog.dueno_telefono
        )})</option>`
    )
    .join("");
}

async function fetchDogs(filtered = true) {
  const params = new URLSearchParams();
  if (filtered) {
    params.append("name", filtroNombreInput.value.trim());
    params.append("owner", filtroDuenoInput.value.trim());
    params.append("phone", filtroTelefonoInput.value.trim());
  }

  const query = params.toString();
  const url = query ? `${DOGS_API}?${query}` : DOGS_API;
  const response = await apiFetch(url);

  if (!response.ok) {
    throw new Error("No se pudo cargar el listado de perritos");
  }
  return response.json();
}

async function fetchDogsByPhone(phone) {
  const response = await apiFetch(`${DOGS_API}/by-phone/${encodeURIComponent(phone)}`);
  if (!response.ok) {
    throw new Error("No se pudo buscar por teléfono");
  }
  return response.json();
}

async function fetchDogHistory(dogId) {
  const response = await apiFetch(`${DOGS_API}/${dogId}/history`);
  if (!response.ok) {
    throw new Error("No se pudo cargar el historial de servicios");
  }
  return response.json();
}

async function fetchAppointmentsByDate(date) {
  const response = await apiFetch(`${APPOINTMENTS_API}?date=${encodeURIComponent(date)}`);
  if (!response.ok) {
    throw new Error("No se pudo cargar la agenda del día");
  }
  return response.json();
}

async function createDogFromPayload(payload) {
  const response = await apiFetch(DOGS_API, {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo guardar el perrito");
  }

  return response.json();
}

async function createDog() {
  const payload = new FormData();
  if (fotoInput.files[0]) {
    payload.append("foto", fotoInput.files[0]);
  }

  payload.append("nombre", nombreInput.value.trim());
  payload.append("raza", razaInput.value.trim());
  payload.append("caracter", caracterInput.value.trim());
  payload.append("pelaje", pelajeInput.value.trim());
  payload.append("duenoNombre", duenoNombreInput.value.trim());
  payload.append("duenoTelefono", normalizePhone(duenoTelefonoInput.value));
  payload.append("duenoDireccion", duenoDireccionInput.value.trim());
  payload.append("duenoNotas", duenoNotasInput.value.trim());
  payload.append("ultimoServicio", servicioInput.value.trim());
  payload.append("fechaUltimoServicio", fechaServicioInput.value);

  await createDogFromPayload(payload);
}

async function createDogFromTurno(phone) {
  const nombre = nuevoPerroNombreInput.value.trim();
  const raza = nuevoPerroRazaInput.value.trim();
  const caracter = nuevoPerroCaracterInput.value.trim();
  const pelaje = nuevoPerroPelajeInput.value.trim();
  const duenoNombre = nuevoDuenoNombreInput.value.trim();

  if (!nombre || !raza || !caracter || !pelaje || !duenoNombre) {
    throw new Error("Completá nombre, raza, carácter, pelaje y dueño para registrar el perrito nuevo");
  }

  const payload = new FormData();
  payload.append("nombre", nombre);
  payload.append("raza", raza);
  payload.append("caracter", caracter);
  payload.append("pelaje", pelaje);
  payload.append("duenoNombre", duenoNombre);
  payload.append("duenoTelefono", phone);
  payload.append("duenoDireccion", nuevoDuenoDireccionInput.value.trim());
  payload.append("duenoNotas", nuevoDuenoNotasInput.value.trim());
  payload.append("ultimoServicio", turnoServicioInput.value.trim() || "Primer turno agendado");
  payload.append("fechaUltimoServicio", turnoFechaInput.value || todayIsoDate());

  return createDogFromPayload(payload);
}

async function updateService(dogId, ultimoServicio, fechaUltimoServicio) {
  const response = await apiFetch(`${DOGS_API}/${dogId}/service`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ultimoServicio, fechaUltimoServicio }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo actualizar el servicio");
  }
}

async function deleteDog(dogId) {
  const response = await apiFetch(`${DOGS_API}/${dogId}`, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo eliminar el perrito");
  }
}

async function createAppointment(dogId) {
  const payload = {
    dogId,
    fechaTurno: turnoFechaInput.value,
    horaTurno: turnoHoraInput.value,
    servicio: turnoServicioInput.value.trim(),
    notas: turnoNotasInput.value.trim(),
  };

  const response = await apiFetch(APPOINTMENTS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo guardar el turno");
  }
}

async function deleteAppointment(appointmentId) {
  const response = await apiFetch(`${APPOINTMENTS_API}/${appointmentId}`, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo eliminar el turno");
  }
}

async function searchDogsForTurno() {
  const phone = normalizePhone(turnoTelefonoInput.value);
  if (!phone) {
    alert("Ingresá un teléfono válido para buscar.");
    return;
  }

  try {
    const dogs = await fetchDogsByPhone(phone);
    setDogSelectOptions(dogs);
    if (!dogs.length) {
      toggleNewDogForm(true);
      return;
    }
    toggleNewDogForm(false);
  } catch (error) {
    alert(error.message);
  }
}

async function renderDogs() {
  let dogs = [];
  try {
    dogs = await fetchDogs(true);
  } catch (error) {
    dogList.innerHTML = `<p class='empty'>${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!dogs.length) {
    dogList.innerHTML = "<p class='empty'>No hay resultados con ese filtro.</p>";
    return;
  }

  dogList.innerHTML = dogs
    .map(
      (dog) => `
      <article class="card">
        <img src="${dog.foto_url || "https://via.placeholder.com/110?text=Sin+foto"}" alt="Foto de ${escapeHtml(dog.nombre)}" />
        <div class="info">
          <p><strong>Nombre:</strong> ${escapeHtml(dog.nombre)}</p>
          <p><strong>Raza:</strong> ${escapeHtml(dog.raza)}</p>
          <p><strong>Carácter:</strong> ${escapeHtml(dog.caracter)}</p>
          <p><strong>Pelaje:</strong> ${escapeHtml(dog.pelaje)}</p>
          <p><strong>Dueño/a:</strong> ${escapeHtml(dog.dueno_nombre)}</p>
          <p><strong>Teléfono:</strong> ${escapeHtml(dog.dueno_telefono)}</p>
          <p><strong>Dirección:</strong> ${escapeHtml(dog.dueno_direccion || "-")}</p>
          <p><strong>Último servicio:</strong> ${escapeHtml(dog.ultimo_servicio)}</p>
          <p><strong>Fecha:</strong> ${formatDate(dog.fecha_ultimo_servicio)}</p>

          <div class="actions">
            <button type="button" data-update="${dog.id}" data-service="${escapeHtml(dog.ultimo_servicio)}" data-date="${escapeHtml(
              dog.fecha_ultimo_servicio
            )}">Actualizar último servicio</button>
            <button type="button" data-history="${dog.id}" data-name="${escapeHtml(dog.nombre)}">Ver historial</button>
            <button type="button" class="secondary" data-delete="${dog.id}">Eliminar</button>
          </div>
        </div>
      </article>
    `
    )
    .join("");
}

async function renderDogsCount() {
  try {
    const dogs = await fetchDogs(false);
    dogsCountLabel.textContent = `Total de perritos registrados: ${dogs.length}`;
  } catch {
    dogsCountLabel.textContent = "Total de perritos registrados: -";
  }
}

async function renderAppointments() {
  const date = agendaFechaInput.value;
  if (!date) {
    appointmentList.innerHTML = "<p class='empty'>Seleccioná una fecha para ver turnos.</p>";
    currentAppointments = [];
    return;
  }

  try {
    const appointments = await fetchAppointmentsByDate(date);
    currentAppointments = appointments;
  } catch (error) {
    appointmentList.innerHTML = `<p class='empty'>${escapeHtml(error.message)}</p>`;
    currentAppointments = [];
    return;
  }

  if (!currentAppointments.length) {
    appointmentList.innerHTML = "<p class='empty'>No hay turnos para ese día.</p>";
    return;
  }

  appointmentList.innerHTML = currentAppointments
    .map(
      (appointment) => `
      <article class="appointment-item">
        <p><strong>Hora:</strong> ${escapeHtml(appointment.hora_turno)}</p>
        <p><strong>Perrito:</strong> ${escapeHtml(appointment.perro_nombre)} (${escapeHtml(appointment.perro_raza)})</p>
        <p><strong>Dueño/a:</strong> ${escapeHtml(appointment.dueno_nombre)} · ${escapeHtml(appointment.dueno_telefono)}</p>
        <p><strong>Servicio:</strong> ${escapeHtml(appointment.servicio)}</p>
        <p><strong>Notas:</strong> ${escapeHtml(appointment.notas || "-")}</p>
        <div class="actions">
          <button type="button" class="secondary" data-delete-appointment="${appointment.id}">Eliminar turno</button>
        </div>
      </article>
    `
    )
    .join("");
}

function buildAppointmentExportRows() {
  return currentAppointments.map((appointment) => ({
    fecha: formatDate(appointment.fecha_turno),
    hora: appointment.hora_turno,
    perrito: appointment.perro_nombre,
    raza: appointment.perro_raza,
    dueno: appointment.dueno_nombre,
    telefono: appointment.dueno_telefono,
    servicio: appointment.servicio,
    notas: appointment.notas || "",
  }));
}

function exportAppointmentsToCsv() {
  if (!currentAppointments.length) {
    alert("No hay turnos agendados para exportar en ese día.");
    return;
  }

  const rows = buildAppointmentExportRows();
  const header = ["Fecha", "Hora", "Perrito", "Raza", "Dueño/a", "Teléfono", "Servicio", "Notas"];

  const csvLines = [header.map(toCsvValue).join(",")];
  rows.forEach((row) => {
    csvLines.push(
      [row.fecha, row.hora, row.perrito, row.raza, row.dueno, row.telefono, row.servicio, row.notas]
        .map(toCsvValue)
        .join(",")
    );
  });

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `turnos_${agendaFechaInput.value || todayIsoDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportAppointmentsToPdf() {
  if (!currentAppointments.length) {
    alert("No hay turnos agendados para exportar en ese día.");
    return;
  }

  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    alert("No se pudo cargar la librería de PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  const rows = buildAppointmentExportRows().map((row) => [
    row.fecha,
    row.hora,
    row.perrito,
    row.raza,
    row.dueno,
    row.telefono,
    row.servicio,
    row.notas,
  ]);

  doc.setFontSize(14);
  doc.text(`Turnos del día ${formatDate(agendaFechaInput.value)}`, 14, 14);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 20);

  if (typeof doc.autoTable !== "function") {
    alert("No se pudo cargar la tabla PDF.");
    return;
  }

  doc.autoTable({
    startY: 24,
    head: [["Fecha", "Hora", "Perrito", "Raza", "Dueño/a", "Teléfono", "Servicio", "Notas"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`turnos_${agendaFechaInput.value || todayIsoDate()}.pdf`);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await createDog();
    form.reset();
    fechaServicioInput.value = todayIsoDate();
    await renderDogs();
    await renderDogsCount();
  } catch (error) {
    alert(error.message);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showLoginError("");

  try {
    await login(loginUserInput.value.trim(), loginPasswordInput.value);
    loginForm.reset();
    loginPasswordInput.type = "password";
    setLoggedInState(true);
    await initAppData();
  } catch (error) {
    showLoginError(error.message);
  }
});

showPasswordInput.addEventListener("change", () => {
  loginPasswordInput.type = showPasswordInput.checked ? "text" : "password";
});

logoutButton.addEventListener("click", async () => {
  try {
    await logout();
  } catch {
    setAuthToken("");
  }

  setLoggedInState(false);
  showLoginError("");
});

appointmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!turnoFechaInput.value || !turnoHoraInput.value || !turnoServicioInput.value.trim()) {
    alert("Completá fecha, hora y servicio del turno.");
    return;
  }

  const phone = normalizePhone(turnoTelefonoInput.value);
  if (!phone) {
    alert("Ingresá el teléfono del dueño.");
    return;
  }

  let dogId = Number(turnoDogIdInput.value);

  try {
    if (!dogId) {
      const createdDog = await createDogFromTurno(phone);
      dogId = createdDog.id;
      const dogs = await fetchDogsByPhone(phone);
      setDogSelectOptions(dogs);
      turnoDogIdInput.value = String(dogId);
      toggleNewDogForm(false);
      await renderDogsCount();
    }

    await createAppointment(dogId);
    const previousDate = turnoFechaInput.value;
    const previousPhone = turnoTelefonoInput.value;
    appointmentForm.reset();
    turnoFechaInput.value = previousDate || todayIsoDate();
    turnoTelefonoInput.value = previousPhone;
    if (agendaFechaInput.value === turnoFechaInput.value) {
      await renderAppointments();
    }
    await renderDogs();
  } catch (error) {
    alert(error.message);
  }
});

dogList.addEventListener("click", async (event) => {
  const target = event.target;
  const updateId = target.getAttribute("data-update");
  const deleteId = target.getAttribute("data-delete");
  const historyId = target.getAttribute("data-history");
  const dogName = target.getAttribute("data-name") || "";

  if (updateId) {
    const servicioActual = target.getAttribute("data-service") || "";
    const fechaActual = target.getAttribute("data-date") || todayIsoDate();

    const nuevoServicio = prompt("Ingresá el último servicio realizado:", servicioActual);
    if (!nuevoServicio) return;

    const nuevaFecha = prompt("Ingresá la fecha (YYYY-MM-DD):", fechaActual);
    if (!nuevaFecha) return;

    try {
      await updateService(updateId, nuevoServicio.trim(), nuevaFecha.trim());
      await renderDogs();
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (historyId) {
    try {
      const history = await fetchDogHistory(historyId);
      if (!history.length) {
        alert("Todavía no hay historial previo para este perrito.");
        return;
      }

      const lines = [`Historial de ${dogName}:`];
      history.forEach((entry, index) => {
        const nextEntry = history[index + 1];
        const base = `- ${formatDate(entry.fecha_servicio)}: ${entry.servicio}`;
        if (!nextEntry) {
          lines.push(base);
          return;
        }
        const intervalo = daysBetween(entry.fecha_servicio, nextEntry.fecha_servicio);
        lines.push(`${base} (intervalo aprox.: ${intervalo} días)`);
      });

      alert(lines.join("\n"));
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (deleteId) {
    const confirmed = confirm("¿Eliminar este perrito del registro?");
    if (!confirmed) return;

    try {
      await deleteDog(deleteId);
      await renderDogs();
      await renderDogsCount();
      await renderAppointments();
    } catch (error) {
      alert(error.message);
    }
  }
});

appointmentList.addEventListener("click", async (event) => {
  const target = event.target;
  const appointmentId = target.getAttribute("data-delete-appointment");
  if (!appointmentId) return;

  const confirmed = confirm("¿Eliminar este turno?");
  if (!confirmed) return;

  try {
    await deleteAppointment(appointmentId);
    await renderAppointments();
  } catch (error) {
    alert(error.message);
  }
});

buscarPorTelefonoButton.addEventListener("click", () => {
  searchDogsForTurno();
});

filtroNombreInput.addEventListener("input", () => {
  renderDogs();
});

filtroDuenoInput.addEventListener("input", () => {
  renderDogs();
});

filtroTelefonoInput.addEventListener("input", () => {
  renderDogs();
});

agendaFechaInput.addEventListener("change", () => {
  renderAppointments();
});

exportExcelButton.addEventListener("click", () => {
  exportAppointmentsToCsv();
});

exportPdfButton.addEventListener("click", () => {
  exportAppointmentsToPdf();
});

tabTurnosButton.addEventListener("click", () => {
  setActiveTab("turnos");
});

tabPerritosButton.addEventListener("click", () => {
  setActiveTab("perritos");
});

async function init() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }

  const isSessionValid = await validateSession();
  if (!isSessionValid) {
    setAuthToken("");
    setLoggedInState(false);
    return;
  }

  setLoggedInState(true);
  await initAppData();
}

async function initAppData() {
  const today = todayIsoDate();
  fechaServicioInput.value = today;
  turnoFechaInput.value = today;
  agendaFechaInput.value = today;
  toggleNewDogForm(false);
  setActiveTab("turnos");
  await renderDogs();
  await renderDogsCount();
  await renderAppointments();
}

init();