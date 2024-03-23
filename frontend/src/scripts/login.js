/**
 * Handles the login form submission. Sends a POST request to the backend with the login form data.
 */
async function submitLoginForm(event){
    event.preventDefault(); // Prevent the default form submission

    // OAuth2 requires FormData in the request body. Therefore, we create a FormData object from the login form
    const loginForm = document.forms["login"];
    const body = new FormData(loginForm);

    const response = await fetch(BACKENDURL + "auth/login/", {
        method: "POST",
        body: body,
    });

    if (!response.ok) { // If login was not successful, display an error message
        document.getElementById("errorMessage").style.display = "block";
        return;
    }

    // If login was successful, store the access token in the local storage and redirect to the chat overview
    const res = await response.json();
    localStorage.setItem("AuthToken", res["access_token"]);
    window.location.href = "/frontend/public/index.html";
}

/**
 * Executed when the DOM is fully loaded. Adds an event listener to the submit button of the login form.
 */
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitLoginForm);
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad);
