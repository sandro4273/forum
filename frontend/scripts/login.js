function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitLoginForm);
}

async function submitLoginForm(){
    const body = {
        "email": document.forms["login"]["email"].value,
        "password": document.forms["login"]["password"].value
    }

    const response = await fetch(
        BACKENDURL + "user/login/", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });

    if (response.ok) {
        const res = await response.json();
        localStorage.setItem("AuthToken", res.auth_token);
        window.location.href = "/ProgProjekt_Forum/frontend/index.html";
    } else {
        document.getElementById("errorMessage").style.display = "block";
    }
}

window.addEventListener("DOMContentLoaded", onLoad);