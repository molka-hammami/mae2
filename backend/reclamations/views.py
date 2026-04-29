from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import ReclamationCase, ReclamationActionLog
from .serializers import ReclamationSerializer
from django.db.models import Count
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Annotation

@api_view(["GET"])
def reclamation_stats(request):
    return Response({"message": "Stats OK"})

@api_view(["GET"])
def reclamation_list(request):
    role = request.GET.get("role", "")
    assigned_category = request.GET.get("assigned_category", "")

    reclamations = ReclamationCase.objects.filter(
        comment__annotation__is_reclamation="reclamation"
    ).order_by("-id")

    if role == "AGENT" and assigned_category:
        reclamations = reclamations.filter(
            comment__annotation__category=assigned_category
        )

    serializer = ReclamationSerializer(reclamations, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def reclamation_detail(request, pk):
    reclamation = get_object_or_404(
        ReclamationCase,
        pk=pk,
        comment__annotation__is_reclamation="reclamation",
    )

    role = request.GET.get("role", "")
    actor_name = request.GET.get("actor_name", "")

    if role == "AGENT":
        changed = False

        if not reclamation.assigned_agent:
            reclamation.assigned_agent = actor_name
            reclamation.opened_at = timezone.now()
            changed = True

            ReclamationActionLog.objects.create(
                case=reclamation,
                actor_name=actor_name,
                actor_role=role,
                action="PRISE_EN_CHARGE",
                details=f"{actor_name} a pris en charge cette réclamation.",
            )

        if reclamation.status == "EN_ATTENTE":
            old_status = reclamation.status
            reclamation.status = "EN_COURS"
            changed = True

            ReclamationActionLog.objects.create(
                case=reclamation,
                actor_name=actor_name,
                actor_role=role,
                action="STATUT_CHANGE",
                details=f"Statut changé de {old_status} vers EN_COURS.",
            )

        if changed:
            reclamation.save()

    serializer = ReclamationSerializer(reclamation)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
def classify_reclamation(request, pk):
    reclamation = get_object_or_404(
        ReclamationCase,
        pk=pk,
        comment__annotation__is_reclamation="reclamation",
    )

    category = request.data.get("category")
    actor_name = request.data.get("actor_name", "Admin")
    actor_role = request.data.get("actor_role", "ADMIN")

    if not category:
        return Response(
            {"error": "La catégorie est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    annotation = reclamation.comment.annotation
    annotation.category = category
    annotation.category_assigned_by_admin = True
    annotation.category_assigned_at = timezone.now()
    annotation.save()

    ReclamationActionLog.objects.create(
        case=reclamation,
        actor_name=actor_name,
        actor_role=actor_role,
        action="CLASSIFICATION_VALIDEE",
        details=f"Catégorie validée : {category}",
    )

    serializer = ReclamationSerializer(reclamation)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
def mark_as_processed(request, pk):
    reclamation = get_object_or_404(
        ReclamationCase,
        pk=pk,
        comment__annotation__is_reclamation="reclamation",
    )

    actor_name = request.data.get("actor_name", "")
    actor_role = request.data.get("actor_role", "")

    if reclamation.status != "TRAITEE":
        old_status = reclamation.status
        reclamation.status = "TRAITEE"
        reclamation.processed_at = timezone.now()
        reclamation.save()

        ReclamationActionLog.objects.create(
            case=reclamation,
            actor_name=actor_name,
            actor_role=actor_role,
            action="TRAITEMENT_TERMINE",
            details=f"Statut changé de {old_status} vers TRAITEE. {actor_name} a marqué la réclamation comme traitée.",
        )

    serializer = ReclamationSerializer(reclamation)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
def update_admin_note(request, pk):
    reclamation = get_object_or_404(
        ReclamationCase,
        pk=pk,
        comment__annotation__is_reclamation="reclamation",
    )

    annotation = getattr(reclamation.comment, "annotation", None)
    if not annotation:
        return Response(
            {"error": "Annotation liée introuvable"},
            status=status.HTTP_404_NOT_FOUND,
        )

    admin_note = request.data.get("admin_note", "")
    actor_name = request.data.get("actor_name", "Admin")
    actor_role = request.data.get("actor_role", "ADMIN")

    annotation.admin_note = admin_note
    annotation.category_assigned_by_admin = True
    annotation.save()

    ReclamationActionLog.objects.create(
        case=reclamation,
        actor_name=actor_name,
        actor_role=actor_role,
        action="NOTE_ADMIN",
        details="Note admin mise à jour.",
    )

    serializer = ReclamationSerializer(reclamation)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
def update_internal_note(request, pk):
    reclamation = get_object_or_404(
        ReclamationCase,
        pk=pk,
        comment__annotation__is_reclamation="reclamation",
    )

    internal_note = request.data.get("internal_note", "")
    actor_name = request.data.get("actor_name", "Agent")
    actor_role = request.data.get("actor_role", "AGENT")

    reclamation.internal_note = internal_note
    reclamation.save()

    ReclamationActionLog.objects.create(
        case=reclamation,
        actor_name=actor_name,
        actor_role=actor_role,
        action="NOTE_AGENT",
        details="Note interne mise à jour.",
    )

    serializer = ReclamationSerializer(reclamation)
    return Response(serializer.data, status=status.HTTP_200_OK)