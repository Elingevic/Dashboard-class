import os
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent


def _db_from_url(url: str) -> dict:
    p = urlparse(url)
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': (p.path or '/postgres').lstrip('/'),
        'USER': p.username or 'postgres',
        'PASSWORD': p.password or '',
        'HOST': p.hostname or '127.0.0.1',
        'PORT': str(p.port or 5432),
    }


SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-only-change-in-production')
DEBUG = os.environ.get('DJANGO_DEBUG', 'true').lower() == 'true'
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'despliegues',
]

MIDDLEWARE = []
ROOT_URLCONF = 'bi_dw.urls'

_db = _db_from_url(os.environ['DATABASE_URL']) if os.environ.get('DATABASE_URL') else {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': os.environ.get('PG_DATABASE', 'postgres'),
    'USER': os.environ.get('PG_USER', 'postgres'),
    'PASSWORD': os.environ.get('PG_PASSWORD', ''),
    'HOST': os.environ.get('PG_HOST', '127.0.0.1'),
    'PORT': os.environ.get('PG_PORT', '5432'),
}
DATABASES = {'default': _db}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_TZ = True

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}
