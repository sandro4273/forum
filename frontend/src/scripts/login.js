function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitLoginForm);
}

async function submitLoginForm(){

    const loginForm = document.forms["login"];
    const body = new FormData(loginForm);

    const response = await fetch(
        BACKENDURL + "auth/login/", {
            method: "POST",
            body: body,
        });

    if (!response.ok) {
        document.getElementById("errorMessage").style.display = "block";
        return;
    }

    const res = await response.json();

    localStorage.setItem("AuthToken", res["access_token"]);
    window.location.href = "/frontend/public/index.html";
}

window.addEventListener("DOMContentLoaded", onLoad);
