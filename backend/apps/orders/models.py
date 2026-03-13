# =============================================================
# models.py — Orders App
# =============================================================
# THREE RELATED TABLES (satisfies "at least three related tables"):
#
#   TABLE 1 → Order      (FK to User)
#   TABLE 2 → OrderItem  (FK to Order, FK to Product)
#   TABLE 3 → OrderNote  (FK to Order, FK to User)
#
# Relationships:
#   User ──< Order ──< OrderItem >── Product
#                └──< OrderNote >── User
# =============================================================

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from apps.products.models import Product


# ─────────────────────────────────────────────────────────────
# TABLE 1 — Order
# CRUD: Created in views.py OrderViewSet.create()
#       Read   in views.py OrderViewSet.list() / retrieve()
#       Updated in views.py OrderViewSet.partial_update()
#       Deleted in views.py OrderViewSet.destroy()
# ─────────────────────────────────────────────────────────────
class Order(models.Model):

    STATUS_CHOICES = [
        ('pending',    'Pending'),
        ('processing', 'Processing'),
        ('shipped',    'Shipped'),
        ('delivered',  'Delivered'),
        ('cancelled',  'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_address = models.TextField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} — {self.user.username} [{self.status}]"

    # CRUD: UPDATE — recalculate total_price from all child OrderItems
    def compute_total(self):
        total = sum(item.price * item.quantity for item in self.items.all())
        self.total_price = total
        self.save(update_fields=['total_price'])


# ─────────────────────────────────────────────────────────────
# TABLE 2 — OrderItem
# Related to: Order (FK), Product (FK)
# CRUD: Created inside OrderViewSet.create() when items[] is sent
#       Read   via order.items.all() — nested in OrderSerializer
#       Updated via OrderItemViewSet.partial_update()
#       Deleted via OrderItemViewSet.destroy()
# ─────────────────────────────────────────────────────────────
class OrderItem(models.Model):

    # FK → Order  (relates TABLE 2 to TABLE 1)
    order   = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    # FK → Product  (relates TABLE 2 to Products app)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='order_items')

    # FORM VALIDATION: quantity must be 1–999 (also enforced in serializers.py)
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(999)]
    )
    # Price is a snapshot at the time of order — not the live product price
    price    = models.DecimalField(max_digits=10, decimal_places=2,
                                   validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        name = self.product.name if self.product else 'Deleted Product'
        return f"{name} x{self.quantity} @ ₱{self.price}"

    @property
    def subtotal(self):
        return self.price * self.quantity


# ─────────────────────────────────────────────────────────────
# TABLE 3 — OrderNote
# Related to: Order (FK), User/author (FK)
# This is the THIRD related table required by the project.
# CRUD: Created via OrderNoteViewSet.create()
#       Read   via order.order_notes.all() — nested in OrderSerializer
#       Updated via OrderNoteViewSet.partial_update()
#       Deleted via OrderNoteViewSet.destroy()
# ─────────────────────────────────────────────────────────────
class OrderNote(models.Model):

    NOTE_TYPE_CHOICES = [
        ('customer', 'Customer Note'),
        ('staff',    'Staff Note'),
        ('system',   'System Note'),
    ]

    # FK → Order  (relates TABLE 3 to TABLE 1)
    order     = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_notes')
    # FK → User   (relates TABLE 3 back to User — who wrote the note)
    author    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='order_notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES, default='customer')
    content   = models.TextField()   # REQUIRED — validated in serializers.py
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        author_name = self.author.username if self.author else 'Unknown'
        return f"Note on Order #{self.order_id} by {author_name}"