from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth endpoints (Djoser handles registration, token login/logout)
    path('api/auth/', include('djoser.urls')),          # /users/ POST → register
    path('api/auth/', include('djoser.urls.authtoken')), # /token/login/ /token/logout/

    # Other apps
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)