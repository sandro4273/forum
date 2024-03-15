function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitLoginForm);
}

async function submitLoginForm(){
    const body = {
        "email": document.forms["login"]["email"].value,
        "password": document.forms["login"]["password"].value
    }

    const response = await fetch(
        BACKENDURL + "users/login/", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });

    if (!response.ok) {
        document.getElementById("errorMessage").style.display = "block";
        return;
    }

    const res = await response.json();
    localStorage.setItem("AuthToken", res["auth_token"]);
    window.location.href = "/frontend/public/index.html";
}

window.addEventListener("DOMContentLoaded", onLoad);
