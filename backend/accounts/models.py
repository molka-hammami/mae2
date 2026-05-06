from django.db import models


class AppUser(models.Model):
    ROLE_CHOICES = [
        ("ADMIN", "ADMIN"),
        ("AGENT", "AGENT"),
    ]

    CATEGORY_CHOICES = [
        ("SINISTRE AUTO", "SINISTRE AUTO"),
        ("SERVICE CLIENT", "SERVICE CLIENT"),
        ("SINISTRE VIE", "SINISTRE VIE"),
        ("SINISTRE IRDS", "SINISTRE IRDS"),
    ]
    
    name = models.CharField(max_length=150)
    recovery_email = models.EmailField(blank=True, null=True)
    # Login automatique généré : exemple ranim@mae.tn
    email = models.EmailField(unique=True)

    # Email réel/personnel : exemple ranim@gmail.com
    personal_email = models.EmailField(null=True, blank=True)

    password = models.CharField(max_length=255)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="AGENT")
    recovery_email = models.EmailField(blank=True, null=True)
    must_change_password = models.BooleanField(default=True)

    assigned_category = models.CharField(
        max_length=100,
        choices=CATEGORY_CHOICES,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "app_users"

    def __str__(self):
        return f"{self.name} - {self.role}"