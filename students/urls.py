from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('notes/', views.my_notes, name='my_notes'),
    path('smart-notes/', views.smart_notes, name='smart_notes'),
    path('calendar/', views.academic_calendar, name='academic_calendar'),
    path('assignments/', views.assignments, name='assignments'),
    path('profile/', views.student_profile, name='student_profile'),
    path('login/', views.login_view, name='login'),
    path('password-reset/', views.password_reset_view, name='password_reset'),
    # HOD URLs
    path('hod/dashboard/', views.hod_dashboard, name='hod_dashboard'),
    path('hod/students/', views.hod_students, name='hod_students'),
    path('hod/faculty/', views.hod_faculty, name='hod_faculty'),
    path('hod/results/', views.hod_results, name='hod_results'),
    path('hod/attendance/', views.hod_attendance, name='hod_attendance'),
    path('hod/subjects/', views.hod_subjects, name='hod_subjects'),
    path('hod/mentorship/', views.hod_mentorship, name='hod_mentorship'),
    path('hod/analytics/', views.hod_analytics, name='hod_analytics'),
    path('hod/promotion/', views.hod_promotion, name='hod_promotion'),
    path('hod/calendar/', views.hod_calendar, name='hod_calendar'),
]
