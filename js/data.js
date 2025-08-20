// Este archivo maneja toda la lógica de localStorage
const DB_KEY = 'admin-game-db';

// Inicializar la base de datos si no existe
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        const initialDB = {
            users: [
                { id: 1, username: 'Karla', password: 'admin123', role: 'admin' },
                { id: 2, username: 'Denis', password: 'admin123', role: 'admin' }
            ],
            modules: [],
            students_progress: {}
        };
        saveDB(initialDB);
    }
}

// Obtener la base de datos completa
function getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

// Guardar la base de datos completa
function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// --- Funciones de Usuarios ---
function addUser(username, password, role) {
    const db = getDB();
    if (db.users.some(user => user.username === username)) {
        return { success: false, message: 'Usuario ya existe.' };
    }
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    db.users.push({ id: newId, username, password, role });

    // Inicializar el progreso si es estudiante
    if (role === 'student') {
        db.students_progress[username] = {
            score: 0,
            lives: 3,
            megas: 0,
            completedActivities: []
        };
    }
    saveDB(db);
    return { success: true, message: 'Usuario creado correctamente.' };
}

function findUser(username, password) {
    const db = getDB();
    return db.users.find(user => user.username === username && user.password === password);
}

function getAllUsers() {
    const db = getDB();
    return db.users;
}

function updateUser(id, username, password, role) {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id == id);
    if (userIndex === -1) {
        return { success: false, message: 'Usuario no encontrado.' };
    }

    const oldUser = db.users[userIndex];
    const oldUsername = oldUser.username;

    // Verificar si el nuevo nombre de usuario ya existe (excepto para el usuario actual)
    if (db.users.some(u => u.username === username && u.id != id)) {
        return { success: false, message: 'El nombre de usuario ya está en uso.' };
    }

    // Actualizar datos del usuario
    db.users[userIndex].username = username;
    db.users[userIndex].role = role;
    if (password) {
        db.users[userIndex].password = password;
    }

    // Si el usuario era estudiante y cambia de rol, eliminar su progreso
    if (oldUser.role === 'student' && role !== 'student') {
        delete db.students_progress[oldUsername];
    }
    // Si el usuario cambia de nombre de usuario y es estudiante, actualizar el progreso
    else if (oldUser.role === 'student' && username !== oldUsername) {
        db.students_progress[username] = db.students_progress[oldUsername];
        delete db.students_progress[oldUsername];
    }
    // Si el nuevo rol es estudiante y no tenía progreso, inicializarlo
    else if (role === 'student' && !db.students_progress[username]) {
        db.students_progress[username] = {
            score: 0,
            lives: 3,
            megas: 0,
            completedActivities: []
        };
    }

    saveDB(db);
    return { success: true, message: 'Usuario actualizado correctamente.' };
}

function deleteUser(id) {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id == id);
    if (userIndex === -1) {
        return { success: false, message: 'Usuario no encontrado.' };
    }

    const usernameToDelete = db.users[userIndex].username;
    const roleToDelete = db.users[userIndex].role;

    // Eliminar el usuario del array
    db.users.splice(userIndex, 1);

    // Eliminar el progreso si era estudiante
    if (roleToDelete === 'student') {
        delete db.students_progress[usernameToDelete];
    }

    saveDB(db);
    return { success: true, message: 'Usuario eliminado correctamente.' };
}


// --- Funciones de Módulos, Unidades y Actividades ---
function getAllModules() {
    return getDB().modules;
}

function getAllUnits() {
    const db = getDB();
    const allUnits = [];
    db.modules.forEach(m => {
        allUnits.push(...m.units.map(u => ({ ...u, moduleId: m.id })));
    });
    return allUnits;
}

function getAllActivities() {
    const db = getDB();
    const allActivities = [];
    db.modules.forEach(m => {
        m.units.forEach(u => {
            allActivities.push(...u.activities.map(a => ({ ...a, unitId: u.id, unitName: u.name, moduleId: m.id, moduleName: m.name })));
        });
    });
    return allActivities;
}

function addModule(name) {
    const db = getDB();
    const newModule = {
        id: db.modules.length > 0 ? Math.max(...db.modules.map(m => m.id)) + 1 : 1,
        name: name,
        units: []
    };
    db.modules.push(newModule);
    saveDB(db);
    return { success: true, message: 'Módulo creado correctamente.' };
}

function updateModule(id, name) {
    const db = getDB();
    const module = db.modules.find(m => m.id == id);
    if (!module) return { success: false, message: 'Módulo no encontrado.' };
    module.name = name;
    saveDB(db);
    return { success: true, message: 'Módulo actualizado correctamente.' };
}

function deleteModule(id) {
    const db = getDB();
    const initialLength = db.modules.length;
    db.modules = db.modules.filter(m => m.id != id);
    if (db.modules.length === initialLength) return { success: false, message: 'Módulo no encontrado.' };
    saveDB(db);
    return { success: true, message: 'Módulo eliminado correctamente.' };
}

function addUnit(moduleId, name) {
    const db = getDB();
    const module = db.modules.find(m => m.id == moduleId);
    if (!module) return { success: false, message: 'Módulo no encontrado.' };
    const newId = module.units.length > 0 ? Math.max(...module.units.map(u => u.id)) + 1 : 1;
    const newUnit = {
        id: newId,
        name: name,
        activities: []
    };
    module.units.push(newUnit);
    saveDB(db);
    return { success: true, message: 'Unidad creada correctamente.' };
}

function updateUnit(id, name) {
    const db = getDB();
    let unit = null;
    db.modules.forEach(m => {
        const found = m.units.find(u => u.id == id);
        if (found) unit = found;
    });
    if (!unit) return { success: false, message: 'Unidad no encontrada.' };
    unit.name = name;
    saveDB(db);
    return { success: true, message: 'Unidad actualizada correctamente.' };
}

function deleteUnit(id) {
    const db = getDB();
    let found = false;
    db.modules.forEach(m => {
        const initialLength = m.units.length;
        m.units = m.units.filter(u => u.id != id);
        if (m.units.length !== initialLength) found = true;
    });
    if (!found) return { success: false, message: 'Unidad no encontrada.' };
    saveDB(db);
    return { success: true, message: 'Unidad eliminada correctamente.' };
}

function addActivity(unitId, name, difficulty, questions) {
    const db = getDB();
    let foundUnit = null;
    db.modules.forEach(m => {
        const unit = m.units.find(u => u.id == unitId);
        if (unit) foundUnit = unit;
    });

    if (!foundUnit) return { success: false, message: 'Unidad no encontrada.' };
    
    const newId = foundUnit.activities.length > 0 ? Math.max(...foundUnit.activities.map(a => a.id)) + 1 : 1;
    const newActivity = {
        id: newId,
        name: name,
        difficulty: difficulty,
        questions: questions
    };
    foundUnit.activities.push(newActivity);
    saveDB(db);
    return { success: true, message: 'Actividad y test creados correctamente.' };
}

function updateActivity(id, name, difficulty, questions) {
    const db = getDB();
    let activity = null;
    db.modules.forEach(m => {
        m.units.forEach(u => {
            const found = u.activities.find(a => a.id == id);
            if (found) activity = found;
        });
    });
    if (!activity) return { success: false, message: 'Actividad no encontrada.' };

    activity.name = name;
    activity.difficulty = difficulty;
    activity.questions = questions;
    saveDB(db);
    return { success: true, message: 'Actividad actualizada correctamente.' };
}

function deleteActivity(id) {
    const db = getDB();
    let found = false;
    db.modules.forEach(m => {
        m.units.forEach(u => {
            const initialLength = u.activities.length;
            u.activities = u.activities.filter(a => a.id != id);
            if (u.activities.length !== initialLength) found = true;
        });
    });
    if (!found) return { success: false, message: 'Actividad no encontrada.' };
    saveDB(db);
    return { success: true, message: 'Actividad eliminada correctamente.' };
}

// --- Funciones de Progreso del Estudiante ---
function getStudentProgress(username) {
    const db = getDB();
    return db.students_progress[username];
}

function updateStudentProgress(username, score, lives, megas, activityId) {
    const db = getDB();
    const progress = db.students_progress[username];
    if (progress) {
        progress.score += score;
        progress.lives = lives;
        progress.megas += megas;
        if (!progress.completedActivities.includes(activityId)) {
            progress.completedActivities.push(activityId);
        }
        saveDB(db);
    }
}

// Inicializamos la base de datos al cargar el script
initDB();