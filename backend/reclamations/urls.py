from django.urls import path
from . import views

urlpatterns = [
    path("reclamations/", views.reclamation_list, name="reclamation_list"),

    path(
        "reclamations/<int:pk>/",
        views.reclamation_detail,
        name="reclamation_detail"
    ),

    path(
        "reclamations/<int:pk>/internal-note/",
        views.update_internal_note,
        name="update_internal_note",
    ),

    path(
        "reclamations/<int:pk>/mark-processed/",
        views.mark_as_processed,
        name="mark_as_processed",
    ),

    path(
        "reclamations/<int:pk>/classify/",
        views.classify_reclamation,
        name="classify_reclamation",
    ),

    path(
        "reclamation-stats/",
        views.reclamation_stats,
        name="reclamation_stats",
    ),
]