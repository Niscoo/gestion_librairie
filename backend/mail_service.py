"""
Service d'envoi d'emails via Gmail API avec OAuth 2.0.

Configuration initiale :
1. Créer un projet sur https://console.cloud.google.com/
2. Activer l'API Gmail
3. Créer des identifiants OAuth 2.0 (type : Application Web)
4. Ajouter http://localhost:8090/ comme URI de redirection autorisée
5. Télécharger le fichier credentials.json dans le dossier backend/
6. Lancer : python mail_service.py
   → Cela ouvrira le navigateur pour autoriser l'accès et créer token.json
"""

import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

BASE_DIR = Path(__file__).parent
CREDENTIALS_FILE = BASE_DIR / 'credentials.json'
TOKEN_FILE = BASE_DIR / 'token.json'

# Variable globale pour capturer le code d'autorisation
_auth_code = None


class _OAuthCallbackHandler(BaseHTTPRequestHandler):
    """Handler HTTP pour capturer le code OAuth"""
    def do_GET(self):
        global _auth_code
        query = parse_qs(urlparse(self.path).query)
        _auth_code = query.get('code', [None])[0]
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(
            '<html><body style="font-family:Arial;text-align:center;padding:60px">'
            '<h2 style="color:#FF6B35">✅ Autorisation réussie !</h2>'
            '<p>Vous pouvez fermer cette fenêtre.</p>'
            '</body></html>'.encode()
        )

    def log_message(self, format, *args):
        pass  # Silence les logs HTTP


def get_gmail_service():
    """Obtient un service Gmail authentifié via OAuth 2.0"""
    global _auth_code
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDENTIALS_FILE.exists():
                raise FileNotFoundError(
                    "Fichier credentials.json introuvable. "
                    "Téléchargez-le depuis Google Cloud Console."
                )

            flow = Flow.from_client_secrets_file(
                str(CREDENTIALS_FILE),
                scopes=SCOPES,
                redirect_uri='http://localhost:8090/'
            )

            auth_url, state = flow.authorization_url(
                access_type='offline',
                prompt='consent'
            )

            # Démarrer un serveur HTTP local pour capturer le callback
            server = HTTPServer(('localhost', 8090), _OAuthCallbackHandler)

            # Ouvrir automatiquement le navigateur
            import webbrowser
            print(f"\nOuverture du navigateur pour autorisation...")
            webbrowser.open(auth_url)
            print("En attente de l'autorisation... (10 minutes max)\n")

            _auth_code = None
            # Boucle d'attente pour gérer les requêtes jusqu'à recevoir le code
            import time
            deadline = time.time() + 600
            while _auth_code is None and time.time() < deadline:
                server.timeout = 5
                server.handle_request()
            server.server_close()

            if not _auth_code:
                raise RuntimeError("Aucun code d'autorisation reçu")

            flow.fetch_token(code=_auth_code)
            creds = flow.credentials

        TOKEN_FILE.write_text(creds.to_json())

    return build('gmail', 'v1', credentials=creds)


def send_email(to, subject, html_body):
    """Envoie un email via Gmail API"""
    service = get_gmail_service()

    message = MIMEMultipart('alternative')
    message['To'] = to
    message['Subject'] = subject
    message.attach(MIMEText(html_body, 'html'))

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(
        userId='me', body={'raw': raw}
    ).execute()


def send_verification_code(email, code, prenom=''):
    """Envoie le code de vérification à l'utilisateur"""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF6B35;">Vérification de votre email</h2>
        <p>Bonjour {prenom},</p>
        <p>Votre code de vérification est :</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">{code}</span>
        </div>
        <p style="color: #888; font-size: 14px;">Ce code expire dans 15 minutes.</p>
        <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
    </div>
    """
    send_email(email, 'Vérification de votre email - Librairie', html)


# Script de configuration initiale
if __name__ == '__main__':
    print("=== Configuration Gmail OAuth 2.0 ===\n")

    if not CREDENTIALS_FILE.exists():
        print("❌ Fichier credentials.json introuvable !")
        print("\nÉtapes :")
        print("1. Allez sur https://console.cloud.google.com/")
        print("2. Créez un projet (ou sélectionnez-en un)")
        print("3. API et services → Bibliothèque → Activez 'Gmail API'")
        print("4. API et services → Identifiants → Créer des identifiants")
        print("5. Type : ID client OAuth → Application de bureau")
        print("6. Téléchargez le JSON et renommez-le 'credentials.json'")
        print(f"7. Placez-le dans : {BASE_DIR}/")
        print("\nPuis relancez : python mail_service.py")
    else:
        print("✓ credentials.json trouvé")
        print("→ Ouverture du navigateur pour autorisation...\n")
        try:
            service = get_gmail_service()
            print("✅ Authentification réussie !")
            print("✅ token.json créé — l'envoi d'emails est prêt !")
        except Exception as e:
            print(f"❌ Erreur : {e}")
