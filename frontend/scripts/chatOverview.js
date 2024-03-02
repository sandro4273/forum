// Executed when chatOverview.html is loaded
function onLoad() {
    loadChats();
}

async function loadChats() {
    // Load all chats of user
    const response = await fetch(BACKENDURL + "user/id/1/chats/all/"); // Account-System noch nicht implementiert
    const chats = await response.json();
    const chatsArray = chats["result"];
    console.log(chatsArray);

    // Create HTML elements and append them
    for (let i = 0; i < chatsArray.length; i++) {
        const link = document.createElement('a');
        link.setAttribute("href", FRONTENDURL + "frontend/pages/chat.html?id=" + chatsArray[i]["chat_id"]);
        const newElement = document.createElement('p');
        newElement.appendChild(link).textContent = chatsArray[i]["other_username"];
        document.querySelector("#chatList").append(newElement);
    }
}

// onLoad ausführen wenn Seite vollständig geladen ist
window.addEventListener("DOMContentLoaded", onLoad());