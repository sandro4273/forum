function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitSignupForm);
}

async function submitSignupForm(){
    const body = {
        "username": document.forms["signup"]["username"].value,
        "email": document.forms["signup"]["email"].value,
        "password": document.forms["signup"]["password"].value
    }

    const response = await fetch(
        BACKENDURL + "user/signup/", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });

    if (response.ok) {
        window.location.href = "/ProgProjekt_Forum/frontend/pages/login.html";
    } else {
        console.error("Error signing up:", response.statusText);
        document.getElementById("errorMessage").style.display = "block";
        console.error("Error signing up:", response.statusText);
    }
}

window.addEventListener("DOMContentLoaded", onLoad());