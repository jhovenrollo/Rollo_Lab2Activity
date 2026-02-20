//GLOBAL VARIABLE
const STORAGE_KEY = 'ipt_demo_v1';

let currentUser = null;
let employees = JSON.parse(localStorage.getItem("employees")) || [];

window.db = {
  accounts:[],
  departments:[],
  employees:[],
  requests:[]
};

//LOAD STORAGE
function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            seedDatabase();
            return;
        }

        const parsed = JSON.parse(raw);

        if (!parsed.accounts || !parsed.departments) {
            seedDatabase();
            return;
        }

        window.db = parsed;
    } catch (error) {
        seedDatabase();
    }
}
//SEEDS DATA
function seedDatabase() {
  window.db = {
    accounts: [
      {
        firstName: "User",
        lastName: "Admin",
        email: "admin@example.com",
        password:"Password123!",
        role: "admin",
        verified: true
      }
    ],
    departments: [
      {
        id: 1, 
        name: "Engineering", 
        description: "Software Teams"
      },
      {
        id: 2, 
        name: "HR",
        description: "Human Resources"
      }
    ],
  };
  saveToStorage();
}

//SAVE TO STORAGE
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}


//NAVIGATE TO HASH
function navigateTo(hash) {
  window.location.hash = hash;
}

//HANDLE ROUTING
function handleRouting() {
  const hash = window.location.hash || "#/";
  const route = hash.replace("#/", "");

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(route + "-page");

  const protectedRoutes = ["profile", "employees", "accounts", "departments", "my-requests"];
  const adminRoutes = ["employees", "accounts", "departments"];

  if (protectedRoutes.includes(route) && !currentUser) {
    navigateTo("#/login");
    return;
  }

  if (adminRoutes.includes(route) && currentUser?.role !== "admin") {
    navigateTo("#/");
    return;
  }

  if (targetPage) {
    targetPage.classList.add("active");

    switch (route) {
        case "profile":
            renderProfile();
            break;

        case "employees" :
            renderEmployeesTable();
            break;

        case "accounts":
            renderAccountsList();   
            break;

        case "departments":
            renderDepartmentsList();
            break;    
            
        case "my-requests":
            renderMyRequests();
            break;    
    }

  } else {
    document.getElementById("home-page").classList.add("active");
  }

//VERIFY EMAIL
   if (route === "verify-email") {
    const email = localStorage.getItem("unverified_email");
    document.getElementById("verifyMessage").innerText =
        "A verification link has been sent to " + email;
    }
}


//Event Listeners
window.addEventListener("hashchange", handleRouting);

window.addEventListener("load", () => {
  if (!window.location.hash) {
    navigateTo("#/");
  } else {
    handleRouting();
  }
});


//REGISTRATION
document.getElementById("registerForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const firstName = regFirstName.value.trim();
  const lastName = regLastName.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const exists = window.db.accounts.find(acc => acc.email === email);

  if (exists) {
    alert("Email already exists.");
    return;
  }

  const newAccount = {
    firstName,
    lastName,
    email,
    password,
    role: "user",
    verified: false
  };

  window.db.accounts.push(newAccount);
  saveToStorage();

  localStorage.setItem("unverified_email", email);

  navigateTo("#/verify-email");
});


//SIMULATE VERIFICATION
function simulateVerification() {
  const email = localStorage.getItem("unverified_email");

  const account = window.db.accounts.find(acc => acc.email === email);

  if (account) {
    account.verified = true;
    saveToStorage();
  }

  localStorage.removeItem("unverified_email");

  navigateTo("#/login");
}

//LOGIN
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  const user = window.db.accounts.find(acc =>
    acc.email === email &&
    acc.password === password &&
    acc.verified === true
  );

  if (user) {
    localStorage.setItem("auth_token", email);

    setAuthState(true, user);

    navigateTo("#/profile");
  } else {
    alert("Invalid credentials or email not verified.");
  }
});

//AUTH STATE MANAGEMENT
function setAuthState(isAuth, user = null) {
  if (isAuth) {
    currentUser = user;

    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");

    if (user.role === "admin") {
      document.body.classList.add("is-admin");
    }

    // Update username in navbar
    document.getElementById("navUsername").innerText =
      user.firstName + " " + user.lastName;

  } else {
    currentUser = null;

    document.body.classList.remove("authenticated", "is-admin");
    document.body.classList.add("not-authenticated");
  }
}


//PAGE LOAD
window.addEventListener("load", () => {
    loadFromStorage();

    const token = localStorage.getItem("auth_token");

    if (token) {
        const user = window.db.accounts.find(acc => acc.email === token);
        if (user) {
            setAuthState(true, user);
        }
    }

    if (!window.location.hash) {
        navigateTo("#/");
    } else {
        handleRouting();
    }

});

//PROFILE
function renderProfile() {
    if (!currentUser) return;
    
    const fullName = currentUser.firstName + " " + currentUser.lastName;
    document.getElementById("profileName").innerText = fullName.toUpperCase();

    document.getElementById("profileEmail").innerText = currentUser.email;

    document.getElementById("profileRole").innerText = currentUser.role === "admin" ? "Admin" : "User";
}

function editProfile () {
    alert("NOT YET...");
}

//EMPLOYEES
function renderEmployeesTable() {
    const tbody = document.getElementById("EmployeesTableBody");
    tbody.innerHTML = "";

    employees.forEach(emp => {

        const user = accounts.find(acc => acc.id === emp.userId);
        const dept = departments.find(d => d.id === emp.departmentId);

        const row = `
            <tr>
                <td>${emp.id}</td>
                <td>${user ? user.email: "N/A"}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name: "N/A"}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick ="deleteEmployee"('${emp.id}')>
                        Delete
                    </button>    
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    })
}

function showAddEmployeeForm() {
    document.getElementById("addEmployeeForm").classList.remove("d-none");
    renderDepartmentsDropdown();
}

function hideAddEmployeeForm() {
    document.getElementById("addEmployeeForm").classList.add("d-none");
}

function renderDepartmentsDropdown() {
  const select = document.getElementById("empDepartment");
  select.innerHTML = "";

  departments.forEach(dept => {
    select.innerHTML += `
      <option value="${dept.id}">${dept.name}</option>
    `;
  });
}


function saveEmployee() {

    const empId = document.getElementById("empId").value.trim();
    const email = document.getElementById("empEmail").value.trim();
    const position = document.getElementById("empPosition").value.trim();
    const departmentId = parseInt(document.getElementById("empDepartment").value);
    const hireDate = document.getElementById("empHireDate").value;

    const user = accounts.find(acc => acc.email === email);

    if (!user) {
        alert("User not found");
        return;
    }

    const newEmployee = {
        id: empId,
        userId: user.id,
        departmentId: departmentId,
        position: position,
        hireDate: hireDate
    };

    employees.push(newEmployee);
    localStorage.setItem("employees", JSON.stringify(employees));

    renderEmployeesTable();
    hideAddEmployeeForm();
}

function deleteEmployee(empId) {
    employees = employees.filter(emp => emp.id !== empId);
    localStorage.setItem("employees", JSON.stringify(employees));
    renderEmployeesTable();
}


//ACCOUNTS
function renderAccountsList() {
  const tbody = document.getElementById("accountsTableBody");
  tbody.innerHTML = "";

  window.db.accounts.forEach((acc, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${acc.firstName} ${acc.lastName}</td>
      <td>${acc.email}</td>
      <td>${acc.role}</td>
      <td>${acc.verified ? "✔" : "—"}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="editAccount(${index})">Edit</button>
        <button class="btn btn-sm btn-secondary me-1" onclick="resetPassword(${index})">Reset Password</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function openAccountForm() {
  document.getElementById("accountFormContainer").classList.remove("d-none");
  document.getElementById("accountForm").reset();
  document.getElementById("accountIndex").value = "";
  document.getElementById("accountFormTitle").innerText = "Add Account";
}

function closeAccountForm() {
  document.getElementById("accountFormContainer").classList.add("d-none");
}


document.getElementById("accountForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const index = document.getElementById("accountIndex").value;

  const accountData = {
    firstName: accFirstName.value,
    lastName: accLastName.value,
    email: accEmail.value,
    password: accPassword.value,
    role: accRole.value,
    verified: accVerified.checked
  };

  if (accountData.password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (index === "") {
    //PREVENT DUPLICATE
    const exists = window.db.accounts.find(a => a.email === accountData.email);
    if (exists) {
      alert("Email already exists.");
      return;
    }

    window.db.accounts.push(accountData);
  } else {
    window.db.accounts[index] = accountData;
  }

  saveToStorage();
  renderAccountsList();
  closeAccountForm();
});


function editAccount(index) {
  const acc = window.db.accounts[index];

  document.getElementById("accountIndex").value = index;
  accFirstName.value = acc.firstName;
  accLastName.value = acc.lastName;
  accEmail.value = acc.email;
  accPassword.value = acc.password;
  accRole.value = acc.role;
  accVerified.checked = acc.verified;

  document.getElementById("accountFormTitle").innerText = "Edit Account";
  document.getElementById("accountFormContainer").classList.remove("d-none");
}


function resetPassword(index) {
  const newPass = prompt("Enter new password (min 6 chars):");

  if (!newPass || newPass.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  window.db.accounts[index].password = newPass;
  saveToStorage();
  alert("Password updated successfully.");
}


function deleteAccount(index) {
  const acc = window.db.accounts[index];

  if (acc.email === currentUser.email) {
    alert("You cannot delete your own account.");
    return;
  }

  if (confirm("Are you sure you want to delete this account?")) {
    window.db.accounts.splice(index, 1);
    saveToStorage();
    renderAccountsList();
  }
}

//DEPARTMENTS
function renderDepartmentsList() {
  const tbody = document.getElementById("departmentsTableBody");
  tbody.innerHTML = "";

  window.db.departments.forEach((dept, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${dept.name}</td>
      <td>${dept.description || "-"}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="alert('Edit not implemented')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="alert('Delete not implemented')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


//MYREQUEST







//LOGOUT
function logout() {
  localStorage.removeItem("auth_token");
  setAuthState(false);
  navigateTo("#/");
}
