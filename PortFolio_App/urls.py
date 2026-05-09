from django.urls import path,include
from . import views

urlpatterns = [
    path('',views.index,name='index'),
    path('contact/', views.contact_me, name='contact_me'),
]