from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Order, Notification
 
STATUS_MESSAGES = {
    'pending':    ('order_placed',     '📋 Your order #{id} has been placed and is waiting to be confirmed.'),
    'processing': ('order_processing', '⚙️ Your order #{id} is being prepared at the station.'),
    'shipped':    ('order_shipped',    '🚚 Your order #{id} is out for delivery! Driver is on the way.'),
    'delivered':  ('order_delivered',  '✅ Your order #{id} has been delivered. Enjoy your water!'),
    'cancelled':  ('order_cancelled',  '❌ Your order #{id} has been cancelled.'),
}
 
_previous_status = {}
 
@receiver(pre_save, sender=Order)
def capture_previous_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            _previous_status[instance.pk] = Order.objects.get(pk=instance.pk).status
        except Order.DoesNotExist:
            pass
 
@receiver(post_save, sender=Order)
def create_order_notification(sender, instance, created, **kwargs):
    new_status = instance.status
    if created:
        notif_type, msg_template = STATUS_MESSAGES.get('pending', ('order_placed', '📋 Order #{id} placed.'))
        Notification.objects.create(
            user=instance.user,
            order=instance,
            notif_type=notif_type,
            message=msg_template.format(id=instance.id),
        )
        return
    old_status = _previous_status.pop(instance.pk, None)
    if old_status == new_status:
        return
    config = STATUS_MESSAGES.get(new_status)
    if not config:
        return
    notif_type, msg_template = config
    Notification.objects.create(
        user=instance.user,
        order=instance,
        notif_type=notif_type,
        message=msg_template.format(id=instance.id),
    )
 