# Generated manually: add store_id (FK to Store) to CmsUser. Null = all stores (e.g. admin).

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_add_username_to_cmsuser"),
    ]

    operations = [
        migrations.AddField(
            model_name="cmsuser",
            name="store",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="users",
                to="api.store",
                db_column="store_id",
            ),
        ),
    ]
