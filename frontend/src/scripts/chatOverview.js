/**
 * Executed when the DOM is fully loaded. Loads all chats of the user.
 */
function onLoad() {
    // Display the current user
    showCurrentUser();

    // Add event listeners
    document.querySelector("#createChatButton").addEventListener("click", createChat);

    // Load chats
    loadChats();
}

/**
 * Fetches all chats of the user and renders them in the chat overview page.
 */
async function loadChats() {
    // Load all chats of user
    const auth_token = localStorage.getItem("AuthToken");
    const chatsResponse = await fetch(
        `${BACKENDURL}users/me/chats/`, {
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            }
        }
    );

    // If the request was not successful, throw an error
    if (!chatsResponse.ok) {
        throw new Error("Failed to fetch chats");
    }

    // If the request was successful, render the chats
    const chatsData = await chatsResponse.json();
    const chats = chatsData["chats"];
    renderChats(chats);
}

/**
 * Renders the chats of the user in the chat overview page.
 */
function renderChats(chats) {
    const chatList = document.querySelector("#chatList");
    chatList.innerHTML = ''; // Clear existing content

    chats.forEach(chat => {
        // Create a link to the chat page
        const link = document.createElement('a');
        link.href = `${FRONTENDURL}frontend/public/chat.html?id=${chat["chat_id"]}`;
        link.textContent = chat["other_username"];

        const chatElement = document.createElement('p');
        chatElement.appendChild(link);

        chatList.appendChild(chatElement);
    });
}

/**
 * Creates a new chat with the user entered in the input field.
 */
async function createChat() {
    // Get the username to search for
    const username = document.querySelector("#searchUser").value;

    // Try to find the user
    const userResponse = await fetch(`${BACKENDURL}users/name/${username}/`)

    // If the user was not found, display an error message
    if (!userResponse.ok) {
        const errorElement = document.querySelector("#error");
        errorElement.textContent = "User not found";
        errorElement.setAttribute("style", "display: block");
        errorElement.setAttribute("style", "color: red");
        return;
    }

    // If the user was found, try to create a chat
    const userData = await userResponse.json();
    const partnerId = userData["user"]["user_id"];

    const auth_token = localStorage.getItem("AuthToken");
    const chatResponse = await fetch(
        `${BACKENDURL}chats/create/`, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json", 
                "Authorization": `Bearer ${auth_token}`
            },
            body: partnerId
        })

    // If there was an error, display an error message
    if (!chatResponse.ok) {
        const errorElement = document.querySelector("#error");
        errorData = await chatResponse.json();
        errorElement.textContent = errorData.detail;

        errorElement.setAttribute("style", "display: block");
        errorElement.setAttribute("style", "color: red");
        return;
    }
}


// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
