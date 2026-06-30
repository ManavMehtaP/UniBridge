# UniBridge - Student Academic Portal

A Django-based student management system with a modern, responsive UI for managing academic tasks, notes, assignments, and schedules.

## Features

- **Dashboard**: Smart study planner with AI-powered insights
- **My Notes**: Personal note management with categorization
- **Smart Notes**: AI-powered note generation and summarization
- **Academic Calendar**: View schedule, exams, and important dates
- **Assignments**: Track assignments with priority and status
- **Student Profile**: Manage personal information and academic statistics

## Tech Stack

- **Backend**: Django 6.0.6
- **Frontend**: HTML templates with Tailwind CSS
- **Database**: SQLite (default)
- **Forms**: Django Crispy Forms with Bootstrap 5

## Project Structure

```
unibridge_2/
├── design_prototype/          # Original HTML prototype files
├── static/                    # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── img/
├── templates/                 # Django templates
│   ├── base.html             # Base template with common layout
│   ├── dashboard.html
│   ├── assignments.html
│   ├── my_notes.html
│   ├── smart_notes.html
│   ├── academic_calendar.html
│   └── student_profile.html
├── students/                  # Django app
│   ├── models.py             # Database models
│   ├── views.py              # View functions
│   ├── urls.py               # URL routing
│   └── admin.py              # Admin configuration
├── unibridge_project/        # Django project settings
│   ├── settings.py
│   └── urls.py
├── media/                     # User uploaded files
├── venv/                      # Virtual environment
├── manage.py
├── requirements.txt
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   cd /Users/manavmehta/Desktop/unibridge_2
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser (for admin access)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

7. **Access the application**
   - Open your browser and go to: `http://127.0.0.1:8000/`
   - Admin panel: `http://127.0.0.1:8000/admin/`

## Database Models

The application includes the following models:

- **StudentProfile**: Student personal information and academic stats
- **Subject**: Course/subject information
- **Assignment**: Assignment tracking with priority and status
- **Note**: Personal notes with categorization
- **CalendarEvent**: Academic calendar events
- **StudyPlan**: Study planning system
- **StudyTask**: Individual study tasks within plans

## URL Routes

- `/` - Dashboard
- `/notes/` - My Notes
- `/smart-notes/` - Smart Notes (AI-powered)
- `/calendar/` - Academic Calendar
- `/assignments/` - Assignments
- `/profile/` - Student Profile
- `/admin/` - Django Admin

## Development

### Adding New Features

1. **Create a new view** in `students/views.py`
2. **Add URL pattern** in `students/urls.py`
3. **Create template** in `templates/`
4. **Update models** if needed in `students/models.py`
5. **Run migrations** after model changes

### Static Files

Static files are served from the `static/` directory. To collect static files for production:

```bash
python manage.py collectstatic
```

## Customization

### Tailwind CSS Configuration

The Tailwind configuration is embedded in the base template. You can customize colors, fonts, and spacing by modifying the `tailwind.config` script in `templates/base.html`.

### Color Scheme

The application uses a custom color palette defined in the Tailwind config:
- Primary: #142175 (Deep Blue)
- Secondary: #505f76 (Slate)
- Tertiary: #370086 (Purple)
- Surface: #fbf8ff (Light Purple)

## Future Enhancements

- User authentication system
- File upload functionality for assignments
- AI integration for smart notes
- Real-time notifications
- Mobile app API
- Grade analytics dashboard

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the development team.
