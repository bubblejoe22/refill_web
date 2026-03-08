from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order model"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return orders for the current user, excluding hidden ones"""
        user = self.request.user
        if user.is_staff:
            return Order.objects.filter(is_hidden_by_user=False)
        return Order.objects.filter(user=user, is_hidden_by_user=False)

    def perform_create(self, serializer):
        """Create order for current user"""
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create a new order with items"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=self.request.user)

        # Create order items if provided
        items_data = request.data.get('items', [])
        for item in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item.get('product_id'),
                quantity=item.get('quantity', 1),
                price=item.get('price', 0)
            )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='hide')
    def hide(self, request, pk=None):
        """Hide an order from the user's history (soft delete)"""
        order = self.get_object()

        # Only the owner can hide their own order
        if order.user != request.user:
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

        order.is_hidden_by_user = True
        order.save()
        return Response({'detail': 'Order hidden.'}, status=status.HTTP_200_OK)