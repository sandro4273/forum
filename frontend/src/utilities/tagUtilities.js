async function loadTags(post_id){
    // load tags
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/tags/");
    const tagsData = await response.json();
    const tags = tagsData["tags"];

    // Check if there are any tags
    document.querySelector("#tags").style.display = tags.length > 0 ? "block" : "none";
    // Create HTML elements for each tag
    const tagList = document.querySelector("#tags");

    for(let i = 0; i < tags.length; i++){
        const tagElement = document.createElement('span');
        tagElement.textContent = tags[i] + "  |  ";
        tagList.appendChild(tagElement);
    }
}