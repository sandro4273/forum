/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file login.js
 * This file contains the logic for the login page. It allows users to log in to the forum using OAuth2.
 *
 * OAuth2 is a protocol that allows a user to log in to a website using a third-party service (e.g., Google, Facebook).
 * (https://oauth.net/2/)
 */

/**
 * Displays an error message on the login page.
 * @param message
 */
function displayErrorMessage(message) {
    document.getElementById("errorMessage").textContent = message;
    document.getElementById("errorMessage").style.display = "block";
}

/**
 * Validates the login form. Checks if the email and password fields are not empty.
 * @param loginForm - The login form element
 * @returns {boolean}
 */
function validateLoginForm(loginForm) {
    const email = loginForm.elements["username"].value;
    const password = loginForm.elements["password"].value;

    // Check if email and password are not empty
    if (email.trim() === "" || password.trim() === "") {
        displayErrorMessage("Bitte geben Sie eine gültige E-Mail-Adresse und ein Passwort ein.");
        return false;
    }

    return true;
}

/**
 * Handles the login form submission. Sends a POST request to the backend with the login form data.
 */
async function submitLoginForm(event){
    event.preventDefault(); // Prevent the default form submission

    // OAuth2 requires FormData in the request body. Therefore, we create a FormData object from the login form
    const loginForm = document.forms["login"];
    if (!validateLoginForm(loginForm)) return;

    const body = new FormData(loginForm);
    const response = await fetch(BACKENDURL + "auth/login/", {
        method: "POST",
        body: body,
    });

    // Display an error message if the login was not successful
    if (!response.ok) {
        displayErrorMessage("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    }

    // Successful login
    const res = await response.json();
    localStorage.setItem("AuthToken", res["access_token"]);

    // Clear the form
    loginForm.reset();

    // Redirect to the home page
    window.location.href = "/frontend/public/index.html";
}

/**
 * Executed when the DOM is fully loaded. Adds an event listener to the submit button of the login form.
 */
function initialize(){
    document.querySelector("#submitButton").addEventListener("click", submitLoginForm);
}

// Entry point - Execute initialize when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initialize);
