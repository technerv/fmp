"""
Celery configuration for farmer_market_pool project.
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('farmer_market_pool')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
