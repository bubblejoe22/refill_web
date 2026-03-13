# =============================================================
# urls.py — Orders App
# =============================================================
# Routes for all three CRUD ViewSets:
#
#   /api/orders/                          → OrderViewSet       (TABLE 1)
#   /api/orders/{order_pk}/items/         → OrderItemViewSet   (TABLE 2)
#   /api/orders/{order_pk}/notes/         → OrderNoteViewSet   (TABLE 3)
#
# Install drf-nested-routers if not already:
#   pip install drf-nested-routers
# =============================================================

from django.urls import path, include
from rest_framework_nested import routers   # pip install drf-nested-routers
from .views import OrderViewSet, OrderItemViewSet, OrderNoteViewSet

# ── Root router — registers Order (TABLE 1) ──────────────────
router = routers.DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

# ── Nested router — registers OrderItem (TABLE 2) and OrderNote (TABLE 3)
#    under /api/orders/{order_pk}/items/ and /api/orders/{order_pk}/notes/
orders_router = routers.NestedDefaultRouter(router, r'', lookup='order')
orders_router.register(r'items', OrderItemViewSet, basename='order-items')  # TABLE 2
orders_router.register(r'notes', OrderNoteViewSet, basename='order-notes')  # TABLE 3

urlpatterns = [
    path('', include(router.urls)),
    path('', include(orders_router.urls)),
]

# =============================================================
# Full endpoint list after this file is included at /api/orders/
# ─────────────────────────────────────────────────────────────
# CRUD — Order (TABLE 1)
#   POST   /api/orders/                    CREATE
#   GET    /api/orders/                    READ list
#   GET    /api/orders/{id}/               READ detail
#   PATCH  /api/orders/{id}/               UPDATE
#   DELETE /api/orders/{id}/               DELETE
#   POST   /api/orders/{id}/cancel/        UPDATE (cancel shortcut)
#
# CRUD — OrderItem (TABLE 2)
#   POST   /api/orders/{order_pk}/items/           CREATE
#   GET    /api/orders/{order_pk}/items/           READ list
#   GET    /api/orders/{order_pk}/items/{id}/      READ detail
#   PATCH  /api/orders/{order_pk}/items/{id}/      UPDATE
#   DELETE /api/orders/{order_pk}/items/{id}/      DELETE
#
# CRUD — OrderNote (TABLE 3)
#   POST   /api/orders/{order_pk}/notes/           CREATE
#   GET    /api/orders/{order_pk}/notes/           READ list
#   GET    /api/orders/{order_pk}/notes/{id}/      READ detail
#   PATCH  /api/orders/{order_pk}/notes/{id}/      UPDATE
#   DELETE /api/orders/{order_pk}/notes/{id}/      DELETE
# =============================================================