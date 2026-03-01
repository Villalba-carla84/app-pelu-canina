const form = document.getElementById("dogForm");
const loginScreen = document.getElementById("loginScreen");
const appRoot = document.getElementById("appRoot");
const loginForm = document.getElementById("loginForm");
const loginUserInput = document.getElementById("loginUser");
const loginPasswordInput = document.getElementById("loginPassword");
const showPasswordInput = document.getElementById("showPassword");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");
const connectionStatus = document.getElementById("connectionStatus");
const fotoInput = document.getElementById("foto");
const fotoCamaraInput = document.getElementById("fotoCamara");
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
const dogDetail = document.getElementById("dogDetail");

const tabRegistroButton = document.getElementById("tabRegistro");
const tabPerritosButton = document.getElementById("tabPerritos");
const tabCargaTurnosButton = document.getElementById("tabCargaTurnos");
const tabAgendaButton = document.getElementById("tabAgenda");
const panelRegistro = document.getElementById("panelRegistro");
const panelPerritos = document.getElementById("panelPerritos");
const panelCargaTurnos = document.getElementById("panelCargaTurnos");
const panelAgenda = document.getElementById("panelAgenda");

const appointmentForm = document.getElementById("appointmentForm");
const turnoTelefonoInput = document.getElementById("turnoTelefono");
const buscarPorTelefonoButton = document.getElementById("buscarPorTelefono");
const turnoDogIdInput = document.getElementById("turnoDogId");
const turnoFechaInput = document.getElementById("turnoFecha");
const turnoHoraInput = document.getElementById("turnoHora");
const turnoServicioInput = document.getElementById("turnoServicio");
const turnoNotasInput = document.getElementById("turnoNotas");
const agendaModoInput = document.getElementById("agendaModo");
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
const DOGS_CACHE_KEY = "narices_frias_dogs_cache";
const APPOINTMENTS_CACHE_KEY = "narices_frias_appointments_cache";
const PENDING_APPOINTMENTS_KEY = "narices_frias_pending_appointments";

let currentAppointments = [];
let currentDogs = [];
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

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isLikelyNetworkError(error) {
  const text = String(error?.message || "").toLowerCase();
  return text.includes("failed to fetch") || text.includes("network") || text.includes("conexión");
}

async function getApiErrorMessage(response, fallbackMessage) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data?.error || fallbackMessage;
    }

    const text = await response.text();
    if (text && text.trim().startsWith("<!DOCTYPE")) {
      return `${fallbackMessage}. Posible desincronización entre frontend y backend en el deploy.`;
    }
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online
    ? "En línea · los cambios se guardan en servidor"
    : "Sin conexión · los turnos se guardan pendientes";
  connectionStatus.classList.toggle("online", online);
  connectionStatus.classList.toggle("offline", !online);
}

function getCachedDogs() {
  return readJsonStorage(DOGS_CACHE_KEY, []);
}

function setCachedDogs(dogs) {
  writeJsonStorage(DOGS_CACHE_KEY, dogs);
}

function getCachedAppointmentsByDate() {
  return readJsonStorage(APPOINTMENTS_CACHE_KEY, {});
}

function setCachedAppointmentsForDate(date, appointments) {
  const cache = getCachedAppointmentsByDate();
  cache[date] = appointments;
  writeJsonStorage(APPOINTMENTS_CACHE_KEY, cache);
}

function getPendingAppointments() {
  return readJsonStorage(PENDING_APPOINTMENTS_KEY, []);
}

function setPendingAppointments(pending) {
  writeJsonStorage(PENDING_APPOINTMENTS_KEY, pending);
}

function queuePendingAppointment(pendingAppointment) {
  const pending = getPendingAppointments();
  pending.push(pendingAppointment);
  setPendingAppointments(pending);
}

function removePendingAppointmentById(pendingId) {
  const pending = getPendingAppointments().filter((item) => item.localId !== pendingId);
  setPendingAppointments(pending);
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
    throw new Error(await getApiErrorMessage(response, "No se pudo iniciar sesión"));
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
  const isRegistro = tabName === "registro";
  const isPerritos = tabName === "perritos";
  const isCargaTurnos = tabName === "carga-turnos";
  const isAgenda = tabName === "agenda";

  panelRegistro.classList.toggle("tab-hidden", !isRegistro);
  panelPerritos.classList.toggle("tab-hidden", !isPerritos);
  panelCargaTurnos.classList.toggle("tab-hidden", !isCargaTurnos);
  panelAgenda.classList.toggle("tab-hidden", !isAgenda);

  tabRegistroButton.classList.toggle("active", isRegistro);
  tabPerritosButton.classList.toggle("active", isPerritos);
  tabCargaTurnosButton.classList.toggle("active", isCargaTurnos);
  tabAgendaButton.classList.toggle("active", isAgenda);
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

  try {
    const response = await apiFetch(url);
    if (!response.ok) {
      throw new Error("No se pudo cargar el listado de perritos");
    }

    const dogs = await response.json();
    if (!filtered) {
      setCachedDogs(dogs);
    }
    return dogs;
  } catch (error) {
    const cachedDogs = getCachedDogs();
    if (!cachedDogs.length) {
      throw error;
    }

    if (!filtered) {
      return cachedDogs;
    }

    const byName = filtroNombreInput.value.trim().toLowerCase();
    const byOwner = filtroDuenoInput.value.trim().toLowerCase();
    const byPhone = normalizePhone(filtroTelefonoInput.value);

    return cachedDogs.filter((dog) => {
      const matchName = !byName || String(dog.nombre || "").toLowerCase().includes(byName);
      const matchOwner = !byOwner || String(dog.dueno_nombre || "").toLowerCase().includes(byOwner);
      const normalizedDogPhone = normalizePhone(dog.dueno_telefono || "");
      const matchPhone = !byPhone || normalizedDogPhone.includes(byPhone);
      return matchName && matchOwner && matchPhone;
    });
  }
}

async function fetchDogsByPhone(phone) {
  try {
    const response = await apiFetch(`${DOGS_API}/by-phone/${encodeURIComponent(phone)}`);
    if (!response.ok) {
      throw new Error("No se pudo buscar por teléfono");
    }
    const dogs = await response.json();

    const existing = getCachedDogs();
    const mergedById = new Map(existing.map((dog) => [dog.id, dog]));
    dogs.forEach((dog) => mergedById.set(dog.id, dog));
    setCachedDogs(Array.from(mergedById.values()));
    return dogs;
  } catch (error) {
    const normalizedPhone = normalizePhone(phone);
    const cached = getCachedDogs().filter((dog) => normalizePhone(dog.dueno_telefono || "") === normalizedPhone);
    if (!cached.length) {
      throw error;
    }
    return cached;
  }
}

async function fetchDogHistory(dogId) {
  const response = await apiFetch(`${DOGS_API}/${dogId}/history`);
  if (!response.ok) {
    throw new Error("No se pudo cargar el historial de servicios");
  }
  return response.json();
}

async function fetchDogAppointments(dogId) {
  const response = await apiFetch(`${DOGS_API}/${dogId}/appointments`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los turnos del perrito");
  }
  return response.json();
}

async function fetchAppointmentsByDate(date) {
  try {
    const response = await apiFetch(`${APPOINTMENTS_API}?date=${encodeURIComponent(date)}`);
    if (!response.ok) {
      throw new Error("No se pudo cargar la agenda del día");
    }
    const appointments = await response.json();
    setCachedAppointmentsForDate(date, appointments);
    return appointments;
  } catch (error) {
    const cached = getCachedAppointmentsByDate();
    if (cached[date]) {
      return cached[date];
    }
    throw error;
  }
}

async function createDogFromPayload(payload) {
  const response = await apiFetch(DOGS_API, {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "No se pudo guardar el perrito"));
  }

  return response.json();
}

async function createDog() {
  const payload = new FormData();
  const selectedPhoto = fotoCamaraInput.files[0] || fotoInput.files[0];
  if (selectedPhoto) {
    payload.append("foto", selectedPhoto);
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
    throw new Error(await getApiErrorMessage(response, "No se pudo actualizar el servicio"));
  }
}

async function deleteDog(dogId) {
  const response = await apiFetch(`${DOGS_API}/${dogId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "No se pudo eliminar el perrito"));
  }
}

async function createAppointment(payload) {
  const response = await apiFetch(APPOINTMENTS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "No se pudo guardar el turno"));
  }

  return response.json();
}

async function deleteAppointment(appointmentId) {
  const response = await apiFetch(`${APPOINTMENTS_API}/${appointmentId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "No se pudo eliminar el turno"));
  }
}

async function completeAppointment(appointmentId, payload) {
  const response = await apiFetch(`${APPOINTMENTS_API}/${appointmentId}/complete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "No se pudo registrar la atención"));
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

async function syncPendingAppointments() {
  if (!navigator.onLine) {
    return;
  }

  const pending = getPendingAppointments();
  if (!pending.length) {
    return;
  }

  const remaining = [];

  for (const item of pending) {
    try {
      await createAppointment({
        dogId: item.dogId,
        fechaTurno: item.fechaTurno,
        horaTurno: item.horaTurno,
        servicio: item.servicio,
        notas: item.notas,
      });
    } catch {
      remaining.push(item);
    }
  }

  setPendingAppointments(remaining);
}

function renderDogDetail(dog) {
  if (!dog) {
    dogDetail.classList.add("hidden");
    dogDetail.removeAttribute("data-dog-id");
    dogDetail.innerHTML = "";
    return;
  }

  dogDetail.classList.remove("hidden");
  dogDetail.setAttribute("data-dog-id", String(dog.id));
  dogDetail.innerHTML = `
    <div class="actions detail-top-actions">
      <button type="button" class="secondary" data-close-detail="true">← Volver al listado</button>
    </div>
    <h3 class="dog-detail-title">Detalle de ${escapeHtml(dog.nombre)}</h3>
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
        <p><strong>Notas:</strong> ${escapeHtml(dog.dueno_notas || "-")}</p>
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
    <section class="panel">
      <h4 class="dog-detail-title">Turnos del perrito</h4>
      <div id="dogAppointmentsDetail">Cargando turnos...</div>
    </section>
  `;

  loadDogAppointmentsInDetail(dog.id);
}

async function loadDogAppointmentsInDetail(dogId) {
  const detailContainer = document.getElementById("dogAppointmentsDetail");
  if (!detailContainer) return;

  try {
    const appointments = await fetchDogAppointments(dogId);
    if (dogDetail.getAttribute("data-dog-id") !== String(dogId)) {
      return;
    }

    if (!appointments.length) {
      detailContainer.innerHTML = "<p class='empty'>Este perrito todavía no tiene turnos.</p>";
      return;
    }

    detailContainer.innerHTML = appointments
      .map(
        (appointment) => `
        <article class="appointment-item">
          <p><strong>Fecha:</strong> ${formatDate(appointment.fecha_turno)} ${escapeHtml(appointment.hora_turno)}</p>
          <p><strong>Servicio agendado:</strong> ${escapeHtml(appointment.servicio)}</p>
          <p><strong>Estado:</strong> ${escapeHtml(appointment.estado || "pendiente")}</p>
          <p><strong>Atención realizada:</strong> ${escapeHtml(appointment.servicio_realizado || "-")}</p>
        </article>
      `
      )
      .join("");
  } catch {
    detailContainer.innerHTML = "<p class='empty'>No se pudieron cargar los turnos del perrito.</p>";
  }
}

async function renderDogs() {
  const selectedDogId = dogDetail.getAttribute("data-dog-id") || "";
  let dogs = [];
  try {
    dogs = await fetchDogs(true);
  } catch (error) {
    dogList.innerHTML = `<p class='empty'>${escapeHtml(error.message)}</p>`;
    renderDogDetail(null);
    return;
  }

  dogs.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" }));
  currentDogs = dogs;

  if (!dogs.length) {
    dogList.innerHTML = "<p class='empty'>No hay resultados con ese filtro.</p>";
    renderDogDetail(null);
    return;
  }

  dogList.innerHTML = dogs
    .map(
      (dog) => `
      <button type="button" class="dog-summary-card" data-open-dog="${dog.id}">
        <img src="${dog.foto_url || "https://via.placeholder.com/110?text=Sin+foto"}" alt="Foto de ${escapeHtml(dog.nombre)}" />
        <div>
          <p><strong>${escapeHtml(dog.nombre)}</strong></p>
          <p>Dueño/a: ${escapeHtml(dog.dueno_nombre)}</p>
        </div>
      </button>
    `
    )
    .join("");

  const dogToShow = selectedDogId ? dogs.find((dog) => String(dog.id) === String(selectedDogId)) : null;
  if (dogToShow) {
    dogDetail.setAttribute("data-dog-id", String(dogToShow.id));
    renderDogDetail(dogToShow);
  } else {
    renderDogDetail(null);
  }
}

async function renderDogsCount() {
  try {
    const dogs = await fetchDogs(false);
    dogsCountLabel.textContent = `Total de perritos registrados: ${dogs.length}`;
  } catch {
    dogsCountLabel.textContent = "Total de perritos registrados: -";
  }
}

function getWeekDates(baseDate) {
  const [year, month, day] = String(baseDate).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + mondayOffset);

  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    const current = new Date(date);
    current.setDate(date.getDate() + index);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
  }

  return dates;
}

function mapPendingForDate(date) {
  return getPendingAppointments()
    .filter((item) => item.fechaTurno === date)
    .map((item) => ({
      id: item.localId,
      dog_id: item.dogId,
      fecha_turno: item.fechaTurno,
      hora_turno: item.horaTurno,
      servicio: item.servicio,
      notas: item.notas,
      perro_nombre: item.perroNombre,
      perro_raza: item.perroRaza,
      dueno_nombre: item.duenoNombre,
      dueno_telefono: item.duenoTelefono,
      pending: true,
    }));
}

async function renderAppointments() {
  const date = agendaFechaInput.value;
  const mode = agendaModoInput.value;
  if (!date) {
    appointmentList.innerHTML = "<p class='empty'>Seleccioná una fecha para ver turnos.</p>";
    currentAppointments = [];
    return;
  }

  try {
    if (mode === "dia") {
      const appointments = await fetchAppointmentsByDate(date);
      const pendingForDate = mapPendingForDate(date);
      currentAppointments = [...appointments, ...pendingForDate].sort((a, b) =>
        `${a.fecha_turno} ${a.hora_turno}`.localeCompare(`${b.fecha_turno} ${b.hora_turno}`)
      );
    } else {
      const weekDates = getWeekDates(date);
      const allByWeek = [];

      for (const weekDate of weekDates) {
        let appointmentsForDate = [];
        try {
          appointmentsForDate = await fetchAppointmentsByDate(weekDate);
        } catch {
          appointmentsForDate = [];
        }

        const pendingForDate = mapPendingForDate(weekDate);
        allByWeek.push(...appointmentsForDate, ...pendingForDate);
      }

      currentAppointments = allByWeek.sort((a, b) => `${a.fecha_turno} ${a.hora_turno}`.localeCompare(`${b.fecha_turno} ${b.hora_turno}`));
    }
  } catch (error) {
    if (mode === "dia") {
      currentAppointments = mapPendingForDate(date);
    } else {
      currentAppointments = getWeekDates(date).flatMap((weekDate) => mapPendingForDate(weekDate));
    }

    if (!currentAppointments.length) {
      appointmentList.innerHTML = `<p class='empty'>${escapeHtml(error.message)}</p>`;
      return;
    }
  }

  if (!currentAppointments.length) {
    appointmentList.innerHTML = `<p class='empty'>No hay turnos para ${mode === "dia" ? "ese día" : "esa semana"}.</p>`;
    return;
  }

  appointmentList.innerHTML = currentAppointments
    .map(
      (appointment) => `
      <article class="appointment-item">
        <p><strong>Fecha:</strong> ${formatDate(appointment.fecha_turno)}</p>
        <p><strong>Hora:</strong> ${escapeHtml(appointment.hora_turno)}</p>
        <p><strong>Perrito:</strong> ${escapeHtml(appointment.perro_nombre)} (${escapeHtml(appointment.perro_raza)})${
          appointment.pending ? '<span class="pending-badge">Pendiente</span>' : ""
        }</p>
        <p><strong>Dueño/a:</strong> ${escapeHtml(appointment.dueno_nombre)} · ${escapeHtml(appointment.dueno_telefono)}</p>
        <p><strong>Servicio:</strong> ${escapeHtml(appointment.servicio)}</p>
        <p><strong>Estado:</strong> ${escapeHtml(appointment.estado || (appointment.pending ? "pendiente" : "pendiente"))}</p>
        <p><strong>Atención realizada:</strong> ${escapeHtml(appointment.servicio_realizado || "-")}</p>
        <p><strong>Notas:</strong> ${escapeHtml(appointment.notas || "-")}</p>
        <div class="actions">
          ${!appointment.pending && appointment.estado !== "atendido" ? `<button type="button" data-complete-appointment="${appointment.id}">Registrar atención</button>` : ""}
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
  const modeSuffix = agendaModoInput.value === "semana" ? "semana" : "dia";
  link.download = `turnos_${modeSuffix}_${agendaFechaInput.value || todayIsoDate()}.csv`;
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

  const title = agendaModoInput.value === "semana" ? `Turnos de la semana de ${formatDate(agendaFechaInput.value)}` : `Turnos del día ${formatDate(agendaFechaInput.value)}`;

  doc.setFontSize(14);
  doc.text(title, 14, 14);
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

  const modeSuffix = agendaModoInput.value === "semana" ? "semana" : "dia";
  doc.save(`turnos_${modeSuffix}_${agendaFechaInput.value || todayIsoDate()}.pdf`);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await createDog();
    form.reset();
    fotoCamaraInput.value = "";
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
    updateConnectionStatus();
    setLoggedInState(true);
    await syncPendingAppointments();
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
  const payload = {
    dogId,
    fechaTurno: turnoFechaInput.value,
    horaTurno: turnoHoraInput.value,
    servicio: turnoServicioInput.value.trim(),
    notas: turnoNotasInput.value.trim(),
  };

  try {
    if (!dogId) {
      if (!navigator.onLine) {
        throw new Error("Sin internet no se puede crear un perrito nuevo. Elegí uno existente o conectate.");
      }

      const createdDog = await createDogFromTurno(phone);
      dogId = createdDog.id;
      payload.dogId = dogId;
      const dogs = await fetchDogsByPhone(phone);
      setDogSelectOptions(dogs);
      turnoDogIdInput.value = String(dogId);
      toggleNewDogForm(false);
      await renderDogsCount();
    }

    let savedOffline = false;

    try {
      await createAppointment(payload);
    } catch (error) {
      if (!navigator.onLine || isLikelyNetworkError(error)) {
        const selectedDog = getCachedDogs().find((dog) => Number(dog.id) === Number(payload.dogId));
        if (!selectedDog) {
          throw new Error("No se pudo guardar offline porque no hay datos del perrito en caché.");
        }

        const localId = `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        queuePendingAppointment({
          localId,
          dogId: payload.dogId,
          fechaTurno: payload.fechaTurno,
          horaTurno: payload.horaTurno,
          servicio: payload.servicio,
          notas: payload.notas,
          perroNombre: selectedDog.nombre,
          perroRaza: selectedDog.raza,
          duenoNombre: selectedDog.dueno_nombre,
          duenoTelefono: selectedDog.dueno_telefono,
        });
        savedOffline = true;
      } else {
        throw error;
      }
    }

    const previousDate = turnoFechaInput.value;
    const previousPhone = turnoTelefonoInput.value;
    appointmentForm.reset();
    turnoFechaInput.value = previousDate || todayIsoDate();
    turnoTelefonoInput.value = previousPhone;
    agendaFechaInput.value = turnoFechaInput.value;
    await renderAppointments();
    await renderDogs();
    setActiveTab("agenda");

    if (savedOffline) {
      alert("Turno guardado sin conexión. Se sincronizará automáticamente cuando vuelva internet.");
    }
  } catch (error) {
    alert(error.message);
  }
});

dogList.addEventListener("click", (event) => {
  const target = event.target;
  const openDogId = target.closest("[data-open-dog]")?.getAttribute("data-open-dog");
  if (!openDogId) return;

  const selectedDog = currentDogs.find((dog) => String(dog.id) === String(openDogId));
  if (!selectedDog) return;

  dogDetail.setAttribute("data-dog-id", String(selectedDog.id));
  renderDogDetail(selectedDog);
});

dogDetail.addEventListener("click", async (event) => {
  const target = event.target;
  const closeDetail = target.getAttribute("data-close-detail");
  if (closeDetail) {
    renderDogDetail(null);
    return;
  }

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
      dogDetail.setAttribute("data-dog-id", "");
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
  const completeId = target.getAttribute("data-complete-appointment");
  const appointmentId = target.getAttribute("data-delete-appointment");

  if (completeId) {
    const appointment = currentAppointments.find((item) => String(item.id) === String(completeId));
    if (!appointment) return;

    const servicioRealizado = prompt("¿Qué atención se realizó?", appointment.servicio_realizado || appointment.servicio || "");
    if (!servicioRealizado) return;

    const fechaRealizacion = prompt("Fecha de atención (YYYY-MM-DD)", appointment.fecha_realizacion || appointment.fecha_turno || todayIsoDate());
    if (!fechaRealizacion) return;

    const notasRealizacion = prompt("Notas de la atención (opcional)", appointment.notas_realizacion || "") || "";

    try {
      await completeAppointment(completeId, {
        servicioRealizado: servicioRealizado.trim(),
        fechaRealizacion: fechaRealizacion.trim(),
        notasRealizacion: notasRealizacion.trim(),
      });
      await renderAppointments();
      await renderDogs();
      const selectedDogId = dogDetail.getAttribute("data-dog-id");
      if (selectedDogId) {
        const selectedDog = currentDogs.find((dog) => String(dog.id) === String(selectedDogId));
        if (selectedDog) {
          renderDogDetail(selectedDog);
        }
      }
    } catch (error) {
      alert(error.message);
    }
    return;
  }

  if (!appointmentId) return;

  const confirmed = confirm("¿Eliminar este turno?");
  if (!confirmed) return;

  try {
    if (appointmentId.startsWith("pending-")) {
      removePendingAppointmentById(appointmentId);
    } else {
      await deleteAppointment(appointmentId);
    }
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

tabRegistroButton.addEventListener("click", () => {
  setActiveTab("registro");
});

tabPerritosButton.addEventListener("click", () => {
  setActiveTab("perritos");
});

tabCargaTurnosButton.addEventListener("click", () => {
  setActiveTab("carga-turnos");
});

tabAgendaButton.addEventListener("click", () => {
  setActiveTab("agenda");
});

agendaModoInput.addEventListener("change", () => {
  renderAppointments();
});

window.addEventListener("online", async () => {
  updateConnectionStatus();
  await syncPendingAppointments();
  await renderAppointments();
});

window.addEventListener("offline", () => {
  updateConnectionStatus();
});

async function init() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }

  updateConnectionStatus();

  const isSessionValid = await validateSession();
  if (!isSessionValid) {
    setAuthToken("");
    setLoggedInState(false);
    return;
  }

  setLoggedInState(true);
  await syncPendingAppointments();
  await initAppData();
}

async function initAppData() {
  const today = todayIsoDate();
  fechaServicioInput.value = today;
  turnoFechaInput.value = today;
  agendaModoInput.value = "dia";
  agendaFechaInput.value = today;
  toggleNewDogForm(false);
  setActiveTab("perritos");
  await renderDogs();
  await renderDogsCount();
  await renderAppointments();
}

init();