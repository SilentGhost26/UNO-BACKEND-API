const sendInvitationSchema = require('../../schemas/send-invitation.schema');
const invitationResponseSchema = require('../../schemas/invitation-response.schema');

const registerNotificationSocket = (
    socket,
    notificationCallbacks
) => {
    socket.on('send-invitation', notificationCallbacks.sendInvitation(sendInvitationSchema));
    socket.on('reject-invitation', notificationCallbacks.rejectInvitation(invitationResponseSchema));
    socket.on('accept-invitation', notificationCallbacks.acceptInvitation(invitationResponseSchema));
}

module.exports = registerNotificationSocket;
