let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Form submit
document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const user = auth.currentUser;


if (!user) {
  showToast("⚠ Please login first");
  return;
}
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const deadline = document.getElementById("deadline").value;

  const task = {
    id: Date.now(),
    title,
    description,
    deadline,
    completed: false
  };

  tasks.push(task);
  saveTasks();
  renderTasks();

  this.reset();
});

document.getElementById("title").focus();
window.scrollTo({ top: 0, behavior: "smooth" });

// Save to localStorage
function saveTasks() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("tasks").doc(user.uid).set({
    tasks: tasks
  });
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  let filteredTasks = [...tasks];

  const searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";

function highlight(text) {
  if (!searchValue) return text;
  return text.replace(
    new RegExp(`(${searchValue})`, "gi"),
    `<mark>$1</mark>`
  );
}

  // ✅ Filter (ONLY ONCE)
  if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter(t => t.completed);
  } else if (currentFilter === "pending") {
    filteredTasks = filteredTasks.filter(t => !t.completed);
  }

  // ✅ Search (ONLY ONCE)
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    const searchValue = searchInput.value.toLowerCase().trim();

    if (searchValue !== "") {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchValue) ||
        (task.description || "").toLowerCase().includes(searchValue)
      );
    }
  }

  // ✅ Empty state
  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <div class="text-center py-5">
        <h5>No matching tasks 😌</h5>
      </div>
    `;
    updateStats();
    updateProgress();
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  filteredTasks.forEach(task => {
    const col = document.createElement("div");
    col.className = "col-md-4";

    let statusBadge = "";
    let isOverdue = false;

    if (task.completed) {
      statusBadge = `<span class="badge bg-success">Completed</span>`;
    } else if (task.deadline < today) {
      statusBadge = `<span class="badge bg-danger">Overdue</span>`;
      isOverdue = true;
    } else {
      statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
    }

    col.innerHTML = `
      <div class="task-card ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}">
        
        <h5>${highlight(task.title)}</h5>
        <p>${task.description || "No description"}</p>
        <small>📅 ${task.deadline}</small><br>
        ${statusBadge}

        <div class="task-actions">
          <button class="btn btn-sm btn-success" onclick="toggleTask(${task.id})">✔</button>
          <button class="btn btn-sm btn-warning" onclick="openEditModal(${task.id})">✏</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">🗑</button>
        </div>

      </div>
    `;

    taskList.appendChild(col);
  });

  updateStats();
  updateProgress();
}

// Toggle complete
function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderTasks();
  showToast("✔ Task Updated");
}

// Delete task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  showToast("🗑 Task Deleted");
}

// Edit task
function editTask(id) {
  const task = tasks.find(t => t.id === id);

  const newTitle = prompt("Edit Title", task.title);
  const newDesc = prompt("Edit Description", task.description);
  const newDate = prompt("Edit Deadline (YYYY-MM-DD)", task.deadline);

  if (newTitle !== null) {
    task.title = newTitle;
    task.description = newDesc;
    task.deadline = newDate;
  }

  saveTasks();
  renderTasks();
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    currentFilter = this.getAttribute("data-filter");
    renderTasks();
  });
});

function checkReminders() {
  const today = new Date();

  tasks.forEach(task => {
    if (!task.completed) {
      const taskDate = new Date(task.deadline);
      const diffTime = taskDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        showToast(`⏰ ${task.title} is due soon!`);
      }

      if (diffDays === 0) {
        showToast(`⏰ ${task.title} is due soon!`);
      }
    }
  });
}

// Initial render
renderTasks();
checkReminders();

let editId = null;

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  editId = id;

  document.getElementById("editTitle").value = task.title;
  document.getElementById("editDesc").value = task.description;
  document.getElementById("editDate").value = task.deadline;

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function saveEdit() {
  const task = tasks.find(t => t.id === editId);

  task.title = document.getElementById("editTitle").value;
  task.description = document.getElementById("editDesc").value;
  task.deadline = document.getElementById("editDate").value;

  saveTasks();
  renderTasks();

  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  document.getElementById("totalTasks").innerText = total;
  document.getElementById("completedTasks").innerText = completed;
  document.getElementById("pendingTasks").innerText = pending;
}
let draggedId = null;

function drag(event) {
  draggedId = event.target.closest(".task-card").dataset.id;
}

document.getElementById("taskList").addEventListener("dragover", function(e) {
  e.preventDefault();
});

document.getElementById("taskList").addEventListener("drop", function(e) {
  e.preventDefault();

  const target = e.target.closest(".task-card");
  if (!target) return;

  const targetId = target.dataset.id;

  const draggedIndex = tasks.findIndex(t => t.id == draggedId);
  const targetIndex = tasks.findIndex(t => t.id == targetId);

  const temp = tasks[draggedIndex];
  tasks[draggedIndex] = tasks[targetIndex];
  tasks[targetIndex] = temp;

  document.getElementById("searchInput").addEventListener("input", renderTasks);

  saveTasks();
  renderTasks();
});

function showToast(message) {
  document.getElementById("toastMsg").innerText = message;
  const toast = new bootstrap.Toast(document.getElementById("liveToast"));
  toast.show();
}
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progressPercent").innerText = percent + "%";
}
function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("⚠ Enter email & password");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      showToast("✅ Signup successful");

      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    })
    .catch(err => showToast(err.message));
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("⚠ Enter email & password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      showToast("✅ Login successful");

      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    })
    .catch(err => showToast(err.message));
}

function logout() {
  auth.signOut().then(() => {
    showToast("👋 Logged out");
    tasks = [];
    renderTasks();
  });
}
auth.onAuthStateChanged(user => {
  const appSection = document.getElementById("appSection");

  if (user) {
    // ✅ User logged in → show app
    appSection.style.display = "block";

    // Load user tasks
    db.collection("tasks").doc(user.uid).get()
      .then(doc => {
        tasks = doc.exists ? doc.data().tasks : [];
        renderTasks();
      });

    // Show user email
    document.getElementById("userEmail").innerText = user.email;

  } else {
    // ❌ User not logged in → hide app
    appSection.style.display = "none";

    tasks = [];
    renderTasks();
  }
});
if (user) {
  appSection.style.display = "block";
} else {
  appSection.style.display = "none";
}