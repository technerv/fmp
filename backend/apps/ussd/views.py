from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category
from apps.orders.models import Order
from apps.farmers.models import FarmerProfile, BuyerProfile
from django.db.models import Sum
from datetime import date
from decimal import Decimal

User = get_user_model()

@csrf_exempt
def ussd_callback(request):
    if request.method == 'POST':
        session_id = request.POST.get('sessionId')
        service_code = request.POST.get('serviceCode')
        phone_number = request.POST.get('phoneNumber')
        text = request.POST.get('text', '')

        response = ""

        # Check if user exists
        user = User.objects.filter(phone_number=phone_number).first()

        if user:
            response = handle_registered_user(user, text)
        else:
            response = handle_registration(phone_number, text)

        return HttpResponse(response, content_type="text/plain")
    return HttpResponse("Method not allowed", status=405)

def handle_registration(phone_number, text):
    inputs = text.split('*') if text else []
    
    if len(inputs) == 0:
        return "CON Welcome to Farmer Market Pool\n1. Register as Farmer\n2. Register as Buyer"
    
    role_input = inputs[0]
    
    if role_input not in ['1', '2']:
        return "END Invalid option. Please try again."
    
    # 1: Role, 2: Name, 3: PIN
    if len(inputs) == 1:
        return "CON Enter your Full Name"
    
    if len(inputs) == 2:
        return "CON Set your 4-digit PIN"
    
    if len(inputs) == 3:
        name = inputs[1]
        pin = inputs[2]
        
        # Create User
        try:
            role = 'farmer' if role_input == '1' else 'buyer'
            # Use phone number as username
            user = User.objects.create_user(
                username=phone_number,
                phone_number=phone_number,
                password=pin,
                user_type=role,
                first_name=name.split(' ')[0],
                last_name=' '.join(name.split(' ')[1:]) if ' ' in name else ''
            )
            
            # Create Profile
            if role == 'farmer':
                FarmerProfile.objects.create(
                    user=user,
                    county='Unknown', # Default
                    ward='Unknown'
                )
            else:
                BuyerProfile.objects.create(
                    user=user,
                    county='Unknown',
                    buyer_type='individual'
                )
                
            return f"END Registration successful as {role}. Dial again to access the menu."
        except Exception as e:
            return f"END Registration failed: {str(e)}"
            
    return "END Something went wrong."

def handle_registered_user(user, text):
    inputs = text.split('*') if text else []
    
    if len(inputs) == 0:
        return f"CON Welcome {user.first_name}\n1. Market\n2. My Orders\n3. My Wallet"
    
    option = inputs[0]
    
    if option == '1': # Market (Add Product for Farmer, Buy for Buyer)
        if user.user_type == 'farmer':
            return handle_farmer_market(user, inputs)
        else:
            return handle_buyer_market(user, inputs)
            
    elif option == '2': # My Orders
        return handle_orders(user, inputs)
        
    elif option == '3': # My Wallet
        return handle_wallet(user, inputs)
        
    else:
        return "END Invalid option."

def handle_farmer_market(user, inputs):
    # Flow: 1 -> Name -> Price -> Qty -> Confirm
    # inputs[0] is '1'
    
    if len(inputs) == 1:
        return "CON Enter Product Name (e.g. Tomatoes)"
        
    if len(inputs) == 2:
        return "CON Enter Price per Kg (KES)"
        
    if len(inputs) == 3:
        return "CON Enter Quantity Available (Kg)"
        
    if len(inputs) == 4:
        name = inputs[1]
        price = inputs[2]
        qty = inputs[3]
        
        try:
            # Get or create default category
            category, _ = Category.objects.get_or_create(
                name='Vegetables',
                defaults={'slug': 'vegetables', 'description': 'Fresh vegetables'}
            )

            # Create product
            Product.objects.create(
                farmer=user,
                name=name,
                category=category,
                price_per_unit=price,
                unit='kg',
                quantity=qty,
                harvest_date=date.today(),
                county=user.farmer_profile.county if hasattr(user, 'farmer_profile') else 'Unknown',
                status='available',
                description=f"Added via USSD by {user.first_name}"
            )
            return "END Product added successfully."
        except Exception as e:
            return f"END Failed to add product: {str(e)}"
            
    return "END Invalid input."

def handle_buyer_market(user, inputs):
    # Flow: 1 -> List Products -> Select -> Qty -> Confirm
    # inputs[0] is '1'
    
    if len(inputs) == 1:
        # List top 5 available products
        products = Product.objects.filter(quantity__gt=0, status='available').order_by('-created_at')[:5]
        if not products:
            return "END No products available."
            
        response = "CON Select Product:\n"
        for idx, p in enumerate(products, 1):
            response += f"{idx}. {p.name} @ {p.price_per_unit}/kg\n"
        return response
        
    if len(inputs) == 2:
        return "CON Enter Quantity (Kg)"
        
    if len(inputs) == 3:
        # Process Order
        try:
            selection_idx = int(inputs[1]) - 1
            qty = float(inputs[2])
            
            products = Product.objects.filter(quantity__gt=0, status='available').order_by('-created_at')[:5]
            if 0 <= selection_idx < len(products):
                product = products[selection_idx]
                total_price = Decimal(product.price_per_unit) * Decimal(qty)
                
                # Check if enough quantity
                if float(product.quantity) < qty:
                    return f"END Not enough stock. Available: {product.quantity}kg"

                # Create Order
                Order.objects.create(
                    buyer=user,
                    product=product,
                    quantity=qty,
                    unit_price=product.price_per_unit,
                    subtotal=total_price,
                    total_amount=total_price, # Initial value, will be updated in save() with commission
                    status='pending',
                    delivery_address='USSD Default',
                    delivery_county=user.buyer_profile.county if hasattr(user, 'buyer_profile') else 'Unknown'
                )
                
                # Deduct quantity
                product.quantity = float(product.quantity) - qty
                product.save()
                
                return f"END Order placed for {qty}kg of {product.name}. Total: KES {total_price}. Pay via M-Pesa."
            else:
                return "END Invalid product selection."
        except ValueError as e:
            return f"END Invalid input: {str(e)}"
        except Exception as e:
            return f"END Order failed: {str(e)}"
            
    return "END Invalid input."

def handle_orders(user, inputs):
    # Just list recent orders
    if user.user_type == 'farmer':
        orders = Order.objects.filter(product__farmer__user=user).order_by('-created_at')[:3]
    else:
        orders = Order.objects.filter(buyer__user=user).order_by('-created_at')[:3]
        
    if not orders:
        return "END No recent orders found."
        
    response = "END Recent Orders:\n"
    for o in orders:
        response += f"- {o.product.name}: {o.quantity}kg ({o.status})\n"
        
    return response

def handle_wallet(user, inputs):
    if user.user_type == 'farmer':
        # Calculate total sales
        total = Order.objects.filter(
            product__farmer__user=user, 
            status='completed'
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0
        return f"END Total Sales: KES {total}"
    else:
        # Calculate total purchases
        total = Order.objects.filter(
            buyer__user=user
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0
        return f"END Total Spent: KES {total}"
