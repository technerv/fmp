from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

def send_notification(user, title, message, notification_type='info', related_id=None):
    """
    Creates a notification in the DB and sends it via WebSocket.
    """
    # 1. Create DB record
    notification = Notification.objects.create(
        recipient=user,
        title=title,
        message=message,
        notification_type=notification_type,
        related_id=related_id
    )

    # 2. Send via WebSocket
    channel_layer = get_channel_layer()
    group_name = f"user_{user.id}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_notification',
            'notification_id': str(notification.id),
            'title': title,
            'message': message,
            'notification_type': notification_type,
            'related_id': related_id
        }
    )
    
    return notification
