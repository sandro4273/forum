/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file chat.js
 * This file contains the logic for the chat page. It displays a chat with a partner and allows users to send messages.
 */

/**
 * Get the chat ID from the URL.
 * @returns {string} - The chat ID
 */
function getChatIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load all messages of a chat and display them in the chat window.
 * @param chat_id
 * @returns {Promise<void>}
 */
async function loadMessages(chat_id) {
    const messageList = document.querySelector("#messageList");
    messageList.innerHTML = ""; // Clear message list

    // Load all messages of chat
    const messagesResponse = await fetch(`${BACKENDURL}chats/id/${chat_id}/messages/`);
    const messagesData = await messagesResponse.json();
    const messages = messagesData["messages"];

    // Create HTML elements for each message and append them
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        // get username of sender
        const sentById = message["sent_by"];
        const username = await getUsername(sentById);

        // Create a container for the comment
        const messageContainer = document.createElement('div');

        // Display creation time (in gray)
        const timestampElement = document.createElement('span');
        timestampElement.textContent = message["created_at"];
        timestampElement.style.color = "gray";
        messageContainer.appendChild(timestampElement);

        // Display user ID
        const usernameElement = document.createElement('span');
        usernameElement.textContent = " - " + username + ": ";
        messageContainer.appendChild(usernameElement);

        // Display comment content
        const msgContentElement = document.createElement('span');
        msgContentElement.textContent = message["message"];
        messageContainer.appendChild(msgContentElement);

        // Append the comment container to the comment list
        messageList.appendChild(messageContainer);
    }

}

/**
 * Send a message to the chat partner. The message is extracted from the input field and sent to the backend.
 * @param event
 * @returns {Promise<any>}
 */
async function sendMessage(event) {
    event.preventDefault();

    // Extract chatId and message content
    const chatId = getChatIdFromUrl();
    const messageContent = document.querySelector("#messageContent");
    const message = messageContent.value.trim();

    // API request to create message
    const currentUserId = await getCurrentUserId();
    const body = {
        "user_id": currentUserId,
        "message": message
    }

    const messageResponse = await fetch(
        `${BACKENDURL}chats/id/${chatId}/create_message/`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });

    const messageData = await messageResponse.json();

    //Reload all messages and clear input field
    await loadMessages(chatId);
    messageContent.value = "";

    return messageData;
}

/**
 * Initialize the chat page.
 */
async function initialize() {
    // Display the current user
    await displayAuthStatus();

    // Get partner username
    const chatId = getChatIdFromUrl();
    const chatResponse = await fetch(`${BACKENDURL}chats/id/${chatId}/`);
    const chatData = await chatResponse.json();
    const chat = chatData["chat"];
    const user1Id = chat["user1"];
    const user2Id = chat["user2"];

    // Must be logged in to access the chat
    const currentUserId = await getCurrentUserId()

    if (!currentUserId) return;

    // Check if current user is permitted to access the chat
    if (!(currentUserId === user1Id || currentUserId === user2Id)) return;

    // Get partner id
    const partnerId = currentUserId === user1Id ? user2Id : user1Id;

    // Set chat title
    const partnerUsername = await getUsername(partnerId);
    const chatTitle = document.querySelector("#chatTitle");
    chatTitle.textContent = "Chat mit " + partnerUsername

    // Add event listener to send message button and load messages
    document.querySelector("#sendMessage").addEventListener("click", sendMessage);
    await loadMessages(chatId);
}

// Entry point - Execute initialize() when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", initialize);
