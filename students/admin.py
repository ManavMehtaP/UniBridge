from django.contrib import admin
from .models import (
    StudentProfile,
    Subject,
    Assignment,
    Note,
    CalendarEvent,
    StudyPlan,
    StudyTask,
)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'student_id', 'department', 'gpa', 'semester']
    list_filter = ['department', 'semester']
    search_fields = ['student_id', 'user__username', 'user__email']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'credits']
    search_fields = ['code', 'name']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'due_date', 'priority', 'status', 'marks']
    list_filter = ['priority', 'status', 'subject']
    search_fields = ['title', 'subject__code']
    date_hierarchy = 'due_date'


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'subject', 'category', 'is_smart_note', 'created_at']
    list_filter = ['category', 'is_smart_note', 'subject']
    search_fields = ['title', 'content', 'tags']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'event_type', 'start_date', 'location']
    list_filter = ['event_type', 'is_all_day']
    search_fields = ['title', 'description']
    date_hierarchy = 'start_date'


@admin.register(StudyPlan)
class StudyPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'user__username']
    filter_horizontal = ['subjects']


@admin.register(StudyTask)
class StudyTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'study_plan', 'subject', 'scheduled_date', 'status', 'estimated_time']
    list_filter = ['status', 'subject']
    search_fields = ['title', 'study_plan__name']
    date_hierarchy = 'scheduled_date'
