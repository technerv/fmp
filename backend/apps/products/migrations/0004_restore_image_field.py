# Generated migration to restore image field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_add_location_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='productimage',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='products/'),
        ),
    ]
