// Executed when chat.html is loaded
async function onLoad() {
    const chatId = getChatIdFromUrl();
    const chatTitle = document.querySelector("#chatTitle");
    document.querySelector("#sendMessage").addEventListener("click", sendMessage);

    const partnerUsername = await getUsernameById(await getChatPartnerId(chatId, 1));
    chatTitle.textContent = "Chat mit " + partnerUsername
    console.log(await getChatPartnerId(chatId, 1)); // Account-System noch nicht implementiert
    loadMessages(chatId);
}

function getChatIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function getUsernameById(user_id) {
    const response = await fetch(BACKENDURL + "user/id/" + user_id + "/");
    const user = await response.json();
    return user["result"]["username"];
}


async function getChatPartnerId(chat_id, user1) {
    const response = await fetch(BACKENDURL + "chat/id/" + chat_id + "/");
    const chat = await response.json();
    // Partner ID is the user_id of the other user in the chat
    const partner_id = chat["result"]["user1"] == user1 ? chat["result"]["user2"] : chat["result"]["user1"];
    return partner_id;
}

async function loadMessages(chat_id) {
    const messageList = document.querySelector("#messageList");
    // Load all messages of chat
    const response = await fetch(BACKENDURL + "chat/id/" + chat_id + "/messages/all/");
    const messages = await response.json();
    const messagesArray = messages["result"];

    // Create HTML elements and append them
    for (let i = 0; i < messagesArray.length; i++) {
        // get message content  
        const msgContent = messagesArray[i]["message"];

        const sentById = messagesArray[i]["sent_by"];
        const username = await getUsernameById(sentById);
        const newElement = document.createElement('p');
        newElement.textContent = username + ": " + msgContent;
        messageList.append(newElement);
    }

}


async function sendMessage(event) {
    event.preventDefault();
    
    const chatId = getChatIdFromUrl();
    const messageContent = document.querySelector("#messageContent");
    const message = messageContent.value.trim();

    const body = {
        "user_id": 1, // Account-System noch nicht implementiert
        "message": message
    }
    const response = await fetch(
        BACKENDURL + "chat/id/" + chatId + "/create_message/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
    res = await response.json();
    return response;
}


// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());