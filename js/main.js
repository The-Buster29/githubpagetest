document.addEventListener('DOMContentLoaded', () => {

    // Variables globales
    let currentUser = null;
    let currentTest = null;
    let currentTestActivity = null;
    
    // --- Lógica del Splash Screen ---
    const splashScreen = document.getElementById('splash-screen');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const mainContent = document.getElementById('main-content');
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Cargando... ${progress}%`;
        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                splashScreen.classList.add('d-none');
                mainContent.classList.remove('d-none');
                checkAuth();
            }, 500);
        }
    }, 200);

    // --- Funciones de Autenticación y Navegación ---
    function checkAuth() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            showDashboard(currentUser.role);
        } else {
            showAuthForm();
        }
    }

    function showAuthForm() {
        document.getElementById('auth-container').classList.remove('d-none');
        document.getElementById('admin-dashboard').classList.add('d-none');
        document.getElementById('student-dashboard').classList.add('d-none');
    }

    function showDashboard(role) {
        document.getElementById('auth-container').classList.add('d-none');
        if (role === 'admin') {
            document.getElementById('admin-dashboard').classList.remove('d-none');
            loadAdminData();
        } else {
            document.getElementById('student-dashboard').classList.remove('d-none');
            loadStudentData();
        }
    }

    function logout() {
        localStorage.removeItem('currentUser');
        currentUser = null;
        showAuthForm();
    }

    // --- Manejo de Formularios de Autenticación ---
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const user = findUser(username, password);

        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            Swal.fire('¡Bienvenido!', `Has iniciado sesión como ${currentUser.username}`, 'success');
            showDashboard(currentUser.role);
        } else {
            Swal.fire('Error', 'Usuario o contraseña incorrectos.', 'error');
        }
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        const result = addUser(username, password, 'student');
        if (result.success) {
            Swal.fire('¡Registro Exitoso!', result.message, 'success');
            new bootstrap.Tab(document.getElementById('login-tab')).show();
            document.getElementById('register-form').reset();
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    });

    // --- Lógica del Panel de Administración (Karla y Denis) ---
    function loadAdminData() {
        loadAdminSelects();
        loadUsersTable();
        loadAlumnosTable();
        renderModulesUnitsAndActivities();
        document.getElementById('logout-btn').addEventListener('click', logout);
    }
    
    // Carga los selects de Modulos y Unidades para los formularios de creación
    function loadAdminSelects() {
        const db = getDB();
        const unidadModuloSelect = document.getElementById('unidad-modulo');
        const actividadUnidadSelect = document.getElementById('actividad-unidad');

        unidadModuloSelect.innerHTML = '<option value="">Seleccione un Módulo</option>';
        actividadUnidadSelect.innerHTML = '<option value="">Seleccione una Unidad</option>';

        db.modules.forEach(modulo => {
            const option = document.createElement('option');
            option.value = modulo.id;
            option.textContent = modulo.name;
            unidadModuloSelect.appendChild(option);
        });

        getAllUnits().forEach(unidad => {
            const option = document.createElement('option');
            option.value = unidad.id;
            option.textContent = `${unidad.name} (${db.modules.find(m => m.id == unidad.moduleId).name})`;
            actividadUnidadSelect.appendChild(option);
        });
    }

    function renderModulesUnitsAndActivities() {
        const modules = getAllModules();
        const container = document.getElementById('content-tables-container');
        container.innerHTML = '';
    
        if (modules.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay módulos, unidades o actividades creadas.</p>';
            return;
        }

        modules.forEach(module => {
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'mb-5';
            moduleDiv.innerHTML = `
                <div class="card">
                    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <span id="module-name-${module.id}">${module.name}</span>
                        <div>
                            <button class="btn btn-sm btn-light edit-module-btn" data-id="${module.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger delete-module-btn" data-id="${module.id}">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <table class="table table-bordered mb-0">
                            <thead>
                                <tr class="table-secondary">
                                    <th>Unidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${module.units.length > 0 ? module.units.map(unit => `
                                    <tr>
                                        <td>
                                            <span id="unit-name-${unit.id}">${unit.name}</span>
                                            <table class="table table-sm table-striped mt-2 mb-0">
                                                <thead>
                                                    <tr class="table-info">
                                                        <th>Actividad</th>
                                                        <th>Dificultad</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${unit.activities.length > 0 ? unit.activities.map(activity => `
                                                        <tr>
                                                            <td><span id="activity-name-${activity.id}">${activity.name}</span></td>
                                                            <td><span id="activity-difficulty-${activity.id}">${activity.difficulty}</span></td>
                                                            <td>
                                                                <button class="btn btn-sm btn-info edit-activity-btn" data-id="${activity.id}">
                                                                    <i class="fas fa-edit"></i> Editar
                                                                </button>
                                                                <button class="btn btn-sm btn-danger delete-activity-btn" data-id="${activity.id}">
                                                                    <i class="fas fa-trash-alt"></i> Eliminar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    `).join('') : `<tr><td colspan="3">No hay actividades en esta unidad.</td></tr>`}
                                                </tbody>
                                            </table>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-warning edit-unit-btn" data-id="${unit.id}">
                                                <i class="fas fa-edit"></i> Editar
                                            </button>
                                            <button class="btn btn-sm btn-danger delete-unit-btn" data-id="${unit.id}">
                                                <i class="fas fa-trash-alt"></i> Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') : `<tr><td colspan="2">No hay unidades en este módulo.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            container.appendChild(moduleDiv);
        });
    }

    function loadUsersTable() {
        const users = getAllUsers();
        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = '';
    
        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user.id);
            row.innerHTML = `
                <td><span class="editable">${user.username}</span></td>
                <td><span class="editable">${user.role === 'admin' ? 'Administrador' : 'Estudiante'}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${user.id}" data-type="user">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function loadAlumnosTable() {
        const db = getDB();
        const tableBody = document.querySelector('#alumnos-table tbody');
        tableBody.innerHTML = '';

        for (const username in db.students_progress) {
            const progress = db.students_progress[username];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${username}</td>
                <td>${progress.score}</td>
                <td>${(progress.completedActivities.length / getTotalActivities() * 100).toFixed(2)}%</td>
                <td><button class="btn btn-sm btn-info detail-btn" data-username="${username}">Ver Detalle</button></td>
            `;
            tableBody.appendChild(row);
        }
    }
    
    function getTotalActivities() {
        const db = getDB();
        let total = 0;
        db.modules.forEach(m => m.units.forEach(u => total += u.activities.length));
        return total > 0 ? total : 1;
    }

    document.getElementById('form-create-modulo').addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('modulo-nombre').value;
        const result = addModule(nombre);
        if(result.success) {
            Swal.fire('Éxito', result.message, 'success');
            document.getElementById('form-create-modulo').reset();
            loadAdminSelects();
            renderModulesUnitsAndActivities();
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    });

    document.getElementById('form-create-unidad').addEventListener('submit', (e) => {
        e.preventDefault();
        const moduleId = document.getElementById('unidad-modulo').value;
        const nombre = document.getElementById('unidad-nombre').value;
        const result = addUnit(moduleId, nombre);
        if(result.success) {
            Swal.fire('Éxito', result.message, 'success');
            document.getElementById('form-create-unidad').reset();
            loadAdminSelects();
            renderModulesUnitsAndActivities();
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    });

    let questionCounter = 0;
    document.getElementById('add-question-btn').addEventListener('click', () => {
        const container = document.getElementById('test-questions-container');
        const questionHtml = `
            <div class="card my-3" data-question-id="${questionCounter}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    Pregunta ${questionCounter + 1}
                    <button type="button" class="btn-close remove-question-btn"></button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Texto de la Pregunta</label>
                        <input type="text" class="form-control question-text" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Opciones (separadas por comas)</label>
                        <input type="text" class="form-control question-options" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Respuesta Correcta (exactamente como en las opciones)</label>
                        <input type="text" class="form-control question-correct" required>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', questionHtml);
        questionCounter++;
    });

    document.getElementById('form-create-actividad').addEventListener('submit', (e) => {
        e.preventDefault();
        const unidadId = document.getElementById('actividad-unidad').value;
        const nombre = document.getElementById('actividad-nombre').value;
        const dificultad = parseInt(document.getElementById('actividad-dificultad').value);
        
        const questions = [];
        const questionCards = document.querySelectorAll('#test-questions-container .card');
        questionCards.forEach(card => {
            const text = card.querySelector('.question-text').value;
            const options = card.querySelector('.question-options').value.split(',').map(o => o.trim());
            const correct = card.querySelector('.question-correct').value.trim();
            questions.push({ text, options, correct });
        });

        const result = addActivity(unidadId, nombre, dificultad, questions);
        if(result.success) {
            Swal.fire('Éxito', result.message, 'success');
            document.getElementById('form-create-actividad').reset();
            document.getElementById('test-questions-container').innerHTML = '';
            questionCounter = 0;
            loadAdminSelects();
            renderModulesUnitsAndActivities();
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-question-btn')) {
            e.target.closest('.card').remove();
        }
    });

    // --- Lógica para Gestión de Usuarios ---
    document.getElementById('add-user-btn').addEventListener('click', () => {
        Swal.fire({
            title: 'Crear Nuevo Usuario',
            html: `
                <input id="swal-input1" class="swal2-input" placeholder="Usuario" required>
                <input id="swal-input2" class="swal2-input" type="password" placeholder="Contraseña" required>
                <select id="swal-input3" class="swal2-input">
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                </select>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const username = document.getElementById('swal-input1').value;
                const password = document.getElementById('swal-input2').value;
                const role = document.getElementById('swal-input3').value;
                if (!username || !password) {
                    Swal.showValidationMessage('Todos los campos son obligatorios');
                    return false;
                }
                return { username, password, role };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { username, password, role } = result.value;
                const addResult = addUser(username, password, role);
                if (addResult.success) {
                    Swal.fire('Éxito', addResult.message, 'success');
                    loadUsersTable();
                    loadAlumnosTable();
                } else {
                    Swal.fire('Error', addResult.message, 'error');
                }
            }
        });
    });

    // Event listeners para edición en línea y eliminación
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.edit-module-btn, .edit-unit-btn, .edit-activity-btn, .edit-btn, .save-btn, .cancel-btn, .delete-user-btn, .delete-module-btn, .delete-unit-btn, .delete-activity-btn');
        if (!target) return;

        const id = target.dataset.id;
        const type = target.dataset.type;

        // Lógica para editar
        if (target.classList.contains('edit-btn')) {
            const row = target.closest('tr');
            const cells = row.querySelectorAll('td');
            
            cells[0].innerHTML = `<input type="text" class="form-control" value="${cells[0].textContent}">`;
            cells[1].innerHTML = `<select class="form-select">
                                    <option value="student" ${cells[1].textContent === 'Estudiante' ? 'selected' : ''}>Estudiante</option>
                                    <option value="admin" ${cells[1].textContent === 'Administrador' ? 'selected' : ''}>Administrador</option>
                                </select>`;
            cells[2].innerHTML = `
                <button class="btn btn-sm btn-success save-btn" data-id="${id}" data-type="user">
                    <i class="fas fa-save"></i> Guardar
                </button>
                <button class="btn btn-sm btn-secondary cancel-btn" data-id="${id}" data-type="user">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            `;
        } else if (target.classList.contains('edit-module-btn')) {
            const cardHeader = target.closest('.card-header');
            const span = cardHeader.querySelector('span');
            const originalName = span.textContent;
            span.innerHTML = `<input type="text" class="form-control" value="${originalName}">`;
            cardHeader.querySelector('.edit-module-btn').outerHTML = `<button class="btn btn-sm btn-success save-btn" data-id="${id}" data-type="module"><i class="fas fa-save"></i> Guardar</button>
            <button class="btn btn-sm btn-secondary cancel-btn" data-id="${id}" data-type="module"><i class="fas fa-times"></i> Cancelar</button>`;

        } else if (target.classList.contains('edit-unit-btn')) {
            const row = target.closest('tr');
            const unitNameSpan = row.querySelector(`#unit-name-${id}`);
            const originalName = unitNameSpan.textContent;
            unitNameSpan.innerHTML = `<input type="text" class="form-control" value="${originalName}">`;
            const actionsCell = row.querySelector('td:last-child');
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-success save-btn" data-id="${id}" data-type="unit">
                    <i class="fas fa-save"></i> Guardar
                </button>
                <button class="btn btn-sm btn-secondary cancel-btn" data-id="${id}" data-type="unit">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            `;
        } else if (target.classList.contains('edit-activity-btn')) {
            const row = target.closest('tr');
            const nameSpan = row.querySelector(`#activity-name-${id}`);
            const difficultySpan = row.querySelector(`#activity-difficulty-${id}`);
            const originalName = nameSpan.textContent;
            const originalDifficulty = difficultySpan.textContent;
            nameSpan.innerHTML = `<input type="text" class="form-control" value="${originalName}">`;
            difficultySpan.innerHTML = `<input type="number" class="form-control" min="1" max="10" value="${originalDifficulty}">`;
            const actionsCell = row.querySelector('td:last-child');
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-success save-btn" data-id="${id}" data-type="activity">
                    <i class="fas fa-save"></i> Guardar
                </button>
                <button class="btn btn-sm btn-secondary cancel-btn" data-id="${id}" data-type="activity">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            `;
        }

        // Lógica para guardar
        if (target.classList.contains('save-btn')) {
            let result;
            if (type === 'user') {
                const row = target.closest('tr');
                const newUsername = row.querySelector('input').value;
                const newRole = row.querySelector('select').value;
                const user = getAllUsers().find(u => u.id == id);
                result = updateUser(id, newUsername, user.password, newRole);
            } else if (type === 'module') {
                const cardHeader = target.closest('.card-header');
                const newName = cardHeader.querySelector('input').value;
                result = updateModule(id, newName);
            } else if (type === 'unit') {
                const row = target.closest('tr');
                const newName = row.querySelector('input').value;
                result = updateUnit(id, newName);
            } else if (type === 'activity') {
                const row = target.closest('tr');
                const newName = row.querySelector('input').value;
                const newDifficulty = row.querySelector('input[type="number"]').value;
                const activity = getAllActivities().find(a => a.id == id);
                result = updateActivity(id, newName, newDifficulty, activity.questions);
            }
            if (result.success) {
                Swal.fire('Éxito', result.message, 'success');
                loadAdminSelects();
                renderModulesUnitsAndActivities();
                loadUsersTable();
            } else {
                Swal.fire('Error', result.message, 'error');
            }
        }

        // Lógica para cancelar
        if (target.classList.contains('cancel-btn')) {
            loadAdminSelects();
            renderModulesUnitsAndActivities();
            loadUsersTable();
        }

        // Lógica para eliminar
        if (target.classList.contains('delete-user-btn')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción no se puede revertir.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const result = deleteUser(id);
                    if (result.success) {
                        Swal.fire('Eliminado', result.message, 'success');
                        loadUsersTable();
                        loadAlumnosTable();
                    } else {
                        Swal.fire('Error', result.message, 'error');
                    }
                }
            });
        }
        if (target.classList.contains('delete-module-btn')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esto eliminará el módulo y todas sus unidades y actividades.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const result = deleteModule(id);
                    if (result.success) {
                        Swal.fire('Eliminado', result.message, 'success');
                        loadAdminSelects();
                        renderModulesUnitsAndActivities();
                    } else {
                        Swal.fire('Error', result.message, 'error');
                    }
                }
            });
        }
        if (target.classList.contains('delete-unit-btn')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esto eliminará la unidad y todas sus actividades.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const result = deleteUnit(id);
                    if (result.success) {
                        Swal.fire('Eliminado', result.message, 'success');
                        loadAdminSelects();
                        renderModulesUnitsAndActivities();
                    } else {
                        Swal.fire('Error', result.message, 'error');
                    }
                }
            });
        }
        if (target.classList.contains('delete-activity-btn')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esto eliminará la actividad y su test.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const result = deleteActivity(id);
                    if (result.success) {
                        Swal.fire('Eliminado', result.message, 'success');
                        loadAdminSelects();
                        renderModulesUnitsAndActivities();
                    } else {
                        Swal.fire('Error', result.message, 'error');
                    }
                }
            });
        }
    });

    // --- Lógica del Panel de Estudiantes ---
    function loadStudentData() {
        document.getElementById('student-username-display').textContent = currentUser.username;
        document.getElementById('student-logout-btn').addEventListener('click', logout);
        renderStudentStats();
        renderModules();
    }

    function renderStudentStats() {
        const progress = getStudentProgress(currentUser.username);
        if (progress) {
            document.getElementById('total-score-display').textContent = progress.score;
            document.getElementById('lives-display').textContent = progress.lives;
            document.getElementById('megas-display').textContent = progress.megas;
        }
    }

    function renderModules() {
        const db = getDB();
        const container = document.getElementById('modules-container');
        container.innerHTML = '';

        db.modules.forEach(modulo => {
            const moduloDiv = document.createElement('div');
            moduloDiv.className = 'card mb-3';
            moduloDiv.innerHTML = `
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">${modulo.name}</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush" id="units-container-${modulo.id}"></ul>
                </div>
            `;
            container.appendChild(moduloDiv);

            const unitsContainer = document.getElementById(`units-container-${modulo.id}`);
            modulo.units.forEach(unidad => {
                const unidadItem = document.createElement('li');
                unidadItem.className = 'list-group-item';
                unidadItem.innerHTML = `
                    <h6>${unidad.name}</h6>
                    <ul class="list-group list-group-flush" id="activities-container-${unidad.id}"></ul>
                `;
                unitsContainer.appendChild(unidadItem);

                const activitiesContainer = document.getElementById(`activities-container-${unidad.id}`);
                unidad.activities.forEach(actividad => {
                    const progress = getStudentProgress(currentUser.username);
                    const isCompleted = progress.completedActivities.includes(actividad.id);
                    const listItem = document.createElement('li');
                    listItem.className = `list-group-item d-flex justify-content-between align-items-center ${isCompleted ? 'list-group-item-success' : ''}`;
                    listItem.innerHTML = `
                        <span>${actividad.name} (Dificultad: ${actividad.difficulty})</span>
                        ${isCompleted ? '<span>Completada ✅</span>' : `<button class="btn btn-sm btn-primary play-btn" data-activity-id="${actividad.id}">Jugar</button>`}
                    `;
                    activitiesContainer.appendChild(listItem);
                });
            });
        });

        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activityId = parseInt(e.target.dataset.activityId);
                startTest(activityId);
            });
        });
    }

    function findActivityById(id) {
        const db = getDB();
        for (const modulo of db.modules) {
            for (const unidad of modulo.units) {
                const activity = unidad.activities.find(a => a.id === id);
                if (activity) return activity;
            }
        }
        return null;
    }

    function startTest(activityId) {
        currentTestActivity = findActivityById(activityId);
        if (!currentTestActivity) {
            Swal.fire('Error', 'Actividad no encontrada.', 'error');
            return;
        }

        const modalBody = document.getElementById('test-body');
        modalBody.innerHTML = '';
        currentTest = currentTestActivity.questions;

        currentTest.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-4';
            questionDiv.innerHTML = `
                <p><strong>${index + 1}. ${q.text}</strong></p>
                <div class="list-group">
                    ${q.options.map((opt, i) => `
                        <label class="list-group-item">
                            <input class="form-check-input me-1" type="radio" name="question-${index}" value="${opt}" required>
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            `;
            modalBody.appendChild(questionDiv);
        });

        const testModal = new bootstrap.Modal(document.getElementById('test-modal'));
        testModal.show();
    }

    document.getElementById('submit-test-btn').addEventListener('click', () => {
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let studentProgress = getStudentProgress(currentUser.username);

        currentTest.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
            if (selectedOption && selectedOption.value === q.correct) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
        });
        
        const totalQuestions = currentTest.length;
        const scorePerQuestion = currentTestActivity.difficulty * 10;
        const scoreEarned = correctAnswers * scorePerQuestion;
        const livesLost = incorrectAnswers > 0 ? 1 : 0;
        const megasEarned = correctAnswers === totalQuestions ? currentTestActivity.difficulty * 5 : 0;

        const newLives = studentProgress.lives - livesLost;
        updateStudentProgress(currentUser.username, scoreEarned, newLives, megasEarned, currentTestActivity.id);
        
        renderStudentStats();
        renderModules();

        let message = `Respuestas correctas: ${correctAnswers} de ${totalQuestions}.`;
        
        if (livesLost > 0) {
            message += ` Has perdido 1 vida.`;
        } else {
            message += ` ¡Perfecto, no has perdido vidas!`;
        }

        if (megasEarned > 0) {
            message += ` ¡Has ganado ${megasEarned} megas!`;
            showAchievementModal('Megas Ganados', `¡Felicitaciones! Has ganado ${megasEarned} megas por completar esta actividad perfectamente.`, '🏆');
        } else {
            Swal.fire({
                title: 'Test Finalizado',
                html: message,
                icon: 'info'
            });
        }
        
        const testModal = bootstrap.Modal.getInstance(document.getElementById('test-modal'));
        testModal.hide();
    });

    function showAchievementModal(title, message, icon) {
        document.getElementById('achievement-modal-label').textContent = title;
        document.getElementById('achievement-message').textContent = message;
        document.getElementById('achievement-icon').innerHTML = icon;
        const achievementModal = new bootstrap.Modal(document.getElementById('achievement-modal'));
        achievementModal.show();
    }

    checkAuth();
});