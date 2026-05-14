from djoser.email import ActivationEmail as BaseActivationEmail

class ActivationEmail(BaseActivationEmail):
    def get_context_data(self):
        context = super().get_context_data()
        context['domain'] = 'localhost:5173'
        context['protocol'] = 'http'
        context['site_name'] = 'Refill Web'
        return context