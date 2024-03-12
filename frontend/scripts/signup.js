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
        window.location.href = "/frontend/pages/login.html";
    } else {
        const errorData = await response.json();

        if (response.status === 422) {
            displayErrorMessage(errorData.detail[0].msg);
        } else {
            displayErrorMessage("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
        }
    }
}

function displayErrorMessage(errorMessage) {
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

    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = errorMessage;
    errorElement.style.display = "block";
}

window.addEventListener("DOMContentLoaded", onLoad);