
import requests
import base64
import json
from datetime import datetime
from django.conf import settings
from rest_framework.response import Response

class MpesaClient:
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.base_url = "https://sandbox.safaricom.co.ke" if settings.MPESA_ENVIRONMENT == 'sandbox' else "https://api.safaricom.co.ke"

    def get_access_token(self):
        api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        try:
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            headers = {
                "Authorization": f"Basic {encoded_auth}"
            }
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            return response.json().get("access_token")
        except Exception as e:
            print(f"Error getting M-Pesa access token: {e}")
            return None

    def stk_push(self, phone_number, amount, account_reference, transaction_desc, callback_url):
        access_token = self.get_access_token()
        if not access_token:
            return {"error": "Failed to get access token"}

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        # Ensure phone number is in correct format (254...)
        if phone_number.startswith('+'):
            phone_number = phone_number[1:]
        if phone_number.startswith('0'):
            phone_number = f"254{phone_number[1:]}"

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        api_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            response_data = response.json()
            return response_data
        except Exception as e:
            print(f"Error initiating STK Push: {e}")
            return {"error": str(e)}
