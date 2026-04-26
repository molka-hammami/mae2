from rest_framework import serializers
from .models import ReclamationCase, ReclamationActionLog


class ReclamationActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReclamationActionLog
        fields = [
            "id",
            "actor_name",
            "actor_role",
            "action",
            "details",
            "created_at",
        ]


class ReclamationSerializer(serializers.ModelSerializer):
    comment_id = serializers.IntegerField(source="comment.id", read_only=True)
    source = serializers.CharField(source="comment.source", read_only=True)
    comment_date = serializers.CharField(source="comment.comment_date", read_only=True)
    text_original = serializers.CharField(source="comment.text_original", read_only=True)

    category = serializers.CharField(
        source="comment.annotation.category",
        allow_null=True,
        read_only=True,
    )

    urgency = serializers.CharField(
        source="comment.annotation.urgency",
        allow_null=True,
        read_only=True,
    )

    category_assigned_by_admin = serializers.BooleanField(
        source="comment.annotation.category_assigned_by_admin",
        read_only=True,
    )

    admin_note = serializers.CharField(
        source="comment.annotation.admin_note",
        allow_null=True,
        allow_blank=True,
        read_only=True,
    )

    category_assigned_at = serializers.DateTimeField(
        source="comment.annotation.category_assigned_at",
        allow_null=True,
        required=False,
        read_only=True,
    )

    comment_url = serializers.SerializerMethodField()

    action_logs = ReclamationActionLogSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ReclamationCase
        fields = [
            "id",
            "comment_id",
            "source",
            "comment_date",
            "text_original",
            "category",
            "urgency",
            "category_assigned_by_admin",
            "admin_note",
            "category_assigned_at",
            "status",
            "assigned_agent",
            "opened_at",
            "processed_at",
            "internal_note",
            "comment_url",
            "action_logs",
        ]

    def get_comment_url(self, obj):
        if obj.comment and hasattr(obj.comment, "url"):
            return obj.comment.url
        return None