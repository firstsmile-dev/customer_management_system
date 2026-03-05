# Generated manually: make memo and unpaid_date optional on VisitRecord

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_add_store_to_cmsuser"),
    ]

    operations = [
        migrations.AlterField(
            model_name="visitrecord",
            name="memo",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="visitrecord",
            name="unpaid_date",
            field=models.DateField(blank=True, db_column="unpaid date", null=True),
        ),
    ]
