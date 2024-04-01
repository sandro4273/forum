/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file signup.js
 * This file contains the logic for the signup page. It allows users to sign up for an account which creates a new user
 * in the database.
 */

// Maps internal error messages to user-friendly error messages
const errorMessagesMap = {
    "Value error, Username must be alphanumeric":
        "Der Benutzername darf nur aus Buchstaben und Zahlen bestehen.",
    "Value error, Username already exists":
        "Der Benutzername existiert bereits.",
    "value is not a valid email address: The email address is not valid. It must have exactly one @-sign.":
        "Die E-Mail-Adresse hat kein gültiges Format.",
    "Value error, Email already exists":
        "Die E-Mail-Adresse existiert bereits.",
    "Value error, Password must be at least 8 characters long":
        "Das Passwort muss mindestens 8 Zeichen lang sein.",
    "Value error, Password must have at least one uppercase letter, one lowercase letter, one digit and a special character":
        "Das Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten."
};

/**
 * Handles the signup form submission. Sends a POST request to the backend with the signup form data.
 */
async function submitSignupForm(){
    // Signup form validation
    const body = {
        "username": document.forms["signup"]["username"].value,
        "email": document.forms["signup"]["email"].value,
        "password": document.forms["signup"]["password"].value
    }

    const response = await fetch(
        BACKENDURL + "auth/signup/", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body),
        });

    // If signup was successful, redirect to the login page
    if (!response.ok) {
        const errorData = await response.json();
        displayErrorMessage(errorData.detail[0]["msg"]);
        return;
    }

    // Signup was successful. Redirect to the login page.
    window.location.href = "/frontend/public/login.html";
}

/**
 * Displays an error message on the frontend, using the provided mapping for user-friendly messages.
 * @param {string} errorMessage
 */
function displayErrorMessage(errorMessage) {
    // Map the error message to a user-friendly message. If no mapping exists, use a default message.
    const defaultErrorMessage = "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
    const userFriendlyMessage = errorMessagesMap[errorMessage] || defaultErrorMessage;

    // Display the error message on the frontend
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = userFriendlyMessage;
    errorElement.style.display = "block";
}

/**
 * Initializes the signup page. Adds an event listener to the submit button.
 */
function initialize(){
    document.querySelector("#submitButton").addEventListener("click", submitSignupForm);
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initialize);
