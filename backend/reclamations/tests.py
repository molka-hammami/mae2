from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from .views import agent_can_access_reclamation, reclamation_detail, reclamation_list


class AgentReclamationScopeTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_agent_access_is_limited_to_assigned_category(self):
        reclamation = SimpleNamespace(
            comment=SimpleNamespace(
                annotation=SimpleNamespace(category="SINISTRE AUTO")
            )
        )

        self.assertTrue(
            agent_can_access_reclamation(
                reclamation, "AGENT", "SINISTRE AUTO"
            )
        )
        self.assertFalse(
            agent_can_access_reclamation(
                reclamation, "AGENT", "SINISTRE VIE"
            )
        )

    @patch("reclamations.views.ReclamationSerializer")
    @patch("reclamations.views.ReclamationCase.objects")
    def test_agent_list_is_filtered_by_assigned_category(
        self, objects, serializer_class
    ):
        queryset = Mock()
        queryset.filter.return_value = queryset
        queryset.order_by.return_value = queryset
        serializer_class.return_value.data = []
        objects.filter.return_value = queryset

        request = self.factory.get(
            "/api/reclamations/",
            {"role": "AGENT", "assigned_category": "SINISTRE AUTO"},
        )
        response = reclamation_list(request)

        self.assertEqual(response.status_code, 200)
        queryset.filter.assert_called_with(
            comment__annotation__category="SINISTRE AUTO"
        )

    @patch("reclamations.views.ReclamationSerializer")
    @patch("reclamations.views.ReclamationCase.objects")
    def test_agent_without_category_receives_empty_list(
        self, objects, serializer_class
    ):
        queryset = Mock()
        queryset.filter.return_value = queryset
        queryset.order_by.return_value = queryset
        queryset.none.return_value = queryset
        serializer_class.return_value.data = []
        objects.filter.return_value = queryset

        request = self.factory.get("/api/reclamations/", {"role": "AGENT"})
        response = reclamation_list(request)

        self.assertEqual(response.status_code, 200)
        queryset.none.assert_called_once_with()

    @patch("reclamations.views.ReclamationActionLog.objects.create")
    @patch("reclamations.views.get_object_or_404")
    def test_opening_out_of_scope_detail_does_not_change_status(
        self, get_object, create_log
    ):
        reclamation = SimpleNamespace(
            comment=SimpleNamespace(
                annotation=SimpleNamespace(category="SINISTRE VIE")
            ),
            assigned_agent=None,
            opened_at=None,
            status="EN_ATTENTE",
            save=Mock(),
        )
        get_object.return_value = reclamation

        request = self.factory.get(
            "/api/reclamations/1/",
            {
                "role": "AGENT",
                "actor_name": "Agent Auto",
                "assigned_category": "SINISTRE AUTO",
            },
        )
        response = reclamation_detail(request, 1)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(reclamation.status, "EN_ATTENTE")
        self.assertIsNone(reclamation.assigned_agent)
        reclamation.save.assert_not_called()
        create_log.assert_not_called()
