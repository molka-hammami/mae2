from django.urls import path
from .views import login_view, change_password_view, users_list_create, user_update_delete,forgot_password_view
urlpatterns = [
    path("login/", login_view),
    path("change-password/", change_password_view),
    path("users/", users_list_create),
    path("users/<int:pk>/", user_update_delete),
    path("forgot-password/", forgot_password_view),
]