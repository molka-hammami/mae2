from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import ReclamationCase, ReclamationActionLog
from .serializers import ReclamationSerializer
from .models import ReclamationCase, ReclamationActionLog, Annotation
import unicodedata
import re


def contains_arabic(text):
    return any("\u0600" <= char <= "\u06FF" for char in text)


def normalize_latin_name(name):
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("utf-8")
    name = re.sub(r"[^a-zA-Z\s]", " ", name)
    return name.strip().lower()


def normalize_arabic_name(name):
    name = re.sub(r"[^\u0600-\u06FF\s]", " ", name)

    replacements = {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ى": "ي",
        "ة": "ه",
    }

    for old, new in replacements.items():
        name = name.replace(old, new)

    return name.strip()


def guess_gender(name):
    if not name:
        return None

    raw_name = name.strip()
    is_arabic = contains_arabic(raw_name)

    cleaned_name = (
        normalize_arabic_name(raw_name)
        if is_arabic
        else normalize_latin_name(raw_name)
    )

    if not cleaned_name:
        return "Autre"

    parts = cleaned_name.split()

    male_names = {
        "mohamed", "mohammed", "mohamad", "mouhamed",
        "ahmed", "ahmad", "ali", "youssef", "yousef",
        "karim", "kareem", "mehdi", "amine", "amin",
        "walid", "houssem", "anis", "omar", "hassan",
        "hamza", "bilal", "khaled", "firas", "sami",
        "nabil", "zakaria", "riad", "aymen", "souhail",
        "tarek", "rafik", "lotfi", "chokri", "habib",
        "saber", "imad", "yassine", "skander", "montassar",
        "ghazi", "zouhair", "adel", "faouzi", "kais",
        "noureddine", "salah", "mondher", "mounir", "ridha",
        "hachem", "bechir", "bachir", "abdallah", "aziz",
        "rayen", "ilyes", "adam", "yazan", "maher", "rami",
        "nizar", "khalil", "hamdi", "sari", "fadi", "ziad",
        "imran", "aidel", "dali", "sassi", "mustapha",
        "monji", "abou", "wajih", "wejih", "neder", "nader",
        "amen", "med", "borhene", "mahmoud", "abdellatif",
        "jalel", "jamal", "jamel", "medkhaled", "fathi",

        "محمد", "احمد", "علي", "يوسف", "كريم", "مهدي",
        "امين", "وليد", "حسام", "انيس", "عمر", "حسن",
        "حمزه", "بلال", "خالد", "فراس", "سامي", "نبيل",
        "زكريا", "رياض", "ايمن", "سهيل", "طارق", "رفيق",
        "لطفي", "شكري", "حبيب", "صابر", "عماد", "ياسين",
        "اسكندر", "منتصر", "غازي", "زهير", "عادل", "فوزي",
        "قيس", "نورالدين", "صالح", "منذر", "منير", "رضا",
        "هاشم", "بشير", "عبدالله", "عزيز", "ريان", "الياس",
        "ادم", "ماهر", "رامي", "نزار", "خليل", "حمدي",
        "زياد", "عمران",
    }

    female_names = {
        "aicha", "aisha", "aycha", "nadia", "molka",
        "sarra", "sara", "ranim", "ranym", "fatma",
        "imen", "ines", "inesse", "dorra", "nour",
        "amal", "rahma", "chaima", "chayma", "chaimaa",
        "marwa", "maroua", "salma", "asma", "asmaa",
        "hiba", "rim", "wafa", "sana", "hayet", "najla",
        "soumaya", "faiza", "lamia", "kaouthar", "nermine",
        "sirine", "dina", "yasmin", "yasmine", "mouna",
        "emna", "ghada", "najet", "samira", "monia",
        "hanene", "afef", "khaoula", "ikram", "abir",
        "henda", "dalenda", "feten", "beya", "saoussen",
        "ahlem", "syrine", "insaf", "hend", "aya", "rania",
        "lina", "nada", "malak", "selma", "islem", "tasnim",
        "farah", "maram", "jihen", "ranya", "mayssa", "roua",
        "nourhen", "doaa", "iman", "zeineb", "zaineb",
        "zainab", "zayneb", "zeyneb", "mariam", "mariem",
        "meriam", "maryem", "sayida", "saida", "hasna",
        "hassna", "hana", "sa", "ol",

        "عائشه", "فاطمه", "ساره", "سارة", "ايناس", "ايمان",
        "ملك", "رحمه", "امل", "نور", "درة", "دره", "مريم",
        "ريم", "وفاء", "سناء", "حياة", "حياه", "نجلاء",
        "سمية", "سميه", "فايزه", "لمياء", "كوثر", "نرمين",
        "سيرين", "دينا", "ياسمين", "منى", "امنه", "غاده",
        "نجاة", "نجاه", "سميره", "منيه", "حنان", "عفاف",
        "خوله", "اكرام", "عبير", "هند", "فتن", "باية",
        "بايه", "سوسن", "احلام", "انصاف", "ايه", "رانية",
        "رانيه", "لينا", "ندى", "تسنيم", "فرح", "مرام",
        "جيهان", "ميساء", "رؤى", "دعاء",
    }

    for part in parts:
        if part in male_names:
            return "Homme"

    for part in parts:
        if part in female_names:
            return "Femme"

    return "Autre"


def agent_can_access_reclamation(reclamation, role, assigned_category):
    if role != "AGENT":
        return True

    annotation = getattr(reclamation.comment, "annotation", None)
    return bool(
        assigned_category
        and annotation
        and annotation.category == assigned_category
    )


def forbidden_category_response():
    return Response(
        {"error": "Cette reclamation ne correspond pas a la categorie de cet agent."},
        status=status.HTTP_403_FORBIDDEN,
    )


@api_view(["GET"])
def reclamation_list(request):
    role = request.GET.get("role", "")
    assigned_category = request.GET.get("assigned_category", "")

    reclamations = ReclamationCase.objects.filter(
        comment__annotation__is_reclamation="reclamation"
    ).order_by("-id")

    if role == "AGENT":
        if assigned_category:
            reclamations = reclamations.filter(
                comment__annotation__category=assigned_category
            )
        else:
            reclamations = reclamations.none()

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
    assigned_category = request.GET.get("assigned_category", "")

    if not agent_can_access_reclamation(reclamation, role, assigned_category):
        return forbidden_category_response()

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

    if reclamation.status in ("TRAITEE", "TRAITÉE"):
        return Response(
            {"error": "Cette reclamation est deja traitee. Sa categorie ne peut plus etre changee."},
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

@api_view(["GET"])
def feedback_stats(request):
    reclamations_count = Annotation.objects.filter(
        is_reclamation="reclamation"
    ).count()

    good_feedbacks_count = Annotation.objects.filter(
        is_reclamation="non_reclamation"
    ).count()

    total = reclamations_count + good_feedbacks_count

    return Response(
        {
            "total": total,
            "reclamations": reclamations_count,
            "good_feedbacks": good_feedbacks_count,
        },
        status=status.HTTP_200_OK,
    )
@api_view(["PATCH"])
def mark_as_processed(request, pk):
    reclamation = get_object_or_404(
        ReclamationCase,
        pk=pk,
        comment__annotation__is_reclamation="reclamation",
    )

    actor_name = request.data.get("actor_name", "")
    actor_role = request.data.get("actor_role", "")
    assigned_category = request.data.get("assigned_category", "")

    if not agent_can_access_reclamation(reclamation, actor_role, assigned_category):
        return forbidden_category_response()

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
    assigned_category = request.data.get("assigned_category", "")

    if not agent_can_access_reclamation(reclamation, actor_role, assigned_category):
        return forbidden_category_response()

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
