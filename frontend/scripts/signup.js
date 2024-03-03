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
    res = await response.json();
    return response;
}

window.addEventListener("DOMContentLoaded", onLoad());