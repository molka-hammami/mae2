from django.urls import path
from .views import (
    login_view,
    change_password_view,
    users_list_create,
    user_update_delete,
)

urlpatterns = [
    path("login/", login_view, name="login"),
    path("change-password/", change_password_view, name="change_password"),
    path("users/", users_list_create, name="users_list_create"),
    path("users/<int:pk>/", user_update_delete, name="user_update_delete"),
]