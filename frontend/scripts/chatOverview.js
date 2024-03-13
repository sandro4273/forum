// Executed when chatOverview.html is loaded
function onLoad() {
    loadChats();
}

async function loadChats() {
    // Load all chats of user
    const auth_token = localStorage.getItem("AuthToken");
    const chatsResponse = await fetch(
        BACKENDURL + "user/chats/all/", {
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
        link.href = `${FRONTENDURL}frontend/pages/chat.html?id=${chat["chat_id"]}`;
        link.textContent = chat["other_username"];

        const chatElement = document.createElement('p');
        chatElement.appendChild(link);

        document.querySelector("#chatList").appendChild(chatElement);
    });
}

// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());
