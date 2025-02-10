
class TodoManager {
    constructor() {
       
        this.tasks = {
            prayers: [
                { id: 'p1', name: 'Fajr', time: 'Aube', status: 'todo', medal: 'gold' },
                { id: 'p2', name: 'Dhuhr', time: 'Midi', status: 'todo', medal: 'gold' },
                { id: 'p3', name: 'Asr', time: 'Après-midi', status: 'todo', medal: 'gold' },
                { id: 'p4', name: 'Maghrib', time: 'Coucher du soleil', status: 'todo', medal: 'gold' },
                { id: 'p5', name: 'Isha', time: 'Nuit', status: 'todo', medal: 'gold' }
            ],
            daily: [],
            weekly: [],
            monthly: [],
            yearly: []
        };

       
        this.initBurgerMenu();
        
        
        this.bindEvents();
        this.loadTasks();
        this.setupAutosave();
    }

    initBurgerMenu() {
        const burgerIcon = document.querySelector('.burger-icon');
        const navMenu = document.querySelector('.nav-menu');
        
        burgerIcon.addEventListener('click', () => {
            burgerIcon.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

       
        document.addEventListener('click', (e) => {
            if (!burgerIcon.contains(e.target) && !navMenu.contains(e.target)) {
                burgerIcon.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    
    setupAutosave() {
        setInterval(() => this.saveTasks(), 30000); // Toutes les 30 secondes
    }

  
    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    }

    
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                this.renderAll();
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        }
    }

    bindEvents() {
        
        const form = document.querySelector('.add-task-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        
        this.setupDragAndDrop();

        
        document.addEventListener('click', (e) => {
            if (e.target.matches('.delete-button')) {
                this.deleteTask(e);
            } else if (e.target.matches('.status-button')) {
                this.cycleTaskStatus(e);
            }
        });
    }
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            const task = e.target.closest('.task');
            if (task) {
                task.classList.add('dragging');
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: task.dataset.id,
                    period: task.dataset.period
                }));
            }
        });

        document.addEventListener('dragend', (e) => {
            const task = e.target.closest('.task');
            if (task) {
                task.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => e.preventDefault());

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.tasks-list');
            if (!dropZone) return;

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.moveTask(data.id, data.period, dropZone.dataset.period);
        });
    }

  
    moveTask(taskId, fromPeriod, toPeriod) {
        if (fromPeriod === toPeriod) return;

        const taskIndex = this.tasks[fromPeriod].findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const task = this.tasks[fromPeriod][taskIndex];
        this.tasks[fromPeriod].splice(taskIndex, 1);
        this.tasks[toPeriod].push({...task, period: toPeriod});

        this.renderAll();
        this.saveTasks();
    }

   
    addTask() {
        const input = document.querySelector('.task-input');
        const deadline = document.querySelector('.task-deadline');
        const period = document.querySelector('.task-period').value;
        const category = document.querySelector('.task-category').value;
        const medal = document.querySelector('.task-medal').value;

        if (input.value.trim()) {
            const newTask = {
                id: Date.now().toString(),
                name: input.value.trim(),
                deadline: deadline.value,
                status: 'todo',
                category,
                medal,
                createdAt: new Date().toISOString()
            };

            this.tasks[period].push(newTask);
            this.renderAll();
            this.saveTasks();

            // Réinitialisation des champs
            input.value = '';
            deadline.value = '';
            
            // Focus sur l'input
            input.focus();
        }
    }

    // Suppression d'une tâche
    deleteTask(e) {
        const task = e.target.closest('.task');
        const {period, id} = task.dataset;
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            this.tasks[period] = this.tasks[period].filter(t => t.id !== id);
            this.renderAll();
            this.saveTasks();
        }
    }

    // Changement de statut d'une tâche
    cycleTaskStatus(e) {
        const task = e.target.closest('.task');
        const {period, id} = task.dataset;
        const statusCycle = ['todo', 'progress', 'done'];
        
        const currentTask = this.tasks[period].find(t => t.id === id);
        if (currentTask) {
            const currentIndex = statusCycle.indexOf(currentTask.status);
            currentTask.status = statusCycle[(currentIndex + 1) % statusCycle.length];
            this.renderAll();
            this.saveTasks();
        }
    }

    // Rendu de toutes les sections
    renderAll() {
        this.renderPrayers();
        
        ['daily', 'weekly', 'monthly', 'yearly'].forEach(period => {
            const container = document.querySelector(`.tasks-list[data-period="${period}"]`);
            if (!container) return;

            container.innerHTML = '';
            
            // Tri des tâches par deadline puis par date de création
            const sortedTasks = [...this.tasks[period]].sort((a, b) => {
                if (a.deadline && b.deadline) {
                    return new Date(a.deadline) - new Date(b.deadline);
                }
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });

            sortedTasks.forEach(task => {
                container.appendChild(this.createTaskElement(task, period));
            });
        });
    }

    // Rendu des prières
    renderPrayers() {
        const container = document.querySelector('.prayer-grid');
        if (!container) return;

        container.innerHTML = '';
        this.tasks.prayers.forEach(prayer => {
            const card = document.createElement('div');
            card.className = `prayer-card ${prayer.status}`;
            card.dataset.id = prayer.id;
            card.innerHTML = `
                <h3>${prayer.name}</h3>
                <p>${prayer.time}</p>
                <button class="status-button" aria-label="Changer le statut">
                    ${this.getStatusEmoji(prayer.status)}
                </button>
            `;
            container.appendChild(card);
        });
    }

    // Création d'un élément de tâche
    createTaskElement(task, period) {
        const div = document.createElement('div');
        div.className = `task ${task.status}`;
        div.draggable = true;
        div.dataset.id = task.id;
        div.dataset.period = period;

        const deadlineDisplay = task.deadline ? 
            `<span class="deadline ${this.isOverdue(task.deadline) ? 'overdue' : ''}" title="Date limite">
                ${this.formatDeadline(task.deadline)}
            </span>` : '';

        div.innerHTML = `
            <span class="drag-handle" aria-hidden="true">⋮</span>
            <span class="task-text">${task.name}</span>
            ${deadlineDisplay}
            <span class="category-badge" title="Catégorie">${task.category}</span>
            <span class="medal ${task.medal}" title="Priorité">
                ${this.getMedalEmoji(task.medal)}
            </span>
            <button class="status-button" aria-label="Changer le statut">
                ${this.getStatusEmoji(task.status)}
            </button>
            <button class="delete-button" aria-label="Supprimer la tâche">🗑️</button>
        `;

        return div;
    }

    // Vérification si une deadline est dépassée
    isOverdue(deadline) {
        return new Date(deadline) < new Date();
    }

    // Formatage de la date limite
    formatDeadline(deadline) {
        return new Date(deadline).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Obtention de l'emoji de statut
    getStatusEmoji(status) {
        const emojis = {
            todo: '📝',
            progress: '🔄',
            done: '✅'
        };
        return emojis[status] || '📝';
    }
    getMedalEmoji(medal) {
        const emojis = {
            gold: '🥇',
            silver: '🥈',
            bronze: '🥉'
        };
        return emojis[medal] || '🏅';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.todoManager = new TodoManager();
});