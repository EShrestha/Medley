console.log("here");
const chatForm = document.getElementById('chat-form');
const rateForm = document.getElementById('rate-form');
const chatMessages = document.querySelector('.chat-messages');
const users = document.getElementById('users');
const ratingComment = document.getElementById('modal-textarea')
const modal_container = document.getElementById('modal-container');
const closeModal = document.getElementById('modal-close');

var activeChatToken = null;
let selfUsername = null;
let selfUserID = null;
let chattingToUsername = null;
var ratingUserID = null;

// Message from server
socket.on('message', message => {
    console.log(message)
    outputMessage(message);

    // Scroll down to most recent message
    chatMessages.scrollTop = chatMessages.scrollHeight;
});


const openModal = (userID) => {
    console.log("RATING:", userID);
    ratingUserID = userID;
    modal_container.classList.add('show');
}

closeModal.addEventListener('click', (evt) => {
    console.log("closing modal");
    clearRating();
    modal_container.classList.remove('show');

});


// Send message
chatForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    let msg = evt.target.elements.msg.value;

    socket.emit('sendChat', activeChatToken, msg, (cb) => {
        outputMessage(cb, true);
    });

    evt.target.elements.msg.value = ''; // Clearing input
    evt.target.elements.msg.focus(); 
});

rateForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    let elements = document.getElementsByName('star');
    let rating = 5;
    let rated = false;
    for (i = 0; i < elements.length; i++) {
        if (elements[i].checked) {
            console.log(i, "is checked");
            rating -= i;
            rated = true;
            break;
        }
    }
    let comment = ratingComment.value;

    if (!rated) { return;}
    socket.emit('rateUser', ratingUserID, rating, comment, callback => {
        if (callback == true) {
            clearRating();
        }
    });
})

function clearRating() {
    let elements = document.getElementsByName('star');
    for (i = 0; i < elements.length; i++) {
        if (elements[i].checked) {
            elements[i].checked = false;
            break;
        }
    }
    ratingComment.value = "";
    modal_container.classList.remove('show');
}
function outputMessage(message, isSelf) {
    let div = document.createElement('div');
    let color = "#319ffd"

    if (isSelf) {
        div.style.cssFloat = "right";

    } else {
        color = "#e5e5ea"
        div.style.cssFloat = "left";
    }
    div.classList.add('message');
    div.style.backgroundColor = color;
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p> <p class="text">${message.text}</p>`
    document.querySelector('.chat-messages').appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

}


const loadMessageSection = async (chatToken) => {
    chattingToUsername = null;
    console.log("Clicked chat:", chatToken);
    await socket.emit('getChatContents', activeChatToken, chatToken, async (chatContent) => {
        document.querySelector('.chat-messages').innerHTML = ''; // Clearing right section
        activeChatToken = chatToken;

        
        
        let chat = chatContent.message;
        for (let index in chat) {
            
            let username = "Loading...";
            let color = "#319ffd"
            let div = document.createElement('div');
            if (chat.at(index).sentBy == selfUserID) {
                username = chatContent.self;
                div.style.cssFloat = "right";
            } else {
                username = chatContent.otherUser;
                color = "#e5e5ea"
                div.style.cssFloat = "left";

            }

            div.classList.add('message');
            div.style.backgroundColor = color;
            div.innerHTML = `<p class="meta" >${username} <span>${chat.at(index).timestamp}</span></p> <p class="text">${chat.at(index).content}</p>`
            document.querySelector('.chat-messages').appendChild(div);


        }
        chatMessages.scrollTop = chatMessages.scrollHeight;

    });
}

function appendRecentChats(chats) {
    c = chats;
    for (let index in chats) {
        let div = document.createElement('div');
        div.classList.add('individual-chats');

        let pChattingWith = document.createElement('p');
        pChattingWith.classList.add('chatting-with');
        pChattingWith.innerText = chats.at(index).chattingWith;
        pChattingWith.addEventListener('click', () => {
            openModal(chats.at(index).chattingWithID);
        });
        div.appendChild(pChattingWith);

        let pListingTitle = document.createElement('p');
        pListingTitle.classList.add('listing-title');
        pListingTitle.innerText = chats.at(index).listingTitle;
        div.appendChild(pListingTitle);

        users.appendChild(div);
        div.addEventListener('click', () => {
            loadMessageSection(chats.at(index).chatToken);
        });
    }
}

window.onload = (event) => {
    socket.emit('getRecentChats', (recentChats) => {
        appendRecentChats(recentChats);
    });

    socket.emit('getSelfChatInfo', callback => {
        selfUsername = callback.username;
        selfUserID = callback.userID;
    });
    console.log("LOADED");
}