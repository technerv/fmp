import os
import django
import asyncio
import json
from channels.testing import WebsocketCommunicator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from config.asgi import application

async def test_chat():
    User = get_user_model()
    # Cleanup previous test run
    await User.objects.filter(username='chat_tester').adelete()

    # Create a test user
    user, created = await User.objects.aget_or_create(
        phone_number='254711111111',
        defaults={'username': 'chat_tester', 'password': 'password123'}
    )
    if created:
        user.set_password('password123')
        await user.asave()

    # Generate token
    token = AccessToken.for_user(user)
    
    # Connect to WebSocket
    communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
    connected, subprotocol = await communicator.connect()
    
    if not connected:
        print("Failed to connect")
        return

    print("Connected successfully")

    # Check for welcome message
    response = await communicator.receive_json_from()
    print(f"Received: {response}")

    # Send a message
    await communicator.send_json_to({"message": "Hello, I need help with an order"})
    
    # Receive response
    response = await communicator.receive_json_from() # User message echo (if any) or bot response
    # My implementation sends back user message first then bot response
    print(f"Received 1: {response}")
    
    response = await communicator.receive_json_from()
    print(f"Received 2: {response}")

    await communicator.disconnect()

if __name__ == "__main__":
    asyncio.run(test_chat())
