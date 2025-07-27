document.addEventListener('DOMContentLoaded', function() {
  // ======= Multi-User Login/Register Handling =======
  const authContainer = document.getElementById('auth-container');
  const appBody = document.getElementById('app-body');
  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const authMsg = document.getElementById('auth-message');
  const userInfo = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');

  // User management helpers
  function getUsers() {
    return JSON.parse(localStorage.getItem("users") || "{}");
  }
  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }
  function setCurrentUser(username) {
    localStorage.setItem("currentUser", username);
  }
  function getCurrentUser() {
    return localStorage.getItem("currentUser");
  }
  function logoutUser() {
    localStorage.removeItem("currentUser");
  }

  loginBtn.onclick = function () {
    const uname = usernameEl.value.trim();
    const pwd = passwordEl.value;
    if (!uname || !pwd) {
      authMsg.textContent = "Username and password required!";
      return;
    }
    let users = getUsers();
    if (!users[uname]) {
      authMsg.textContent = "User not found. Please register first.";
      return;
    }
    if (users[uname].password !== pwd) {
      authMsg.textContent = "Wrong password.";
      return;
    }
    setCurrentUser(uname);
    showApp();
  };

  registerBtn.onclick = function () {
    const uname = usernameEl.value.trim();
    const pwd = passwordEl.value;
    if (!uname || !pwd) {
      authMsg.textContent = "Username and password required to register!";
      return;
    }
    let users = getUsers();
    if (users[uname]) {
      authMsg.textContent = "Username already exists. Please log in.";
      return;
    }
    users[uname] = { password: pwd };
    saveUsers(users);
    setCurrentUser(uname);
    showApp();
  };

  function showAuth() {
    authContainer.style.display = "flex";
    appBody.style.display = "none";
    authMsg.textContent = "";
    passwordEl.value = "";
    usernameEl.value = "";
  }
  function showApp() {
    authContainer.style.display = "none";
    appBody.style.display = "";
    userInfo.textContent = `User: ${getCurrentUser()}`;
    renderNotes();
    resetNoteInput();
  }

  if (getCurrentUser()) showApp();
  else showAuth();

  logoutBtn.onclick = function () {
    logoutUser();
    showAuth();
  };

  // ======= Notes Logic (per user) =======
  const noteTitle = document.getElementById('note-title');
  const noteInput = document.getElementById('note-input');
  const fileInput = document.getElementById('file-input');
  const saveBtn = document.getElementById('save-btn');
  const notesList = document.getElementById('notes-list');
  const searchBar = document.getElementById('search-bar');
  const sortFilter = document.getElementById('sort-filter');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importInput = document.getElementById('import-input');
  const imagePreview = document.getElementById('image-preview');

  let notes = [];
  let editIndex = -1;
  let currentAttachment = null;

  function getNotesKey() { return "notes::" + getCurrentUser(); }
  function loadNotes() {
    notes = JSON.parse(localStorage.getItem(getNotesKey()) || "[]");
  }
  function saveNotes() {
    localStorage.setItem(getNotesKey(), JSON.stringify(notes));
  }

  function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString();
  }

  function resetNoteInput() {
    noteTitle.value = '';
    noteInput.value = '';
    imagePreview.innerHTML = '';
    currentAttachment = null;
    editIndex = -1;
    saveBtn.textContent = 'Save Note';
  }

  fileInput.onchange = function () {
    const file = fileInput.files[0];
    currentAttachment = null;
    imagePreview.innerHTML = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      if (file.type.startsWith("image/")) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Image preview">`;
        currentAttachment = {
          filename: file.name,
          type: file.type,
          data: e.target.result
        };
      } else {
        imagePreview.textContent = 'Attached: ' + file.name;
        currentAttachment = {
          filename: file.name,
          type: file.type,
          data: e.target.result
        };
      }
    };
    reader.readAsDataURL(file);
  };

  function renderNotes() {
    if (!getCurrentUser()) return;
    loadNotes();
    let filteredNotes = [...notes];

    const searchTerm = searchBar.value && searchBar.value.trim().toLowerCase();
    if (searchTerm) {
      filteredNotes = filteredNotes.filter(note =>
        (note.title && note.title.toLowerCase().includes(searchTerm)) ||
        (note.content && note.content.toLowerCase().includes(searchTerm))
      );
    }
    switch (sortFilter.value) {
      case 'oldest':
        filteredNotes.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'title-asc':
        filteredNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title-desc':
        filteredNotes.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      default:
        filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    notesList.innerHTML = '';
    filteredNotes.forEach((note, idx) => {
      const li = document.createElement('li');

      const titleSpan = document.createElement('span');
      titleSpan.className = 'note-title';
      titleSpan.textContent = note.title || '(No Title)';

      const contentSpan = document.createElement('span');
      contentSpan.className = 'note-content';
      contentSpan.textContent = note.content;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'note-date';
      dateSpan.textContent = note.date;

      let attDom = null;
      if (note.attachment && note.attachment.data) {
        if (note.attachment.type.startsWith("image/")) {
          attDom = document.createElement('img');
          attDom.src = note.attachment.data;
          attDom.alt = note.attachment.filename;
          attDom.className = 'note-attachment';
        } else {
          attDom = document.createElement('a');
          attDom.href = note.attachment.data;
          attDom.textContent = "Download: " + note.attachment.filename;
          attDom.download = note.attachment.filename;
          attDom.className = "note-attachment";
        }
      }

      const editBtn = document.createElement('button');
      editBtn.textContent = '✎';
      editBtn.className = 'edit-btn';
      editBtn.onclick = () => {
        noteTitle.value = note.title;
        noteInput.value = note.content;
        saveBtn.textContent = 'Update Note';
        editIndex = notes.indexOf(note);
        if (note.attachment) {
          currentAttachment = { ...note.attachment };
          if (note.attachment.type.startsWith("image/")) {
            imagePreview.innerHTML = `<img src="${note.attachment.data}" alt="Image preview">`;
          } else {
            imagePreview.textContent = 'Attached: ' + note.attachment.filename;
          }
        } else {
          currentAttachment = null;
          imagePreview.innerHTML = '';
        }
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.className = 'delete-btn';
      deleteBtn.onclick = () => {
        const deleteIdx = notes.indexOf(note);
        notes.splice(deleteIdx, 1);
        saveNotes();
        if (editIndex === deleteIdx) {
          resetNoteInput();
        }
        renderNotes();
      };

      li.appendChild(titleSpan);
      li.appendChild(contentSpan);
      li.appendChild(dateSpan);
      if (attDom) li.appendChild(attDom);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      notesList.appendChild(li);
    });
  }

  saveBtn.onclick = () => {
    const title = noteTitle.value.trim();
    const content = noteInput.value.trim();
    loadNotes(); // <-- THIS IS THE FIX! Ensures new notes are added to the latest list, not stale.
    if (content && getCurrentUser()) {
      if (editIndex === -1) {
        notes.push({
          title,
          content,
          date: getCurrentDateTime(),
          attachment: currentAttachment ? { ...currentAttachment } : null,
        });
      } else {
        notes[editIndex].title = title;
        notes[editIndex].content = content;
        notes[editIndex].date = getCurrentDateTime();
        notes[editIndex].attachment = currentAttachment ? { ...currentAttachment } : null;
        editIndex = -1;
        saveBtn.textContent = 'Save Note';
      }
      saveNotes();
      resetNoteInput();
      renderNotes();
    }
  };

  searchBar.oninput = renderNotes;
  sortFilter.onchange = renderNotes;

  exportBtn.onclick = function () {
    loadNotes();
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "notes-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  importBtn.onclick = function () {
    importInput.value = '';
    importInput.click();
  };
  importInput.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          loadNotes();
          notes = notes.concat(imported.filter(n => !notes.some(exist => exist.title === n.title && exist.content === n.content)));
          saveNotes();
          renderNotes();
          alert("Import successful!");
        } else {
          alert("File format is not valid.");
        }
      } catch {
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  if (getCurrentUser()) renderNotes();
});