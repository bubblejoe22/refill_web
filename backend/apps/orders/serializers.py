# =============================================================
# serializers.py — Orders App
# =============================================================
# FORM VALIDATION lives here. Every validate_*() method is a
# form validation rule. Look for the "# FORM VALIDATION" tags.
#
# Serializers covered:
#   OrderItemSerializer  → validates quantity, price, product_id
#   OrderNoteSerializer  → validates content, note_type
#   OrderSerializer      → validates shipping_address, status, notes
#                          + cross-field object-level validation
# =============================================================

from rest_framework import serializers
from .models import Order, OrderItem, OrderNote
from apps.products.serializers import ProductSerializer


# ─────────────────────────────────────────────────────────────
# OrderItem Serializer
# CRUD: used for CREATE and READ of individual line items
# ─────────────────────────────────────────────────────────────
class OrderItemSerializer(serializers.ModelSerializer):

    product    = ProductSerializer(read_only=True)         # READ: full product details
    product_id = serializers.IntegerField(write_only=True) # WRITE: send product_id to link item
    subtotal   = serializers.DecimalField(                 # READ: computed price × quantity
                     max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price', 'subtotal', 'created_at']
        read_only_fields = ['id', 'subtotal', 'created_at']

    # FORM VALIDATION — quantity
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        if value > 999:
            raise serializers.ValidationError("Quantity cannot exceed 999.")
        return value

    # FORM VALIDATION — price
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    # FORM VALIDATION — product_id (must exist and be active)
    def validate_product_id(self, value):
        from apps.products.models import Product
        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError(f"Product with id={value} does not exist.")
        if not product.is_active:
            raise serializers.ValidationError(f"Product '{product.name}' is no longer available.")
        return value


# ─────────────────────────────────────────────────────────────
# OrderNote Serializer  (TABLE 3)
# CRUD: used for full CRUD of notes on an order
# ─────────────────────────────────────────────────────────────
class OrderNoteSerializer(serializers.ModelSerializer):

    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model  = OrderNote
        fields = ['id', 'author_username', 'note_type', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author_username', 'created_at', 'updated_at']

    # FORM VALIDATION — content (required, max 1000 chars)
    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Note content cannot be empty.")
        if len(value) > 1000:
            raise serializers.ValidationError("Note content cannot exceed 1000 characters.")
        return value

    # FORM VALIDATION — note_type must be a known value
    def validate_note_type(self, value):
        allowed = [c[0] for c in OrderNote.NOTE_TYPE_CHOICES]
        if value not in allowed:
            raise serializers.ValidationError(
                f"note_type must be one of: {', '.join(allowed)}."
            )
        return value


# ─────────────────────────────────────────────────────────────
# Order Serializer  (main — TABLE 1)
# CRUD: handles full CRUD for Order
#       Nests OrderItem (TABLE 2) and OrderNote (TABLE 3) for reads
# ─────────────────────────────────────────────────────────────
class OrderSerializer(serializers.ModelSerializer):

    items          = OrderItemSerializer(many=True, read_only=True)      # nested TABLE 2
    order_notes    = OrderNoteSerializer(many=True, read_only=True)      # nested TABLE 3
    user_email     = serializers.EmailField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'user', 'user_email',
            'status', 'status_display',
            'total_price', 'shipping_address', 'notes',
            'items', 'order_notes',
            'created_at', 'updated_at',
        ]
        # total_price is auto-computed server-side — clients must NOT set it
        read_only_fields = ['id', 'user', 'user_email', 'total_price',
                            'status_display', 'created_at', 'updated_at']

    # FORM VALIDATION — shipping_address (required, min 10 chars)
    def validate_shipping_address(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Shipping address is required.")
        if len(value) < 10:
            raise serializers.ValidationError(
                "Please provide a complete shipping address (at least 10 characters)."
            )
        return value

    # FORM VALIDATION — status (must follow allowed transition flow)
    def validate_status(self, value):
        # Only enforce transition rules on UPDATE (instance already exists)
        if self.instance:
            current = self.instance.status
            allowed_next = {
                'pending':    ['processing', 'cancelled'],
                'processing': ['shipped',    'cancelled'],
                'shipped':    ['delivered',  'cancelled'],
                'delivered':  [],   # terminal — no further changes allowed
                'cancelled':  [],   # terminal — no further changes allowed
            }
            allowed = allowed_next.get(current, [])
            if value != current and value not in allowed:
                raise serializers.ValidationError(
                    f"Cannot change status from '{current}' to '{value}'. "
                    f"Allowed: {allowed or ['none — this order is closed']}."
                )
        return value

    # FORM VALIDATION — notes (optional but capped at 500 chars)
    def validate_notes(self, value):
        if len(value) > 500:
            raise serializers.ValidationError("Notes cannot exceed 500 characters.")
        return value

    # FORM VALIDATION — object-level (cross-field check)
    # Runs after all individual field validators pass
    def validate(self, data):
        # Block any edits to orders that are already closed
        if self.instance and self.instance.status in ['delivered', 'cancelled']:
            mutable = {k for k in data if k not in ('status',)}
            if mutable:
                raise serializers.ValidationError(
                    "This order is closed and can no longer be edited."
                )
        return data