const registerNotificationSocket = (
    socket,
    notificationCallbacks
) => {
    socket.on('send-invitation', notificationCallbacks.sendInvitation());
    socket.on('reject-invitation', notificationCallbacks.rejectInvitation());
    socket.on('accept-invitation', notificationCallbacks.acceptInvitation());
}

module.exports = registerNotificationSocket;