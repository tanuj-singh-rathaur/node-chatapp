const socket = io()
const $messageform = document.querySelector('#message-form')
const $input = $messageform.querySelector('input')
const $btn = $messageform.querySelector('button')
const $sendlocationbtn = document.querySelector("#send-location")
const $messages = document.querySelector('#messages')


//templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//parsing the querry string 
const { room, username } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoScroll = () => {
    //new message element 
    const $newMessage = $messages.lastElementChild

    //height of the newMessages
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far i have scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {

        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render($locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageform.addEventListener('submit', (e) => {
    e.preventDefault()
    $btn.setAttribute('disabled', 'disabled')

    const message = $input.value
    socket.emit('send-message', message, (ack) => {
        $btn.removeAttribute('disabled')
        $input.value = ''
        $input.focus()

    })


})

$sendlocationbtn.addEventListener('click', () => {
    if (!navigator.geolocation)
        alert('your browser doesnt support geolocation  now')
    $sendlocationbtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('send-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (ack) => {
            $sendlocationbtn.removeAttribute('disabled')
            console.log(ack)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }

})