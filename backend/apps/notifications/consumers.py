import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Notification

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
        else:
            # Group name based on user ID so we can send messages to specific users
            self.group_name = f"user_{self.user.id}"
            
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        # We generally don't expect the client to send messages for notifications,
        # but if we did (e.g. mark as read), we'd handle it here.
        pass

    # Receive message from group
    async def send_notification(self, event):
        message = event['message']
        title = event['title']
        notification_id = event.get('notification_id')
        notification_type = event.get('notification_type', 'info')
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id': notification_id,
            'title': title,
            'message': message,
            'notification_type': notification_type
        }))
