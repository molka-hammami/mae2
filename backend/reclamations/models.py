from django.db import models


class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    source = models.CharField(max_length=100, null=True, blank=True)
    comment_date = models.CharField(max_length=100, null=True, blank=True)
    url = models.TextField(unique=True)
    text_original = models.TextField(null=True, blank=True)
    clean_text = models.TextField(null=True, blank=True)

    # ✅ AJOUTE ÇA
    author_name = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "comments"
        managed = False


class Annotation(models.Model):
    id = models.AutoField(primary_key=True)
    comment = models.OneToOneField(
        Comment,
        on_delete=models.DO_NOTHING,
        db_column="comment_id",
        related_name="annotation",
    )

    is_reclamation = models.CharField(max_length=50, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    urgency = models.CharField(max_length=50, null=True, blank=True)
    processing_status = models.CharField(max_length=50, null=True, blank=True)
    review_reason = models.TextField(null=True, blank=True)

    category_assigned_by_admin = models.BooleanField(default=False)
    admin_note = models.TextField(null=True, blank=True)
    category_assigned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "annotations"
        managed = False


class ReclamationCase(models.Model):
    id = models.AutoField(primary_key=True)

    comment = models.OneToOneField(
    Comment,
    on_delete=models.DO_NOTHING,
    db_column="comment_id",
    related_name="case",
    null=True,
    blank=True,
)

    status = models.CharField(
        max_length=20,
        default="EN_ATTENTE",
    )

    assigned_agent = models.CharField(max_length=100, null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    internal_note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "reclamation_cases"
        managed = True


class ReclamationActionLog(models.Model):
    case = models.ForeignKey(
        ReclamationCase,
        on_delete=models.CASCADE,
        related_name="action_logs",
    )

    actor_name = models.CharField(max_length=150, null=True, blank=True)
    actor_role = models.CharField(max_length=50, null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reclamation_action_logs"