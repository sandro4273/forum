/**
 * Handles the signup form submission. Sends a POST request to the backend with the signup form data.
 */
async function submitSignupForm(){
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
    if (response.ok) {
        window.location.href = "/frontend/public/login.html";
        return;
    }

    // If signup was not successful, display an appropriate error message
    const errorData = await response.json();

    if (response.status === 422) { // A submitted field has an invalid value. Display a user-friendly error message
        displayErrorMessage(errorData.detail[0]["msg"]);
        console.log(errorData);
    } else { // An unexpected error occurred. Display a generic error message
        displayErrorMessage("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
    }
}

/**
 * Displays an error message on the signup form depending on the error message received from the backend.
 */
function displayErrorMessage(errorMessage) {
    // Map internal error messages to more user-friendly messages
    switch (errorMessage) {
    case "Value error, Username must be alphanumeric":
        errorMessage = "Der Benutzername darf nur aus Buchstaben und Zahlen bestehen.";
        break;
    case "Value error, Username already exists":
        errorMessage = "Der Benutzername existiert bereits.";
        break;
    case "value is not a valid email address: The email address is not valid. It must have exactly one @-sign.":
        errorMessage = "Die E-Mail-Adresse hat kein gültiges Format.";
        break;
    case "Value error, Email already exists":
        errorMessage = "Die E-Mail-Adresse existiert bereits.";
        break;
    case "Value error, Password must be at least 8 characters long":
        errorMessage = "Das Passwort muss mindestens 8 Zeichen lang sein.";
        break;
    case "Value error, Password must have at least one uppercase letter, one lowercase letter, one digit and a special character":
        errorMessage = "Das Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.";
        break;

    default:
        break;
    }

    // Display the error message
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = errorMessage;
    errorElement.style.display = "block";
}

/**
 * Executed when the DOM is fully loaded. Adds an event listener to the submit button of the signup form.
 */
function onLoad(){
    document.querySelector("#submitButton").addEventListener("click", submitSignupForm);
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad);
