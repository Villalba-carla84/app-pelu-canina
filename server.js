const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_USER = process.env.APP_USER || "admin";
const AUTH_PASS = process.env.APP_PASS || "narices2026";
const activeTokens = new Map();

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : __dirname;
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(dataDir, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, "data.db");
const db = new sqlite3.Database(dbPath);

db.run("PRAGMA foreign_keys = ON");

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS dogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      foto_url TEXT,
      nombre TEXT NOT NULL,
      raza TEXT NOT NULL,
      caracter TEXT NOT NULL,
      pelaje TEXT NOT NULL,
      dueno_nombre TEXT NOT NULL,
      dueno_telefono TEXT NOT NULL,
      dueno_direccion TEXT,
      dueno_notas TEXT,
      ultimo_servicio TEXT NOT NULL,
      fecha_ultimo_servicio TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS service_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL,
      servicio TEXT NOT NULL,
      fecha_servicio TEXT NOT NULL,
      registrado_en TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL,
      fecha_turno TEXT NOT NULL,
      hora_turno TEXT NOT NULL,
      servicio TEXT NOT NULL,
      notas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
    )
  `);
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_, res) => {
  return res.status(200).json({ status: "ok" });
});

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return "";
  }
  return token;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  req.authUser = activeTokens.get(token);
  req.authToken = token;
  return next();
}

app.post("/api/auth/login", (req, res) => {
  const { username = "", password = "" } = req.body || {};

  if (username !== AUTH_USER || password !== AUTH_PASS) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  activeTokens.set(token, { username });
  return res.json({ token, username });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/auth/login") {
    return next();
  }
  return requireAuth(req, res, next);
});

app.get("/api/auth/me", (req, res) => {
  return res.json({ username: req.authUser.username });
});

app.post("/api/auth/logout", (req, res) => {
  activeTokens.delete(req.authToken);
  return res.status(204).send();
});

app.get("/api/dogs", async (req, res) => {
  const { name = "", phone = "", owner = "" } = req.query;

  const sql = `
    SELECT * FROM dogs
    WHERE nombre LIKE ?
      AND dueno_nombre LIKE ?
      AND dueno_telefono LIKE ?
    ORDER BY id DESC
  `;

  try {
    const rows = await allQuery(sql, [`%${name}%`, `%${owner}%`, `%${phone}%`]);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "No se pudieron obtener los perritos" });
  }
});

app.get("/api/dogs/by-phone/:phone", async (req, res) => {
  const { phone } = req.params;
  const normalizedPhone = String(phone).replace(/\D/g, "");

  if (!normalizedPhone) {
    return res.status(400).json({ error: "El teléfono es obligatorio" });
  }

  try {
    const rows = await allQuery(
      `
        SELECT * FROM dogs
        WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(dueno_telefono, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') = ?
        ORDER BY nombre ASC
      `,
      [normalizedPhone]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "No se pudo buscar por teléfono" });
  }
});

app.get("/api/dogs/:id/history", async (req, res) => {
  const { id } = req.params;

  try {
    const history = await allQuery(
      `
        SELECT id, servicio, fecha_servicio, registrado_en
        FROM service_history
        WHERE dog_id = ?
        ORDER BY fecha_servicio DESC, id DESC
      `,
      [id]
    );
    return res.json(history);
  } catch {
    return res.status(500).json({ error: "No se pudo obtener el historial" });
  }
});

app.post("/api/dogs", upload.single("foto"), async (req, res) => {
  const {
    nombre,
    raza,
    caracter,
    pelaje,
    duenoNombre,
    duenoTelefono,
    duenoDireccion,
    duenoNotas,
    ultimoServicio,
    fechaUltimoServicio,
  } = req.body;

  if (!nombre || !raza || !caracter || !pelaje || !duenoNombre || !duenoTelefono || !ultimoServicio || !fechaUltimoServicio) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const fotoUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const sql = `
    INSERT INTO dogs (
      foto_url, nombre, raza, caracter, pelaje,
      dueno_nombre, dueno_telefono, dueno_direccion, dueno_notas,
      ultimo_servicio, fecha_ultimo_servicio
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    fotoUrl,
    nombre,
    raza,
    caracter,
    pelaje,
    duenoNombre,
    duenoTelefono,
    duenoDireccion || "",
    duenoNotas || "",
    ultimoServicio,
    fechaUltimoServicio,
  ];

  try {
    const insertResult = await runQuery(sql, params);
    const row = await getQuery("SELECT * FROM dogs WHERE id = ?", [insertResult.lastID]);
    return res.status(201).json(row);
  } catch {
    return res.status(500).json({ error: "No se pudo guardar el perrito" });
  }
});

app.put("/api/dogs/:id/service", async (req, res) => {
  const { id } = req.params;
  const { ultimoServicio, fechaUltimoServicio } = req.body;

  if (!ultimoServicio || !fechaUltimoServicio) {
    return res.status(400).json({ error: "Servicio y fecha son obligatorios" });
  }

  try {
    const currentDog = await getQuery("SELECT id, ultimo_servicio, fecha_ultimo_servicio FROM dogs WHERE id = ?", [id]);

    if (!currentDog) {
      return res.status(404).json({ error: "Perrito no encontrado" });
    }

    await runQuery(
      `
        INSERT INTO service_history (dog_id, servicio, fecha_servicio)
        VALUES (?, ?, ?)
      `,
      [id, currentDog.ultimo_servicio, currentDog.fecha_ultimo_servicio]
    );

    await runQuery(
      `
        UPDATE dogs
        SET ultimo_servicio = ?, fecha_ultimo_servicio = ?
        WHERE id = ?
      `,
      [ultimoServicio, fechaUltimoServicio, id]
    );

    const updatedDog = await getQuery("SELECT * FROM dogs WHERE id = ?", [id]);
    return res.json(updatedDog);
  } catch {
    return res.status(500).json({ error: "No se pudo actualizar el servicio" });
  }
});

app.post("/api/appointments", async (req, res) => {
  const { dogId, fechaTurno, horaTurno, servicio, notas } = req.body;

  if (!dogId || !fechaTurno || !horaTurno || !servicio) {
    return res.status(400).json({ error: "Faltan campos obligatorios del turno" });
  }

  try {
    const dogExists = await getQuery("SELECT id FROM dogs WHERE id = ?", [dogId]);
    if (!dogExists) {
      return res.status(404).json({ error: "El perrito no existe" });
    }

    const insert = await runQuery(
      `
        INSERT INTO appointments (dog_id, fecha_turno, hora_turno, servicio, notas)
        VALUES (?, ?, ?, ?, ?)
      `,
      [dogId, fechaTurno, horaTurno, servicio, notas || ""]
    );

    const created = await getQuery(
      `
        SELECT
          a.id,
          a.dog_id,
          a.fecha_turno,
          a.hora_turno,
          a.servicio,
          a.notas,
          d.nombre AS perro_nombre,
          d.dueno_nombre,
          d.dueno_telefono
        FROM appointments a
        INNER JOIN dogs d ON d.id = a.dog_id
        WHERE a.id = ?
      `,
      [insert.lastID]
    );

    return res.status(201).json(created);
  } catch {
    return res.status(500).json({ error: "No se pudo guardar el turno" });
  }
});

app.get("/api/appointments", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "La fecha es obligatoria" });
  }

  try {
    const rows = await allQuery(
      `
        SELECT
          a.id,
          a.dog_id,
          a.fecha_turno,
          a.hora_turno,
          a.servicio,
          a.notas,
          d.nombre AS perro_nombre,
          d.raza AS perro_raza,
          d.dueno_nombre,
          d.dueno_telefono
        FROM appointments a
        INNER JOIN dogs d ON d.id = a.dog_id
        WHERE a.fecha_turno = ?
        ORDER BY a.hora_turno ASC, a.id ASC
      `,
      [date]
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "No se pudieron obtener los turnos" });
  }
});

app.delete("/api/appointments/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await runQuery("DELETE FROM appointments WHERE id = ?", [id]);
    if (!result.changes) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "No se pudo eliminar el turno" });
  }
});

app.delete("/api/dogs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dog = await getQuery("SELECT foto_url FROM dogs WHERE id = ?", [id]);
    if (!dog) {
      return res.status(404).json({ error: "Perrito no encontrado" });
    }

    await runQuery("DELETE FROM dogs WHERE id = ?", [id]);

    if (dog.foto_url) {
      const relativePhotoPath = dog.foto_url.replace(/^\//, "");
      const photoPath = path.join(dataDir, relativePhotoPath);
      fs.unlink(photoPath, () => {});
    }

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "No se pudo eliminar el perrito" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
  console.log(`Usuario: ${AUTH_USER}`);
});
