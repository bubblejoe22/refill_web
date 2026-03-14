from django.urls import path, include
from rest_framework_nested import routers
from .views import OrderViewSet, OrderItemViewSet, OrderNoteViewSet, NotificationViewSet

router = routers.DefaultRouter()
router.register(r'', OrderViewSet, basename='order')
router.register(r'notifications', NotificationViewSet, basename='notification') 

orders_router = routers.NestedDefaultRouter(router, r'', lookup='order')
orders_router.register(r'items', OrderItemViewSet, basename='order-items')  
orders_router.register(r'notes', OrderNoteViewSet, basename='order-notes')  

urlpatterns = [
    path('', include(router.urls)),
    path('', include(orders_router.urls)),
]
