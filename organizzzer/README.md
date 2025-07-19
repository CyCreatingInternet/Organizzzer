# Python Lernplattform mit KI-Assistent

Eine interaktive Plattform zum Lernen von Python mit KI-Unterstützung und praktischen Übungen.

## Features

- 🤖 KI-gestützter Lernassistent
- 📚 Interaktive Python-Übungen
- 💻 Live Code-Ausführung
- 🎯 Übungen für verschiedene Schwierigkeitsgrade
- 🔍 Suchfunktion für Übungen

## Installation

1. Klone das Repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Installiere die Python-Abhängigkeiten:
```bash
pip install -r requirements.txt
```

3. Erstelle eine `.env` Datei im Hauptverzeichnis und füge deinen OpenAI API-Schlüssel hinzu:
```
OPENAI_API_KEY=dein-api-schlüssel
```

## Starten der Anwendung

1. Starte den Python-Backend-Server:
```bash
python app.py
```

2. Öffne die `python lerne.html` Datei in deinem Browser.

## Verwendung

1. **Übungen auswählen**: Wähle eine Übung aus der Seitenleiste aus.
2. **Code schreiben**: Nutze den eingebauten Code-Editor.
3. **Code ausführen**: Klicke auf "Code ausführen" um deinen Code zu testen.
4. **KI-Hilfe**: Stelle Fragen an den KI-Assistenten im Chat-Bereich.

## Technologien

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask)
- KI: OpenAI GPT-3.5
- Code-Editor: Ace Editor
- Styling: Bootstrap 5

## Sicherheitshinweise

- Der Code-Ausführungs-Server sollte nur in einer sicheren Umgebung betrieben werden
- Stelle sicher, dass dein OpenAI API-Schlüssel sicher verwahrt wird
- Die Anwendung ist für Lernzwecke gedacht und sollte nicht in einer Produktionsumgebung eingesetzt werden 