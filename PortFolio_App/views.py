from django.shortcuts import render
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings

# Create your views here.
def index(request):
    return render(request, 'index.html')

def contact_me(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        message = request.POST.get('message')
        
        subject = f"New Portfolio Message from {name}"
        body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        
        try:
            send_mail(
                subject,
                body,
                settings.EMAIL_HOST_USER,
                ['akhayakumardash77@gmail.com'],
                fail_silently=False,
            )
            return JsonResponse({'status': 'success', 'message': 'Message sent successfully!'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
            
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)