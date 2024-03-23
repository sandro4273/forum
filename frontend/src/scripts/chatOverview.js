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
 * Executed when the DOM is fully loaded. Loads all chats of the user.
 */
function onLoad() {
    loadChats();
}

// Entry point - Execute onLoad when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
