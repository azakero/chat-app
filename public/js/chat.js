const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocation = document.querySelector("#send-location")
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New Message Element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
})

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll();
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // disable button after form submission
    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value;

    socket.emit("userMessage", message, (error) => {

        // enable button after message acknowledgement
        $messageFormButton.removeAttribute("disabled")
        $messageInput.value = ""
        $messageInput.focus()

        if(error){
            return console.log(error)
        }
    })
})

$sendLocation.addEventListener("click", () => {
    if(!navigator.geolocation){
        return alert("Geolocation services are not supported by your browser. Please Update!")
    }

    //disable location button
    $sendLocation.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit("sendLocation", location, (sharedMessage) => {
            // enable location button
            $sendLocation.removeAttribute("disabled")
        });
    })
})

socket.emit("join", { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = "/"
    }
})