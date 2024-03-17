// Executed when chatOverview.html is loaded
function onLoad() {
    document.querySelector("#createChatButton").addEventListener("click", createChat);
    loadChats();
}

async function loadChats() {
    // Load all chats of user
    const auth_token = localStorage.getItem("AuthToken");
    const chatsResponse = await fetch(
        `${BACKENDURL}users/chats/all/`, {
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${auth_token}`
            }
        }
    );

    const chatsData = await chatsResponse.json();
    const chats = chatsData["chats"];

    // Create HTML elements and append them
    chats.forEach(chat => {
        const link = document.createElement('a');
        link.href = `${FRONTENDURL}frontend/public/chat.html?id=${chat["chat_id"]}`;
        link.textContent = chat["other_username"];

        const chatElement = document.createElement('p');
        chatElement.appendChild(link);

        document.querySelector("#chatList").appendChild(chatElement);
    });
}

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
    const partnerId = userData["user_id"];

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

// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
