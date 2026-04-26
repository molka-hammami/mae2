from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import AppUser
from .serializers import UserSerializer, CreateUserSerializer


@api_view(["POST"])
def login_view(request):
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "").strip()

    if not email or not password:
        return Response(
            {"error": "Email et mot de passe sont obligatoires."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = AppUser.objects.get(email=email, is_active=True)
    except AppUser.DoesNotExist:
        return Response(
            {"error": "Email ou mot de passe incorrect."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not check_password(password, user.password):
        return Response(
            {"error": "Email ou mot de passe incorrect."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def change_password_view(request):
    user_id = request.data.get("user_id")
    current_password = request.data.get("currentPassword", "").strip()
    new_password = request.data.get("newPassword", "").strip()
    confirm_password = request.data.get("confirmPassword", "").strip()

    if not user_id:
        return Response(
            {"error": "Utilisateur introuvable."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = get_object_or_404(AppUser, pk=user_id)

    if not current_password or not new_password or not confirm_password:
        return Response(
            {"error": "Tous les champs sont obligatoires."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not check_password(current_password, user.password):
        return Response(
            {"error": "L'ancien mot de passe est incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_password != confirm_password:
        return Response(
            {"error": "La confirmation du mot de passe est incorrecte."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.password = make_password(new_password)
    user.must_change_password = False
    user.save()

    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
def users_list_create(request):
    if request.method == "GET":
        users = AppUser.objects.all().order_by("id")
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        data = request.data.copy()
        raw_password = data.get("password", "").strip()

        if not raw_password:
            return Response(
                {"error": "Le mot de passe temporaire est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["email"] = data.get("email", "").strip().lower()
        data["password"] = make_password(raw_password)
        data["must_change_password"] = True

        serializer = CreateUserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            created_user = AppUser.objects.get(pk=serializer.data["id"])
            return Response(UserSerializer(created_user).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
def user_update_delete(request, pk):
    user = get_object_or_404(AppUser, pk=pk)

    if request.method == "PATCH":
        data = request.data.copy()

        if "email" in data:
            data["email"] = data["email"].strip().lower()

        if "password" in data and data["password"].strip():
            data["password"] = make_password(data["password"].strip())
            data["must_change_password"] = True
        elif "password" in data:
            data.pop("password")

        serializer = CreateUserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        user.delete()
        return Response({"message": "Utilisateur supprimé avec succès."}, status=status.HTTP_204_NO_CONTENT)