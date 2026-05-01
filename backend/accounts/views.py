from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AppUser
from .serializers import UserSerializer, CreateUserSerializer

import secrets

from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags


def generate_temporary_password():
    chars_lower = "abcdefghjkmnpqrstuvwxyz"
    chars_upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    chars_digits = "23456789"
    chars_special = "@#$!"

    password = [
        secrets.choice(chars_upper),
        secrets.choice(chars_lower),
        secrets.choice(chars_digits),
        secrets.choice(chars_special),
    ]

    all_chars = chars_lower + chars_upper + chars_digits + chars_special

    for _ in range(6):
        password.append(secrets.choice(all_chars))

    secrets.SystemRandom().shuffle(password)
    return "".join(password)


def generate_tokens_for_user(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.id
    refresh["email"] = user.email
    refresh["name"] = user.name
    refresh["role"] = user.role
    refresh["must_change_password"] = user.must_change_password

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def send_account_created_email(user, temporary_password):
    if not user.personal_email:
        return

    subject = "Bienvenue sur la plateforme MAE"

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.12);">
              <tr>
                <td style="background:#166534; padding:28px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:26px;">MAE Assurances</h1>
                  <p style="margin:8px 0 0; color:#dcfce7;">Plateforme de gestion des réclamations</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px; color:#0f172a;">Bonjour {user.name},</h2>

                  <p style="font-size:15px; color:#334155; line-height:1.6;">
                    Votre compte agent a été créé avec succès.
                  </p>

                  <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:20px; margin:24px 0;">
                    <p style="margin:0 0 12px; color:#166534; font-weight:bold;">
                      Vos informations de connexion
                    </p>
                    <p><strong>Login :</strong> {user.email}</p>
                    <p><strong>Mot de passe provisoire :</strong> {temporary_password}</p>
                  </div>

                  <p style="font-size:15px; color:#334155; line-height:1.6;">
                    Merci d'accéder à la plateforme et de changer votre mot de passe lors de votre première connexion.
                  </p>

                  <div style="text-align:center; margin:30px 0;">
                    <a href="http://localhost:5173/login"
                       style="background:#166534; color:#ffffff; padding:14px 24px; text-decoration:none; border-radius:12px; font-weight:bold; display:inline-block;">
                      Accéder à la plateforme
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc; padding:18px; text-align:center; color:#64748b; font-size:12px;">
                  © MAE Assurances — Message automatique
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    text_message = strip_tags(html_message)

    email = EmailMultiAlternatives(
        subject,
        text_message,
        "MAE Assurances <mae.assurances.platform@gmail.com>",
        [user.personal_email],
    )
    email.attach_alternative(html_message, "text/html")
    email.send()


def send_forgot_password_email(user, temporary_password):
    if not user.personal_email:
        return

    subject = "Réinitialisation de votre mot de passe MAE"

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.12);">
              <tr>
                <td style="background:#166534; padding:28px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:26px;">MAE Assurances</h1>
                  <p style="margin:8px 0 0; color:#dcfce7;">Réinitialisation du mot de passe</p>
                </td>
              </tr>

              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px; color:#0f172a;">Bonjour {user.name},</h2>

                  <p style="font-size:15px; color:#334155; line-height:1.6;">
                    Votre demande de réinitialisation de mot de passe a bien été traitée.
                  </p>

                  <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:20px; margin:24px 0;">
                    <p style="margin:0 0 12px; color:#166534; font-weight:bold;">
                      Vos nouvelles informations de connexion
                    </p>
                    <p><strong>Login :</strong> {user.email}</p>
                    <p><strong>Nouveau mot de passe provisoire :</strong> {temporary_password}</p>
                  </div>

                  <p style="font-size:15px; color:#334155; line-height:1.6;">
                    Pour des raisons de sécurité, merci de changer ce mot de passe dès votre prochaine connexion.
                  </p>

                  <div style="text-align:center; margin:30px 0;">
                    <a href="http://localhost:5173/login"
                       style="background:#166534; color:#ffffff; padding:14px 24px; text-decoration:none; border-radius:12px; font-weight:bold; display:inline-block;">
                      Accéder à la plateforme
                    </a>
                  </div>

                  <p style="font-size:13px; color:#64748b; line-height:1.6;">
                    Si vous n'avez pas demandé cette réinitialisation, veuillez contacter l'administrateur.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background:#f8fafc; padding:18px; text-align:center; color:#64748b; font-size:12px;">
                  © MAE Assurances — Message automatique
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    text_message = strip_tags(html_message)

    email = EmailMultiAlternatives(
        subject,
        text_message,
        "MAE Assurances <mae.assurances.platform@gmail.com>",
        [user.personal_email],
    )
    email.attach_alternative(html_message, "text/html")
    email.send()


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "").strip()

    if not email or not password:
        return Response({"error": "Email et mot de passe obligatoires"}, status=400)

    try:
        user = AppUser.objects.get(email=email, is_active=True)
    except AppUser.DoesNotExist:
        return Response({"error": "Email ou mot de passe incorrect"}, status=401)

    if not check_password(password, user.password):
        return Response({"error": "Email ou mot de passe incorrect"}, status=401)

    tokens = generate_tokens_for_user(user)

    return Response({
        "access": tokens["access"],
        "refresh": tokens["refresh"],
        "user": UserSerializer(user).data,
    })


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def change_password_view(request):
    user_id = request.data.get("user_id")
    current_password = request.data.get("currentPassword", "")
    new_password = request.data.get("newPassword", "")
    confirm_password = request.data.get("confirmPassword", "")

    if not user_id:
        return Response({"error": "Utilisateur introuvable."}, status=400)

    user = get_object_or_404(AppUser, pk=user_id)

    if not current_password or not new_password or not confirm_password:
        return Response({"error": "Tous les champs sont obligatoires."}, status=400)

    if not check_password(current_password, user.password):
        return Response({"error": "Ancien mot de passe incorrect"}, status=400)

    if new_password != confirm_password:
        return Response({"error": "Confirmation incorrecte"}, status=400)

    user.password = make_password(new_password)
    user.must_change_password = False
    user.save(update_fields=["password", "must_change_password"])

    return Response(UserSerializer(user).data)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def forgot_password_view(request):
    personal_email = request.data.get("personal_email", "").strip().lower()

    if not personal_email:
        return Response({"error": "Email personnel obligatoire."}, status=400)

    try:
        user = AppUser.objects.get(personal_email=personal_email, is_active=True)
    except AppUser.DoesNotExist:
        return Response({"error": "Email introuvable"}, status=404)

    temporary_password = generate_temporary_password()

    user.password = make_password(temporary_password)
    user.must_change_password = True
    user.save(update_fields=["password", "must_change_password"])

    if not check_password(temporary_password, user.password):
        return Response(
            {"error": "Erreur lors de l'enregistrement du mot de passe."},
            status=500,
        )

    send_forgot_password_email(user, temporary_password)

    return Response(
        {"message": "Un nouveau mot de passe provisoire a été envoyé par email."},
        status=200,
    )


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def users_list_create(request):
    if request.method == "GET":
        users = AppUser.objects.all().order_by("id")
        return Response(UserSerializer(users, many=True).data)

    data = request.data.copy()
    raw_password = data.get("password", "").strip()

    if not raw_password:
        return Response({"error": "Mot de passe obligatoire"}, status=400)

    data["email"] = data.get("email", "").strip().lower()
    data["personal_email"] = data.get("personal_email", "").strip().lower()
    data["must_change_password"] = True

    serializer = CreateUserSerializer(data=data)

    if serializer.is_valid():
        user = serializer.save()
        user.password = make_password(raw_password)
        user.save(update_fields=["password"])

        send_account_created_email(user, raw_password)

        return Response(UserSerializer(user).data, status=201)

    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
@authentication_classes([])
@permission_classes([AllowAny])
def user_update_delete(request, pk):
    user = get_object_or_404(AppUser, pk=pk)

    if request.method == "PATCH":
        data = request.data.copy()

        if "email" in data:
            data["email"] = data["email"].strip().lower()

        if "personal_email" in data:
            data["personal_email"] = data["personal_email"].strip().lower()

        raw_password = data.get("password", "").strip() if "password" in data else ""

        if raw_password:
            data.pop("password")
            user.password = make_password(raw_password)
            user.must_change_password = True
            user.save(update_fields=["password", "must_change_password"])
        elif "password" in data:
            data.pop("password")

        serializer = CreateUserSerializer(user, data=data, partial=True)

        if serializer.is_valid():
            updated_user = serializer.save()
            return Response(UserSerializer(updated_user).data)

        return Response(serializer.errors, status=400)

    user.delete()
    return Response({"message": "Utilisateur supprimé"}, status=204)