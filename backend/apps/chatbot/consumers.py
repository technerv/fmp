import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
            
        # Get or create active session
        self.session = await self.get_or_create_session()
        self.room_group_name = f"chat_{self.session.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        # Send welcome message if new session
        if await self.is_new_session():
            await self.send_message("bot", "Hello! I am your assistant. How can I help you today?")

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Save user message
        await self.save_message('user', message)
        
        # Echo user message back to client (and group)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'sender': 'user',
                'message': message
            }
        )

        # Generate response
        response = await self.generate_response(message)
        
        # Save bot message
        await self.save_message('bot', response)

        # Send response to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'sender': 'bot',
                'message': response
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'sender': event['sender'],
            'message': event['message']
        }))


    async def send_message(self, sender, message):
        await self.save_message(sender, message)
        await self.send(text_data=json.dumps({
            'sender': sender,
            'message': message
        }))

    @database_sync_to_async
    def get_or_create_session(self):
        session = ChatSession.objects.filter(user=self.user, is_active=True).first()
        if not session:
            session = ChatSession.objects.create(user=self.user)
        return session

    @database_sync_to_async
    def is_new_session(self):
        return not self.session.messages.exists()

    @database_sync_to_async
    def save_message(self, sender, message):
        return ChatMessage.objects.create(
            session=self.session,
            sender=sender,
            message=message
        )

    async def generate_response(self, message):
        msg = message.lower()
        
        if 'order' in msg:
            return "You can view your orders in the 'My Orders' section. Do you need help with a specific order?"
        elif 'product' in msg:
            if 'add' in msg:
                return "To add a product, go to your dashboard and click 'Add Product'."
            return "We have a wide variety of fresh produce. Check the marketplace!"
        elif 'payment' in msg or 'pay' in msg:
            return "We accept M-Pesa and card payments. Payments are secured via escrow."
        elif 'contact' in msg or 'support' in msg:
            return "You can reach our support team at support@farmermarketpool.com or call +254..."
        elif 'hello' in msg or 'hi' in msg:
            return "Hello! How can I assist you today?"
        else:
            return "I'm not sure I understand. Could you please rephrase or ask about orders, products, or payments?"
