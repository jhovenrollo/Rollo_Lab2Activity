// GLOBAL VARIABLES
const STORAGE_KEY = 'ipt_demo_v1';

let currentUser = null;

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};


// ============================================================
// TOAST NOTIFICATIONS
// Usage: showToast("Your message here", "success")
// Types: "success", "danger", "warning", "info"
// ============================================================

function showToast(message, type) {
    // Default to "info" if no type given
    if (!type) {
        type = "info";
    }

    // Pick an emoji icon based on type
    var icons = {
        success: "✅",
        danger:  "❌",
        warning: "⚠️",
        info:    "ℹ️"
    };

    // Get the container div from the HTML
    var container = document.getElementById("toast-container");

    // Build the toast element
    var toast = document.createElement("div");
    toast.className = "toast-item toast-" + type;

    toast.innerHTML =
        '<span class="toast-icon">' + icons[type] + '</span>' +
        '<span class="toast-message">' + message + '</span>' +
        '<button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>';

    // Add to container
    container.appendChild(toast);

    // Auto-remove after 3.5 seconds
    setTimeout(function() {
        removeToast(toast);
    }, 3500);
}

function removeToast(toast) {
    // Don't run twice if already being removed
    if (!toast || toast.classList.contains("removing")) return;

    toast.classList.add("removing");

    // Wait for the CSS slide-out animation to finish, then delete
    toast.addEventListener("animationend", function() {
        toast.remove();
    });
}


// FORM VALIDATION HELPERS
function setFieldError(inputEl, message) {
    inputEl.classList.remove("is-valid");
    inputEl.classList.add("is-invalid");

    // Remove any existing error message first
    var existing = inputEl.parentElement.querySelector(".field-error-msg");
    if (existing) {
        existing.remove();
    }

    // Add the new error message
    var errorDiv = document.createElement("div");
    errorDiv.className = "field-error-msg";
    errorDiv.textContent = message;
    inputEl.parentElement.appendChild(errorDiv);
}

// Mark a field as valid (green border, no error message)
function setFieldValid(inputEl) {
    inputEl.classList.remove("is-invalid");
    inputEl.classList.add("is-valid");

    var existing = inputEl.parentElement.querySelector(".field-error-msg");
    if (existing) {
        existing.remove();
    }
}

// Remove all validation styles from every field in a form
function clearFormValidation(formEl) {
    formEl.querySelectorAll(".is-invalid, .is-valid").forEach(function(el) {
        el.classList.remove("is-invalid", "is-valid");
    });
    formEl.querySelectorAll(".field-error-msg").forEach(function(el) {
        el.remove();
    });
}


// LOADING BUTTON HELPER
function setButtonLoading(btn, isLoading) {
    if (isLoading) {
        // Save the original label so we can restore it later
        btn.dataset.originalText = btn.innerHTML;
        btn.classList.add("btn-loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("btn-loading");
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText;
    }
}


// LOCAL STORAGE
function loadFromStorage() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            seedDatabase();
            return;
        }

        var parsed = JSON.parse(raw);

        if (!parsed.accounts || !parsed.departments) {
            seedDatabase();
            return;
        }

        window.db = parsed;

    } catch (error) {
        seedDatabase();
    }
}

function seedDatabase() {
    window.db = {
        accounts: [
            {
                firstName: "User",
                lastName: "Admin",
                email: "admin@example.com",
                password: "Password123!",
                role: "admin",
                verified: true
            }
        ],
        departments: [
            { id: 1, name: "Engineering", description: "Software Teams" },
            { id: 2, name: "HR",          description: "Human Resources" }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}


// ROUTING
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    var hash  = window.location.hash || "#/";
    var route = hash.replace("#/", "");

    // Hide all pages
    document.querySelectorAll(".page").forEach(function(page) {
        page.classList.remove("active");
    });

    var targetPage    = document.getElementById(route + "-page");
    var protectedRoutes = ["profile", "employees", "accounts", "departments", "my-requests"];
    var adminRoutes     = ["employees", "accounts", "departments"];

    // Redirect to login if not logged in
    if (protectedRoutes.includes(route) && !currentUser) {
        showToast("Please log in to access that page.", "warning");
        navigateTo("#/login");
        return;
    }

    // Redirect to home if not admin
    if (adminRoutes.includes(route) && currentUser?.role !== "admin") {
        showToast("You don't have permission to view that page.", "danger");
        navigateTo("#/");
        return;
    }

    if (targetPage) {
        targetPage.classList.add("active");

        // Call the right render function for the page
        switch (route) {
            case "profile":     renderProfile();        break;
            case "employees":   renderEmployeesTable(); break;
            case "accounts":    renderAccountsList();   break;
            case "departments": renderDepartmentsList();break;
            case "my-requests": renderMyRequests();     break;
        }

    } else {
        document.getElementById("home-page").classList.add("active");
    }

    // Special case: show the pending verification email
    if (route === "verify-email") {
        var email = localStorage.getItem("unverified_email");
        document.getElementById("verifyMessage").innerText =
            "A verification link has been sent to " + email;
    }
}


// REGISTRATION
function setupRegisterForm() {
    var form = document.getElementById("registerForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        // Clear any old validation styles
        clearFormValidation(form);

        // Grab field elements
        var firstNameEl = document.getElementById("regFirstName");
        var lastNameEl  = document.getElementById("regLastName");
        var emailEl     = document.getElementById("regEmail");
        var passwordEl  = document.getElementById("regPassword");

        var isValid = true;

        // Validate first name
        if (!firstNameEl.value.trim()) {
            setFieldError(firstNameEl, "First name is required.");
            isValid = false;
        } else {
            setFieldValid(firstNameEl);
        }

        // Validate last name
        if (!lastNameEl.value.trim()) {
            setFieldError(lastNameEl, "Last name is required.");
            isValid = false;
        } else {
            setFieldValid(lastNameEl);
        }

        // Validate email format
        if (!emailEl.value.trim()) {
            setFieldError(emailEl, "Email is required.");
            isValid = false;
        } else {
            setFieldValid(emailEl);
        }

        // Validate password length
        if (passwordEl.value.length < 6) {
            setFieldError(passwordEl, "Password must be at least 6 characters.");
            isValid = false;
        } else {
            setFieldValid(passwordEl);
        }

        // Stop here if anything is invalid
        if (!isValid) {
            showToast("Please fix the errors in the form.", "danger");
            return;
        }

        // Check if email is already taken
        var exists = window.db.accounts.find(function(acc) {
            return acc.email === emailEl.value.trim();
        });

        if (exists) {
            setFieldError(emailEl, "This email is already registered.");
            showToast("Email already exists.", "danger");
            return;
        }

        // Show loading spinner on the submit button
        var submitBtn = form.querySelector('[type="submit"]');
        setButtonLoading(submitBtn, true);

        // Small delay to simulate a network call
        setTimeout(function() {
            setButtonLoading(submitBtn, false);

            window.db.accounts.push({
                firstName: firstNameEl.value.trim(),
                lastName:  lastNameEl.value.trim(),
                email:     emailEl.value.trim(),
                password:  passwordEl.value,
                role:      "user",
                verified:  false
            });

            saveToStorage();
            localStorage.setItem("unverified_email", emailEl.value.trim());

            showToast("Account created! Please verify your email.", "success");
            navigateTo("#/verify-email");
        }, 600);
    });
}


// SIMULATE EMAIL VERIFICATION
function simulateVerification() {
    var email   = localStorage.getItem("unverified_email");
    var account = window.db.accounts.find(function(acc) {
        return acc.email === email;
    });

    if (account) {
        account.verified = true;
        saveToStorage();
        showToast("Email verified! You can now log in.", "success");
    }

    localStorage.removeItem("unverified_email");
    navigateTo("#/login");
}


// LOGIN
function setupLoginForm() {
    var form = document.getElementById("loginForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        clearFormValidation(form);

        var emailEl    = document.getElementById("loginEmail");
        var passwordEl = document.getElementById("loginPassword");

        var isValid = true;

        if (!emailEl.value.trim()) {
            setFieldError(emailEl, "Email is required.");
            isValid = false;
        } else {
            setFieldValid(emailEl);
        }

        if (!passwordEl.value) {
            setFieldError(passwordEl, "Password is required.");
            isValid = false;
        } else {
            setFieldValid(passwordEl);
        }

        if (!isValid) return;

        // Show loading spinner
        var submitBtn = form.querySelector('[type="submit"]');
        setButtonLoading(submitBtn, true);

        // Simulate a short network delay
        setTimeout(function() {
            setButtonLoading(submitBtn, false);

            var user = window.db.accounts.find(function(acc) {
                return acc.email    === emailEl.value.trim() &&
                       acc.password === passwordEl.value &&
                       acc.verified === true;
            });

            if (user) {
                localStorage.setItem("auth_token", emailEl.value.trim());
                setAuthState(true, user);
                showToast("Welcome back, " + user.firstName + "!", "success");
                navigateTo("#/profile");
            } else {
                // Give a more helpful error message
                var accountExists = window.db.accounts.find(function(acc) {
                    return acc.email === emailEl.value.trim();
                });

                if (accountExists && !accountExists.verified) {
                    setFieldError(emailEl, "Email not yet verified. Check your inbox.");
                    showToast("Please verify your email before logging in.", "warning");
                } else {
                    setFieldError(emailEl, "Invalid email or password.");
                    showToast("Login failed. Check your credentials.", "danger");
                }
            }
        }, 600);
    });
}


// AUTH STATE
function setAuthState(isAuth, user) {
    if (!user) user = null;

    if (isAuth) {
        currentUser = user;
        document.body.classList.remove("not-authenticated");
        document.body.classList.add("authenticated");

        if (user.role === "admin") {
            document.body.classList.add("is-admin");
        }

        document.getElementById("navUsername").innerText = user.lastName;

    } else {
        currentUser = null;
        document.body.classList.remove("authenticated", "is-admin");
        document.body.classList.add("not-authenticated");
    }
}


// PAGE LOAD
window.addEventListener("hashchange", handleRouting);

window.addEventListener("load", function() {
    loadFromStorage();

    // Set up all form listeners
    setupRegisterForm();
    setupLoginForm();
    setupEmployeeForm();
    setupAccountForm();
    setupRequestForm();

    // Restore session if token exists
    var token = localStorage.getItem("auth_token");
    if (token) {
        var user = window.db.accounts.find(function(acc) {
            return acc.email === token;
        });
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


// PROFILE
function renderProfile() {
    if (!currentUser) return;

    var fullName = currentUser.firstName + " " + currentUser.lastName;
    document.getElementById("profileName").innerText  = fullName.toUpperCase();
    document.getElementById("profileEmail").innerText = currentUser.email;
    document.getElementById("profileRole").innerText  = currentUser.role === "admin" ? "Admin" : "User";
}

function editProfile() {
    showToast("Profile editing is not yet available.", "info");
}


// EMPLOYEES
function populateDepartmentDropdown() {
    var select = document.getElementById("empDepartment");
    select.innerHTML = "";

    if (!window.db.departments) return;

    window.db.departments.forEach(function(dept) {
        var option = document.createElement("option");
        option.value       = dept.id;
        option.textContent = dept.name;
        select.appendChild(option);
    });
}

function toggleEmployeeForm(show) {
    var container = document.getElementById("employeeFormContainer");
    container.classList.toggle("d-none", !show);

    if (show) {
        populateDepartmentDropdown();
        clearFormValidation(document.getElementById("employeeForm"));
    }

    if (!show) {
        document.getElementById("employeeForm").reset();
    }
}

function setupEmployeeForm() {
    var form = document.getElementById("employeeForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        clearFormValidation(form);

        var idEl       = document.getElementById("empId");
        var emailEl    = document.getElementById("empEmail");
        var positionEl = document.getElementById("empPosition");
        var deptEl     = document.getElementById("empDepartment");
        var hireDateEl = document.getElementById("empHireDate");

        var isValid = true;

        // Validate Employee ID
        if (!idEl.value.trim()) {
            setFieldError(idEl, "Employee ID is required.");
            isValid = false;
        } else if (window.db.employees.some(function(emp) { return emp.id === idEl.value.trim(); })) {
            setFieldError(idEl, "This Employee ID already exists.");
            isValid = false;
        } else {
            setFieldValid(idEl);
        }

        // Validate email — must belong to an existing account
        var account = window.db.accounts.find(function(a) { return a.email === emailEl.value.trim(); });
        if (!emailEl.value.trim()) {
            setFieldError(emailEl, "Email is required.");
            isValid = false;
        } else if (!account) {
            setFieldError(emailEl, "No account found with this email.");
            isValid = false;
        } else {
            setFieldValid(emailEl);
        }

        // Validate position
        if (!positionEl.value.trim()) {
            setFieldError(positionEl, "Position is required.");
            isValid = false;
        } else {
            setFieldValid(positionEl);
        }

        // Validate hire date
        if (!hireDateEl.value) {
            setFieldError(hireDateEl, "Hire date is required.");
            isValid = false;
        } else {
            setFieldValid(hireDateEl);
        }

        if (!isValid) {
            showToast("Please fix the errors in the form.", "danger");
            return;
        }

        // Loading spinner
        var submitBtn = form.querySelector('[type="submit"]');
        setButtonLoading(submitBtn, true);

        setTimeout(function() {
            setButtonLoading(submitBtn, false);

            window.db.employees.push({
                id:       idEl.value.trim(),
                email:    emailEl.value.trim(),
                position: positionEl.value.trim(),
                deptId:   deptEl.value,
                hireDate: hireDateEl.value
            });

            saveToStorage();
            renderEmployeesTable();
            toggleEmployeeForm(false);
            showToast("Employee added successfully.", "success");
        }, 500);
    });
}

function renderEmployeesTable() {
    var tbody = document.getElementById("employeesTableBody");
    tbody.innerHTML = "";

    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No employees yet.</td></tr>';
        return;
    }

    window.db.employees.forEach(function(emp) {
        var dept     = window.db.departments.find(function(d) { return String(d.id) === String(emp.deptId); });
        var deptName = dept ? dept.name : "-";

        var tr = document.createElement("tr");
        tr.innerHTML =
            '<td>' + emp.id + '</td>' +
            '<td>' + emp.email + '</td>' +
            '<td>' + emp.position + '</td>' +
            '<td>' + deptName + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-danger" onclick="deleteEmployee(\'' + emp.id + '\')">Delete</button>' +
            '</td>';

        tbody.appendChild(tr);
    });
}

function deleteEmployee(id) {
    if (!confirm("Delete this employee?")) return;

    window.db.employees = window.db.employees.filter(function(emp) {
        return emp.id !== id;
    });

    saveToStorage();
    renderEmployeesTable();
    showToast("Employee deleted.", "warning");
}


// ACCOUNTS
function renderAccountsList() {
    var tbody = document.getElementById("accountsTableBody");
    tbody.innerHTML = "";

    window.db.accounts.forEach(function(acc, index) {
        var tr = document.createElement("tr");
        tr.innerHTML =
            '<td>' + acc.firstName + ' ' + acc.lastName + '</td>' +
            '<td>' + acc.email + '</td>' +
            '<td>' + acc.role + '</td>' +
            '<td>' + (acc.verified ? "✔" : "—") + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-warning me-1"   onclick="editAccount(' + index + ')">Edit</button>' +
                '<button class="btn btn-sm btn-secondary me-1" onclick="resetPassword(' + index + ')">Reset Password</button>' +
                '<button class="btn btn-sm btn-danger"         onclick="deleteAccount(' + index + ')">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function openAccountForm() {
    document.getElementById("accountFormContainer").classList.remove("d-none");
    document.getElementById("accountForm").reset();
    document.getElementById("accountIndex").value = "";
    document.getElementById("accountFormTitle").innerText = "Add Account";
    clearFormValidation(document.getElementById("accountForm"));
}

function closeAccountForm() {
    document.getElementById("accountFormContainer").classList.add("d-none");
}

function setupAccountForm() {
    var form = document.getElementById("accountForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        clearFormValidation(form);

        var firstNameEl = document.getElementById("accFirstName");
        var lastNameEl  = document.getElementById("accLastName");
        var emailEl     = document.getElementById("accEmail");
        var passwordEl  = document.getElementById("accPassword");
        var index       = document.getElementById("accountIndex").value;

        var isValid = true;

        if (!firstNameEl.value.trim()) {
            setFieldError(firstNameEl, "First name is required.");
            isValid = false;
        } else {
            setFieldValid(firstNameEl);
        }

        if (!lastNameEl.value.trim()) {
            setFieldError(lastNameEl, "Last name is required.");
            isValid = false;
        } else {
            setFieldValid(lastNameEl);
        }

        if (!emailEl.value.trim()) {
            setFieldError(emailEl, "Email is required.");
            isValid = false;
        } else {
            setFieldValid(emailEl);
        }

        if (passwordEl.value.length < 6) {
            setFieldError(passwordEl, "Password must be at least 6 characters.");
            isValid = false;
        } else {
            setFieldValid(passwordEl);
        }

        if (!isValid) {
            showToast("Please fix the errors in the form.", "danger");
            return;
        }

        var accountData = {
            firstName: firstNameEl.value.trim(),
            lastName:  lastNameEl.value.trim(),
            email:     emailEl.value.trim(),
            password:  passwordEl.value,
            role:      document.getElementById("accRole").value,
            verified:  document.getElementById("accVerified").checked
        };

        if (index === "") {
            // Add new & check for duplicate email
            var exists = window.db.accounts.find(function(a) {
                return a.email === accountData.email;
            });

            if (exists) {
                setFieldError(emailEl, "This email is already registered.");
                showToast("Email already exists.", "danger");
                return;
            }

            window.db.accounts.push(accountData);
            showToast("Account created successfully.", "success");
        } else {
            // Editing existing
            window.db.accounts[index] = accountData;
            showToast("Account updated successfully.", "success");
        }

        saveToStorage();
        renderAccountsList();
        closeAccountForm();
    });
}

function editAccount(index) {
    var acc = window.db.accounts[index];

    document.getElementById("accountIndex").value = index;
    document.getElementById("accFirstName").value = acc.firstName;
    document.getElementById("accLastName").value  = acc.lastName;
    document.getElementById("accEmail").value     = acc.email;
    document.getElementById("accPassword").value  = acc.password;
    document.getElementById("accRole").value      = acc.role;
    document.getElementById("accVerified").checked = acc.verified;

    document.getElementById("accountFormTitle").innerText = "Edit Account";
    document.getElementById("accountFormContainer").classList.remove("d-none");
    clearFormValidation(document.getElementById("accountForm"));
}

function resetPassword(index) {
    var newPass = prompt("Enter new password (min 6 chars):");

    if (!newPass) return;

    if (newPass.length < 6) {
        showToast("Password must be at least 6 characters.", "danger");
        return;
    }

    window.db.accounts[index].password = newPass;
    saveToStorage();
    showToast("Password updated successfully.", "success");
}

function deleteAccount(index) {
    var acc = window.db.accounts[index];

    if (acc.email === currentUser.email) {
        showToast("You cannot delete your own account.", "danger");
        return;
    }

    if (confirm("Are you sure you want to delete this account?")) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsList();
        showToast("Account deleted.", "warning");
    }
}


// DEPARTMENTS
function renderDepartmentsList() {
    var tbody = document.getElementById("departmentsTableBody");
    tbody.innerHTML = "";

    if (window.db.departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No departments yet.</td></tr>';
        return;
    }

    window.db.departments.forEach(function(dept) {
        var tr = document.createElement("tr");
        tr.innerHTML =
            '<td>' + dept.name + '</td>' +
            '<td>' + (dept.description || "-") + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-warning me-1" onclick="showToast(\'Edit not yet available.\', \'info\')">Edit</button>' +
                '<button class="btn btn-sm btn-danger"       onclick="showToast(\'Delete not yet available.\', \'info\')">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}


// MY REQUESTS
function addItemField(name, qty) {
    if (!name) name = "";
    if (!qty)  qty  = "";

    var container = document.getElementById("itemsContainer");
    var div = document.createElement("div");
    div.className = "row mb-2 item-row";
    div.innerHTML =
        '<div class="col-md-6">' +
            '<input class="form-control item-name" placeholder="Item Name" value="' + name + '" required>' +
        '</div>' +
        '<div class="col-md-4">' +
            '<input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="' + qty + '" required>' +
        '</div>' +
        '<div class="col-md-2">' +
            '<button type="button" class="btn btn-danger w-100" onclick="this.closest(\'.item-row\').remove()">×</button>' +
        '</div>';
    container.appendChild(div);
}

function setupRequestForm() {
    var form = document.getElementById("requestForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var typeEl   = document.getElementById("requestType");
        var itemRows = document.querySelectorAll(".item-row");

        // Reset type field state
        typeEl.classList.remove("is-invalid");

        // Validate type selection
        if (!typeEl.value) {
            typeEl.classList.add("is-invalid");
            showToast("Please select a request type.", "warning");
            return;
        }

        // Validate at least one item exists
        if (itemRows.length === 0) {
            showToast("Please add at least one item.", "warning");
            return;
        }

        // Collect and validate items
        var items = [];
        var itemsValid = true;

        itemRows.forEach(function(row) {
            var nameEl = row.querySelector(".item-name");
            var qtyEl  = row.querySelector(".item-qty");

            if (!nameEl.value.trim()) {
                nameEl.classList.add("is-invalid");
                itemsValid = false;
            } else {
                nameEl.classList.remove("is-invalid");
            }

            if (!qtyEl.value || Number(qtyEl.value) < 1) {
                qtyEl.classList.add("is-invalid");
                itemsValid = false;
            } else {
                qtyEl.classList.remove("is-invalid");
            }

            if (nameEl.value.trim() && qtyEl.value) {
                items.push({ name: nameEl.value.trim(), qty: qtyEl.value });
            }
        });

        if (!itemsValid || items.length === 0) {
            showToast("Please fill in all item fields.", "warning");
            return;
        }

        // Show loading on submit button
        var submitBtn = form.querySelector('[type="submit"]');
        setButtonLoading(submitBtn, true);

        setTimeout(function() {
            setButtonLoading(submitBtn, false);

            window.db.requests.push({
                type:          typeEl.value,
                items:         items,
                status:        "Pending",
                date:          new Date().toLocaleDateString(),
                employeeEmail: currentUser.email
            });

            saveToStorage();
            renderMyRequests();

            bootstrap.Modal.getInstance(document.getElementById("requestModal")).hide();
            form.reset();
            document.getElementById("itemsContainer").innerHTML = "";

            showToast("Request submitted successfully!", "success");
        }, 600);
    });
}

function renderMyRequests() {
    var tbody      = document.getElementById("requestsTableBody");
    var emptyState = document.getElementById("emptyState");
    var table      = document.getElementById("requestsTable");

    tbody.innerHTML = "";

    var myRequests = (window.db.requests || []).filter(function(r) {
        return r.employeeEmail === currentUser.email;
    });

    if (myRequests.length === 0) {
        emptyState.classList.remove("d-none");
        table.classList.add("d-none");
        return;
    }

    emptyState.classList.add("d-none");
    table.classList.remove("d-none");

    myRequests.forEach(function(req) {
        var tr = document.createElement("tr");

        var itemsText = req.items.map(function(i) {
            return i.name + " (x" + i.qty + ")";
        }).join(", ");

        var badgeClass = "bg-warning text-dark";
        if (req.status === "Approved") badgeClass = "bg-success";
        if (req.status === "Rejected") badgeClass = "bg-danger";

        tr.innerHTML =
            '<td>' + req.date + '</td>' +
            '<td>' + req.type + '</td>' +
            '<td>' + itemsText + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + req.status + '</span></td>';

        tbody.appendChild(tr);
    });
}


// LOGOUT
function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    showToast("You have been logged out.", "info");
    navigateTo("#/");
}
