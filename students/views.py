from django.shortcuts import render


def dashboard(request):
    return render(request, 'student_dashboard.html', {'active_page': 'dashboard'})


def my_notes(request):
    return render(request, 'student_notes.html', {'active_page': 'notes'})


def smart_notes(request):
    return render(request, 'student_smart_notes.html', {'active_page': 'smart_notes'})


def academic_calendar(request):
    return render(request, 'student_calendar.html', {'active_page': 'calendar'})


def assignments(request):
    return render(request, 'student_assignments.html', {'active_page': 'assignments'})


def student_profile(request):
    return render(request, 'student_profile.html', {'active_page': 'profile'})


def login_view(request):
    return render(request, 'login.html')


def password_reset_view(request):
    return render(request, 'password_reset.html')


# HOD Views
def hod_dashboard(request):
    return render(request, 'hod/dashboard.html', {'active_page': 'dashboard'})


def hod_students(request):
    return render(request, 'hod/students.html', {'active_page': 'students'})


def hod_faculty(request):
    return render(request, 'hod/faculty.html', {'active_page': 'faculty'})


def hod_results(request):
    return render(request, 'hod/results.html', {'active_page': 'results'})


def hod_attendance(request):
    return render(request, 'hod/attendance.html', {'active_page': 'attendance'})


def hod_subjects(request):
    return render(request, 'hod/subjects.html', {'active_page': 'subjects'})


def hod_mentorship(request):
    return render(request, 'hod/mentorship.html', {'active_page': 'mentorship'})


def hod_analytics(request):
    return render(request, 'hod/analytics.html', {'active_page': 'analytics'})


def hod_promotion(request):
    return render(request, 'hod/promotion.html', {'active_page': 'promotion'})


def hod_calendar(request):
    return render(request, 'hod/calendar.html', {'active_page': 'calendar'})
