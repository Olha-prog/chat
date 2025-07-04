const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const registerBtn = document.getElementById('register-btn');
const loginBtn = document.getElementById('login-btn');

loginBtn?.addEventListener('click', (e) => {
    location.assign('/login');
});

registerBtn?.addEventListener('click', (e) => {
    location.assign('/register');
});

registerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const {login, password, passwordRepeat} = registerForm;
    if (password.value !== passwordRepeat.value) {
        return alert('Паролі не співпадають');
    }
    if (password.value.length < 4) {
        return alert('Password should contains at least 4 symbols');
    }
    const user = JSON.stringify({
        login: login.value,
        password: password.value,
        photo: photo.value
    });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/register');
    xhr.send(user);
    xhr.onload = () => alert(xhr.response);
});

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const {login, password} = loginForm;
    const user = JSON.stringify({
        login: login.value,
        password: password.value
    });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/login');
    xhr.send(user);
    xhr.onload = () => {
        if (xhr.status === 200) {
            const token = xhr.response;
            document.cookie = `token=${token}`;
            window.location.assign('/');
        } else {
            return alert(xhr.response);
        }
    };
});