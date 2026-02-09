// =======================
// Update Navbar based on login
// =======================
function updateNavbar() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutLink = document.getElementById('logout-link');

    // Remove previous dynamic dropdown if exists
    const existingDropdown = document.getElementById('userDropdown');
    if (existingDropdown) existingDropdown.remove();

    if (user) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        logoutLink.style.display = 'none'; // hide default logout link

        // Create user dropdown
        const navbar = document.querySelector('.navbar-nav');
        const li = document.createElement('li');
        li.classList.add('nav-item', 'dropdown');
        li.id = 'userDropdown';
        li.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                ${user.email}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#">Profile</a></li>
                <li><a class="dropdown-item" href="#">My Requests</a></li>
                ${user.role === 'Admin' ? `
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item role-admin" href="#">Employees</a></li>
                    <li><a class="dropdown-item role-admin" href="#">Accounts</a></li>
                    <li><a class="dropdown-item role-admin" href="#">Departments</a></li>
                ` : ''}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logoutBtnDropdown">Logout</a></li>
            </ul>
        `;
        navbar.appendChild(li);

        // Attach logout event to the new dropdown logout
        document.getElementById('logoutBtnDropdown').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            updateNavbar();
            alert('Logged out successfully!');
        });

    } else {
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

// =======================
// Logout function for old logoutBtn (optional)
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    updateNavbar();
    alert('Logged out successfully!');
});

// =======================
// Register
// =======================
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('Email already registered!');
        return;
    }

    // Make the first user Admin automatically (optional)
    const role = users.length === 0 ? 'Admin' : 'User';

    users.push({ email, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    alert(`Registration successful! You are registered as ${role}. You can now login.`);
    bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    document.getElementById('registerForm').reset();
});

// =======================
// Login
// =======================
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
        alert('Invalid email or password!');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    updateNavbar();
    alert('Login successful!');
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    document.getElementById('loginForm').reset();
});

// =======================
// Initialize navbar on page load
// =======================
updateNavbar();
